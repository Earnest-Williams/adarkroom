import type {
  CountSnapshot,
  EngineEventPayload,
  NumericCounterSnapshot,
  TelemetryConfig,
  TelemetryCountersSnapshot,
  TelemetryEvent,
  TelemetryMode,
} from "../../types/engine";

const DEFAULT_BUFFER_SIZE = 256;

type TelemetryLogger = (event: TelemetryEvent) => void;

class RingBuffer<T> {
  private buffer: T[] = [];
  private cursor = 0;

  constructor(private readonly capacity: number) {
    if (!Number.isFinite(capacity) || capacity <= 0) {
      throw new Error("RingBuffer capacity must be a positive finite number.");
    }
  }

  push(value: T): void {
    if (this.buffer.length < this.capacity) {
      this.buffer.push(value);
      if (this.buffer.length === this.capacity) {
        this.cursor = 0;
      }
      return;
    }

    this.buffer[this.cursor] = value;
    this.cursor = (this.cursor + 1) % this.capacity;
  }

  clear(): void {
    this.buffer = [];
    this.cursor = 0;
  }

  snapshot(): readonly T[] {
    if (this.buffer.length < this.capacity) {
      return [...this.buffer];
    }

    return [
      ...this.buffer.slice(this.cursor),
      ...this.buffer.slice(0, this.cursor),
    ];
  }
}

class NumericCounter {
  private count = 0;
  private total = 0;
  private min: number | null = null;
  private max: number | null = null;
  private lastValue: number | null = null;

  record(value: number): void {
    if (!Number.isFinite(value)) {
      throw new Error("NumericCounter can only record finite numbers.");
    }

    this.count += 1;
    this.total += value;
    this.lastValue = value;
    this.min = this.min === null ? value : Math.min(this.min, value);
    this.max = this.max === null ? value : Math.max(this.max, value);
  }

  snapshot(): NumericCounterSnapshot {
    const average = this.count === 0 ? null : this.total / this.count;

    return {
      count: this.count,
      total: this.total,
      min: this.min,
      max: this.max,
      average,
      lastValue: this.lastValue,
    };
  }

  reset(): void {
    this.count = 0;
    this.total = 0;
    this.min = null;
    this.max = null;
    this.lastValue = null;
  }
}

class CountCounter {
  private count = 0;
  private lastValue: number | null = null;

  increment(by = 1): void {
    if (!Number.isFinite(by)) {
      throw new Error("CountCounter can only increment by finite numbers.");
    }

    this.count += by;
    this.lastValue = by;
  }

  snapshot(): CountSnapshot {
    return {
      count: this.count,
      lastValue: this.lastValue,
    };
  }

  reset(): void {
    this.count = 0;
    this.lastValue = null;
  }
}

const defaultDevLogger: TelemetryLogger = (event) => {
  console.log(`[telemetry] ${event.name}`, event);
};

let telemetryMode: TelemetryMode = "noop";
let devLogger: TelemetryLogger = defaultDevLogger;
let eventBuffer = new RingBuffer<TelemetryEvent>(DEFAULT_BUFFER_SIZE);

const schedulerLagCounter = new NumericCounter();
const eventRuntimeCounter = new NumericCounter();
const uiRenderWarningCounter = new CountCounter();

const counters = {
  schedulerLag: schedulerLagCounter,
  eventRuntime: eventRuntimeCounter,
  uiRenderWarnings: uiRenderWarningCounter,
};

function sanitizePayload(payload: EngineEventPayload | undefined): EngineEventPayload | undefined {
  if (!payload) {
    return undefined;
  }

  const entries = Object.entries(payload);
  if (entries.length === 0) {
    return undefined;
  }

  return Object.fromEntries(entries);
}

export function configureTelemetry(config: TelemetryConfig): void {
  telemetryMode = config.mode;

  const bufferSize =
    typeof config.bufferSize === "number" && Number.isFinite(config.bufferSize) && config.bufferSize > 0
      ? Math.floor(config.bufferSize)
      : DEFAULT_BUFFER_SIZE;

  if (telemetryMode === "production") {
    eventBuffer = new RingBuffer<TelemetryEvent>(bufferSize);
  } else {
    eventBuffer.clear();
  }

  if (config.logger) {
    devLogger = config.logger;
  } else {
    devLogger = defaultDevLogger;
  }
}

export function track(eventName: string, payload?: EngineEventPayload): void {
  if (typeof eventName !== "string" || eventName.trim().length === 0) {
    throw new Error("track requires a non-empty event name.");
  }

  if (telemetryMode === "noop") {
    return;
  }

  const sanitizedPayload = sanitizePayload(payload);
  const event: TelemetryEvent =
    sanitizedPayload === undefined
      ? {
          name: eventName,
          timestamp: Date.now(),
        }
      : {
          name: eventName,
          timestamp: Date.now(),
          payload: sanitizedPayload,
        };

  if (telemetryMode === "development") {
    devLogger(event);
    return;
  }

  eventBuffer.push(event);
}

export function recordSchedulerLag(durationMs: number): void {
  schedulerLagCounter.record(durationMs);
}

export function recordEventRuntime(durationMs: number): void {
  eventRuntimeCounter.record(durationMs);
}

export function recordUiRenderWarning(count = 1): void {
  uiRenderWarningCounter.increment(count);
}

export function getTelemetryMode(): TelemetryMode {
  return telemetryMode;
}

export function getBufferedEvents(): readonly TelemetryEvent[] {
  return eventBuffer.snapshot();
}

export function getTelemetryCountersSnapshot(): TelemetryCountersSnapshot {
  return {
    schedulerLag: schedulerLagCounter.snapshot(),
    eventRuntime: eventRuntimeCounter.snapshot(),
    uiRenderWarnings: uiRenderWarningCounter.snapshot(),
  };
}

export function resetTelemetry(): void {
  telemetryMode = "noop";
  devLogger = defaultDevLogger;
  eventBuffer = new RingBuffer<TelemetryEvent>(DEFAULT_BUFFER_SIZE);

  for (const counter of Object.values(counters)) {
    counter.reset();
  }
}
