export type Season = "spring" | "summer" | "autumn" | "winter";
export type TimeOfDay = "dawn" | "day" | "dusk" | "night";
export const SEASONS: readonly Season[] = [
  "spring",
  "summer",
  "autumn",
  "winter",
];
export const TIMES_OF_DAY: readonly TimeOfDay[] = [
  "dawn",
  "day",
  "dusk",
  "night",
];
export type WeatherKind =
  | "clear"
  | "rain"
  | "storm"
  | "snow"
  | "fog"
  | "heatwave"
  | "blizzard";
export const WEATHER_KINDS: readonly WeatherKind[] = [
  "clear",
  "rain",
  "storm",
  "snow",
  "fog",
  "heatwave",
  "blizzard",
];

export interface MetaFlags {
  quests: Record<string, QuestState>;
  morality: number;
  factions: Record<string, number>;
  flags: Record<string, boolean>;
  time: {
    day: number;
    tod: TimeOfDay;
    hour: number;
    minute: number;
    season: Season;
    year: number;
  };
  weather: {
    kind: WeatherKind;
    intensity: number;
    durationTicksLeft: number;
    seed: number;
  };
}

export interface QuestState {
  id: string;
  stage: string;
  vars?: Record<string, number | string | boolean>;
  startedAtDay: number;
  completed?: boolean;
  endingKey?: string;
}

export interface Companion {
  id: string;
  name?: string;
  [key: string]: unknown;
}

export interface Pet {
  id: string;
  name?: string;
  [key: string]: unknown;
}

export interface RootState {
  feature: Record<string, unknown>;
  store: Record<string, unknown>;
  character: Record<string, unknown> & {
    companions: Companion[];
    pets: Pet[];
    morality: number;
  };
  world: Record<string, unknown>;
  meta: MetaFlags;
}

const WEATHER_SEED_MAX = 0xffffffff;

function generateSeed(): number {
  const random = Math.random();
  const seed = Math.floor(random * WEATHER_SEED_MAX);
  return Number.isFinite(seed) ? seed : 0;
}

export function defaultMeta(): MetaFlags {
  return {
    quests: {},
    morality: 0,
    factions: {},
    flags: {},
    time: {
      day: 0,
      tod: "dawn",
      hour: 6,
      minute: 0,
      season: "spring",
      year: 1,
    },
    weather: {
      kind: "clear",
      intensity: 0,
      durationTicksLeft: 0,
      seed: generateSeed(),
    },
  };
}

export function defaultRootState(): RootState {
  return {
    feature: {},
    store: {},
    character: {
      companions: [],
      pets: [],
      morality: 0,
    },
    world: {},
    meta: defaultMeta(),
  };
}
