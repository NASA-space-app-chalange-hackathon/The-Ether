import { INDICATORS } from "./indicators";
import type { Alert } from "./types";

export interface GroundMessageInput {
  alert: Alert;
  memberName: string;
  /** Step texts the crew has already completed. */
  completed: readonly string[];
}

/** Auto-filled, plain-text summary for the flight surgeon (or soum hospital). */
export function composeGroundMessage({ alert, memberName, completed }: GroundMessageInput): string {
  const lines = [
    `PRIVATE MEDICAL — ${memberName}, mission day ${alert.day}`,
    `${alert.title} (${alert.severity === "critical" ? "act now" : "watch"}) since day ${alert.sinceDay}.`,
    "",
    alert.whatChanged,
  ];
  if (alert.evidence.length) {
    lines.push("", "Readings vs. personal baseline:");
    for (const e of alert.evidence) {
      const m = INDICATORS[e.indicator];
      lines.push(
        `- ${m.label}: ${e.value.toFixed(m.decimals)} ${m.unit} (normal ${e.baseline.toFixed(m.decimals)}, z ${e.zScore.toFixed(1)})`.replace(/ +\(/, " ("),
      );
    }
  }
  lines.push("", completed.length ? "Done on board:" : "Done on board: nothing yet.");
  for (const c of completed) lines.push(`- ${c}`);
  lines.push("", "Request: review and advise.");
  return lines.join("\n");
}

/** Arrival time of a message sent at `sentAtMs` with a one-way delay. */
export function arrivalTime(sentAtMs: number, oneWaySeconds: number): number {
  return sentAtMs + oneWaySeconds * 1000;
}
