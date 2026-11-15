"use client";

import { ChevronRight } from "lucide-react";
import type { Tier } from "@/lib/engine/types";
import type { MessageKey } from "@/lib/i18n";
import { useAppState, useT } from "@/lib/state/useAppState";
import { TIER_ICON, TIER_ICON_STEPPE } from "@/components/ui/icons";

const TIERS: Tier[] = ["SELF", "CMO", "EARTH"];

/** SELF → CMO → EARTH, with every rung up to the assigned tier lit. */
export function TierLadder({ tier }: { tier: Tier }) {
  const t = useT();
  const { mode } = useAppState();
  const level = TIERS.indexOf(tier);
  return (
    <ol className="flex flex-wrap items-center gap-1 text-xs" aria-label={t("alerts.who")}>
      {TIERS.map((rung, i) => {
        const Icon = (mode === "steppe" ? TIER_ICON_STEPPE : TIER_ICON)[rung];
        const current = rung === tier;
        return (
          <li key={rung} className="flex items-center gap-1">
            {i > 0 && <ChevronRight size={14} aria-hidden className={i <= level ? "text-fg/60" : "text-line-strong"} />}
            <span
              aria-current={current ? "step" : undefined}
              className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-md px-2 py-1 font-medium ring-1 ring-inset ${
                current ? "bg-accent/10 text-accent ring-accent/35" : i < level ? "text-fg ring-line-strong" : "text-muted/60 ring-line"
              }`}
            >
              <Icon size={12} strokeWidth={2.25} />
              {t(`tier.${mode}.${rung}` as MessageKey)}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
