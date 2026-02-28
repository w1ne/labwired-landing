/* tslint:disable */
/* eslint-disable */

export class WasmSimulator {
    free(): void;
    [Symbol.dispose](): void;
    get_disassembly(): string;
    get_led_state(): boolean;
    get_pc(): number;
    get_register(id: number): number;
    get_register_names(): any;
    constructor(firmware: Uint8Array);
    read_memory(addr: number, len: number): Uint8Array;
    step(cycles: number): void;
    step_single(): void;
}

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
    readonly memory: WebAssembly.Memory;
    readonly __wbg_wasmsimulator_free: (a: number, b: number) => void;
    readonly wasmsimulator_get_disassembly: (a: number) => [number, number];
    readonly wasmsimulator_get_led_state: (a: number) => number;
    readonly wasmsimulator_get_pc: (a: number) => number;
    readonly wasmsimulator_get_register: (a: number, b: number) => number;
    readonly wasmsimulator_get_register_names: (a: number) => any;
    readonly wasmsimulator_new: (a: number, b: number) => [number, number, number];
    readonly wasmsimulator_read_memory: (a: number, b: number, c: number) => [number, number];
    readonly wasmsimulator_step: (a: number, b: number) => [number, number];
    readonly wasmsimulator_step_single: (a: number) => [number, number];
    readonly __wbindgen_malloc: (a: number, b: number) => number;
    readonly __wbindgen_realloc: (a: number, b: number, c: number, d: number) => number;
    readonly __wbindgen_externrefs: WebAssembly.Table;
    readonly __wbindgen_free: (a: number, b: number, c: number) => void;
    readonly __externref_table_dealloc: (a: number) => void;
    readonly __wbindgen_start: () => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;

/**
 * Instantiates the given `module`, which can either be bytes or
 * a precompiled `WebAssembly.Module`.
 *
 * @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
 *
 * @returns {InitOutput}
 */
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
 * If `module_or_path` is {RequestInfo} or {URL}, makes a request and
 * for everything else, calls `WebAssembly.instantiate` directly.
 *
 * @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
 *
 * @returns {Promise<InitOutput>}
 */
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;
