"use client";

import type { Status, Tier } from "@/lib/engine/types";
import type { MessageKey } from "@/lib/i18n";
import { useAppState, useT } from "@/lib/state/useAppState";
import { STATUS_STYLE, TIER_ICON } from "./status";

export function StatusBadge({ status, size = "sm" }: { status: Status; size?: "sm" | "lg" }) {
  const t = useT();
  const s = STATUS_STYLE[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-semibold ${s.text} ${s.bg} ${s.border} ${
        size === "lg" ? "px-3 py-1 text-base" : "px-2 py-0.5 text-xs"
      }`}
    >
      <span aria-hidden>{s.icon}</span>
      {t(`status.${status}` as MessageKey)}
    </span>
  );
}

export function TierBadge({ tier }: { tier: Tier }) {
  const t = useT();
  const { mode } = useAppState();
  const tone = tier === "EARTH" ? "border-accent/60 text-accent" : tier === "CMO" ? "border-amber/50 text-amber" : "border-line text-fg";
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-semibold ${tone}`}>
      <span aria-hidden>{TIER_ICON[tier]}</span>
      {t(`tier.${mode}.${tier}` as MessageKey)}
    </span>
  );
}
