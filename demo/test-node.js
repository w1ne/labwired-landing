const fs = require('fs');
const path = require('path');
const { WasmSimulator } = require('./wasm-node/labwired_wasm.js');

async function main() {
    console.log("🚀 Starting LabWired Headless HIL Test...");

    try {
        // Load firmware
        const firmwarePath = path.join(__dirname, 'demo-blinky.bin');
        const firmware = fs.readFileSync(firmwarePath);
        console.log(`✅ Loaded firmware: ${firmwarePath} (${firmware.length} bytes)`);

        // Initialize simulator
        const simulator = new WasmSimulator(firmware);
        console.log("✅ Simulator Initialized");

        // Run for a bit
        const iterations = 20;
        const cyclesPerIteration = 100000;

        console.log(`\nRunning ${iterations} iterations of ${cyclesPerIteration} cycles each...\n`);

        for (let i = 0; i < iterations; i++) {
            simulator.step(cyclesPerIteration);
            const pc = simulator.get_pc();
            const led = simulator.get_led_state();

            console.log(`[Iter ${i + 1}] PC: 0x${pc.toString(16).padStart(8, '0')} | LED: ${led ? '🔴 ON' : '⚫ OFF'}`);
        }

        console.log("\n✨ Simulation Test Complete!");
    } catch (e) {
        console.error("❌ Simulation Failed:", e);
        process.exit(1);
    }
}

main();
