/**
 * Transactional state store.
 *
 * All game rules in @tamtam/core are pure functions `(state, input) → newState`.
 * A Store applies them atomically: the mutation runs on a private draft and is
 * committed only if it returns without throwing. The in-memory implementation
 * is used by tests and the web build; the SQLite implementation (Phase 3) will
 * wrap the same contract in `BEGIN IMMEDIATE … COMMIT`.
 */
export interface Store<S> {
  read(): Readonly<S>;
  /** Runs `fn` against a draft; commits on return, discards on throw. */
  transact<T>(fn: (draft: S) => T): T;
}

export class MemoryStore<S> implements Store<S> {
  private state: S;
  private listeners = new Set<(s: Readonly<S>) => void>();

  constructor(initial: S) {
    this.state = deepFreeze(cloneData(initial));
  }

  read(): Readonly<S> {
    return this.state;
  }

  transact<T>(fn: (draft: S) => T): T {
    const draft = cloneData(this.state) as S;
    const result = fn(draft); // throws → draft discarded, state untouched
    this.state = deepFreeze(draft);
    this.listeners.forEach((l) => l(this.state));
    return result;
  }

  subscribe(listener: (s: Readonly<S>) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
}

/**
 * Deep copy of plain game data (objects, arrays, primitives). Game state must stay
 * JSON-compatible anyway for persistence; this avoids relying on structuredClone,
 * which is not available on every React Native JS engine.
 */
export function cloneData<T>(v: T): T {
  if (v === null || typeof v !== "object") return v;
  if (Array.isArray(v)) return v.map(cloneData) as T;
  const out: Record<string, unknown> = {};
  for (const [k, x] of Object.entries(v as Record<string, unknown>)) out[k] = cloneData(x);
  return out as T;
}

function deepFreeze<T>(o: T): T {
  if (o && typeof o === "object" && !Object.isFrozen(o)) {
    Object.freeze(o);
    for (const v of Object.values(o as object)) deepFreeze(v);
  }
  return o;
}

/** Versioned snapshot for persistence (JSON round-trip). */
export interface Snapshot<S> {
  schemaVersion: number;
  savedAt: number;
  state: S;
}

export function serialize<S>(state: S, schemaVersion: number, savedAt: number): string {
  const snap: Snapshot<S> = { schemaVersion, savedAt, state };
  return JSON.stringify(snap);
}

export function deserialize<S>(json: string, expectedVersion: number): Snapshot<S> {
  const snap = JSON.parse(json) as Snapshot<S>;
  if (typeof snap !== "object" || snap === null || typeof snap.schemaVersion !== "number") {
    throw new Error("Corrupt save: missing schemaVersion");
  }
  if (snap.schemaVersion > expectedVersion) {
    throw new Error(`Save is from a newer version (${snap.schemaVersion} > ${expectedVersion})`);
  }
  return snap;
}
