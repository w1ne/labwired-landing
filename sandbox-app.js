console.log("sandbox-app.js: Loading module...");
import init, { WasmSimulator } from './demo/wasm/labwired_wasm.js';

let simulator = null;
let isRunning = false;
let animationFrameId = null;
let totalCycles = 0;
let registerNames = [];

const elements = {
    overlay: document.getElementById('loading-overlay'),
    pc: document.getElementById('pcValue'),
    cycles: document.getElementById('cycleCount'),
    led: document.getElementById('virtualLed'),
    disasm: document.getElementById('disasm'),
    registers: document.getElementById('registers'),
    memory: document.getElementById('memory'),
    btnStart: document.getElementById('btnStart'),
    btnPause: document.getElementById('btnPause'),
    btnStep: document.getElementById('btnStep'),
    btnStop: document.getElementById('btnStop'),
    btnGdb: document.getElementById('btnGdb'),
    gdbStatus: document.getElementById('gdbStatus'),
    gdbText: document.getElementById('gdbText')
};

let gdbSocket = null;

// --- GDB Link Logic ---
function toggleGdb() {
    if (gdbSocket) {
        gdbSocket.close();
        return;
    }

    try {
        gdbSocket = new WebSocket('ws://localhost:8081');
        gdbSocket.binaryType = 'arraybuffer';

        gdbSocket.onopen = () => {
            elements.gdbStatus.classList.add('active');
            elements.gdbText.innerText = 'GDB Bridge: Connected';
            elements.btnGdb.innerText = 'Disable GDB Link';
            console.log("GDB WebSocket Connected");
        };

        gdbSocket.onmessage = (event) => {
            const data = new Uint8Array(event.data);
            if (simulator) {
                const response = simulator.gdb_process_packet(data);
                if (response && response.length > 0) {
                    gdbSocket.send(response);
                }
            }
        };

        gdbSocket.onclose = () => {
            elements.gdbStatus.classList.remove('active');
            elements.gdbText.innerText = 'GDB Bridge: Disconnected';
            elements.btnGdb.innerText = 'Enable GDB Link';
            gdbSocket = null;
            console.log("GDB WebSocket Disconnected");
        };

        gdbSocket.onerror = (err) => {
            console.error("GDB WebSocket Error:", err);
            alert("Could not connect to GDB Bridge. Is 'gdb-bridge.py' running?");
        };

    } catch (e) {
        console.error("GDB Init Error:", e);
    }
}

async function boot() {
    try {
        console.log("Initializing WASM Core...");
        // Initialize WASM from the demo folder
        // Note: we pass the .wasm path explicitly to ensure it loads even if fetch path inference fails
        await init('./demo/wasm/labwired_wasm_bg.wasm');

        console.log("Fetching firmware...");
        const firmwareResponse = await fetch('./demo/demo-blinky.bin');
        if (!firmwareResponse.ok) {
            throw new Error(`Could not fetch firmware binary: ${firmwareResponse.status} ${firmwareResponse.statusText}`);
        }

        const firmwareBuffer = await firmwareResponse.arrayBuffer();
        const firmwareBytes = new Uint8Array(firmwareBuffer);

        console.log("Starting simulator...");
        simulator = new WasmSimulator(firmwareBytes);
        registerNames = simulator.get_register_names();

        elements.overlay.style.display = 'none';
        elements.btnStart.disabled = false;
        elements.btnStop.disabled = false;

        createRegisterGrid();
        updateUI();
        console.log("WASM Core Initialized successfully.");
    } catch (e) {
        if (e.message.includes("Timed out")) {
            console.warn("Initialization took longer than expected.");
        }
        console.error("Initialization Failed:", e);
        const p = elements.overlay.querySelector('p');
        if (p) {
            p.innerHTML = `<span style="color: #ff3333; font-weight: bold;">Initialization Failed</span><br/>
                           <span style="font-size: 0.8em; opacity: 0.8;">${e.message}</span><br/>
                           <button onclick="location.reload()" style="margin-top: 10px; padding: 5px 10px; font-size: 0.7em;">Retry</button>`;
        }
        const spinner = elements.overlay.querySelector('.spinner');
        if (spinner) spinner.style.display = 'none';
    }
}

function createRegisterGrid() {
    elements.registers.innerHTML = '';
    registerNames.forEach((name, i) => {
        const div = document.createElement('div');
        div.className = 'reg-item';
        div.innerHTML = `<span class="reg-name">${name}</span><span id="reg-${i}" class="reg-value">00000000</span>`;
        elements.registers.appendChild(div);
    });
}

function updateUI() {
    if (!simulator) return;

    const pc = simulator.get_pc();
    elements.pc.innerText = `0x${pc.toString(16).padStart(8, '0').toUpperCase()}`;
    elements.cycles.innerText = totalCycles.toLocaleString();

    // LED
    const ledOn = simulator.get_led_state();
    if (ledOn) elements.led.classList.add('on');
    else elements.led.classList.remove('on');

    // Disassembly
    const asm = simulator.get_disassembly();
    elements.disasm.innerText = asm;

    // Registers
    registerNames.forEach((_, i) => {
        const val = simulator.get_register(i);
        const regEl = document.getElementById(`reg-${i}`);
        if (regEl) regEl.innerText = val.toString(16).padStart(8, '0').toUpperCase();
    });

    updateMemoryView();
}

function updateMemoryView() {
    const stackBase = 0x20004BC0;
    const len = 64;
    const bytes = simulator.read_memory(stackBase, len);

    let html = '';
    for (let i = 0; i < len; i += 16) {
        const rowAddr = (stackBase + i).toString(16).toUpperCase();
        const rowBytes = Array.from(bytes.slice(i, i + 16))
            .map(b => b.toString(16).padStart(2, '0').toUpperCase())
            .join(' ');
        html += `<div class="mem-line"><span class="mem-addr">${rowAddr}:</span><span class="mem-bytes">${rowBytes}</span></div>`;
    }
    elements.memory.innerHTML = html;
}

function simulationLoop() {
    if (!isRunning || !simulator) return;

    try {
        // Throttled execution: 10,000 instructions per frame (~600k/sec)
        // to prevent CPU drain while keeping UI responsive.
        const stepSize = isRunning ? 10000 : 0;
        if (stepSize > 0) {
            simulator.step(stepSize);
            totalCycles += stepSize;
        }

        updateUI();
        animationFrameId = requestAnimationFrame(simulationLoop);
    } catch (e) {
        console.error("Simulation error:", e);
        stopSimulation();
        alert("Simulation halted: " + e.message);
    }
}

function startSimulation() {
    isRunning = true;
    elements.btnStart.disabled = true;
    elements.btnPause.disabled = false;
    elements.btnStep.disabled = true;
    simulationLoop();
}

function pauseSimulation() {
    isRunning = false;
    if (animationFrameId) cancelAnimationFrame(animationFrameId);
    elements.btnStart.disabled = false;
    elements.btnPause.disabled = true;
    elements.btnStep.disabled = false;
    updateUI();
}

function stepSimulation() {
    if (!simulator) return;
    try {
        simulator.step_single();
        totalCycles += 1;
        updateUI();
    } catch (e) {
        console.error(e);
    }
}

function stopSimulation() {
    isRunning = false;
    if (animationFrameId) cancelAnimationFrame(animationFrameId);
    totalCycles = 0;
    elements.overlay.style.display = 'flex';
    boot(); // Reload
}

if (elements.btnStart) elements.btnStart.onclick = startSimulation;
if (elements.btnPause) elements.btnPause.onclick = pauseSimulation;
if (elements.btnStep) elements.btnStep.onclick = stepSimulation;
if (elements.btnStop) elements.btnStop.onclick = stopSimulation;
if (elements.btnGdb) elements.btnGdb.onclick = toggleGdb;

boot();
