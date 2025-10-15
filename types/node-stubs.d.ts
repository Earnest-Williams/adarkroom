declare module "node:test" {
  type TestFunction = () => void | Promise<void>;

  export function describe(name: string, fn: TestFunction): void;
  export function it(name: string, fn: TestFunction): void;
  export function beforeEach(fn: TestFunction): void;
}

declare module "node:assert/strict" {
  interface AssertionModule {
    equal(actual: unknown, expected: unknown, message?: string): void;
    deepEqual(actual: unknown, expected: unknown, message?: string): void;
    ok(value: unknown, message?: string): void;
    fail(message?: string): never;
  }

  const assert: AssertionModule;
  export default assert;
}

declare module "fs" {
  export type Dirent = {
    name: string;
    isDirectory(): boolean;
    isFile(): boolean;
  };

  export const promises: {
    readdir(path: string, options: { withFileTypes: true }): Promise<Dirent[]>;
    readFile(path: string, encoding: string): Promise<string>;
    writeFile(path: string, data: string, encoding: string): Promise<void>;
    access(path: string): Promise<void>;
    mkdir(path: string, options?: { recursive?: boolean }): Promise<void>;
  };
}

declare module "path" {
  export function join(...segments: string[]): string;
  export function resolve(...segments: string[]): string;
  export function relative(from: string, to: string): string;
  export function dirname(path: string): string;
}

declare const process: {
  cwd(): string;
  exitCode?: number;
};
