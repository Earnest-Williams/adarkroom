declare module "node:fs" {
  export type PathLike = string | number | { toString(): string };
  export interface ReadFileSyncOptions {
    encoding?: string | null;
    flag?: string;
  }
  export function readFileSync(path: PathLike, options: ReadFileSyncOptions | string): string;
}

declare module "node:path" {
  export function resolve(...paths: string[]): string;
  export function dirname(path: string): string;
}

declare module "node:url" {
  export function fileURLToPath(url: string | URL): string;
}

declare module "node:test" {
  export type TestFn = (...args: unknown[]) => unknown;
  export interface TestOptions {
    only?: boolean;
    skip?: boolean | string;
    todo?: boolean | string;
    signal?: AbortSignal;
    timeout?: number;
  }
  export function describe(name: string, fn: TestFn): void;
  export function it(name: string, fn: TestFn, options?: TestOptions): void;
}

declare module "node:assert/strict" {
  export function equal(actual: unknown, expected: unknown, message?: string | Error): void;
  export function ok(value: unknown, message?: string | Error): void;
  export default {
    equal: typeof equal,
    ok: typeof ok,
  };
}
