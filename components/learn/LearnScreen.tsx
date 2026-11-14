"use client";

import { HAZARDS_MN, HOW_IT_WORKS, INDICATOR_CARDS, type Bilingual } from "@/content/learn";
import { HAZARDS } from "@/content/risks";
import { SourceList } from "@/components/ui/SourceList";
import { STEPPE_RISKS } from "@/content/steppe";
import { useAppState, useT } from "@/lib/state/useAppState";

export function LearnScreen() {
  const t = useT();
  const { locale, mode } = useAppState();
  const tx = (b: Bilingual) => b[locale];
  const hazardName = (id: (typeof HAZARDS)[number]["id"]) => (locale === "mn" ? HAZARDS_MN[id].name : HAZARDS.find((h) => h.id === id)!.name);

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">{t("nav.learn")}</h1>
        <p className="max-w-2xl text-sm text-muted">{t("learn.intro")}</p>
      </div>

      <section className="rounded-xl border border-accent/40 bg-accent/5 p-4">
        <h2 className="mb-1 font-semibold text-accent">{t("learn.how")}</h2>
        <p className="text-sm leading-relaxed">{tx(HOW_IT_WORKS)}</p>
      </section>

      {mode === "steppe" && (
        <section className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted">{t("learn.steppeTitle")}</h2>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4" data-testid="steppe-risks">
            {STEPPE_RISKS.map((r) => (
              <li key={r.id} className="space-y-2 rounded-xl border border-line bg-panel p-4">
                <p className="text-2xl" aria-hidden>{r.icon}</p>
                <h3 className="font-semibold">{tx(r.title)}</h3>
                <p className="text-sm text-muted">{tx(r.summary)}</p>
                <p className="text-xs text-accent">↔ {t("steppe.mirrors", { hazard: tx(r.mirrors) })}</p>
                <SourceList sources={r.sources} className="space-y-0.5 text-xs" />
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-muted">{t(mode === "steppe" ? "learn.sameInSpace" : "learn.hazards")}</h2>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5" data-testid="hazard-cards">
          {HAZARDS.map((h) => (
            <li key={h.id} className="space-y-2 rounded-xl border border-line bg-panel p-4">
              <p className="text-2xl" aria-hidden>{h.icon}</p>
              <h3 className="font-semibold">{hazardName(h.id)}</h3>
              <p className="text-sm text-muted">{locale === "mn" ? HAZARDS_MN[h.id].summary : h.summary}</p>
              <SourceList sources={[h.source]} className="space-y-0.5 text-xs" />
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-muted">{t("learn.indicators")}</h2>
        <ul className="grid gap-3 lg:grid-cols-2" data-testid="indicator-cards">
          {INDICATOR_CARDS.map((c) => (
            <li key={c.id} className="space-y-3 rounded-xl border border-line bg-panel p-4">
              <h3 className="flex items-center gap-2 text-lg font-semibold">
                <span aria-hidden>{c.icon}</span>
                {tx(c.title)}
              </h3>
              <dl className="space-y-2 text-sm">
                <div>
                  <dt className="text-xs uppercase tracking-wider text-muted">{t("learn.measure")}</dt>
                  <dd>{tx(c.measure)}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wider text-muted">{t("learn.why")}</dt>
                  <dd>{tx(c.why)}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wider text-muted">{t("learn.escalate")}</dt>
                  <dd>{tx(c.escalate)}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wider text-muted">{t("learn.hazardsAffecting")}</dt>
                  <dd className="flex flex-wrap gap-1.5 pt-0.5">
                    {c.hazards.map((id) => (
                      <span key={id} className="rounded-full border border-line px-2 py-0.5 text-xs">{hazardName(id)}</span>
                    ))}
                  </dd>
                </div>
              </dl>
              <SourceList sources={c.sources} className="space-y-0.5 text-xs" />
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
