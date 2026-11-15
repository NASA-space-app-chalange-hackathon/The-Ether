import { headline as ruleHeadline, ruleText } from "@/content/rules-text";
import { RULES, type RuleId } from "@/lib/engine/escalation";
import { formatChange, formatValue } from "@/lib/engine/format";
import { INDICATORS } from "@/lib/engine/indicators";
import { checkThreshold } from "@/lib/engine/thresholds";
import type { Alert, AlertEvidence, IndicatorId } from "@/lib/engine/types";
import type { Mode } from "@/lib/state/store";
import { formatDate } from "./date";
import { t, type Locale, type MessageKey } from "./index";

export function indicatorLabel(id: IndicatorId, locale: Locale): string {
  return t(`ind.${id}` as MessageKey, locale);
}

const unitOf = (id: IndicatorId) => {
  const u = INDICATORS[id].unit;
  return u === "/5" ? "/5" : u ? ` ${u}` : "";
};

/** Mongolian "what changed" for alerts built from facts rather than an evidence table. */
function factsMn(alert: Alert): string | null {
  const f = alert.facts;
  if (!f) return null;
  const days = alert.day - alert.sinceDay + 1;
  switch (alert.ruleId) {
    case "radiation-event": {
      const parts: string[] = [];
      if (f.realDate) parts.push(`NASA DONKI ${formatDate(f.realDate, "mn")}-нд бодит нарны бөөмийн шуурга бүртгэсэн; ${alert.sinceDay}-р өдөрт давтан харуулав.`);
      const today = (f.todayDose ?? 0).toFixed(2);
      const usual = (f.usualDose ?? 0).toFixed(2);
      parts.push(
        f.doseSpike
          ? `Дозиметр: өдрийн тун ${today} мЗв болж өссөн (ердийн ${usual}).`
          : `Дозиметр: одоогоор өсөлтгүй (өнөөдөр ${today} мЗв, ердийн ${usual}) — багийн эмч тунг баталгаажуултал хоргод.`,
      );
      return parts.join(" ");
    }
    case "radiation-cumulative":
      return `Карьерын тун ${(f.totalDose ?? 0).toFixed(0)} мЗв = ${f.limitDose ?? 600} мЗв хязгаарын ${Math.round(((f.totalDose ?? 0) / (f.limitDose ?? 600)) * 100)}%.`;
    case "fitness":
      return `Сүүлийн 14 хоногт дасгалын зорилтын ${f.adherencePct ?? 0}%-ийг биелүүлсэн — ${days} хоног (${alert.sinceDay}-р өдрөөс).`;
    case "bone-loss":
      return `Яс сийрэгжих эрсдэлийн оноо ${f.boneScore ?? 0}/100; сүүлийн 14 хоногт дасгалын зорилтын ${f.adherencePct ?? 0}%.`;
    default:
      return null;
  }
}

/** Rebuild "what changed" in Mongolian from the alert's stored evidence (same numbers as the English text). */
function whatChangedMn(alert: Alert): string {
  const fromFacts = factsMn(alert);
  if (fromFacts) return fromFacts;
  if (alert.evidence.length === 0) return alert.whatChanged;
  const drift = alert.ruleId === "behavioral-drift";
  const parts = alert.evidence
    .filter((e) => !drift || (e.indicator !== "mood" && e.indicator !== "crewPulse"))
    .map((e) => {
      const meta = INDICATORS[e.indicator];
      const label = indicatorLabel(e.indicator, "mn");
      const unit = meta.unit && meta.unit !== "/5" ? ` ${meta.unit}` : "";
      const change = formatChange(e);
      const base = `${label} ${formatValue(e.indicator, e.value)}${unit} (таны хэвийн ${formatValue(e.indicator, e.baseline)}${unit}`;
      const text = change.percent ? `${base}, ${change.percent})` : `${base})`;
      if (!e.trend) return text;
      const side = e.trend.direction === "above" ? "дээгүүр" : "доогуур";
      return e.trend.basis === "average"
        ? `${text}, сүүлийн ${e.trend.window} хоногийн дунджаар хэвийнээс ${side}`
        : `${text}, сүүлийн ${e.trend.window} хоногийн ${e.trend.abnormalDays}-д хэвийнээс ${side}`;
    });
  const days = alert.day - alert.sinceDay + 1;
  const windowDays = alert.evidence.find((e) => e.windowDays)?.windowDays;
  const prefix = windowDays ? `${windowDays} хоногийн дундаж: ` : "";
  let s = `${prefix}${parts.join("; ")} — ${days} хоног (${alert.sinceDay}-р өдрөөс).`;
  const crossed = alert.evidence.filter((e) => checkThreshold(e.indicator, e.value)).map((e) => indicatorLabel(e.indicator, "mn"));
  if (crossed.length) s += ` Аюулгүйн босго давсан: ${crossed.join(", ")}.`;
  if (drift) s += " Сэтгэл санаа хэвийн хэвээр → далд ядаргаа байж магадгүй.";
  return s;
}

/**
 * Localize an engine alert for the chosen mode and language. The engine speaks
 * Space-mode English; every other pair swaps in its own title, reason and steps.
 */
export function localizeAlert(alert: Alert, locale: Locale, mode: Mode = locale === "mn" ? "steppe" : "space"): Alert {
  if (mode === "space" && locale === "en") return alert;
  const ruleId = alert.ruleId as RuleId;
  const rule = RULES[ruleId];
  if (!rule) return alert;
  const text = ruleText(ruleId, mode, locale);
  const doNow = alert.doNow.map((step) => {
    const i = rule.steps.findIndex((s) => s.text === step.text);
    return { ...step, text: i >= 0 ? (text.steps[i] ?? step.text) : step.text };
  });
  return {
    ...alert,
    title: text.title,
    whyItMatters: text.why,
    doNow,
    whatChanged: locale === "mn" ? whatChangedMn(alert) : alert.whatChanged,
  };
}

export interface AlertSummaryText {
  headline: string;
  /** 1–3 short lines: what changed, in plain words. Full numbers stay in the Action Center. */
  bullets: string[];
}

const L = {
  en: {
    normal: "normal",
    avg: "on average",
    moodFine: "Mood check-ins still say “fine”",
    donki: (date: string) => `Real NASA solar storm data from ${date}`,
    dose: (today: string, usual: string) => `Dose today: ${today} mSv (usual ${usual} mSv)`,
    noSpike: "Dosimeter shows no spike yet",
    shelter: "Stay in the shelter until the all-clear",
    career: (total: string, limit: number, pct: number) => `Career dose: ${total} of ${limit} mSv (${pct}%)`,
    adherence: (pct: number) => `Exercise goal met on ${pct}% of the last 14 days`,
    bone: (score: number) => `Bone-loss risk score: ${score} of 100`,
  },
  mn: {
    normal: "хэвийн",
    avg: "дунджаар",
    moodFine: "Сэтгэл санааны тэмдэглэл “зүгээр” хэвээр",
    donki: (date: string) => `NASA-гийн бодит нарны шуурганы мэдээ (${date})`,
    dose: (today: string, usual: string) => `Өнөөдрийн тун: ${today} мЗв (ердийн ${usual} мЗв)`,
    noSpike: "Дозиметр одоогоор өсөлт үзүүлээгүй",
    shelter: "Зөвшөөрөл гартал хоргодох хэсэгт бай",
    career: (total: string, limit: number, pct: number) => `Карьерын тун: ${limit} мЗв-ээс ${total} (${pct}%)`,
    adherence: (pct: number) => `Сүүлийн 14 хоногийн ${pct}%-д дасгалын зорилт биелсэн`,
    bone: (score: number) => `Яс сийрэгжих эрсдэлийн оноо: 100-аас ${score}`,
  },
} as const;

function evidenceLine(e: AlertEvidence, locale: Locale, label: (id: IndicatorId) => string): string {
  const w = L[locale];
  const unit = unitOf(e.indicator);
  const value = `${formatValue(e.indicator, e.value)}${unit}`;
  const normal = `${formatValue(e.indicator, e.baseline)}${unit}`;
  return e.windowDays ? `${label(e.indicator)}: ${value} ${w.avg} (${w.normal} ${normal})` : `${label(e.indicator)}: ${value} (${w.normal} ${normal})`;
}

/** A plain headline and 2–3 short bullet lines for an alert, in any mode and language. */
export function alertSummary(alert: Alert, locale: Locale, mode: Mode, label: (id: IndicatorId) => string = (id) => indicatorLabel(id, locale)): AlertSummaryText {
  const ruleId = alert.ruleId as RuleId;
  const w = L[locale];
  const f = alert.facts ?? {};
  const head = RULES[ruleId] ? ruleHeadline(ruleId, mode, locale) : alert.title;
  let bullets: string[];
  switch (ruleId) {
    case "behavioral-drift":
      bullets = [
        ...alert.evidence.filter((e) => e.indicator === "sleepHours" || e.indicator === "pvtMeanRT").map((e) => evidenceLine(e, locale, label)),
        w.moodFine,
      ];
      break;
    case "radiation-event":
      bullets = [
        ...(f.realDate ? [w.donki(formatDate(f.realDate, locale))] : []),
        f.doseSpike ? w.dose((f.todayDose ?? 0).toFixed(1), (f.usualDose ?? 0).toFixed(1)) : w.noSpike,
        w.shelter,
      ];
      break;
    case "radiation-cumulative": {
      const limit = f.limitDose ?? 600;
      bullets = [w.career((f.totalDose ?? 0).toFixed(0), limit, Math.round(((f.totalDose ?? 0) / limit) * 100))];
      break;
    }
    case "fitness":
      bullets = [w.adherence(f.adherencePct ?? 0)];
      break;
    case "bone-loss":
      bullets = [w.bone(f.boneScore ?? 0), ...(f.adherencePct !== undefined ? [w.adherence(f.adherencePct)] : [])];
      break;
    default:
      bullets = alert.evidence.map((e) => evidenceLine(e, locale, label));
  }
  return { headline: head, bullets: bullets.slice(0, 3) };
}
