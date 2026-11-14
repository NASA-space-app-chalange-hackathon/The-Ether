"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * Small localStorage-backed stores of string sets, grouped by key
 * (e.g. ticked checklist steps per alert episode, ticked quests per day).
 */
type Sets = Record<string, string[]>;

interface Store {
  data: Sets;
  loaded: boolean;
  listeners: Set<() => void>;
}

const stores = new Map<string, Store>();
const EMPTY: Sets = {};

function store(storageKey: string): Store {
  let s = stores.get(storageKey);
  if (!s) {
    s = { data: {}, loaded: false, listeners: new Set() };
    stores.set(storageKey, s);
  }
  return s;
}

function load(storageKey: string): Sets {
  const s = store(storageKey);
  if (!s.loaded && typeof window !== "undefined") {
    s.loaded = true;
    try {
      const parsed: unknown = JSON.parse(window.localStorage.getItem(storageKey) ?? "{}");
      s.data = parsed && typeof parsed === "object" ? (parsed as Sets) : {};
    } catch {
      s.data = {};
    }
  }
  return s.data;
}

export function usePersistentSet(storageKey: string, setKey: string): { items: readonly string[]; toggle: (item: string) => void } {
  const subscribe = useCallback(
    (l: () => void) => {
      const s = store(storageKey);
      s.listeners.add(l);
      return () => s.listeners.delete(l);
    },
    [storageKey],
  );
  const getSnapshot = useCallback(() => load(storageKey), [storageKey]);
  const all = useSyncExternalStore(subscribe, getSnapshot, () => EMPTY);
  const toggle = useCallback(
    (item: string) => {
      const s = store(storageKey);
      const current = load(storageKey)[setKey] ?? [];
      const next = current.includes(item) ? current.filter((x) => x !== item) : [...current, item];
      s.data = { ...s.data, [setKey]: next };
      try {
        window.localStorage.setItem(storageKey, JSON.stringify(s.data));
      } catch {
        // storage unavailable: keep in memory
      }
      s.listeners.forEach((l) => l());
    },
    [storageKey, setKey],
  );
  return { items: all[setKey] ?? [], toggle };
}
