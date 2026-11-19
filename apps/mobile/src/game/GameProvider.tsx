import RNAsyncStorage from "@react-native-async-storage/async-storage";
import { deserialize, MemoryStore, newGame, SCHEMA_VERSION, serialize, tick, type GameState } from "@tamtam/core";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { AppState } from "react-native";

/**
 * Owns the game state for the active profile.
 * - "main": the normal save, real clock.
 * - "debug": Developer Debug Mode — a separate save slot (a copy of main when first opened)
 *   with a simulated clock offset. Nothing done there touches the main save.
 */

export type Profile = "main" | "debug";

/**
 * Storage that never throws: some web sandboxes (embedded previews) block localStorage.
 * Falls back to memory so the game still runs (progress then lasts for the session only).
 */
const memory = new Map<string, string>();
export let persistentStorage = true;
const AsyncStorage = {
  async getItem(k: string): Promise<string | null> {
    try {
      return await RNAsyncStorage.getItem(k);
    } catch {
      persistentStorage = false;
      return memory.get(k) ?? null;
    }
  },
  async setItem(k: string, v: string): Promise<void> {
    try {
      await RNAsyncStorage.setItem(k, v);
    } catch {
      persistentStorage = false;
      memory.set(k, v);
    }
  },
  async removeItem(k: string): Promise<void> {
    try {
      await RNAsyncStorage.removeItem(k);
    } catch {
      persistentStorage = false;
      memory.delete(k);
    }
  },
};

const KEY = (p: Profile) => `tamtam:save:${p}:v${SCHEMA_VERSION}`;
const OFFSET_KEY = "tamtam:debug:offset";

export function newId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

interface GameCtx {
  state: Readonly<GameState>;
  profile: Profile;
  /** Game clock (real clock + debug offset on the debug profile). */
  now: () => number;
  /** Runs a rule atomically; throws if the rule throws (state untouched). */
  act: <T>(fn: (draft: GameState) => T) => T;
  setProfile: (p: Profile) => Promise<void>;
  timeOffsetMs: number;
  addTime: (ms: number) => void;
  resetDebug: () => Promise<void>;
  tzOffsetMin: number;
}

const Ctx = createContext<GameCtx | null>(null);

async function load(p: Profile): Promise<GameState | null> {
  const raw = await AsyncStorage.getItem(KEY(p));
  if (!raw) return null;
  try {
    return deserialize<GameState>(raw, SCHEMA_VERSION).state;
  } catch {
    return null;
  }
}

export function GameProvider({ children, fallback }: { children: ReactNode; fallback: ReactNode }) {
  const [store, setStore] = useState<MemoryStore<GameState> | null>(null);
  const [profile, setProfileState] = useState<Profile>("main");
  const [offset, setOffset] = useState(0);
  const offsetRef = useRef(0);
  const profileRef = useRef<Profile>("main");
  offsetRef.current = profile === "debug" ? offset : 0;
  profileRef.current = profile;

  const now = useCallback(() => Date.now() + offsetRef.current, []);

  const open = useCallback(async (p: Profile) => {
    let s = await load(p);
    if (!s && p === "debug") s = await load("main");
    if (!s) s = newGame(Date.now(), { tamtamId: newId() });
    setStore(new MemoryStore(s));
  }, []);

  useEffect(() => {
    void (async () => {
      const o = Number((await AsyncStorage.getItem(OFFSET_KEY)) ?? 0);
      setOffset(Number.isFinite(o) ? o : 0);
      await open("main");
    })();
  }, [open]);

  // Persist after every change (debounced) and when the app goes to background.
  useEffect(() => {
    if (!store) return;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const save = () => AsyncStorage.setItem(KEY(profileRef.current), serialize(store.read(), SCHEMA_VERSION, Date.now()));
    const unsub = store.subscribe(() => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(save, 250);
    });
    const sub = AppState.addEventListener("change", (st) => st !== "active" && void save());
    return () => {
      unsub();
      sub.remove();
      if (timer) clearTimeout(timer);
      void save();
    };
  }, [store]);

  // Real-time simulation tick.
  useEffect(() => {
    if (!store) return;
    const id = setInterval(() => store.transact((s) => tick(s, now())), 1000);
    return () => clearInterval(id);
  }, [store, now]);

  const state = useSyncExternalStore(
    useCallback((cb) => (store ? store.subscribe(cb) : () => undefined), [store]),
    () => (store ? store.read() : null),
  );

  const value = useMemo<GameCtx | null>(() => {
    if (!store || !state) return null;
    return {
      state,
      profile,
      now,
      act: (fn) => store.transact(fn),
      setProfile: async (p) => {
        await AsyncStorage.setItem(KEY(profileRef.current), serialize(store.read(), SCHEMA_VERSION, Date.now()));
        setProfileState(p);
        profileRef.current = p;
        offsetRef.current = p === "debug" ? offset : 0;
        await open(p);
      },
      timeOffsetMs: offset,
      addTime: (ms) => {
        const next = offset + ms;
        setOffset(next);
        offsetRef.current = next;
        void AsyncStorage.setItem(OFFSET_KEY, String(next));
        store.transact((s) => tick(s, Date.now() + next));
      },
      resetDebug: async () => {
        await AsyncStorage.removeItem(KEY("debug"));
        setOffset(0);
        offsetRef.current = 0;
        await AsyncStorage.setItem(OFFSET_KEY, "0");
        await open("debug");
      },
      tzOffsetMin: -new Date().getTimezoneOffset(),
    };
  }, [store, state, profile, now, offset, open]);

  if (!value) return <>{fallback}</>;
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useGame(): GameCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error("useGame outside GameProvider");
  return c;
}
