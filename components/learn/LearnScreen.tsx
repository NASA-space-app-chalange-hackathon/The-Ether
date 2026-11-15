"use client";

import { ArrowLeftRight, Earth, Radiation, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  CSA_RADIATION,
  CSA_RADIATION_IN_APP,
  EARTH_BENEFITS,
  EARTH_BENEFITS_OURS,
  HAZARDS_MN,
  HOW_IT_WORKS,
  INDICATOR_CARDS,
  type Bilingual,
} from "@/content/learn";
import { RULES_MN } from "@/content/rules-mn";
import { FALLBACK_ICON, HAZARD_ICON, INDICATOR_CARD_ICON, STEPPE_RISK_ICON } from "@/components/ui/icons";
import { PageHeader } from "@/components/ui/PageHeader";
import { RealDataBadge } from "@/components/ui/RealDataBadge";
import { Segmented } from "@/components/ui/Segmented";
import { HAZARDS, REGION_CONTENT, type HazardId } from "@/content/risks";
import { SourceList } from "@/components/ui/SourceList";
import { STEPPE_RISKS } from "@/content/steppe";
import { RULES } from "@/lib/engine/escalation";
import { HAZARD_IDS, INDICATOR_HAZARDS } from "@/lib/engine/hazards";
import { INDICATOR_IDS } from "@/lib/engine/indicators";
import { REGION_IDS } from "@/lib/engine/regions";
import { SOURCES } from "@/lib/engine/sources";
import type { Source } from "@/lib/engine/types";
import type { MessageKey } from "@/lib/i18n";
import { formatDate } from "@/lib/i18n/date";
import { useNasa } from "@/lib/state/NasaProvider";
import { useAppState, useT } from "@/lib/state/useAppState";
import { useLabels } from "@/lib/state/useLabels";
import { DataSources } from "./DataSources";

type Tab = "learn" | "data";

function IconTile({ icon: Icon }: { icon: LucideIcon }) {
  return (
    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-line bg-panel-2 text-fg/90">
      <Icon size={16} strokeWidth={1.75} />
    </span>
  );
}

const CHIP = "inline-flex items-center rounded-md px-1.5 py-0.5 text-xs text-fg/80 ring-1 ring-inset ring-line-strong";

/** HRP risk pages behind a hazard: from the body systems and the alert rules tagged with it. */
function risksFor(id: HazardId): Source[] {
  const all = [
    ...REGION_IDS.filter((r) => REGION_CONTENT[r].hazards.includes(id)).flatMap((r) => REGION_CONTENT[r].risks),
    ...Object.values(RULES).filter((rule) => rule.hazards.includes(id)).flatMap((rule) => rule.sources),
  ].filter((s) => s.id.startsWith("risk"));
  return [...new Map(all.map((s) => [s.id, s])).values()];
}

/** Read #data / #hazard-<id> so other screens can deep-link here. */
function readHash(): { tab: Tab; hazard: HazardId | null } {
  const hash = window.location.hash.slice(1);
  if (hash === "data") return { tab: "data", hazard: null };
  const h = hash.startsWith("hazard-") ? (hash.slice(7) as HazardId) : null;
  return { tab: "learn", hazard: h && HAZARD_IDS.includes(h) ? h : null };
}

function HazardDetail({ id }: { id: HazardId }) {
  const t = useT();
  const labels = useLabels();
  const { locale } = useAppState();
  const name = locale === "mn" ? HAZARDS_MN[id].name : HAZARDS.find((h) => h.id === id)!.name;
  const indicators = INDICATOR_IDS.filter((i) => INDICATOR_HAZARDS[i].includes(id));
  const regions = REGION_IDS.filter((r) => REGION_CONTENT[r].hazards.includes(id));
  const rules = Object.values(RULES).filter((r) => r.hazards.includes(id));
  return (
    <div className="surface space-y-4 p-5" data-testid="hazard-detail" aria-live="polite">
      <h3 className="font-medium">{t("learn.hazardTracks", { hazard: name })}</h3>
      <dl className="grid gap-x-6 gap-y-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-1.5">
          <dt className="eyebrow">{t("learn.hazardIndicators")}</dt>
          <dd className="flex flex-wrap gap-1.5">
            {indicators.map((i) => (
              <span key={i} className={CHIP}>{labels.indicator(i)}</span>
            ))}
          </dd>
        </div>
        <div className="space-y-1.5">
          <dt className="eyebrow">{t("learn.hazardSystems")}</dt>
          <dd className="flex flex-wrap gap-1.5">
            {regions.map((r) => (
              <Link key={r} href={`/body?region=${r}`} className={`${CHIP} transition-colors duration-150 hover:text-fg`}>
                {t(`region.${r}` as MessageKey)}
              </Link>
            ))}
          </dd>
        </div>
        <div className="space-y-1.5">
          <dt className="eyebrow">{t("learn.hazardAlerts")}</dt>
          <dd>
            <ul className="space-y-1">
              {rules.map((r) => (
                <li key={r.id}>{locale === "mn" ? (RULES_MN[r.id as keyof typeof RULES_MN]?.title ?? r.title) : r.title}</li>
              ))}
            </ul>
          </dd>
        </div>
        <div className="space-y-1.5">
          <dt className="eyebrow">{t("learn.hazardRisks")}</dt>
          <dd>
            <SourceList sources={risksFor(id)} className="space-y-1 text-xs" />
          </dd>
        </div>
      </dl>
      <p className="text-xs text-muted italic">{t("learn.hazardMapping")}</p>
    </div>
  );
}

function RadiationSection() {
  const t = useT();
  const { locale, setDay } = useAppState();
  const { spaceWeather } = useNasa();
  const tx = (b: Bilingual) => b[locale];
  const events = spaceWeather.data.events;
  return (
    <section className="space-y-3" aria-labelledby="learn-radiation">
      <h2 id="learn-radiation" className="eyebrow">{t("learn.radiationTitle")}</h2>
      <div className="grid gap-3 lg:grid-cols-2">
        <div className="surface space-y-3 p-5">
          <h3 className="flex items-center gap-3 font-medium">
            <IconTile icon={Radiation} />
            {t("learn.csaTitle")}
          </h3>
          <ul className="list-disc space-y-1.5 pl-5 text-sm text-fg/90 marker:text-muted" data-testid="csa-radiation">
            {CSA_RADIATION.map((p) => (
              <li key={p.en}>{tx(p)}</li>
            ))}
          </ul>
          <p className="text-sm text-muted">{tx(CSA_RADIATION_IN_APP)}</p>
          <SourceList sources={[SOURCES.csaRadiation]} className="space-y-0.5 text-xs" />
        </div>
        <div className="surface space-y-3 p-5" data-testid="donki-list">
          <h3 className="font-medium">{t("learn.donkiTitle")}</h3>
          <p className="text-sm text-muted">
            {t("learn.donkiIntro", {
              from: formatDate(spaceWeather.data.replayStart, locale),
              records: spaceWeather.data.recordCount,
              events: spaceWeather.data.eventCount,
              near: events.length,
            })}
          </p>
          <div className="overflow-x-auto rounded-lg border border-line">
            <table className="w-full text-left text-sm">
              <thead className="bg-panel-2/60 text-xs text-muted">
                <tr>
                  <th className="px-3 py-1.5 font-normal">{t("learn.donkiDay")}</th>
                  <th className="px-3 py-1.5 font-normal">{t("learn.donkiDate")}</th>
                  <th className="px-3 py-1.5 font-normal">{t("learn.donkiSeen")}</th>
                </tr>
              </thead>
              <tbody>
                {events.map((e) => (
                  <tr key={e.id} className="border-t border-line">
                    <td className="px-3 py-1.5 font-mono text-[13px]">
                      <Link href="/" onClick={() => setDay(e.missionDay)} className="link">
                        {t("clock.dayShort", { day: e.missionDay })}
                      </Link>
                    </td>
                    <td className="px-3 py-1.5">
                      {e.link ? (
                        <a href={e.link} target="_blank" rel="noreferrer" className="link">
                          {formatDate(e.realDate, locale)}
                        </a>
                      ) : (
                        formatDate(e.realDate, locale)
                      )}
                    </td>
                    <td className="px-3 py-1.5 text-xs text-muted">{e.highEnergy ? t("learn.donkiHigh") : t("learn.donkiGoes")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <RealDataBadge source="NASA DONKI" href="https://kauai.ccmc.gsfc.nasa.gov/DONKI/" status={spaceWeather.status} />
        </div>
      </div>
    </section>
  );
}

function EarthSection() {
  const t = useT();
  const { locale } = useAppState();
  return (
    <section className="surface relative overflow-hidden p-5 sm:p-6" aria-labelledby="learn-earth" data-testid="earth-benefits">
      <span aria-hidden className="absolute inset-y-0 left-0 w-0.5 bg-accent" />
      <h2 id="learn-earth" className="mb-2 flex items-center gap-2 font-medium text-accent">
        <Earth size={16} strokeWidth={2} />
        {t("learn.earthTitle")}
      </h2>
      <ul className="max-w-3xl list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-fg/90 marker:text-muted">
        {EARTH_BENEFITS.map((p) => (
          <li key={p.en}>{p[locale]}</li>
        ))}
      </ul>
      <p className="mt-3 max-w-3xl text-sm text-muted">{EARTH_BENEFITS_OURS[locale]}</p>
      <SourceList sources={[SOURCES.csaScience]} className="mt-3 space-y-0.5 text-xs" />
    </section>
  );
}

export function LearnScreen() {
  const t = useT();
  const { locale, mode } = useAppState();
  const [tab, setTab] = useState<Tab>("learn");
  const [hazard, setHazard] = useState<HazardId | null>(null);
  const tx = (b: Bilingual) => b[locale];
  const hazardName = (id: HazardId) => (locale === "mn" ? HAZARDS_MN[id].name : HAZARDS.find((h) => h.id === id)!.name);

  useEffect(() => {
    const apply = () => {
      const h = readHash();
      setTab(h.tab);
      setHazard(h.hazard);
      if (h.hazard) requestAnimationFrame(() => document.getElementById(`hazard-${h.hazard}`)?.scrollIntoView({ block: "center" }));
    };
    apply();
    window.addEventListener("hashchange", apply);
    return () => window.removeEventListener("hashchange", apply);
  }, []);

  const changeTab = (next: Tab) => {
    setTab(next);
    window.history.replaceState(null, "", next === "data" ? "#data" : window.location.pathname);
  };
  const toggleHazard = (id: HazardId) => setHazard((h) => (h === id ? null : id));
  const cards = hazard ? INDICATOR_CARDS.filter((c) => c.hazards.includes(hazard)) : INDICATOR_CARDS;

  return (
    <div className="space-y-10">
      <PageHeader title={t("nav.learn")} intro={t("learn.intro")}>
        <Segmented
          label={t("learn.tabs")}
          value={tab}
          onChange={changeTab}
          options={[
            { value: "learn", label: t("learn.tabLearn") },
            { value: "data", label: t("learn.tabData") },
          ]}
        />
      </PageHeader>

      {tab === "data" ? (
        <DataSources />
      ) : (
        <>
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

          <section className="space-y-3" id="hazards">
            <div className="space-y-1">
              <h2 className="eyebrow">{t(mode === "steppe" ? "learn.sameInSpace" : "learn.hazards")}</h2>
              <p className="text-sm text-muted">{t("learn.hazardsHint")}</p>
            </div>
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5" data-testid="hazard-cards">
              {HAZARDS.map((h) => {
                const on = hazard === h.id;
                return (
                  <li
                    key={h.id}
                    id={`hazard-${h.id}`}
                    className={`surface flex scroll-mt-40 flex-col gap-3 p-4 transition-shadow duration-150 ${on ? "ring-1 ring-accent/50" : ""}`}
                  >
                    <IconTile icon={HAZARD_ICON[h.id]} />
                    <h3 className="font-medium">{hazardName(h.id)}</h3>
                    <p className="text-sm text-muted">{locale === "mn" ? HAZARDS_MN[h.id].summary : h.summary}</p>
                    <SourceList sources={[h.source]} className="space-y-0.5 text-xs" />
                    <button
                      type="button"
                      aria-pressed={on}
                      onClick={() => toggleHazard(h.id)}
                      className="mt-auto inline-flex min-h-10 items-center justify-center rounded-lg border border-line px-3 text-[13px] font-medium text-muted transition-[background-color,border-color,color] duration-150 hover:border-line-strong hover:text-fg aria-pressed:border-accent/40 aria-pressed:bg-accent/10 aria-pressed:text-accent"
                    >
                      {t(on ? "learn.hazardHide" : "learn.hazardShow")}
                    </button>
                  </li>
                );
              })}
            </ul>
            {hazard && <HazardDetail id={hazard} />}
          </section>

          {mode === "space" && <RadiationSection />}
          <EarthSection />

          <section className="space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="eyebrow">
                {t("learn.indicators")}
                {hazard && ` · ${hazardName(hazard)}`}
              </h2>
              {hazard && (
                <button type="button" onClick={() => setHazard(null)} className="link text-xs">
                  {t("learn.showAll")}
                </button>
              )}
            </div>
            <ul className="grid gap-3 lg:grid-cols-2" data-testid="indicator-cards">
              {cards.map((c) => (
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
                          <span key={id} className={CHIP}>{hazardName(id)}</span>
                        ))}
                      </dd>
                    </div>
                  </dl>
                  <SourceList sources={c.sources} className="space-y-0.5 text-xs" />
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </div>
  );
}
