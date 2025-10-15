import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { ContentRunner } from "../../script/engine/content/runner.js";
import { StateManager } from "../../script/engine/state/StateManager.js";
import { defaultRootState } from "../../types/state.js";

describe("ContentRunner", () => {
  it("filters choices by conditions and applies effects", () => {
    const manager = new StateManager(defaultRootState());
    manager.update((draft) => {
      draft.meta.morality = 5;
    });

    const runner = new ContentRunner(manager);
    runner.register({
      id: "event:test",
      category: "Room",
      nodes: [
        {
          id: "start",
          bodyKey: "start",
          choices: [
            { id: "deny", textKey: "deny", effects: [] },
            {
              id: "accept",
              textKey: "accept",
              effects: [
                { kind: "resource", key: "wood", amount: 3 },
                { kind: "morality", amount: -2 },
                { kind: "flag", key: "flag.accepted" },
              ],
              conditions: [{ kind: "morality", test: "gte", key: "", value: 3 }],
            },
          ],
        },
      ],
    });

    const session = runner.start("event:test");
    const choices = runner.getAvailableChoices(session);
    assert.deepEqual(
      choices.map((choice) => choice.id),
      ["deny", "accept"],
    );

    runner.choose(session, "accept");
    const state = manager.getState();
    assert.equal(state.store.wood, 3);
    assert.equal(state.meta.morality, 3);
    assert.equal(state.meta.flags["flag.accepted"], true);
  });

  it("marks once events as complete", () => {
    const manager = new StateManager(defaultRootState());
    const runner = new ContentRunner(manager);

    runner.register({
      id: "event:once",
      category: "Room",
      once: true,
      nodes: [
        {
          id: "start",
          bodyKey: "start",
          choices: [
            { id: "finish", textKey: "finish", effects: [] },
          ],
        },
      ],
    });

    assert.equal(runner.canRun("event:once"), true);
    const session = runner.start("event:once");
    runner.choose(session, "finish");
    assert.equal(session.completed, true);
    assert.equal(runner.canRun("event:once"), false);
    let caught: unknown = null;
    try {
      runner.start("event:once");
    } catch (error) {
      caught = error;
    }
    assert.ok(caught instanceof Error);
  });
});
