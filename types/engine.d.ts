export type EngineEventPayload = Record<string, unknown>;

export interface TelemetryEvent {
  name: string;
  timestamp: number;
  payload?: EngineEventPayload;
}

export type TelemetryMode = "noop" | "development" | "production";

export interface TelemetryConfig {
  mode: TelemetryMode;
  bufferSize?: number;
  logger?: (event: TelemetryEvent) => void;
}

export interface NumericCounterSnapshot {
  readonly count: number;
  readonly total: number;
  readonly min: number | null;
  readonly max: number | null;
  readonly average: number | null;
  readonly lastValue: number | null;
}

export interface CountSnapshot {
  readonly count: number;
  readonly lastValue: number | null;
}

export interface TelemetryCountersSnapshot {
  readonly schedulerLag: NumericCounterSnapshot;
  readonly eventRuntime: NumericCounterSnapshot;
  readonly uiRenderWarnings: CountSnapshot;
}
