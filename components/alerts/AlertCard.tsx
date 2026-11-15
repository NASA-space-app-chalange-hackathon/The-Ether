"use client";

import type { ReactNode } from "react";
import { StatusBadge, TierBadge } from "@/components/ui/Badges";
import { SourceList } from "@/components/ui/SourceList";
import { STATUS_STYLE } from "@/components/ui/status";
import { INDICATORS } from "@/lib/engine/indicators";
import type { Alert } from "@/lib/engine/types";
import { useChecklist } from "@/lib/state/checklist";
import { useT } from "@/lib/state/useAppState";
import { useLabels } from "@/lib/state/useLabels";
import { MessageToGround } from "./MessageToGround";
import { TierLadder } from "./TierLadder";

function Block({ n, title, children }: { n: number; title: string; children: ReactNode }) {
  return (
    <section className="space-y-2.5">
      <h4 className="eyebrow flex items-center gap-2">
        <span aria-hidden className="text-fg/50">
          {String(n).padStart(2, "0")}
        </span>
        {title}
      </h4>
      {children}
    </section>
  );
}

function Evidence({ alert }: { alert: Alert }) {
  const t = useT();
  const labels = useLabels();
  if (alert.evidence.length === 0) return null;
  return (
    <div className="overflow-x-auto rounded-lg border border-line">
      <table className="w-full text-left text-sm" aria-label={t("alerts.evidence")}>
        <thead className="bg-panel-2/60 text-xs text-muted">
          <tr>
            <th className="px-3 py-1.5 font-normal">{t("alerts.colIndicator")}</th>
            <th className="px-3 py-1.5 text-right font-normal">{t("alerts.colValue")}</th>
            <th className="px-3 py-1.5 text-right font-normal">{t("alerts.colNormal")}</th>
            <th className="px-3 py-1.5 text-right font-normal">{t("alerts.colChange")}</th>
          </tr>
        </thead>
        <tbody className="font-mono text-[13px]">
          {alert.evidence.map((e) => {
            const m = INDICATORS[e.indicator];
            const change = m.changeAs === "absolute" ? (e.value - e.baseline).toFixed(1) : `${e.percentChange > 0 ? "+" : ""}${e.percentChange.toFixed(0)}%`;
            return (
              <tr key={e.indicator} className="border-t border-line">
                <td className="px-3 py-1.5 font-sans">{labels.indicator(e.indicator)}</td>
                <td className="whitespace-nowrap px-3 py-1.5 text-right">
                  {e.value.toFixed(m.decimals)} <span className="text-muted">{m.unit}</span>
                </td>
                <td className="px-3 py-1.5 text-right text-muted">{e.baseline.toFixed(m.decimals)}</td>
                <td className="px-3 py-1.5 text-right">{change}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function AlertCard({ alert, memberName }: { alert: Alert; memberName: string }) {
  const t = useT();
  const { done, toggle } = useChecklist(`${alert.id}@${alert.sinceDay}`);
  const style = STATUS_STYLE[alert.severity];
  const days = alert.day - alert.sinceDay + 1;

  return (
    <article
      id={alert.id}
      data-testid="alert-card"
      data-rule={alert.ruleId}
      className="surface relative scroll-mt-40 space-y-5 overflow-hidden p-5 target:ring-2 target:ring-accent/60 sm:p-6"
    >
      <span aria-hidden className="absolute inset-y-0 left-0 w-0.5" style={{ backgroundColor: style.fill }} />
      <header className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <StatusBadge status={alert.severity} size="lg" />
        <h3 className="text-lg font-semibold tracking-tight">{alert.title}</h3>
        <span className="font-mono text-sm text-muted">{memberName}</span>
        <span className="ml-auto">
          <TierBadge tier={alert.tier} />
        </span>
      </header>

      <div className="grid gap-x-8 gap-y-6 lg:grid-cols-2">
        <Block n={1} title={t("alerts.whatChanged")}>
          <p className="text-sm leading-relaxed">{alert.whatChanged}</p>
          <p className="font-mono text-xs text-muted">{t("alerts.since", { day: alert.sinceDay, days })}</p>
          <Evidence alert={alert} />
        </Block>
        <Block n={2} title={t("alerts.why")}>
          <p className="text-sm leading-relaxed text-fg/90">{alert.whyItMatters}</p>
        </Block>
        <Block n={3} title={t("alerts.doNow")}>
          <ul className="-mx-2 space-y-0.5">
            {alert.doNow.map((step) => {
              const checked = done.includes(step.text);
              return (
                <li key={step.text}>
                  <label className="flex min-h-11 cursor-pointer items-start gap-3 rounded-lg px-2 py-2 transition-colors duration-150 hover:bg-panel-2">
                    <input type="checkbox" checked={checked} onChange={() => toggle(step.text)} className="checkbox mt-0.5" />
                    <span className={`flex-1 text-sm transition-colors duration-150 ${checked ? "text-muted line-through decoration-muted/60" : ""}`}>{step.text}</span>
                    <TierBadge tier={step.tier} />
                  </label>
                </li>
              );
            })}
          </ul>
          <div className="flex items-center gap-3">
            <div className="track h-1 flex-1" aria-hidden>
              <div
                className="absolute inset-0 origin-left bg-accent transition-transform duration-300 ease-smooth"
                style={{ transform: `scaleX(${alert.doNow.length ? done.length / alert.doNow.length : 0})` }}
              />
            </div>
            <p className="font-mono text-xs text-muted">{t("alerts.progress", { done: done.length, total: alert.doNow.length })}</p>
          </div>
        </Block>
        <Block n={4} title={t("alerts.who")}>
          <TierLadder tier={alert.tier} />
          <h5 className="eyebrow pt-3">{t("alerts.sources")}</h5>
          <SourceList sources={alert.sources} />
        </Block>
      </div>

      {alert.tier === "EARTH" && <MessageToGround alert={alert} memberName={memberName} completed={done} />}
    </article>
  );
}
