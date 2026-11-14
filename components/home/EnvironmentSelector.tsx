"use client";

import type { AppState } from "@/lib/state/store";
import { useAppState, useT } from "@/lib/state/useAppState";

const ENVS: { id: AppState["environment"]; icon: string }[] = [
  { id: "transit", icon: "🚀" },
  { id: "iss", icon: "🛰" },
  { id: "lunar", icon: "🌙" },
  { id: "mars", icon: "🔴" },
  { id: "rover", icon: "🛞" },
];

export function EnvironmentSelector() {
  const t = useT();
  const { state, setEnvironment } = useAppState();
  return (
    <div role="radiogroup" aria-label={t("home.environment")} className="flex flex-wrap gap-1.5">
      {ENVS.map(({ id, icon }) => {
        const selected = state.environment === id;
        return (
          <button
            key={id}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => setEnvironment(id)}
            className={`flex min-h-11 items-center gap-1.5 rounded-lg border px-3 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-accent ${
              selected ? "border-accent bg-accent/10 text-fg" : "border-line text-muted hover:text-fg"
            }`}
          >
            <span aria-hidden>{icon}</span>
            {t(`env.${id}`)}
          </button>
        );
      })}
    </div>
  );
}
