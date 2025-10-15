import type { RootState } from "../../../types/state";
import { StateManager } from "../state/StateManager";
import { bus } from "../events/bus";
import type {
  Choice,
  Condition,
  ContentManifest,
  Effect,
  EventDef,
  EventNode,
} from "./schema";

export interface EventSession {
  readonly event: EventDef;
  readonly history: string[];
  currentNode: EventNode | null;
  completed: boolean;
}

export interface RunnerOptions {
  onNode?: (node: EventNode, event: EventDef) => void;
  onChoice?: (choice: Choice, node: EventNode, event: EventDef) => void;
}

export class ContentRunner {
  private readonly events = new Map<string, EventDef>();

  constructor(private readonly stateManager: StateManager, private readonly options: RunnerOptions = {}) {}

  ingest(manifest: ContentManifest): void {
    for (const { definition } of manifest.events.values()) {
      this.register(definition);
    }
  }

  register(definition: EventDef): void {
    if (this.events.has(definition.id)) {
      throw new Error(`Event with id '${definition.id}' already registered.`);
    }
    this.events.set(definition.id, definition);
  }

  getEvent(id: string): EventDef | undefined {
    return this.events.get(id);
  }

  canRun(id: string): boolean {
    const definition = this.events.get(id);
    if (!definition) {
      return false;
    }

    const state = this.stateManager.snapshot();
    if (definition.once && this.isEventComplete(state, id)) {
      return false;
    }

    return this.evaluateConditions(definition.conditions, state);
  }

  start(id: string): EventSession {
    const definition = this.events.get(id);
    if (!definition) {
      throw new Error(`Unknown event '${id}'.`);
    }

    const state = this.stateManager.snapshot();
    if (!this.evaluateConditions(definition.conditions, state)) {
      throw new Error(`Event '${id}' does not meet its start conditions.`);
    }

    if (definition.once && this.isEventComplete(state, id)) {
      throw new Error(`Event '${id}' is marked as once and has already been completed.`);
    }

    const startNode = definition.nodes[0];
    if (!startNode) {
      throw new Error(`Event '${id}' has no nodes to run.`);
    }

    this.options.onNode?.(startNode, definition);
    return {
      event: definition,
      history: [startNode.id],
      currentNode: startNode,
      completed: false,
    };
  }

  getAvailableChoices(session: EventSession): Choice[] {
    if (!session.currentNode) {
      return [];
    }
    const state = this.stateManager.snapshot();
    return session.currentNode.choices.filter((choice) => this.evaluateConditions(choice.conditions, state));
  }

  choose(session: EventSession, choiceId: string): void {
    if (!session.currentNode) {
      throw new Error("No active node to choose from.");
    }

    const choices = this.getAvailableChoices(session);
    const choice = choices.find((c) => c.id === choiceId);
    if (!choice) {
      throw new Error(`Choice '${choiceId}' is not available.`);
    }

    this.applyEffects(choice.effects);
    this.options.onChoice?.(choice, session.currentNode, session.event);

    if (!choice.next) {
      this.finalize(session);
      return;
    }

    const nextNode = session.event.nodes.find((node) => node.id === choice.next);
    if (!nextNode) {
      this.finalize(session);
      return;
    }

    session.history.push(nextNode.id);
    session.currentNode = nextNode;
    this.options.onNode?.(nextNode, session.event);
  }

  private finalize(session: EventSession): void {
    session.completed = true;
    session.currentNode = null;
    this.stateManager.update((state) => {
      this.markEventComplete(state, session.event);
    });
  }

  private evaluateConditions(conditions: Condition[] | undefined, state: RootState): boolean {
    if (!conditions || conditions.length === 0) {
      return true;
    }

    return conditions.every((condition) => this.evaluateCondition(condition, state));
  }

  private evaluateCondition(condition: Condition, state: RootState): boolean {
    const candidate = this.resolveConditionValue(condition, state);

    switch (condition.test) {
      case "gte":
        return Number(candidate) >= Number(condition.value);
      case "lte":
        return Number(candidate) <= Number(condition.value);
      case "eq":
        return candidate === condition.value;
      case "neq":
        return candidate !== condition.value;
      case "in":
        return Array.isArray(condition.value) ? condition.value.includes(candidate as string) : false;
      default:
        return false;
    }
  }

  private resolveConditionValue(condition: Condition, state: RootState): unknown {
    switch (condition.kind) {
      case "morality":
        return state.meta.morality;
      case "faction":
        return state.meta.factions[condition.key] ?? 0;
      case "season":
        return state.meta.time.season;
      case "time":
        return this.resolvePath(state.meta.time, condition.key);
      case "weather":
        return this.resolvePath(state.meta.weather, condition.key);
      case "flag": {
        const scope = condition.scope ?? "meta";
        if (scope === "meta") {
          return state.meta.flags[condition.key];
        }
        const base = this.scopeTarget(state, scope);
        return this.resolvePath(base, condition.key);
      }
      case "stat": {
        const scope = condition.scope ?? "character";
        const base = this.scopeTarget(state, scope);
        return this.resolvePath(base, condition.key);
      }
      default:
        return this.resolvePath(state.meta as unknown as Record<string, unknown>, condition.key);
    }
  }

  private scopeTarget(state: RootState, scope: NonNullable<Condition["scope"]>): unknown {
    switch (scope) {
      case "meta":
        return state.meta;
      case "character":
        return state.character;
      case "world":
        return state.world;
      default:
        return state.meta;
    }
  }

  private resolvePath(object: unknown, path: string): unknown {
    if (!object || typeof object !== "object") {
      return undefined;
    }
    if (!path) {
      return object;
    }

    const segments = path.split(".").filter(Boolean);
    let current: unknown = object;
    for (const segment of segments) {
      if (!current || typeof current !== "object") {
        return undefined;
      }
      current = (current as Record<string, unknown>)[segment];
    }
    return current;
  }

  private applyEffects(effects: Effect[] | undefined): void {
    if (!effects || effects.length === 0) {
      return;
    }

    this.stateManager.update((state) => {
      for (const effect of effects) {
        this.applyEffect(state, effect);
      }
    });
  }

  private applyEffect(state: RootState, effect: Effect): void {
    switch (effect.kind) {
      case "addItem":
      case "resource": {
        if (!effect.key) {
          return;
        }
        const path = effect.key.includes(".") ? effect.key : `store.${effect.key}`;
        this.incrementPath(state as unknown as Record<string, unknown>, path, effect.amount ?? 1);
        break;
      }
      case "flag": {
        if (!effect.key) {
          return;
        }
        const value = effect.amount === undefined ? true : Boolean(effect.amount);
        state.meta.flags[effect.key] = value;
        break;
      }
      case "rep": {
        if (!effect.key) {
          return;
        }
        const delta = effect.amount ?? 0;
        const current = state.meta.factions[effect.key] ?? 0;
        state.meta.factions[effect.key] = this.clampNumber(current + delta, -100, 100);
        break;
      }
      case "morality": {
        const delta = effect.amount ?? 0;
        state.meta.morality = this.clampNumber(state.meta.morality + delta, -100, 100);
        break;
      }
      case "startQuest": {
        if (!effect.questId) {
          return;
        }
        state.meta.quests[effect.questId] = {
          id: effect.questId,
          stage: effect.stage ?? "start",
          startedAtDay: state.meta.time.day,
          completed: false,
        };
        break;
      }
      case "advanceQuest": {
        if (!effect.questId) {
          return;
        }
        const quest = state.meta.quests[effect.questId];
        if (!quest) {
          state.meta.quests[effect.questId] = {
            id: effect.questId,
            stage: effect.stage ?? "start",
            startedAtDay: state.meta.time.day,
          };
        } else if (effect.stage) {
          quest.stage = effect.stage;
        }
        break;
      }
      case "endQuest": {
        if (!effect.questId) {
          return;
        }
        const quest = state.meta.quests[effect.questId] ?? {
          id: effect.questId,
          stage: effect.stage ?? "end",
          startedAtDay: state.meta.time.day,
        };
        quest.completed = true;
        if (effect.endingKey) {
          quest.endingKey = effect.endingKey;
        }
        state.meta.quests[effect.questId] = quest;
        break;
      }
      case "telegraphRaid": {
        const etaTicks = Math.max(0, Math.floor(effect.amount ?? 0));
        const strengthValue = effect.key ? Number(effect.key) : NaN;
        const strength = Number.isFinite(strengthValue) && strengthValue > 0 ? strengthValue : 1;
        bus.emit({ type: "RAID_TELEGRAPH", etaTicks, strength });
        break;
      }
    }
  }

  private clampNumber(value: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, value));
  }

  private incrementPath(target: Record<string, unknown>, path: string, amount: number): void {
    const segments = path.split(".").filter(Boolean);
    if (segments.length === 0) {
      return;
    }

    const last = segments.pop()!;
    let cursor: Record<string, unknown> = target;
    for (const segment of segments) {
      const next = cursor[segment];
      if (!next || typeof next !== "object") {
        cursor[segment] = {};
      }
      cursor = cursor[segment] as Record<string, unknown>;
    }

    const currentValue = Number(cursor[last] ?? 0);
    const nextValue = Number.isFinite(currentValue) ? currentValue + amount : amount;
    cursor[last] = nextValue;
  }

  private markEventComplete(state: RootState, event: EventDef): void {
    if (!event.once) {
      return;
    }
    state.meta.flags[`event.${event.id}`] = true;
  }

  private isEventComplete(state: RootState, eventId: string): boolean {
    return Boolean(state.meta.flags[`event.${eventId}`]);
  }
}
