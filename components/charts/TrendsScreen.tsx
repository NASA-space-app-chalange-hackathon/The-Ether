"use client";

import { useState } from "react";
import { CrewSwitcher } from "@/components/home/CrewSwitcher";
import { StatusBadge } from "@/components/ui/Badges";
import { INDICATORS, INDICATOR_IDS } from "@/lib/engine/indicators";
import type { IndicatorId } from "@/lib/engine/types";
import { useAssessment, useMission } from "@/lib/state/DataProvider";
import { useAppState, useT } from "@/lib/state/useAppState";
import { useLabels } from "@/lib/state/useLabels";
import { TrendChart } from "./TrendChart";

const DEFAULT_SELECTION: IndicatorId[] = ["heartRate", "systolicBP", "sleepHours", "pvtMeanRT"];
const RANGES = [7, 30, 180] as const;
type Range = (typeof RANGES)[number];

export function TrendsScreen() {
  const t = useT();
  const labels = useLabels();
  const { day } = useAppState();
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
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">{t("nav.trends")}</h1>
          <p className="max-w-xl text-sm text-muted">{t("trends.intro")}</p>
        </div>
        <CrewSwitcher />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div role="radiogroup" aria-label={t("trends.range")} className="flex rounded-lg border border-line p-0.5 text-sm">
          {RANGES.map((r) => (
            <button key={r} type="button" role="radio" aria-checked={range === r} onClick={() => setRange(r)} className="min-h-10 rounded-md px-4 aria-checked:bg-accent/15 aria-checked:text-accent">
              {r === 180 ? t("trends.all") : t("trends.days", { n: r })}
            </button>
          ))}
        </div>
        <p className="text-xs text-muted">{t("trends.legend")}</p>
      </div>

      <fieldset className="flex flex-wrap gap-1.5">
        <legend className="mb-1.5 text-xs uppercase tracking-widest text-muted">{t("trends.indicators")}</legend>
        {available.map((id) => (
          <label key={id} className={`flex min-h-10 cursor-pointer items-center gap-2 rounded-full border px-3 text-sm ${selection.includes(id) ? "border-accent bg-accent/10" : "border-line text-muted"}`}>
            <input type="checkbox" className="sr-only" checked={selection.includes(id)} onChange={() => toggle(id)} />
            <span aria-hidden>{selection.includes(id) ? "●" : "○"}</span>
            {labels.indicator(id)}
          </label>
        ))}
      </fieldset>

      {a && shown.length === 0 && <p className="text-muted">{t("trends.empty")}</p>}
      <div className="grid gap-4 lg:grid-cols-2">
        {a &&
          shown.map((id) => {
            const st = a.indicators[id];
            const meta = INDICATORS[id];
            const inRange = st.series.some((p) => p.day >= from && p.day <= today);
            return (
              <section key={id} className="space-y-2 rounded-xl border border-line bg-panel p-4">
                <header className="flex flex-wrap items-center gap-2">
                  <h2 className="font-semibold">{labels.indicator(id)}</h2>
                  <span className="text-xs text-muted">{meta.unit}</span>
                  <span className="ml-auto"><StatusBadge status={st.status} /></span>
                </header>
                {st.latest && (
                  <p className="font-mono text-xs text-muted tabular-nums">
                    {t("trends.latest", {
                      value: `${st.latest.value.toFixed(meta.decimals)} ${meta.unit}`,
                      normal: st.baseline && !st.learning ? st.baseline.center.toFixed(meta.decimals) : "—",
                    })}
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
    </div>
  );
}
