import { CircleCheck, CircleDashed, OctagonAlert, TriangleAlert, type LucideIcon } from "lucide-react";
import type { Status } from "@/lib/engine/types";
import { THEME } from "./theme";

/** Status → color + icon (never color alone). */
export const STATUS_STYLE: Record<Status, { icon: LucideIcon; text: string; bg: string; border: string; ring: string; fill: string }> = {
  ok: { icon: CircleCheck, text: "text-ok", bg: "bg-ok/10", border: "border-ok/30", ring: "ring-ok/25", fill: THEME.ok },
  watch: { icon: TriangleAlert, text: "text-amber", bg: "bg-amber/10", border: "border-amber/30", ring: "ring-amber/25", fill: THEME.amber },
  critical: { icon: OctagonAlert, text: "text-red", bg: "bg-red/10", border: "border-red/35", ring: "ring-red/30", fill: THEME.red },
  unknown: { icon: CircleDashed, text: "text-grey", bg: "bg-grey/10", border: "border-grey/30", ring: "ring-grey/25", fill: THEME.grey },
};
