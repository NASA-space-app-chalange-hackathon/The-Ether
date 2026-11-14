import { RULES_MN } from "@/content/rules-mn";
import { RULES } from "@/lib/engine/escalation";
import { INDICATORS } from "@/lib/engine/indicators";
import { checkThreshold } from "@/lib/engine/thresholds";
import type { Alert, IndicatorId } from "@/lib/engine/types";
import { t, type Locale, type MessageKey } from "./index";

export function indicatorLabel(id: IndicatorId, locale: Locale): string {
  return t(`ind.${id}` as MessageKey, locale);
}

const fmt = (v: number) => v.toFixed(v < 10 && Math.abs(v - Math.round(v)) > 0.05 ? 1 : 0);

/** Rebuild "what changed" in Mongolian from the alert's stored evidence. */
function whatChangedMn(alert: Alert): string {
  if (alert.evidence.length === 0) return alert.whatChanged;
  const drift = alert.ruleId === "behavioral-drift";
  const parts = alert.evidence
    .filter((e) => !drift || (e.indicator !== "mood" && e.indicator !== "crewPulse"))
    .map((e) => {
      const label = indicatorLabel(e.indicator, "mn");
      if (INDICATORS[e.indicator].changeAs === "absolute") return `${label} ${fmt(e.value)} (таны хэвийн ${fmt(e.baseline)})`;
      const pct = Math.round(e.percentChange);
      return `${label} ${pct > 0 ? "+" : pct < 0 ? "−" : "±"}${Math.abs(pct)}% таны хэвийнээс`;
    });
  const days = alert.day - alert.sinceDay + 1;
  let s = `${parts.join("; ")} — ${days} хоног (${alert.sinceDay}-р өдрөөс).`;
  const crossed = alert.evidence.filter((e) => checkThreshold(e.indicator, e.value)).map((e) => indicatorLabel(e.indicator, "mn"));
  if (crossed.length) s += ` Аюулгүйн босго давсан: ${crossed.join(", ")}.`;
  if (drift) s += " Сэтгэл санаа хэвийн хэвээр → далд ядаргаа байж магадгүй.";
  return s;
}

/** Localize an engine alert for display. English is the engine's source language. */
export function localizeAlert(alert: Alert, locale: Locale): Alert {
  if (locale === "en") return alert;
  const ruleId = alert.ruleId as keyof typeof RULES_MN;
  const mn = RULES_MN[ruleId];
  const rule = RULES[ruleId];
  if (!mn || !rule) return alert;
  const doNow = alert.doNow.map((step) => {
    const i = rule.steps.findIndex((s) => s.text === step.text);
    return { ...step, text: i >= 0 ? (mn.steps[i] ?? step.text) : step.text };
  });
  return { ...alert, title: mn.title, whyItMatters: mn.why, doNow, whatChanged: whatChangedMn(alert) };
}
