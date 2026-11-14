"use client";

import { useCallback, useSyncExternalStore } from "react";

/** Ticked action steps, keyed by alert id + start day (a new episode starts unticked). localStorage-backed. */
const KEY = "the-ether:checklist:v1";
type Ticks = Record<string, string[]>;

let ticks: Ticks = {};
let loaded = false;
const listeners = new Set<() => void>();
const EMPTY: Ticks = {};

function load(): Ticks {
  if (!loaded && typeof window !== "undefined") {
    loaded = true;
    try {
      const parsed: unknown = JSON.parse(window.localStorage.getItem(KEY) ?? "{}");
      ticks = parsed && typeof parsed === "object" ? (parsed as Ticks) : {};
    } catch {
      ticks = {};
    }
  }
  return ticks;
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function useChecklist(episodeKey: string): { done: readonly string[]; toggle: (step: string) => void } {
  const all = useSyncExternalStore(subscribe, load, () => EMPTY);
  const done = all[episodeKey] ?? [];
  const toggle = useCallback(
    (step: string) => {
      const current = load()[episodeKey] ?? [];
      const next = current.includes(step) ? current.filter((s) => s !== step) : [...current, step];
      ticks = { ...load(), [episodeKey]: next };
      try {
        window.localStorage.setItem(KEY, JSON.stringify(ticks));
      } catch {
        // storage unavailable: keep in memory
      }
      listeners.forEach((l) => l());
    },
    [episodeKey],
  );
  return { done, toggle };
}
