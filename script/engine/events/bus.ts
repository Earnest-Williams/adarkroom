import type { Season, TimeOfDay, WeatherKind } from "../../../types/state";

export type Listener<T> = (payload: T) => void;

export class SimpleEmitter<T> {
  private readonly listeners = new Set<Listener<T>>();

  on(listener: Listener<T>): () => void {
    this.listeners.add(listener);
    return () => this.off(listener);
  }

  once(listener: Listener<T>): () => void {
    const wrapper: Listener<T> = (payload) => {
      this.off(wrapper);
      listener(payload);
    };
    return this.on(wrapper);
  }

  off(listener: Listener<T>): void {
    this.listeners.delete(listener);
  }

  clear(): void {
    this.listeners.clear();
  }

  emit(payload: T): void {
    for (const listener of [...this.listeners]) {
      listener(payload);
    }
  }
}

export type EngineEvent =
  | { type: "TICK"; dt: number; tick: number }
  | { type: "TIME_SLICE_CHANGED"; tod: TimeOfDay }
  | { type: "WEATHER_CHANGED"; from: WeatherKind; to: WeatherKind }
  | { type: "SEASON_CHANGED"; from: Season; to: Season }
  | { type: "RAID_TELEGRAPH"; etaTicks: number; strength: number };

export const bus = new SimpleEmitter<EngineEvent>();
