import type { Status } from "@/lib/engine/types";
import { STATUS_STYLE } from "./status";
import { THEME } from "./theme";

/** Abstract geometric avatars — never photos or faces. */
const SHAPES: Record<string, string> = {
  hex: "M12 2.5 20.5 7.25v9.5L12 21.5l-8.5-4.75v-9.5z",
  tri: "M12 3.5 21 19.5H3z",
  circle: "M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18z",
  diamond: "M12 2.5 21.5 12 12 21.5 2.5 12z",
  ger: "M3.5 13 12 5.5l8.5 7.5v7h-17z",
};

export function Avatar({ shape, status, size = 36 }: { shape: string; status?: Status; size?: number }) {
  const color = status ? STATUS_STYLE[status].fill : THEME.muted;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden className="shrink-0">
      <path d={SHAPES[shape] ?? SHAPES.circle} fill={color} fillOpacity={0.08} stroke={color} strokeWidth={1.5} strokeLinejoin="round" />
      <circle cx="12" cy="13" r="2" fill={color} />
    </svg>
  );
}
