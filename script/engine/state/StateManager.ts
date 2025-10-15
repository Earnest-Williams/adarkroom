import { RootState, defaultRootState } from "../../../types/state.js";
import { applyMigrations } from "./migrations.js";

type Listener = (state: RootState) => void;

function deepClone<T>(value: T): T {
  const globalClone = (globalThis as { structuredClone?: <U>(input: U) => U }).structuredClone;
  if (typeof globalClone === "function") {
    return globalClone(value);
  }

  return JSON.parse(JSON.stringify(value)) as T;
}

export class StateManager {
  private state: RootState;
  private readonly listeners = new Set<Listener>();

  constructor(initialState?: Partial<RootState>) {
    const initial = initialState ?? defaultRootState();
    this.state = applyMigrations(initial);
    this.syncMirrors();
  }

  load(raw: unknown): RootState {
    this.state = applyMigrations(raw);
    this.syncMirrors();
    this.emitChange();
    return this.snapshot();
  }

  getState(): RootState {
    return this.snapshot();
  }

  snapshot(): RootState {
    return deepClone(this.state);
  }

  update(mutator: (draft: RootState) => void): RootState {
    const draft = this.snapshot();
    mutator(draft);
    this.state = applyMigrations(draft);
    this.syncMirrors();
    this.emitChange();
    return this.snapshot();
  }

  set<K extends keyof RootState>(key: K, value: RootState[K]): RootState[K] {
    const updatedState = this.update((draft) => {
      (draft[key] as RootState[K]) = value;
    });
    return updatedState[key];
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private emitChange(): void {
    const snapshot = this.snapshot();
    for (const listener of this.listeners) {
      listener(snapshot);
    }
  }

  private syncMirrors(): void {
    this.state.character.morality = this.state.meta.morality;
  }
}
