"use client";

import { HAZARDS_MN, HOW_IT_WORKS, INDICATOR_CARDS, type Bilingual } from "@/content/learn";
import { HAZARDS } from "@/content/risks";
import type { Source } from "@/lib/engine/types";
import { useAppState, useT } from "@/lib/state/useAppState";

function Sources({ sources }: { sources: readonly Source[] }) {
  return (
    <ul className="space-y-0.5 text-xs">
      {sources.map((s) => (
        <li key={s.id}>
          {s.url ? (
            <a href={s.url} target="_blank" rel="noreferrer" className="text-accent hover:underline">{s.title} ↗</a>
          ) : (
            <span className="italic text-muted">{s.title}</span>
          )}
        </li>
      ))}
    </ul>
  );
}

export function LearnScreen() {
  const t = useT();
  const { locale } = useAppState();
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

      <section className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-muted">{t("learn.hazards")}</h2>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5" data-testid="hazard-cards">
          {HAZARDS.map((h) => (
            <li key={h.id} className="space-y-2 rounded-xl border border-line bg-panel p-4">
              <p className="text-2xl" aria-hidden>{h.icon}</p>
              <h3 className="font-semibold">{hazardName(h.id)}</h3>
              <p className="text-sm text-muted">{locale === "mn" ? HAZARDS_MN[h.id].summary : h.summary}</p>
              <Sources sources={[h.source]} />
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
              <Sources sources={c.sources} />
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
