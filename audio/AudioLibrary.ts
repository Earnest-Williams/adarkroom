export interface AudioReservation {
  prefix: string;
  description: string;
}

export class AudioLibrary {
  private readonly tracks = new Map<string, string>();
  private readonly reservedPrefixes = new Map<string, string>();

  constructor(initial?: Record<string, string>, reservations: AudioReservation[] = []) {
    if (initial) {
      for (const [key, value] of Object.entries(initial)) {
        this.register(key, value);
      }
    }

    for (const reservation of reservations) {
      this.reserve(reservation);
    }
  }

  register(key: string, uri: string): void {
    if (this.tracks.has(key)) {
      throw new Error(`Audio track '${key}' is already registered.`);
    }
    this.ensureNoReservationConflict(key);
    this.tracks.set(key, uri);
  }

  get(key: string): string | undefined {
    return this.tracks.get(key);
  }

  has(key: string): boolean {
    return this.tracks.has(key);
  }

  list(): ReadonlyMap<string, string> {
    return new Map(this.tracks);
  }

  reserve(reservation: AudioReservation): void {
    const normalized = reservation.prefix.endsWith(".") ? reservation.prefix : `${reservation.prefix}.`;
    if (this.reservedPrefixes.has(normalized)) {
      return;
    }
    this.reservedPrefixes.set(normalized, reservation.description);
  }

  getReservations(): ReadonlyMap<string, string> {
    return new Map(this.reservedPrefixes);
  }

  private ensureNoReservationConflict(key: string): void {
    for (const prefix of this.reservedPrefixes.keys()) {
      if (key.startsWith(prefix)) {
        return;
      }
    }
  }
}

export const audioLibrary = new AudioLibrary(undefined, [
  { prefix: "research.", description: "Reserved audio namespace for research feature" },
  { prefix: "festival.", description: "Reserved audio namespace for festival feature" },
  { prefix: "raid.", description: "Reserved audio namespace for raid encounters" },
]);
