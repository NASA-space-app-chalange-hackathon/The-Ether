"use client";

import { ENV_ICON } from "@/components/ui/icons";
import type { AppState } from "@/lib/state/store";
import { useAppState, useT } from "@/lib/state/useAppState";

const ENVS: AppState["environment"][] = ["transit", "iss", "lunar", "mars", "rover"];

export function EnvironmentSelector() {
  const t = useT();
  const { state, setEnvironment } = useAppState();
  return (
    <div role="radiogroup" aria-label={t("home.environment")} className="flex flex-wrap gap-1.5">
      {ENVS.map((id) => {
        const selected = state.environment === id;
        const Icon = ENV_ICON[id];
        return (
          <button
            key={id}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => setEnvironment(id)}
            className={`flex min-h-10 items-center gap-2 rounded-lg border px-3 text-[13px] font-medium transition-[background-color,border-color,color] duration-150 ${
              selected ? "border-line-strong bg-panel-2 text-fg" : "border-line text-muted hover:border-line-strong hover:text-fg"
            }`}
          >
            <Icon size={14} strokeWidth={2} className={selected ? "text-accent" : undefined} />
            {t(`env.${id}`)}
          </button>
        );
      })}
    </div>
  );
}
