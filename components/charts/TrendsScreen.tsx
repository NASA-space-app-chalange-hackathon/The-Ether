"use client";

import { Check } from "lucide-react";
import { useState } from "react";
import { CrewSwitcher } from "@/components/home/CrewSwitcher";
import { StatusBadge } from "@/components/ui/Badges";
import { HazardTags } from "@/components/ui/HazardTags";
import { PageHeader } from "@/components/ui/PageHeader";
import { Segmented } from "@/components/ui/Segmented";
import type { IndicatorState } from "@/lib/engine/evaluate";
import { formatValue } from "@/lib/engine/format";
import { INDICATOR_HAZARDS } from "@/lib/engine/hazards";
import { INDICATORS, INDICATOR_IDS } from "@/lib/engine/indicators";
import type { IndicatorId } from "@/lib/engine/types";
import type { TFunction } from "@/lib/state/useAppState";
import { useAssessment, useMission } from "@/lib/state/DataProvider";
import { useAppState, useT } from "@/lib/state/useAppState";
import { useLabels } from "@/lib/state/useLabels";
import { TrendChart } from "./TrendChart";
import { WeatherPanel } from "./WeatherChart";

/** Why an indicator is Watch/Critical when today's value alone may look normal. */
function statusReason(st: IndicatorState, t: TFunction): string | null {
  if (st.status !== "watch" && st.status !== "critical") return null;
  if (st.threshold) return t("trends.reasonThreshold");
  if (st.indicator === "exerciseMinutes") return t("trends.reasonAdherence");
  const { abnormalDays, direction, window } = st.recent;
  if (abnormalDays === 0 || direction === null) return null;
  return t(direction === "above" ? "trends.reasonAbove" : "trends.reasonBelow", { k: abnormalDays, n: window });
}

const DEFAULT_SELECTION: IndicatorId[] = ["heartRate", "systolicBP", "sleepHours", "pvtMeanRT"];
const RANGES = [7, 30, 180] as const;
type Range = (typeof RANGES)[number];

export function TrendsScreen() {
  const t = useT();
  const labels = useLabels();
  const { day, mode } = useAppState();
  const { events, maxDay } = useMission();
  const a = useAssessment();
  const [selection, setSelection] = useState<IndicatorId[]>(DEFAULT_SELECTION);
  const [range, setRange] = useState<Range>(30);

  const today = Math.min(day, maxDay);
  const from = range === 180 ? 0 : Math.max(0, today - range + 1);
  const available = a ? INDICATOR_IDS.filter((id) => a.indicators[id].latest !== null) : [];
  const shown = selection.filter((id) => available.includes(id));
  const toggle = (id: IndicatorId) => setSelection((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  return (
    <div className="space-y-6">
      <PageHeader title={t("nav.trends")} intro={t("trends.intro")}>
        <CrewSwitcher />
      </PageHeader>

      <div className="flex flex-wrap items-center gap-4">
        <Segmented
          label={t("trends.range")}
          value={range}
          onChange={setRange}
          options={RANGES.map((r) => ({ value: r, label: r === 180 ? t("trends.all") : t("trends.days", { n: r }) }))}
        />
        <p className="flex items-center gap-2 text-xs text-muted">
          <span aria-hidden className="h-2.5 w-4 rounded-sm bg-accent/25" />
          {t("trends.legend")}
        </p>
      </div>

      <fieldset className="space-y-2">
        <legend className="eyebrow mb-2">{t("trends.indicators")}</legend>
        <div className="flex flex-wrap gap-1.5">
          {available.map((id) => {
            const on = selection.includes(id);
            return (
              <label
                key={id}
                className={`flex min-h-10 cursor-pointer items-center gap-2 rounded-lg border px-3 text-[13px] transition-[background-color,border-color,color] duration-150 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-accent ${
                  on ? "border-line-strong bg-panel-2 text-fg" : "border-line text-muted hover:border-line-strong hover:text-fg"
                }`}
              >
                <input type="checkbox" className="sr-only" checked={on} onChange={() => toggle(id)} />
                <span
                  aria-hidden
                  className={`grid h-3.5 w-3.5 place-items-center rounded-[4px] border transition-colors duration-150 ${on ? "border-accent bg-accent text-bg" : "border-line-strong"}`}
                >
                  {on && <Check size={10} strokeWidth={3.5} />}
                </span>
                {labels.indicator(id)}
              </label>
            );
          })}
        </div>
      </fieldset>

      {a && shown.length === 0 && <p className="text-muted">{t("trends.empty")}</p>}
      <div className="grid gap-4 lg:grid-cols-2">
        {a &&
          shown.map((id) => {
            const st = a.indicators[id];
            const meta = INDICATORS[id];
            const inRange = st.series.some((p) => p.day >= from && p.day <= today);
            return (
              <section key={id} className="surface space-y-3 p-4 sm:p-5">
                <header className="flex flex-wrap items-center gap-2">
                  <h2 className="font-medium">{labels.indicator(id)}</h2>
                  <span className="font-mono text-xs text-muted">{meta.unit}</span>
                  <span className="ml-auto">
                    <StatusBadge status={st.status} />
                  </span>
                  <HazardTags ids={INDICATOR_HAZARDS[id]} className="w-full" />
                </header>
                {st.latest && (
                  <p className="font-mono text-xs text-muted" data-testid={`trend-latest-${id}`}>
                    {t(st.latest.day === today ? "trends.today" : "trends.lastReading", {
                      value: `${formatValue(id, st.latest.value)} ${meta.unit}`,
                      day: st.latest.day,
                    })}
                    {st.recent.mean !== null && <> · {t("trends.avg", { n: st.recent.window, value: formatValue(id, st.recent.mean) })}</>}
                    {" · "}
                    {t("trends.normal", { value: st.baseline && !st.learning ? formatValue(id, st.baseline.center) : "—" })}
                  </p>
                )}
                {statusReason(st, t) && (
                  <p className={`text-xs ${st.status === "critical" ? "text-red" : "text-amber"}`} data-testid={`trend-reason-${id}`}>
                    {statusReason(st, t)}
                  </p>
                )}
                {inRange ? (
                  <TrendChart indicator={id} series={st.series} from={from} to={today} today={today} events={events} height={200} />
                ) : (
                  <p className="py-8 text-center text-sm text-muted">{t("trends.noData")}</p>
                )}
              </section>
            );
          })}
      </div>
      {mode === "steppe" && <WeatherPanel from={from} to={today} />}
    </div>
  );
}
