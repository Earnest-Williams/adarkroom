import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

import { Scheduler } from "../../script/engine/scheduler.js";
import { StateManager } from "../../script/engine/state/StateManager.js";
import { defaultRootState } from "../../types/state.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const TIME_CONFIG = JSON.parse(
  readFileSync(resolve(__dirname, "../../../config/time.json"), "utf8"),
) as {
  timeOfDay?: { slice: string; startHour: number; endHour: number }[];
  weather?: Record<string, unknown>;
};

function createScheduler() {
  const manager = new StateManager(defaultRootState());
  const scheduler = new Scheduler(
    { tickMs: 250, catchUpCap: 10, config: TIME_CONFIG },
    manager,
  );
  return { scheduler, manager };
}

describe("scheduler", () => {
  it("transitions from night to dawn at configured hours", () => {
    const { scheduler, manager } = createScheduler();
    manager.update((draft) => {
      draft.meta.time.hour = 4;
      draft.meta.time.minute = 59;
      draft.meta.time.tod = "night";
    });

    scheduler.stepOnce(250);
    const state = manager.getState();
    assert.equal(state.meta.time.hour, 5);
    assert.equal(state.meta.time.tod, "dawn");
  });

  it("enters dusk after configured daytime hours", () => {
    const { scheduler, manager } = createScheduler();
    manager.update((draft) => {
      draft.meta.time.hour = 18;
      draft.meta.time.minute = 59;
      draft.meta.time.tod = "day";
    });

    scheduler.stepOnce(250);
    const state = manager.getState();
    assert.equal(state.meta.time.hour, 19);
    assert.equal(state.meta.time.tod, "dusk");
  });

  it("decrements existing weather durations before transitioning", () => {
    const { scheduler, manager } = createScheduler();
    manager.update((draft) => {
      draft.meta.weather.kind = "rain";
      draft.meta.weather.durationTicksLeft = 5;
      draft.meta.weather.intensity = 0.5;
    });

    scheduler.stepOnce(250);
    const state = manager.getState();
    assert.equal(state.meta.weather.kind, "rain");
    assert.equal(state.meta.weather.durationTicksLeft, 4);
  });

  it("draws weather properties from configuration ranges", () => {
    const { scheduler, manager } = createScheduler();
    manager.update((draft) => {
      draft.meta.time.season = "winter";
      draft.meta.weather.kind = "snow";
      draft.meta.weather.durationTicksLeft = 0;
      draft.meta.weather.seed = 12345;
    });

    scheduler.stepOnce(250);
    const state = manager.getState();
    const duration = state.meta.weather.durationTicksLeft;
    const intensity = state.meta.weather.intensity;

    assert.ok(duration >= 12 && duration <= 36, `duration ${duration} outside winter snow range`);
    assert.ok(intensity >= 0.4 && intensity <= 0.9, `intensity ${intensity} outside snow range`);
  });
});
