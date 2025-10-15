import { bus } from "./events/bus";
import { StateManager } from "./state/StateManager";
import type { MetaFlags, Season, TimeOfDay, WeatherKind } from "../../types/state";
import { SEASONS, WEATHER_KINDS } from "../../types/state";

export interface SchedulerOptions {
  tickMs: number;
  catchUpCap: number;
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

function resolveTimeSlice(hour: number, minute: number): TimeOfDay {
  const totalMinutes = hour * 60 + minute;
  if (totalMinutes >= 300 && totalMinutes < 420) {
    return "dawn";
  }
  if (totalMinutes >= 420 && totalMinutes < 1080) {
    return "day";
  }
  if (totalMinutes >= 1080 && totalMinutes < 1260) {
    return "dusk";
  }
  return "night";
}

export class Scheduler {
  private readonly options: SchedulerOptions;
  private readonly stateManager: StateManager;
  private timer: TimerHandle = null;
  private running = false;
  private lastTimestamp = 0;
  private accumulator = 0;
  private tick = 0;
  private minuteRemainder = 0;

  constructor(opts: SchedulerOptions, stateManager: StateManager);
  constructor(opts: SchedulerOptions, stateManager: StateManager) {
    this.options = { ...DEFAULT_OPTIONS, ...opts };
    this.stateManager = stateManager;
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

    const newSlice = resolveTimeSlice(hour, minute);
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

    const rng = createRng(weather.seed || 1);
    const nextKind = WEATHER_KINDS[Math.floor(rng() * WEATHER_KINDS.length)];
    const intensity = clamp(rng(), 0, 1);
    const duration = Math.max(6, Math.floor(rng() * 48));
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
