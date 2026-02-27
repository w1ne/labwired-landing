import init, { WasmSimulator } from './wasm/labwired_wasm.js';

let simulator = null;
let isRunning = false;
let animationFrameId = null;
let totalCycles = 0;
let registerNames = [];

const elements = {
    loading: document.getElementById('loading'),
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
};

async function boot() {
    try {
        await init();
        const firmwareResponse = await fetch('demo-blinky.bin');
        const firmwareBuffer = await firmwareResponse.arrayBuffer();
        const firmwareBytes = new Uint8Array(firmwareBuffer);

        simulator = new WasmSimulator(firmwareBytes);
        registerNames = simulator.get_register_names();

        elements.loading.style.display = 'none';
        elements.btnStart.disabled = false;

        createRegisterGrid();
        updateUI();
    } catch (e) {
        elements.loading.innerText = 'Error loading simulator: ' + e;
        console.error(e);
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
    elements.pc.innerText = `0x${pc.toString(16).padStart(8, '0')}`;
    elements.cycles.innerText = totalCycles.toLocaleString();

    // LED
    const ledOn = simulator.get_led_state();
    if (ledOn) elements.led.classList.add('on');
    else elements.led.classList.remove('on');

    // Disassembly
    elements.disasm.innerText = simulator.get_disassembly();

    // Registers
    registerNames.forEach((_, i) => {
        const val = simulator.get_register(i);
        document.getElementById(`reg-${i}`).innerText = val.toString(16).padStart(8, '0').toUpperCase();
    });

    // Memory (Stack area)
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
        // High-speed execution (batch of cycles per frame)
        const stepSize = 100000;
        simulator.step(stepSize);
        totalCycles += stepSize;

        updateUI();
        animationFrameId = requestAnimationFrame(simulationLoop);
    } catch (e) {
        console.error("Simulation error:", e);
        stopSimulation();
        alert("Simulation halted: " + e);
    }
}

function startSimulation() {
    isRunning = true;
    elements.btnStart.disabled = true;
    elements.btnPause.disabled = false;
    elements.btnStep.disabled = true;
    elements.btnStop.disabled = false;
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
        alert(e);
    }
}

function stopSimulation() {
    isRunning = false;
    if (animationFrameId) cancelAnimationFrame(animationFrameId);
    boot(); // Full reset
    totalCycles = 0;
    elements.btnStart.disabled = false;
    elements.btnPause.disabled = true;
    elements.btnStep.disabled = true;
    elements.btnStop.disabled = true;
}

elements.btnStart.onclick = startSimulation;
elements.btnPause.onclick = pauseSimulation;
elements.btnStep.onclick = stepSimulation;
elements.btnStop.onclick = stopSimulation;

boot();
