import type { MessageKey } from "@/lib/i18n";
import type { Mode } from "./store";

/** One beat of the scripted demo story (designed for the 30-second video). */
export interface DemoStep {
  route: string;
  mode: Mode;
  memberId: string;
  /** Day to land on; the clock scrubs to it from the previous day. */
  day: number;
  caption: MessageKey;
  holdMs: number;
}

export const DEMO_STEPS: readonly DemoStep[] = [
  { route: "/", mode: "space", memberId: "orion-a", day: 1, caption: "demo.s1", holdMs: 3500 },
  { route: "/", mode: "space", memberId: "orion-a", day: 40, caption: "demo.s2", holdMs: 4000 },
  { route: "/body?region=brain", mode: "space", memberId: "orion-b", day: 70, caption: "demo.s3", holdMs: 5000 },
  { route: "/alerts", mode: "space", memberId: "orion-c", day: 95, caption: "demo.s4", holdMs: 5000 },
  { route: "/check", mode: "space", memberId: "orion-c", day: 95, caption: "demo.s5", holdMs: 3500 },
  { route: "/", mode: "steppe", memberId: "herder-1", day: 27, caption: "demo.s6", holdMs: 4500 },
  { route: "/", mode: "space", memberId: "orion-b", day: 70, caption: "demo.end", holdMs: 3500 },
];

/** Days to step through when scrubbing from `from` to `to` in ~`frames` frames. */
export function scrubPath(from: number, to: number, frames = 20): number[] {
  if (from === to) return [to];
  const out: number[] = [];
  for (let i = 1; i <= frames; i++) out.push(Math.round(from + ((to - from) * i) / frames));
  return [...new Set(out)];
}
