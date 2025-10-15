import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";

import { bus } from "../../script/engine/events/bus.js";
import { ContentRunner } from "../../script/engine/content/runner.js";
import type { EventDef } from "../../script/engine/content/schema.js";
import { StateManager } from "../../script/engine/state/StateManager.js";

describe("ContentRunner", () => {
  beforeEach(() => {
    bus.clear();
  });

  it("respects conditions, applies effects, and marks events complete", () => {
    const stateManager = new StateManager();
    const runner = new ContentRunner(stateManager);

    const event: EventDef = {
      id: "test:event",
      category: "Room",
      once: true,
      conditions: [
        { kind: "morality", test: "gte", key: "", value: 0 },
      ],
      nodes: [
        {
          id: "start",
          bodyKey: "events.test.start",
          choices: [
            {
              id: "continue",
              textKey: "events.test.continue",
              effects: [
                { kind: "morality", amount: 5 },
                { kind: "rep", key: "guild", amount: 10 },
                { kind: "flag", key: "story.seen" },
                { kind: "telegraphRaid", amount: 12, key: "3" },
              ],
            },
          ],
        },
      ],
    };

    runner.register(event);

    assert.equal(runner.canRun("test:event"), true);

    const session = runner.start("test:event");
    const choices = runner.getAvailableChoices(session);
    assert.equal(choices.length, 1);

    const events: unknown[] = [];
    const off = bus.on((payload) => events.push(payload));

    runner.choose(session, "continue");

    off();

    assert.equal(session.completed, true);
    assert.equal(runner.canRun("test:event"), false, "once events should not rerun");

    const state = stateManager.getState();
    assert.equal(state.meta.morality, 5);
    assert.equal(state.meta.factions.guild, 10);
    assert.equal(state.meta.flags["story.seen"], true);

    const raid = events.find((payload) => (payload as { type?: string }).type === "RAID_TELEGRAPH");
    assert.ok(raid, "expected raid telegraph event to be emitted");
    assert.equal((raid as { etaTicks: number }).etaTicks, 12);
    assert.equal((raid as { strength: number }).strength, 3);
  });
});
