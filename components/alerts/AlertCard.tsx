"use client";

import { StatusBadge, TierBadge } from "@/components/ui/Badges";
import { STATUS_STYLE } from "@/components/ui/status";
import { INDICATORS } from "@/lib/engine/indicators";
import type { Alert } from "@/lib/engine/types";
import { useChecklist } from "@/lib/state/checklist";
import { useT } from "@/lib/state/useAppState";
import { useLabels } from "@/lib/state/useLabels";
import { MessageToGround } from "./MessageToGround";
import { TierLadder } from "./TierLadder";

function Block({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h4 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted">
        <span aria-hidden className="grid h-5 w-5 place-items-center rounded-full bg-line text-[10px] text-fg">{n}</span>
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
    <table className="w-full text-left text-sm" aria-label={t("alerts.evidence")}>
      <thead className="text-xs text-muted">
        <tr>
          <th className="py-1 font-normal">{t("alerts.colIndicator")}</th>
          <th className="py-1 text-right font-normal">{t("alerts.colValue")}</th>
          <th className="py-1 text-right font-normal">{t("alerts.colNormal")}</th>
          <th className="py-1 text-right font-normal">{t("alerts.colChange")}</th>
        </tr>
      </thead>
      <tbody className="font-mono tabular-nums">
        {alert.evidence.map((e) => {
          const m = INDICATORS[e.indicator];
          const change = m.changeAs === "absolute" ? (e.value - e.baseline).toFixed(1) : `${e.percentChange > 0 ? "+" : ""}${e.percentChange.toFixed(0)}%`;
          return (
            <tr key={e.indicator} className="border-t border-line">
              <td className="py-1 font-sans">{labels.indicator(e.indicator)}</td>
              <td className="py-1 text-right">{e.value.toFixed(m.decimals)} {m.unit}</td>
              <td className="py-1 text-right text-muted">{e.baseline.toFixed(m.decimals)}</td>
              <td className="py-1 text-right">{change}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

export function AlertCard({ alert, memberName }: { alert: Alert; memberName: string }) {
  const t = useT();
  const { done, toggle } = useChecklist(`${alert.id}@${alert.sinceDay}`);
  const style = STATUS_STYLE[alert.severity];
  const days = alert.day - alert.sinceDay + 1;

  return (
    <article id={alert.id} data-testid="alert-card" data-rule={alert.ruleId} className={`scroll-mt-40 space-y-4 rounded-xl border border-l-4 border-line bg-panel p-5 target:ring-2 target:ring-accent ${style.border}`}>
      <header className="flex flex-wrap items-center gap-2">
        <StatusBadge status={alert.severity} size="lg" />
        <h3 className="text-lg font-semibold">{alert.title}</h3>
        <span className="font-mono text-sm text-muted">· {memberName}</span>
        <span className="ml-auto"><TierBadge tier={alert.tier} /></span>
      </header>

      <div className="grid gap-5 lg:grid-cols-2">
        <Block n={1} title={t("alerts.whatChanged")}>
          <p className="text-sm leading-relaxed">{alert.whatChanged}</p>
          <p className="font-mono text-xs text-muted">{t("alerts.since", { day: alert.sinceDay, days })}</p>
          <Evidence alert={alert} />
        </Block>
        <Block n={2} title={t("alerts.why")}>
          <p className="text-sm leading-relaxed">{alert.whyItMatters}</p>
        </Block>
        <Block n={3} title={t("alerts.doNow")}>
          <ul className="space-y-1.5">
            {alert.doNow.map((step) => (
              <li key={step.text}>
                <label className="flex min-h-11 cursor-pointer items-start gap-3 rounded-lg p-1.5 hover:bg-panel-2">
                  <input type="checkbox" checked={done.includes(step.text)} onChange={() => toggle(step.text)} className="mt-0.5 h-5 w-5 shrink-0 accent-accent" />
                  <span className={`flex-1 text-sm ${done.includes(step.text) ? "text-muted line-through" : ""}`}>{step.text}</span>
                  <TierBadge tier={step.tier} />
                </label>
              </li>
            ))}
          </ul>
          <p className="text-xs text-muted">{t("alerts.progress", { done: done.length, total: alert.doNow.length })}</p>
        </Block>
        <Block n={4} title={t("alerts.who")}>
          <TierLadder tier={alert.tier} />
          <h5 className="pt-2 text-xs uppercase tracking-widest text-muted">{t("alerts.sources")}</h5>
          <ul className="space-y-1 text-sm">
            {alert.sources.map((s) => (
              <li key={s.id}>
                {s.url ? (
                  <a href={s.url} target="_blank" rel="noreferrer" className="text-accent hover:underline">{s.title} ↗</a>
                ) : (
                  <span className="italic text-muted">{s.title}</span>
                )}
              </li>
            ))}
          </ul>
        </Block>
      </div>

      {alert.tier === "EARTH" && <MessageToGround alert={alert} memberName={memberName} completed={done} />}
    </article>
  );
}
