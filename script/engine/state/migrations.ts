import {
  MetaFlags,
  RootState,
  SEASONS,
  TIMES_OF_DAY,
  WEATHER_KINDS,
  defaultMeta,
  defaultRootState,
} from "../../../types/state.js";

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    (Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null)
  );
}

function coerceNumber(value: unknown, fallback: number): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return fallback;
  }

  return value;
}

function sanitizeMeta(input: unknown): MetaFlags {
  const defaults = defaultMeta();
  if (!isPlainObject(input)) {
    return defaults;
  }

  const quests = isPlainObject(input.quests) ? (input.quests as Record<string, MetaFlags["quests"][string]>) : {};
  const factions = isPlainObject(input.factions)
    ? (Object.fromEntries(
        Object.entries(input.factions).map(([key, value]) => [key, coerceNumber(value, 0)]),
      ) as Record<string, number>)
    : {};

  const morality = coerceNumber(input.morality, defaults.morality);
  const flags = isPlainObject((input as { flags?: unknown }).flags)
    ? (Object.fromEntries(
        Object.entries((input as { flags: Record<string, unknown> }).flags).map(([key, value]) => [
          key,
          Boolean(value),
        ]),
      ) as Record<string, boolean>)
    : {};

  const timeInput = isPlainObject(input.time) ? input.time : {};
  const time = {
    day: Math.max(0, Math.floor(coerceNumber(timeInput.day, defaults.time.day))),
    tod: TIMES_OF_DAY.includes(timeInput.tod as never)
      ? (timeInput.tod as MetaFlags["time"]["tod"])
      : defaults.time.tod,
    hour: Math.min(23, Math.max(0, Math.floor(coerceNumber(timeInput.hour, defaults.time.hour)))),
    minute: Math.min(59, Math.max(0, Math.floor(coerceNumber(timeInput.minute, defaults.time.minute)))),
    season: SEASONS.includes(timeInput.season as never)
      ? (timeInput.season as MetaFlags["time"]["season"])
      : defaults.time.season,
    year: Math.max(1, Math.floor(coerceNumber(timeInput.year, defaults.time.year))),
  } satisfies MetaFlags["time"];

  const weatherInput = isPlainObject(input.weather) ? input.weather : {};
  const weatherKind = WEATHER_KINDS.includes(weatherInput.kind as never)
    ? (weatherInput.kind as MetaFlags["weather"]["kind"])
    : defaults.weather.kind;
  const weather = {
    kind: weatherKind,
    intensity: Math.max(0, Math.min(1, coerceNumber(weatherInput.intensity, defaults.weather.intensity))),
    durationTicksLeft: Math.max(
      0,
      Math.floor(coerceNumber(weatherInput.durationTicksLeft, defaults.weather.durationTicksLeft)),
    ),
    seed: Math.max(0, Math.floor(coerceNumber(weatherInput.seed, defaults.weather.seed))),
  } satisfies MetaFlags["weather"];

  return {
    quests,
    morality,
    factions,
    flags,
    time,
    weather,
  };
}

function sanitizeRootState(input: unknown): RootState {
  const defaults = defaultRootState();
  if (!isPlainObject(input)) {
    return defaults;
  }

  const feature = isPlainObject(input.feature) ? { ...input.feature } : {};
  const store = isPlainObject(input.store) ? { ...input.store } : {};
  const world = isPlainObject(input.world) ? { ...input.world } : {};

  const characterInput = isPlainObject(input.character) ? input.character : {};
  const companionsValue = characterInput.companions;
  const petsValue = characterInput.pets;
  const companions = Array.isArray(companionsValue) ? [...companionsValue] : [];
  const pets = Array.isArray(petsValue) ? [...petsValue] : [];

  const meta = sanitizeMeta(input.meta);
  const morality = coerceNumber(characterInput.morality, meta.morality);
  const character = {
    ...characterInput,
    companions,
    pets,
    morality,
  } as RootState["character"];

  return {
    feature,
    store,
    character,
    world,
    meta,
  };
}

type Migration = (state: unknown) => unknown;

const MIGRATIONS: Migration[] = [
  (state) => (state ? state : defaultRootState()),
  (state) => {
    const working = isPlainObject(state) ? { ...state } : {};
    if (!working.meta) {
      working.meta = defaultMeta();
    }
    return working;
  },
];

export function applyMigrations(raw: unknown): RootState {
  const migrated = MIGRATIONS.reduce<unknown>((current, migrate) => migrate(current), raw);
  return sanitizeRootState(migrated);
}
