import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";

import {
  configureTelemetry,
  getBufferedEvents,
  getTelemetryCountersSnapshot,
  getTelemetryMode,
  recordEventRuntime,
  recordSchedulerLag,
  recordUiRenderWarning,
  resetTelemetry,
  track,
} from "../../script/engine/telemetry.js";

describe("telemetry", () => {
  beforeEach(() => {
    resetTelemetry();
  });

  it("does not emit events when unconfigured", () => {
    track("noop:event", { value: 1 });

    assert.equal(getTelemetryMode(), "noop");
    assert.equal(getBufferedEvents().length, 0);
  });

  it("logs to the supplied logger in development mode", () => {
    const calls: unknown[] = [];
    const logger = (event: unknown) => {
      calls.push(event);
    };

    configureTelemetry({ mode: "development", logger });
    track("dev:event", { foo: "bar" });

    assert.equal(calls.length, 1);
    const [event] = calls as [{ name?: string }];
    if (!event || typeof event !== "object" || !("name" in event)) {
      assert.fail("Logger did not receive an event payload");
    }
    assert.equal((event as { name: string }).name, "dev:event");
    assert.equal(getBufferedEvents().length, 0);
  });

  it("buffers events in production mode with ring buffer semantics", () => {
    configureTelemetry({ mode: "production", bufferSize: 2 });

    track("event:one");
    track("event:two");
    track("event:three");

    const events = getBufferedEvents();
    assert.equal(events.length, 2);
    assert.deepEqual(
      events.map((event) => event.name),
      ["event:two", "event:three"],
    );
  });

  it("aggregates scheduler, runtime, and UI warning counters", () => {
    recordSchedulerLag(16);
    recordSchedulerLag(32);
    recordEventRuntime(12);
    recordUiRenderWarning();
    recordUiRenderWarning(2);

    const snapshot = getTelemetryCountersSnapshot();

    assert.equal(snapshot.schedulerLag.count, 2);
    assert.equal(snapshot.schedulerLag.max, 32);
    assert.equal(snapshot.schedulerLag.min, 16);
    assert.ok(snapshot.schedulerLag.average !== null && Math.abs(snapshot.schedulerLag.average - 24) < 1e-6);
    assert.equal(snapshot.eventRuntime.total, 12);
    assert.equal(snapshot.uiRenderWarnings.count, 3);
    assert.equal(snapshot.uiRenderWarnings.lastValue, 2);
  });

  it("resets buffers and counters", () => {
    configureTelemetry({ mode: "production" });
    track("event:one");
    recordSchedulerLag(10);
    recordUiRenderWarning(5);

    resetTelemetry();

    assert.equal(getTelemetryMode(), "noop");
    assert.equal(getBufferedEvents().length, 0);

    const snapshot = getTelemetryCountersSnapshot();
    assert.equal(snapshot.schedulerLag.count, 0);
    assert.equal(snapshot.uiRenderWarnings.count, 0);
  });
});
