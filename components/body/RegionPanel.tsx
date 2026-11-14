"use client";

import { useState } from "react";
import { RadiationMeter } from "@/components/home/RadiationMeter";
import { TrendChart } from "@/components/charts/TrendChart";
import { StatusBadge, TierBadge } from "@/components/ui/Badges";
import { STATUS_STYLE } from "@/components/ui/status";
import { REGION_CONTENT } from "@/content/risks";
import { REGION_STEPPE } from "@/content/steppe";
import { SourceList } from "@/components/ui/SourceList";
import type { MemberAssessment } from "@/lib/engine/evaluate";
import { INDICATORS } from "@/lib/engine/indicators";
import { REGION_INDICATORS, REGION_RULES, regionStatus, type RegionId } from "@/lib/engine/regions";
import type { IndicatorId } from "@/lib/engine/types";
import type { MessageKey } from "@/lib/i18n";
import { useMission } from "@/lib/state/DataProvider";
import { useAppState, useT } from "@/lib/state/useAppState";
import { useLabels } from "@/lib/state/useLabels";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h3 className="text-xs font-semibold uppercase tracking-widest text-muted">{title}</h3>
      {children}
    </section>
  );
}

export function RegionPanel({ region, assessment, onClose }: { region: RegionId; assessment: MemberAssessment; onClose: () => void }) {
  const t = useT();
  const labels = useLabels();
  const { events } = useMission();
  const { mode, locale } = useAppState();
  const content = REGION_CONTENT[region];
  const steppe = mode === "steppe" ? REGION_STEPPE[region] : null;
  const status = regionStatus(assessment, region);
  const withData = REGION_INDICATORS[region].filter((id) => assessment.indicators[id].latest !== null);
  const [chosen, setChosen] = useState<IndicatorId | null>(null);
  const chartIndicator = chosen && withData.includes(chosen) ? chosen : (withData[0] ?? null);
  const rules: readonly string[] = REGION_RULES[region];
  const alerts = assessment.alerts.filter((a) => rules.includes(a.ruleId));
  const day = assessment.day;

  return (
    <aside aria-labelledby="region-title" className="space-y-5 rounded-xl border border-line bg-panel p-5" data-testid="region-panel">
      <header className="flex items-start justify-between gap-3">
        <div className="space-y-2">
          <h2 id="region-title" className="text-xl font-semibold">{t(`region.${region}` as MessageKey)}</h2>
          <StatusBadge status={status} size="lg" />
        </div>
        <button type="button" onClick={onClose} aria-label={t("panel.close")} className="grid h-11 w-11 place-items-center rounded-lg border border-line hover:border-accent">
          <span aria-hidden>✕</span>
        </button>
      </header>

      <Section title={t("panel.function")}>
        <p className="text-sm leading-relaxed">{steppe ? steppe.function[locale] : content.function}</p>
      </Section>
      <Section title={t(steppe ? "panel.earth" : "panel.spaceflight")}>
        <p className="text-sm leading-relaxed">{steppe ? steppe.effect[locale] : content.spaceflightEffect}</p>
      </Section>

      {region === "radiation" && <RadiationMeter radiation={assessment.radiation} />}
      {region === "bones" && (
        <Section title={t("panel.boneScore")}>
          <div className="h-3 overflow-hidden rounded-full bg-line" role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(assessment.bone.score)} aria-label={t("panel.boneScore")}>
            <div className="h-full" style={{ width: `${assessment.bone.score}%`, backgroundColor: STATUS_STYLE[assessment.bone.status].fill }} />
          </div>
          <p className="font-mono text-xs text-muted">
            {assessment.bone.score.toFixed(0)}/100 ·{" "}
            {t("panel.adherence", { pct: assessment.bone.adherence === null ? "—" : `${Math.round(assessment.bone.adherence * 100)}%` })}
          </p>
          <p className="text-xs italic text-muted">{t("panel.demoModel")}</p>
        </Section>
      )}

      {withData.length > 0 ? (
        <Section title={t("panel.latest")}>
          <ul className="divide-y divide-line rounded-lg border border-line">
            {withData.map((id) => {
              const st = assessment.indicators[id];
              const meta = INDICATORS[id];
              const s = STATUS_STYLE[st.status];
              return (
                <li key={id}>
                  <button
                    type="button"
                    onClick={() => setChosen(id)}
                    aria-pressed={chartIndicator === id}
                    className="flex min-h-11 w-full items-center gap-2 px-3 py-1.5 text-left text-sm hover:bg-panel-2 aria-pressed:bg-panel-2"
                  >
                    <span aria-hidden className={`w-4 text-center ${s.text}`}>{s.icon}</span>
                    <span className="flex-1">{labels.indicator(id)}</span>
                    <span className="font-mono tabular-nums">
                      {st.latest!.value.toFixed(meta.decimals)} {meta.unit}
                    </span>
                    {st.baseline && !st.learning && (
                      <span className="w-28 text-right font-mono text-xs text-muted tabular-nums">
                        {t("panel.normal", { value: st.baseline.center.toFixed(meta.decimals) })}
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </Section>
      ) : (
        region !== "radiation" && region !== "bones" && <p className="text-sm text-muted">– {t("panel.noData")}</p>
      )}

      {chartIndicator && (
        <Section title={`${t("panel.trend")} · ${labels.indicator(chartIndicator)}`}>
          <TrendChart
            indicator={chartIndicator}
            series={assessment.indicators[chartIndicator].series}
            from={Math.max(0, day - 30)}
            to={day}
            today={day}
            events={events}
            height={170}
            compact
          />
        </Section>
      )}

      <Section title={t("panel.actions")}>
        {alerts.length === 0 ? (
          <p className="text-sm text-ok">✓ {t("panel.noActions")}</p>
        ) : (
          alerts.map((a) => (
            <div key={a.id} className="space-y-2 rounded-lg border border-line bg-panel-2 p-3">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={a.severity} />
                <span className="font-semibold">{a.title}</span>
                <span className="ml-auto"><TierBadge tier={a.tier} /></span>
              </div>
              <p className="text-sm text-muted">{a.whatChanged}</p>
              <ol className="space-y-1 text-sm">
                {a.doNow.map((step) => (
                  <li key={step.text} className="flex gap-2">
                    <TierBadge tier={step.tier} />
                    <span>{step.text}</span>
                  </li>
                ))}
              </ol>
            </div>
          ))
        )}
      </Section>

      <Section title={`${t("panel.risks")} · ${t("panel.sources")}`}>
        <SourceList sources={content.risks} />
      </Section>
    </aside>
  );
}
