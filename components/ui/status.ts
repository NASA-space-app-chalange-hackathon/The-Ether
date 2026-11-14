import type { Status, Tier } from "@/lib/engine/types";

/** Status → color + icon (never color alone). */
export const STATUS_STYLE: Record<Status, { icon: string; text: string; bg: string; border: string; fill: string }> = {
  ok: { icon: "✓", text: "text-ok", bg: "bg-ok/15", border: "border-ok/40", fill: "#22c55e" },
  watch: { icon: "▲", text: "text-amber", bg: "bg-amber/15", border: "border-amber/40", fill: "#f59e0b" },
  critical: { icon: "■", text: "text-red", bg: "bg-red/15", border: "border-red/50", fill: "#ef4444" },
  unknown: { icon: "–", text: "text-grey", bg: "bg-grey/15", border: "border-grey/40", fill: "#64748b" },
};

export const TIER_ICON: Record<Tier, string> = { SELF: "👤", CMO: "⚕", EARTH: "🌍" };
