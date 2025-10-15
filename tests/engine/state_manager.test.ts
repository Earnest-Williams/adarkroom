import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { StateManager } from "../../script/engine/state/StateManager.js";
import { defaultMeta, defaultRootState, WEATHER_KINDS } from "../../types/state.js";

describe("StateManager", () => {
  it("initializes with migrated default state", () => {
    const initial = { meta: { ...defaultMeta(), morality: 10 } };
    const manager = new StateManager(initial);

    const state = manager.getState();
    assert.equal(state.meta.morality, 10);
    assert.equal(state.character.morality, 10);
  });

  it("sanitizes invalid input on load", () => {
    const manager = new StateManager();
    manager.load({
      meta: {
        morality: "bad",
        factions: { raiders: "50" },
        time: { day: -5, tod: "noon", hour: 30, minute: 90, season: "monsoon", year: 0 },
        weather: { kind: "sandstorm", intensity: 5, durationTicksLeft: -10, seed: -1 },
      },
      character: { morality: -999 },
    });

    const state = manager.getState();
    assert.equal(state.meta.morality, 0);
    assert.equal(state.meta.time.day >= 0, true);
    assert.equal(state.meta.time.tod, "dawn");
    assert.equal(state.meta.time.hour >= 0 && state.meta.time.hour < 24, true);
    assert.equal(state.meta.time.minute >= 0 && state.meta.time.minute < 60, true);
    assert.equal(WEATHER_KINDS.includes(state.meta.weather.kind), true);
    assert.equal(state.meta.weather.intensity >= 0 && state.meta.weather.intensity <= 1, true);
    assert.equal(state.meta.weather.durationTicksLeft >= 0, true);
    assert.equal(state.meta.weather.seed >= 0, true);
    assert.equal(state.character.morality, state.meta.morality);
  });

  it("notifies subscribers with immutable snapshots", () => {
    const manager = new StateManager(defaultRootState());
    const seen: number[] = [];
    const unsubscribe = manager.subscribe((state) => {
      seen.push(state.meta.morality);
      state.meta.morality = -1234;
    });

    manager.update((draft) => {
      draft.meta.morality = 5;
    });

    unsubscribe();

    const state = manager.getState();
    assert.deepEqual(seen, [5]);
    assert.equal(state.meta.morality, 5);
  });
});
