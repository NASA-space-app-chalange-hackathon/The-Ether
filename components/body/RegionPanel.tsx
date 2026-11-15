"use client";

import { CircleCheck, X } from "lucide-react";
import { useState } from "react";
import { RadiationMeter } from "@/components/home/RadiationMeter";
import { TrendChart } from "@/components/charts/TrendChart";
import { StatusBadge, StatusIcon, TierBadge } from "@/components/ui/Badges";
import { HazardTags } from "@/components/ui/HazardTags";
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
    <section className="space-y-2.5">
      <h3 className="eyebrow">{title}</h3>
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
    <aside aria-labelledby="region-title" className="surface space-y-6 p-5 sm:p-6" data-testid="region-panel">
      <header className="flex items-start justify-between gap-3">
        <div className="space-y-2">
          <h2 id="region-title" className="text-xl font-semibold tracking-tight">{t(`region.${region}` as MessageKey)}</h2>
          <StatusBadge status={status} size="lg" />
          <HazardTags ids={content.hazards} />
        </div>
        <button type="button" onClick={onClose} aria-label={t("panel.close")} className="icon-btn">
          <X size={16} strokeWidth={2} />
        </button>
      </header>

      <Section title={t("panel.function")}>
        <p className="text-sm leading-relaxed text-fg/90">{steppe ? steppe.function[locale] : content.function}</p>
      </Section>
      <Section title={t(steppe ? "panel.earth" : "panel.spaceflight")}>
        <p className="text-sm leading-relaxed text-fg/90">{steppe ? steppe.effect[locale] : content.spaceflightEffect}</p>
      </Section>

      {region === "radiation" && <RadiationMeter radiation={assessment.radiation} spaceWeather={assessment.spaceWeather} />}
      {region === "bones" && (
        <Section title={t("panel.boneScore")}>
          <div className="track" role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(assessment.bone.score)} aria-label={t("panel.boneScore")}>
            <div className="absolute inset-0 origin-left transition-transform duration-300 ease-smooth" style={{ transform: `scaleX(${assessment.bone.score / 100})`, backgroundColor: STATUS_STYLE[assessment.bone.status].fill }} />
          </div>
          <p className="font-mono text-xs text-muted">
            {assessment.bone.score.toFixed(0)}/100 ·{" "}
            {t("panel.adherence", { pct: assessment.bone.adherence === null ? "—" : `${Math.round(assessment.bone.adherence * 100)}%` })}
          </p>
          <p className="text-xs text-muted italic">{t("panel.demoModel")}</p>
        </Section>
      )}

      {withData.length > 0 ? (
        <Section title={t("panel.latest")}>
          <ul className="divide-y divide-line overflow-hidden rounded-lg border border-line">
            {withData.map((id) => {
              const st = assessment.indicators[id];
              const meta = INDICATORS[id];
              return (
                <li key={id}>
                  <button
                    type="button"
                    onClick={() => setChosen(id)}
                    aria-pressed={chartIndicator === id}
                    className="flex min-h-11 w-full items-center gap-2.5 px-3 py-1.5 text-left text-sm transition-colors duration-150 hover:bg-panel-2/70 aria-pressed:bg-panel-2"
                  >
                    <StatusIcon status={st.status} />
                    <span className="flex-1">{labels.indicator(id)}</span>
                    <span className="font-mono text-[13px]">
                      {st.latest!.value.toFixed(meta.decimals)} {meta.unit}
                    </span>
                    {st.baseline && !st.learning && (
                      <span className="w-28 text-right font-mono text-xs text-muted">
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
        region !== "radiation" && region !== "bones" && <p className="text-sm text-muted">{t("panel.noData")}</p>
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
          <p className="flex items-center gap-2 text-sm text-ok">
            <CircleCheck size={14} strokeWidth={2.25} />
            {t("panel.noActions")}
          </p>
        ) : (
          alerts.map((a) => (
            <div key={a.id} className="space-y-2.5 rounded-lg border border-line bg-panel-2/50 p-3.5">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={a.severity} />
                <span className="font-medium">{a.title}</span>
                <span className="ml-auto"><TierBadge tier={a.tier} /></span>
              </div>
              <p className="text-sm text-muted">{a.whatChanged}</p>
              <ol className="space-y-1.5 text-sm">
                {a.doNow.map((step) => (
                  <li key={step.text} className="flex flex-col items-start gap-1 sm:flex-row sm:gap-2">
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
