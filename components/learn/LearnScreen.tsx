"use client";

import { ArrowLeftRight, type LucideIcon } from "lucide-react";
import { HAZARDS_MN, HOW_IT_WORKS, INDICATOR_CARDS, type Bilingual } from "@/content/learn";
import { FALLBACK_ICON, HAZARD_ICON, INDICATOR_CARD_ICON, STEPPE_RISK_ICON } from "@/components/ui/icons";
import { PageHeader } from "@/components/ui/PageHeader";
import { HAZARDS } from "@/content/risks";
import { SourceList } from "@/components/ui/SourceList";
import { STEPPE_RISKS } from "@/content/steppe";
import { useAppState, useT } from "@/lib/state/useAppState";

function IconTile({ icon: Icon }: { icon: LucideIcon }) {
  return (
    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-line bg-panel-2 text-fg/90">
      <Icon size={16} strokeWidth={1.75} />
    </span>
  );
}

export function LearnScreen() {
  const t = useT();
  const { locale, mode } = useAppState();
  const tx = (b: Bilingual) => b[locale];
  const hazardName = (id: (typeof HAZARDS)[number]["id"]) => (locale === "mn" ? HAZARDS_MN[id].name : HAZARDS.find((h) => h.id === id)!.name);

  return (
    <div className="space-y-10">
      <PageHeader title={t("nav.learn")} intro={t("learn.intro")} />

      <section className="surface relative overflow-hidden p-5 sm:p-6">
        <span aria-hidden className="absolute inset-y-0 left-0 w-0.5 bg-accent" />
        <h2 className="mb-1.5 font-medium text-accent">{t("learn.how")}</h2>
        <p className="max-w-3xl text-sm leading-relaxed text-fg/90">{tx(HOW_IT_WORKS)}</p>
      </section>

      {mode === "steppe" && (
        <section className="space-y-3">
          <h2 className="eyebrow">{t("learn.steppeTitle")}</h2>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4" data-testid="steppe-risks">
            {STEPPE_RISKS.map((r) => (
              <li key={r.id} className="surface space-y-3 p-4">
                <IconTile icon={STEPPE_RISK_ICON[r.id]} />
                <h3 className="font-medium">{tx(r.title)}</h3>
                <p className="text-sm text-muted">{tx(r.summary)}</p>
                <p className="flex items-center gap-1.5 text-xs text-accent">
                  <ArrowLeftRight size={12} strokeWidth={2} className="shrink-0" />
                  {t("steppe.mirrors", { hazard: tx(r.mirrors) })}
                </p>
                <SourceList sources={r.sources} className="space-y-0.5 text-xs" />
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="space-y-3">
        <h2 className="eyebrow">{t(mode === "steppe" ? "learn.sameInSpace" : "learn.hazards")}</h2>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5" data-testid="hazard-cards">
          {HAZARDS.map((h) => (
            <li key={h.id} className="surface space-y-3 p-4">
              <IconTile icon={HAZARD_ICON[h.id]} />
              <h3 className="font-medium">{hazardName(h.id)}</h3>
              <p className="text-sm text-muted">{locale === "mn" ? HAZARDS_MN[h.id].summary : h.summary}</p>
              <SourceList sources={[h.source]} className="space-y-0.5 text-xs" />
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="eyebrow">{t("learn.indicators")}</h2>
        <ul className="grid gap-3 lg:grid-cols-2" data-testid="indicator-cards">
          {INDICATOR_CARDS.map((c) => (
            <li key={c.id} className="surface space-y-4 p-5">
              <h3 className="flex items-center gap-3 text-base font-medium">
                <IconTile icon={INDICATOR_CARD_ICON[c.id] ?? FALLBACK_ICON} />
                {tx(c.title)}
              </h3>
              <dl className="space-y-3 text-sm">
                <div>
                  <dt className="eyebrow mb-0.5">{t("learn.measure")}</dt>
                  <dd>{tx(c.measure)}</dd>
                </div>
                <div>
                  <dt className="eyebrow mb-0.5">{t("learn.why")}</dt>
                  <dd>{tx(c.why)}</dd>
                </div>
                <div>
                  <dt className="eyebrow mb-0.5">{t("learn.escalate")}</dt>
                  <dd>{tx(c.escalate)}</dd>
                </div>
                <div>
                  <dt className="eyebrow mb-0.5">{t("learn.hazardsAffecting")}</dt>
                  <dd className="flex flex-wrap gap-1.5 pt-0.5">
                    {c.hazards.map((id) => (
                      <span key={id} className="rounded-md px-1.5 py-0.5 text-xs text-fg/80 ring-1 ring-inset ring-line-strong">{hazardName(id)}</span>
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
