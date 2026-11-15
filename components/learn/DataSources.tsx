"use client";

import { ArrowUpRight, FlaskConical, Server } from "lucide-react";
import { DATA_SOURCES, SIMULATED_NOTE, type DataSourceEntry } from "@/content/learn";
import { HazardTags } from "@/components/ui/HazardTags";
import { RealDataBadge } from "@/components/ui/RealDataBadge";
import { SourceList } from "@/components/ui/SourceList";
import { SOURCES } from "@/lib/engine/sources";
import { formatDate } from "@/lib/i18n/date";
import { useNasa } from "@/lib/state/NasaProvider";
import { useAppState, useT } from "@/lib/state/useAppState";

/** Cited references that are neither official challenge resources nor HRP risk pages. */
const OFFICIAL_IDS = new Set(DATA_SOURCES.map((d) => d.id));
const OTHER_REFERENCES = Object.values(SOURCES).filter((s) => !OFFICIAL_IDS.has(s.id) && !s.id.startsWith("risk"));

function Entry({ entry }: { entry: DataSourceEntry }) {
  const t = useT();
  const { locale } = useAppState();
  const feeds = useNasa();
  const feed = entry.feed ? feeds[entry.feed] : null;
  return (
    <li className="surface space-y-2.5 p-4 sm:p-5" data-testid={`source-${entry.id}`}>
      <a href={entry.url} target="_blank" rel="noreferrer" className="link group inline-flex items-start gap-1 font-medium">
        <span>{entry.name}</span>
        <ArrowUpRight size={13} strokeWidth={2} className="mt-[0.2em] shrink-0 opacity-60 transition-transform duration-150 group-hover:-translate-y-px group-hover:translate-x-px group-hover:opacity-100" />
      </a>
      <p className="text-sm text-fg/90">{entry.powers[locale]}</p>
      {feed && (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
          <RealDataBadge status={feed.status} />
          <span className="font-mono text-xs text-muted">{t("data.fetched", { date: formatDate(feed.fetchedAt, locale) })}</span>
          {entry.route && (
            <span className="inline-flex items-center gap-1 font-mono text-xs text-muted">
              <Server size={11} strokeWidth={2} />
              {entry.route}
            </span>
          )}
        </div>
      )}
      {entry.hazard && <HazardTags ids={[entry.hazard]} />}
    </li>
  );
}

/** Learn → "Data & sources": every official resource and NASA API, and what each one powers. */
export function DataSources() {
  const t = useT();
  const { locale } = useAppState();
  return (
    <div className="space-y-10" data-testid="data-sources">
      <section className="space-y-3">
        <div className="space-y-1">
          <h2 className="eyebrow">{t("data.apis")}</h2>
          <p className="max-w-3xl text-sm text-muted">{t("data.apisIntro")}</p>
        </div>
        <ul className="grid gap-3 lg:grid-cols-3">
          {DATA_SOURCES.filter((d) => d.kind === "api").map((d) => (
            <Entry key={d.id} entry={d} />
          ))}
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="eyebrow">{t("data.official")}</h2>
        <ul className="grid gap-3 lg:grid-cols-2">
          {DATA_SOURCES.filter((d) => d.kind === "official").map((d) => (
            <Entry key={d.id} entry={d} />
          ))}
        </ul>
      </section>

      <section className="surface relative overflow-hidden p-5 sm:p-6" data-testid="simulated-note">
        <span aria-hidden className="absolute inset-y-0 left-0 w-0.5 bg-amber" />
        <h2 className="mb-1.5 flex items-center gap-2 font-medium text-amber">
          <FlaskConical size={16} strokeWidth={2} />
          {t("data.simulatedTitle")}
        </h2>
        <p className="max-w-3xl text-sm leading-relaxed text-fg/90">{SIMULATED_NOTE[locale]}</p>
      </section>

      <section className="space-y-3">
        <h2 className="eyebrow">{t("data.other")}</h2>
        <SourceList sources={OTHER_REFERENCES} className="grid gap-x-6 gap-y-1.5 text-sm lg:grid-cols-2" />
      </section>
    </div>
  );
}
