import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { StateManager } from "../../script/engine/state/StateManager.js";
import type { RootState } from "../../types/state.js";
import { defaultMeta } from "../../types/state.js";

describe("StateManager migrations", () => {
  it("hydrates default meta flags for legacy saves", () => {
    const manager = new StateManager();
    const legacyState: Partial<RootState> = {
      feature: {},
      store: {},
      character: {
        companions: [],
        pets: [],
        morality: 0,
      },
      world: {},
      // intentionally omit meta
    };

    const loaded = manager.load(legacyState);

    assert.ok(loaded.meta, "expected meta to be defined");
    const defaults = defaultMeta();
    assert.equal(loaded.meta.morality, defaults.morality);
    assert.deepEqual(loaded.meta.factions, defaults.factions);
    assert.equal(loaded.meta.time.tod, defaults.time.tod);
    assert.equal(loaded.meta.time.hour, defaults.time.hour);
    assert.equal(loaded.meta.weather.kind, defaults.weather.kind);
    assert.equal(loaded.meta.weather.intensity, defaults.weather.intensity);
    assert.equal(typeof loaded.meta.weather.seed, "number");
  });

  it("preserves meta flags and companions when reloading", () => {
    const manager = new StateManager();
    manager.update((state) => {
      state.character.companions.push({ id: "ally" });
      state.meta.factions.guild = 25;
      state.meta.morality = 10;
      state.meta.weather.seed = 12345;
    });

    const saved = manager.snapshot();
    const serialized = JSON.parse(JSON.stringify(saved));

    const rehydrated = new StateManager();
    const loaded = rehydrated.load(serialized);

    assert.equal(loaded.meta.morality, 10);
    assert.equal(loaded.meta.factions.guild, 25);
    assert.equal(loaded.character.companions.length, 1);
    assert.equal(loaded.character.companions[0]?.id, "ally");
    assert.equal(loaded.meta.weather.seed, saved.meta.weather.seed);
  });
});
