import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";

import { bus } from "../../script/engine/events/bus.js";
import { Scheduler } from "../../script/engine/scheduler.js";
import { StateManager } from "../../script/engine/state/StateManager.js";

function createScheduler(): { scheduler: Scheduler; stateManager: StateManager } {
  const stateManager = new StateManager();
  const scheduler = new Scheduler({ tickMs: 250, catchUpCap: 10 }, stateManager);
  return { scheduler, stateManager };
}

describe("Scheduler", () => {
  beforeEach(() => {
    bus.clear();
  });

  it("advances time deterministically and emits tick events", () => {
    const { scheduler, stateManager } = createScheduler();

    const received: unknown[] = [];
    const off = bus.on((event) => received.push(event));

    scheduler.stepOnce(250);

    off();

    const state = stateManager.getState();
    assert.equal(state.meta.time.minute, 1);
    assert.equal(state.meta.time.hour, 6);

    const tickEvent = received.find((event) => (event as { type?: string }).type === "TICK");
    assert.ok(tickEvent, "expected tick event to be emitted");
    assert.deepEqual(tickEvent, { type: "TICK", dt: 250, tick: 1 });
  });

  it("emits time slice and season change events when thresholds are crossed", () => {
    const { scheduler, stateManager } = createScheduler();

    const events: unknown[] = [];
    const off = bus.on((event) => events.push(event));

    stateManager.update((state) => {
      state.meta.time.hour = 6;
      state.meta.time.minute = 59;
      state.meta.time.tod = "dawn";
    });

    scheduler.stepOnce(250);

    const timeSlice = events.find((event) => (event as { type?: string }).type === "TIME_SLICE_CHANGED");
    assert.ok(timeSlice, "expected time slice change event");
    assert.equal((timeSlice as { tod: string }).tod, "day");

    events.length = 0;

    stateManager.update((state) => {
      state.meta.time.hour = 23;
      state.meta.time.minute = 59;
      state.meta.time.tod = "night";
      state.meta.time.day = 29;
      state.meta.time.season = "spring";
    });

    scheduler.stepOnce(250);

    const season = events.find((event) => (event as { type?: string }).type === "SEASON_CHANGED");
    assert.ok(season, "expected season change event");
    assert.equal((season as { from: string }).from, "spring");
    assert.equal((season as { to: string }).to, "summer");

    const state = stateManager.getState();
    assert.equal(state.meta.time.day, 30);
    assert.equal(state.meta.time.season, "summer");

    off();
  });

  it("rolls new weather fronts when the duration expires", () => {
    const { scheduler, stateManager } = createScheduler();

    stateManager.update((state) => {
      state.meta.weather.kind = "clear";
      state.meta.weather.durationTicksLeft = 0;
      state.meta.weather.seed = 1;
    });

    const events: unknown[] = [];
    const off = bus.on((event) => events.push(event));

    scheduler.stepOnce(250);

    off();

    const weather = events.find((event) => (event as { type?: string }).type === "WEATHER_CHANGED");
    assert.ok(weather, "expected weather change event");
    assert.equal((weather as { from: string }).from, "clear");
    assert.equal((weather as { to: string }).to, "fog");

    const state = stateManager.getState();
    assert.equal(state.meta.weather.kind, "fog");
    assert.ok(state.meta.weather.durationTicksLeft >= 6);
  });
});
