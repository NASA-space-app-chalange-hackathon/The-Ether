"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import type { Environment } from "@/lib/engine/types";
import { t, type Locale, type MessageKey } from "@/lib/i18n";
import { getServerSnapshot, getSnapshot, subscribe, updateState, type AppState, type Mode } from "./store";

export interface AppStateApi {
  state: AppState;
  mode: Mode;
  memberId: string;
  day: number;
  /** Effective environment (Steppe mode → "steppe"). */
  environment: Environment;
  locale: Locale;
  setMode: (mode: Mode) => void;
  setMemberId: (id: string) => void;
  setDay: (day: number) => void;
  setEnvironment: (env: AppState["environment"]) => void;
}

export function useAppState(): AppStateApi {
  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const mode = state.mode;
  return {
    state,
    mode,
    memberId: state.memberId[mode],
    day: state.day[mode],
    environment: mode === "steppe" ? "steppe" : state.environment,
    locale: mode === "steppe" ? "mn" : "en",
    setMode: (m) => updateState((s) => ({ ...s, mode: m })),
    setMemberId: (id) => updateState((s) => ({ ...s, memberId: { ...s.memberId, [s.mode]: id } })),
    setDay: (d) => updateState((s) => ({ ...s, day: { ...s.day, [s.mode]: Math.max(0, Math.round(d)) } })),
    setEnvironment: (env) => updateState((s) => ({ ...s, environment: env })),
  };
}

export type TFunction = (key: MessageKey, params?: Record<string, string | number>) => string;

/** Translator bound to the current mode's locale. */
export function useT(): TFunction {
  const { locale } = useAppState();
  const translate = useCallback<TFunction>((key, params) => t(key, locale, params), [locale]);
  return useMemo(() => translate, [translate]);
}
