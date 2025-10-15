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
