"use client";

import type { Status, Tier } from "@/lib/engine/types";
import type { MessageKey } from "@/lib/i18n";
import { useAppState, useT } from "@/lib/state/useAppState";
import { TIER_ICON, TIER_ICON_STEPPE } from "./icons";
import { STATUS_STYLE } from "./status";

/** The status glyph alone, in its status color. Pair it with visible or sr-only text. */
export function StatusIcon({ status, size = 14, className = "" }: { status: Status; size?: number; className?: string }) {
  const s = STATUS_STYLE[status];
  const Icon = s.icon;
  return <Icon size={size} strokeWidth={2.25} className={`shrink-0 ${s.text} ${className}`} />;
}

export function StatusBadge({ status, size = "sm" }: { status: Status; size?: "sm" | "lg" }) {
  const t = useT();
  const s = STATUS_STYLE[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-md font-medium ring-1 ring-inset ${s.text} ${s.bg} ${s.ring} ${
        size === "lg" ? "px-2 py-1 text-sm" : "px-1.5 py-0.5 text-xs"
      }`}
    >
      <StatusIcon status={status} size={size === "lg" ? 14 : 12} />
      {t(`status.${status}` as MessageKey)}
    </span>
  );
}

const TIER_TONE: Record<Tier, string> = {
  SELF: "text-fg/80 ring-line-strong",
  CMO: "text-amber ring-amber/25",
  EARTH: "text-accent ring-accent/30",
};

export function TierBadge({ tier }: { tier: Tier }) {
  const t = useT();
  const { mode } = useAppState();
  const Icon = (mode === "steppe" ? TIER_ICON_STEPPE : TIER_ICON)[tier];
  return (
    <span className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md px-1.5 py-0.5 text-xs font-medium ring-1 ring-inset ${TIER_TONE[tier]}`}>
      <Icon size={12} strokeWidth={2.25} />
      {t(`tier.${mode}.${tier}` as MessageKey)}
    </span>
  );
}
