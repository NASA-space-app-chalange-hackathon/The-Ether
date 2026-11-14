import { INDICATORS } from "./indicators";
import type { Alert } from "./types";

export interface GroundMessageInput {
  alert: Alert;
  memberName: string;
  /** Step texts the crew has already completed. */
  completed: readonly string[];
  /** "mn" renders the Steppe-mode (soum hospital) template. */
  locale?: "en" | "mn";
  /** Indicator label override (localized). */
  label?: (id: Alert["evidence"][number]["indicator"]) => string;
}

const TEMPLATE = {
  en: {
    head: (name: string, day: number) => `PRIVATE MEDICAL — ${name}, mission day ${day}`,
    status: (title: string, critical: boolean, since: number) => `${title} (${critical ? "act now" : "watch"}) since day ${since}.`,
    readings: "Readings vs. personal baseline:",
    normal: "normal",
    done: "Done on board:",
    none: "Done on board: nothing yet.",
    request: "Request: review and advise.",
  },
  mn: {
    head: (name: string, day: number) => `НУУЦ — ${name}, ${day}-р өдөр`,
    status: (title: string, critical: boolean, since: number) => `${title} (${critical ? "яаралтай" : "анхаарах"}) ${since}-р өдрөөс.`,
    readings: "Хувийн хэвийн түвшинтэй харьцуулахад:",
    normal: "хэвийн",
    done: "Хийсэн зүйлс:",
    none: "Хийсэн зүйлс: одоогоор алга.",
    request: "Хүсэлт: хянаж, зөвлөгөө өгнө үү.",
  },
};

/** Auto-filled, plain-text summary for the flight surgeon (or soum hospital). */
export function composeGroundMessage({ alert, memberName, completed, locale = "en", label }: GroundMessageInput): string {
  const tpl = TEMPLATE[locale];
  const lines = [tpl.head(memberName, alert.day), tpl.status(alert.title, alert.severity === "critical", alert.sinceDay), "", alert.whatChanged];
  if (alert.evidence.length) {
    lines.push("", tpl.readings);
    for (const e of alert.evidence) {
      const m = INDICATORS[e.indicator];
      const name = label ? label(e.indicator) : m.label;
      lines.push(
        `- ${name}: ${e.value.toFixed(m.decimals)} ${m.unit} (${tpl.normal} ${e.baseline.toFixed(m.decimals)}, z ${e.zScore.toFixed(1)})`.replace(/ +\(/, " ("),
      );
    }
  }
  lines.push("", completed.length ? tpl.done : tpl.none);
  for (const c of completed) lines.push(`- ${c}`);
  lines.push("", tpl.request);
  return lines.join("\n");
}

/** Arrival time of a message sent at `sentAtMs` with a one-way delay. */
export function arrivalTime(sentAtMs: number, oneWaySeconds: number): number {
  return sentAtMs + oneWaySeconds * 1000;
}
