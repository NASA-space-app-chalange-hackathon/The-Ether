"use client";

import type { Tier } from "@/lib/engine/types";
import type { MessageKey } from "@/lib/i18n";
import { useAppState, useT } from "@/lib/state/useAppState";
import { TIER_ICON, TIER_ICON_STEPPE } from "@/components/ui/status";

const TIERS: Tier[] = ["SELF", "CMO", "EARTH"];

/** SELF → CMO → EARTH, with every rung up to the assigned tier lit. */
export function TierLadder({ tier }: { tier: Tier }) {
  const t = useT();
  const { mode } = useAppState();
  const level = TIERS.indexOf(tier);
  return (
    <ol className="flex flex-wrap items-center gap-1 text-xs" aria-label={t("alerts.who")}>
      {TIERS.map((rung, i) => (
        <li key={rung} className="flex items-center gap-1">
          {i > 0 && <span aria-hidden className={i <= level ? "text-fg" : "text-line"}>→</span>}
          <span
            aria-current={rung === tier ? "step" : undefined}
            className={`inline-flex items-center gap-1 whitespace-nowrap rounded-md border px-2 py-1 font-semibold ${
              rung === tier ? "border-accent bg-accent/15 text-accent" : i < level ? "border-line text-fg" : "border-line/50 text-muted/60"
            }`}
          >
            <span aria-hidden>{(mode === "steppe" ? TIER_ICON_STEPPE : TIER_ICON)[rung]}</span>
            {t(`tier.${mode}.${rung}` as MessageKey)}
          </span>
        </li>
      ))}
    </ol>
  );
}
