import type { Environment } from "@/lib/engine/types";

export type Mode = "space" | "steppe";

export interface AppState {
  mode: Mode;
  /** Selected member per mode. */
  memberId: Record<Mode, string>;
  /** Mission Clock day per mode. */
  day: Record<Mode, number>;
  /** Space-mode environment (Steppe mode always uses "steppe"). */
  environment: Exclude<Environment, "steppe">;
}

/** Zero-click demo state: ORION-B on day 70 (hidden fatigue visible). */
export const DEFAULT_STATE: AppState = {
  mode: "space",
  memberId: { space: "orion-b", steppe: "herder-1" },
  day: { space: 70, steppe: 24 },
  environment: "transit",
};

const STORAGE_KEY = "the-ether:state:v1";
const ENVIRONMENTS = ["transit", "iss", "lunar", "mars", "rover"] as const;

let state: AppState = DEFAULT_STATE;
let loaded = false;
const listeners = new Set<() => void>();

/** Merge whatever is stored over the defaults, ignoring anything malformed. */
export function parseStored(raw: string | null): AppState {
  if (!raw) return DEFAULT_STATE;
  try {
    const s = JSON.parse(raw) as Partial<AppState>;
    const mode: Mode = s.mode === "steppe" ? "steppe" : "space";
    const environment = ENVIRONMENTS.find((e) => e === s.environment) ?? DEFAULT_STATE.environment;
    const num = (v: unknown, fallback: number) => (typeof v === "number" && Number.isFinite(v) ? Math.max(0, Math.round(v)) : fallback);
    const str = (v: unknown, fallback: string) => (typeof v === "string" && v ? v : fallback);
    return {
      mode,
      environment,
      memberId: {
        space: str(s.memberId?.space, DEFAULT_STATE.memberId.space),
        steppe: str(s.memberId?.steppe, DEFAULT_STATE.memberId.steppe),
      },
      day: { space: num(s.day?.space, DEFAULT_STATE.day.space), steppe: num(s.day?.steppe, DEFAULT_STATE.day.steppe) },
    };
  } catch {
    return DEFAULT_STATE;
  }
}

function load(): void {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    state = parseStored(window.localStorage.getItem(STORAGE_KEY));
  } catch {
    state = DEFAULT_STATE;
  }
}

export function getSnapshot(): AppState {
  load();
  return state;
}

export function getServerSnapshot(): AppState {
  return DEFAULT_STATE;
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function updateState(patch: (s: AppState) => AppState): void {
  state = patch(getSnapshot());
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Private mode / blocked storage: state still works for this session.
  }
  listeners.forEach((l) => l());
}
