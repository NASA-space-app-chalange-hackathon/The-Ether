"use client";

import { ArrowRight, CircleCheck, CornerDownRight, LoaderCircle, RadioTower } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { AlertSummary } from "@/components/alerts/AlertSummary";
import { PageHeader, Panel } from "@/components/ui/PageHeader";
import { RealDataBadge } from "@/components/ui/RealDataBadge";
import { StatusRing } from "@/components/ui/StatusRing";
import { dayToTimestamp } from "@/lib/data/dataset";
import { dailyQuests } from "@/lib/engine/quests";
import { allRegionStatuses } from "@/lib/engine/regions";
import { formatDelay } from "@/lib/engine/signal";
import type { MessageKey } from "@/lib/i18n";
import { formatDate } from "@/lib/i18n/date";
import { NASA_LINKS } from "@/lib/nasa/config";
import { useAssessment, useMission } from "@/lib/state/DataProvider";
import { useNasa, useSignalDelay } from "@/lib/state/NasaProvider";
import { useAppState, useT } from "@/lib/state/useAppState";
import { useLabels } from "@/lib/state/useLabels";
import { CrewSwitcher } from "./CrewSwitcher";
import { EnvironmentSelector } from "./EnvironmentSelector";
import { RadiationMeter } from "./RadiationMeter";
import { SteppeCareCard } from "./SteppeCareCard";

function MoreLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="group mt-3 inline-flex min-h-10 items-center gap-1.5 text-sm text-muted transition-colors duration-150 hover:text-fg">
      {children}
      <ArrowRight size={14} className="transition-transform duration-150 group-hover:translate-x-0.5" />
    </Link>
  );
}

function Stat({ label, children, className = "" }: { label: ReactNode; children: ReactNode; className?: string }) {
  return (
    <div className={`space-y-1 ${className}`}>
      <dt className="eyebrow flex items-center gap-1.5">{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

export function HomeScreen() {
  const t = useT();
  const labels = useLabels();
  const { mode, day, locale } = useAppState();
  const { dataset, members, maxDay } = useMission();
  const a = useAssessment();
  const { memberId } = useAppState();
  const member = members.find((m) => m.id === memberId);
  const delay = useSignalDelay(Math.min(day, maxDay));
  const { lightTime } = useNasa();

  const heading = (
    <PageHeader title={t("nav.home")}>
      <CrewSwitcher />
    </PageHeader>
  );
  if (!a || !dataset || !member) return <div className="space-y-6">{heading}</div>;

  const current = Math.min(day, maxDay);
  const date = formatDate(dayToTimestamp(dataset.startDate, current), locale);
  const quests = dailyQuests(a, mode);
  const learning = current < 14;

  return (
    <div className="space-y-6">
      {heading}
      <div className="grid gap-4 lg:grid-cols-[1.25fr_1fr]">
        <Panel title={`${labels.memberName(member)} · ${labels.memberRole(member)}`}>
          <StatusRing regions={allRegionStatuses(a)} overall={a.overall} label={labels.memberName(member)} />
          {learning && (
            <p className="mt-4 flex items-center gap-2 text-sm text-accent">
              <LoaderCircle size={14} className="animate-spin motion-reduce:animate-none" />
              {t("status.learning")}
            </p>
          )}
        </Panel>

        <Panel title={t("home.mission")}>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-5">
            <Stat label={t("clock.label")}>
              <span className="font-mono text-3xl font-medium tracking-tight">{current}</span>
            </Stat>
            <Stat label={t("home.date")}>
              <span className="font-mono text-base">{date}</span>
            </Stat>
            {mode === "space" && (
              <Stat
                className="col-span-2"
                label={
                  <>
                    <RadioTower size={12} strokeWidth={2} />
                    {t("signal.label")} ({t(`signal.src.${delay.source}` as MessageKey)})
                  </>
                }
              >
                <span className="font-mono text-2xl font-medium tracking-tight text-accent" data-testid="home-signal-delay">
                  {formatDelay(delay.oneWaySeconds)}
                </span>
                {(delay.source === "horizons" || delay.source === "interpolated") && (
                  <div className="mt-1.5">
                    <RealDataBadge source="JPL Horizons" href={NASA_LINKS.horizons} status={lightTime.status} />
                  </div>
                )}
              </Stat>
            )}
          </dl>
          {mode === "space" && (
            <div className="mt-5 space-y-2">
              <p className="eyebrow">{t("home.environment")}</p>
              <EnvironmentSelector />
            </div>
          )}
          <div className="mt-5 border-t border-line pt-5">{mode === "space" ? <RadiationMeter radiation={a.radiation} spaceWeather={a.spaceWeather} /> : <SteppeCareCard />}</div>
        </Panel>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.25fr_1fr]">
        <Panel title={t("home.alerts")}>
          {a.alerts.length === 0 ? (
            <p className="flex items-center gap-2 text-sm text-ok">
              <CircleCheck size={14} strokeWidth={2.25} />
              {t("home.noAlerts")}
            </p>
          ) : (
            <ul className="space-y-2" data-testid="home-alerts">
              {a.alerts.slice(0, 3).map((alert) => (
                <AlertSummary key={alert.id} alert={alert} />
              ))}
            </ul>
          )}
          <MoreLink href="/alerts">{t("home.allAlerts")}</MoreLink>
        </Panel>

        <Panel title={t("home.quests")}>
          <ul className="divide-y divide-line">
            {quests.map((q) => (
              <li key={q.id} className="flex items-start gap-3 py-2.5 text-sm first:pt-0">
                <span aria-hidden className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                <span className="flex-1">
                  {t(`quest.${q.kind}` as MessageKey)}
                  {q.reason && (
                    <span className="mt-0.5 flex items-center gap-1 text-xs text-amber">
                      <CornerDownRight size={12} className="shrink-0" />
                      {a.alerts.find((x) => x.ruleId === q.reason)?.title}
                    </span>
                  )}
                </span>
                <span className="font-mono text-xs text-muted">+{q.xp} XP</span>
              </li>
            ))}
          </ul>
          <MoreLink href="/quests">{t("home.allQuests")}</MoreLink>
        </Panel>
      </div>
    </div>
  );
}
