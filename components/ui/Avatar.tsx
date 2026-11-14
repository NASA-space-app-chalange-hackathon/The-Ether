import type { Status } from "@/lib/engine/types";
import { STATUS_STYLE } from "./status";

/** Abstract geometric avatars — never photos or faces. */
const SHAPES: Record<string, string> = {
  hex: "M12 2 21 7v10l-9 5-9-5V7z",
  tri: "M12 3 22 20H2z",
  circle: "M12 2a10 10 0 1 0 0 20a10 10 0 1 0 0-20z",
  diamond: "M12 2 22 12 12 22 2 12z",
  ger: "M3 13 12 5l9 8v7H3z",
};

export function Avatar({ shape, status, size = 36 }: { shape: string; status?: Status; size?: number }) {
  const color = status ? STATUS_STYLE[status].fill : "#38bdf8";
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden className="shrink-0">
      <path d={SHAPES[shape] ?? SHAPES.circle} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" />
      <circle cx="12" cy="13" r="2.5" fill={color} />
    </svg>
  );
}
