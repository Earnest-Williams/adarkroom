import { bus } from "./events/bus.js";
import { StateManager } from "./state/StateManager.js";
import type { MetaFlags, Season, TimeOfDay, WeatherKind } from "../../types/state.js";
import { SEASONS, TIMES_OF_DAY, WEATHER_KINDS } from "../../types/state.js";

export interface SchedulerOptions {
  tickMs: number;
  catchUpCap: number;
  config?: SchedulerConfig;
}

interface AdvanceTimeResult {
  timeSliceChanged: boolean;
  previousTimeSlice: TimeOfDay;
  nextTimeSlice: TimeOfDay;
  seasonChanged: boolean;
  previousSeason: Season;
  nextSeason: Season;
}

interface AdvanceWeatherResult {
  changed: boolean;
  previousKind: WeatherKind;
  nextKind: WeatherKind;
}

type TimerHandle = ReturnType<typeof setInterval> | null;

const DEFAULT_OPTIONS: SchedulerOptions = {
  tickMs: 250,
  catchUpCap: 10,
};

const MINUTES_PER_TICK = 1;
const DAYS_PER_SEASON = 30;

type RawTimeRange = {
  slice?: string;
  startHour?: number;
  endHour?: number;
};

type WeatherTransitionWeights = Record<string, number>;

type WeatherTransitionTable = Record<string, WeatherTransitionWeights>;

interface WeatherConfigSchema {
  durations?: Partial<Record<WeatherKind, [number, number]>>;
  intensity?: Partial<Record<WeatherKind, [number, number]>>;
  transitions?: Record<string, WeatherTransitionTable>;
}

interface TimeRange {
  slice: TimeOfDay;
  startHour: number;
  endHour: number;
}

export interface SchedulerConfig {
  timeOfDay?: RawTimeRange[];
  weather?: WeatherConfigSchema;
}

interface NormalizedWeatherConfig {
  durations: Partial<Record<WeatherKind, [number, number]>>;
  intensity: Partial<Record<WeatherKind, [number, number]>>;
  transitions: Record<string, WeatherTransitionTable>;
}

const DEFAULT_TIME_RANGES: readonly TimeRange[] = [
  { slice: "dawn", startHour: 5, endHour: 6 },
  { slice: "day", startHour: 7, endHour: 18 },
  { slice: "dusk", startHour: 19, endHour: 20 },
  { slice: "night", startHour: 21, endHour: 4 },
];

function clampHour(value: number | undefined): number {
  const numeric = Number.isFinite(value) ? Math.floor(value as number) : 0;
  const normalized = numeric % 24;
  return normalized < 0 ? normalized + 24 : normalized;
}

function isHourWithinRange(hour: number, range: TimeRange): boolean {
  const start = clampHour(range.startHour);
  const end = clampHour(range.endHour);
  if (start === end) {
    return hour === start;
  }
  if (start < end) {
    return hour >= start && hour <= end;
  }
  return hour >= start || hour <= end;
}

function normalizeTimeRanges(raw?: RawTimeRange[]): readonly TimeRange[] {
  const configured = (raw ?? [])
    .map<TimeRange | undefined>((range) => {
      const slice = typeof range.slice === "string" ? (range.slice as TimeOfDay) : undefined;
      if (!slice || !TIMES_OF_DAY.includes(slice)) {
        return undefined;
      }
      const startHour = clampHour(range.startHour);
      const endHour = clampHour(range.endHour ?? range.startHour);
      return { slice, startHour, endHour };
    })
    .filter((range): range is TimeRange => Boolean(range));

  return configured.length > 0 ? configured : DEFAULT_TIME_RANGES;
}

const EMPTY_WEATHER_CONFIG: NormalizedWeatherConfig = {
  durations: {},
  intensity: {},
  transitions: {},
};

function normalizeWeatherConfig(config?: WeatherConfigSchema): NormalizedWeatherConfig {
  if (!config) {
    return { ...EMPTY_WEATHER_CONFIG };
  }
  return {
    durations: config.durations ?? {},
    intensity: config.intensity ?? {},
    transitions: config.transitions ? { ...config.transitions } : {},
  };
}

function now(): number {
  if (typeof performance !== "undefined" && typeof performance.now === "function") {
    return performance.now();
  }

  return Date.now();
}

function createRng(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function resolveTimeSlice(hour: number, minute: number, ranges: readonly TimeRange[]): TimeOfDay {
  const normalizedHour = clampHour(hour);
  for (const range of ranges) {
    if (isHourWithinRange(normalizedHour, range)) {
      return range.slice;
    }
  }
  return ranges[0]?.slice ?? "dawn";
}

function resolveWeatherDuration(kind: WeatherKind, rng: () => number, config: NormalizedWeatherConfig): number {
  const range = config.durations?.[kind];
  const min = Math.max(1, Math.floor((range && range[0]) ?? 6));
  const max = Math.max(min, Math.floor((range && range[1]) ?? 24));
  const span = max - min + 1;
  return min + Math.floor(rng() * span);
}

function resolveWeatherIntensity(kind: WeatherKind, rng: () => number, config: NormalizedWeatherConfig): number {
  const range = config.intensity?.[kind];
  if (!range || range.length !== 2) {
    return clamp(rng(), 0, 1);
  }
  const min = clamp(range[0] ?? 0, 0, 1);
  const max = clamp(range[1] ?? min, min, 1);
  if (max <= min) {
    return min;
  }
  return min + rng() * (max - min);
}

function pickWeatherKind(
  current: WeatherKind,
  season: Season,
  rng: () => number,
  config: NormalizedWeatherConfig,
): WeatherKind {
  const transitions = config.transitions;
  if (!transitions) {
    return WEATHER_KINDS[Math.floor(rng() * WEATHER_KINDS.length)];
  }

  const seasonTable = transitions[season] ?? transitions.default ?? {};
  const weights =
    seasonTable[current] ??
    seasonTable.default ??
    transitions.default?.[current] ??
    transitions.default?.default ??
    {};

  const entries = Object.entries(weights).filter(([, weight]) => typeof weight === "number" && weight > 0);
  if (entries.length === 0) {
    return WEATHER_KINDS[Math.floor(rng() * WEATHER_KINDS.length)];
  }

  const total = entries.reduce((sum, [, weight]) => sum + weight, 0);
  let roll = rng() * total;
  for (const [kind, weight] of entries) {
    roll -= weight;
    if (roll <= 0) {
      if (WEATHER_KINDS.includes(kind as WeatherKind)) {
        return kind as WeatherKind;
      }
      break;
    }
  }

  const fallback = entries[entries.length - 1][0];
  return WEATHER_KINDS.includes(fallback as WeatherKind) ? (fallback as WeatherKind) : current;
}

export class Scheduler {
  private readonly options: SchedulerOptions;
  private readonly stateManager: StateManager;
  private readonly timeRanges: readonly TimeRange[];
  private readonly weatherConfig: NormalizedWeatherConfig;
  private timer: TimerHandle = null;
  private running = false;
  private lastTimestamp = 0;
  private accumulator = 0;
  private tick = 0;
  private minuteRemainder = 0;

  constructor(opts: SchedulerOptions, stateManager: StateManager);
  constructor(opts: SchedulerOptions, stateManager: StateManager) {
    const { config, ...rest } = opts;
    this.options = { ...DEFAULT_OPTIONS, ...rest };
    this.stateManager = stateManager;
    this.timeRanges = normalizeTimeRanges(config?.timeOfDay);
    this.weatherConfig = normalizeWeatherConfig(config?.weather);
  }

  start(): void {
    if (this.running) {
      return;
    }

    this.running = true;
    this.lastTimestamp = now();
    this.timer = setInterval(() => this.pump(), this.options.tickMs);
  }

  stop(): void {
    if (this.timer !== null) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.running = false;
    this.accumulator = 0;
  }

  stepOnce(dtMs: number): void {
    const ticksElapsed = Math.max(1, Math.round(dtMs / this.options.tickMs));
    let timeResult: AdvanceTimeResult | undefined;
    let weatherResult: AdvanceWeatherResult | undefined;

    this.stateManager.update((draft) => {
      timeResult = this.advanceTime(draft.meta, dtMs);
      weatherResult = this.advanceWeather(draft.meta, ticksElapsed);
    });

    this.tick += ticksElapsed;

    bus.emit({ type: "TICK", dt: dtMs, tick: this.tick });

    if (timeResult?.timeSliceChanged) {
      bus.emit({ type: "TIME_SLICE_CHANGED", tod: timeResult.nextTimeSlice });
    }

    if (timeResult?.seasonChanged) {
      bus.emit({ type: "SEASON_CHANGED", from: timeResult.previousSeason, to: timeResult.nextSeason });
    }

    if (weatherResult?.changed) {
      bus.emit({ type: "WEATHER_CHANGED", from: weatherResult.previousKind, to: weatherResult.nextKind });
    }
  }

  private pump(): void {
    const currentTimestamp = now();
    const delta = currentTimestamp - this.lastTimestamp;
    this.lastTimestamp = currentTimestamp;
    this.accumulator += delta;

    const cap = this.options.catchUpCap * this.options.tickMs;
    if (cap > 0 && this.accumulator > cap) {
      this.accumulator = cap;
    }

    while (this.accumulator >= this.options.tickMs) {
      this.accumulator -= this.options.tickMs;
      this.stepOnce(this.options.tickMs);
    }
  }

  private advanceTime(meta: MetaFlags, dtMs: number): AdvanceTimeResult {
    const minutesToAdvance = (dtMs / this.options.tickMs) * MINUTES_PER_TICK;
    let minutesAccumulator = this.minuteRemainder + minutesToAdvance;
    const wholeMinutes = Math.floor(minutesAccumulator);
    this.minuteRemainder = minutesAccumulator - wholeMinutes;

    const result: AdvanceTimeResult = {
      timeSliceChanged: false,
      previousTimeSlice: meta.time.tod,
      nextTimeSlice: meta.time.tod,
      seasonChanged: false,
      previousSeason: meta.time.season,
      nextSeason: meta.time.season,
    };

    if (wholeMinutes <= 0) {
      return result;
    }

    let minute = meta.time.minute + wholeMinutes;
    let hour = meta.time.hour;
    let day = meta.time.day;

    while (minute >= 60) {
      minute -= 60;
      hour += 1;
      if (hour >= 24) {
        hour = 0;
        day += 1;
      }
    }

    meta.time.minute = minute;
    meta.time.hour = hour;

    if (day !== meta.time.day) {
      meta.time.day = day;
    }

    const newSlice = resolveTimeSlice(hour, minute, this.timeRanges);
    if (newSlice !== meta.time.tod) {
      result.timeSliceChanged = true;
      result.previousTimeSlice = meta.time.tod;
      result.nextTimeSlice = newSlice;
      meta.time.tod = newSlice;
    }

    const totalDays = day;
    const seasonIndex = totalDays === 0 ? 0 : Math.floor(totalDays / DAYS_PER_SEASON) % SEASONS.length;
    const newSeason = SEASONS[seasonIndex];
    if (newSeason !== meta.time.season) {
      result.seasonChanged = true;
      result.previousSeason = meta.time.season;
      result.nextSeason = newSeason;
      meta.time.season = newSeason;
    }

    const newYear = Math.floor(totalDays / (DAYS_PER_SEASON * SEASONS.length)) + 1;
    if (newYear !== meta.time.year) {
      meta.time.year = newYear;
    }

    return result;
  }

  private advanceWeather(meta: MetaFlags, ticksElapsed: number): AdvanceWeatherResult {
    const weather = meta.weather;
    const previousKind = weather.kind;

    const remaining = Math.max(0, weather.durationTicksLeft - ticksElapsed);
    if (remaining > 0) {
      weather.durationTicksLeft = remaining;
      return { changed: false, previousKind, nextKind: weather.kind };
    }

    const rng = createRng(weather.seed ?? 1);
    const season = meta.time.season;
    const nextKind = pickWeatherKind(previousKind, season, rng, this.weatherConfig);
    const intensity = resolveWeatherIntensity(nextKind, rng, this.weatherConfig);
    const duration = resolveWeatherDuration(nextKind, rng, this.weatherConfig);
    const newSeed = Math.floor(rng() * 0xffffffff);

    weather.kind = nextKind;
    weather.intensity = intensity;
    weather.durationTicksLeft = duration;
    weather.seed = newSeed;

    return {
      changed: nextKind !== previousKind,
      previousKind,
      nextKind,
    };
  }
}
