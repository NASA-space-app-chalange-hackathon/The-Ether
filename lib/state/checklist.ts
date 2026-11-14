"use client";

import { usePersistentSet } from "./persistentSets";

/** Ticked action steps, keyed by alert id + start day (a new episode starts unticked). */
export function useChecklist(episodeKey: string): { done: readonly string[]; toggle: (step: string) => void } {
  const { items, toggle } = usePersistentSet("the-ether:checklist:v1", episodeKey);
  return { done: items, toggle };
}
