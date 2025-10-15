export type ConditionScope = "meta" | "character" | "world";

export interface Condition {
  kind: "flag" | "stat" | "time" | "weather" | "season" | "faction" | "morality";
  test: "gte" | "lte" | "eq" | "neq" | "in";
  key: string;
  value: number | string | string[];
  scope?: ConditionScope;
}

export interface Effect {
  kind:
    | "addItem"
    | "resource"
    | "flag"
    | "rep"
    | "morality"
    | "startQuest"
    | "advanceQuest"
    | "endQuest"
    | "telegraphRaid";
  key?: string;
  amount?: number;
  questId?: string;
  stage?: string;
  endingKey?: string;
}

export interface Choice {
  id: string;
  textKey: string;
  effects?: Effect[];
  next?: string;
  conditions?: Condition[];
}

export interface EventNode {
  id: string;
  bodyKey: string;
  art?: string;
  choices: Choice[];
}

export type EventCategory = "Room" | "Outside" | "World" | "Setpiece" | "Dungeon" | "Festival";

export interface EventDef {
  id: string;
  category: EventCategory;
  conditions?: Condition[];
  nodes: EventNode[];
  once?: boolean;
  tags?: string[];
}

export interface LoadedEvent {
  source: string;
  definition: EventDef;
}

export interface ContentManifest {
  events: Map<string, LoadedEvent>;
}

export type ConditionContext = Readonly<{ state: unknown }>;
