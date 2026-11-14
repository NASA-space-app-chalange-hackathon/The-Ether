"use client";

import Link from "next/link";
import { AlertSummary } from "@/components/alerts/AlertSummary";
import { StatusRing } from "@/components/ui/StatusRing";
import { dayToTimestamp } from "@/lib/data/dataset";
import { dailyQuests } from "@/lib/engine/quests";
import { allRegionStatuses } from "@/lib/engine/regions";
import { formatDelay, signalDelay } from "@/lib/engine/signal";
import type { MessageKey } from "@/lib/i18n";
import { useAssessment, useMission } from "@/lib/state/DataProvider";
import { useAppState, useT } from "@/lib/state/useAppState";
import { CrewSwitcher } from "./CrewSwitcher";
import { EnvironmentSelector } from "./EnvironmentSelector";
import { RadiationMeter } from "./RadiationMeter";

function Card({ title, children, className = "" }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={`rounded-xl border border-line bg-panel p-4 ${className}`}>
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted">{title}</h2>
      {children}
    </section>
  );
}

export function HomeScreen() {
  const t = useT();
  const { mode, day, environment, locale } = useAppState();
  const { dataset, members, maxDay } = useMission();
  const a = useAssessment();
  const { memberId } = useAppState();
  const member = members.find((m) => m.id === memberId);

  const heading = (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <h1 className="text-2xl font-semibold">{t("nav.home")}</h1>
      <CrewSwitcher />
    </div>
  );
  if (!a || !dataset || !member) return <div className="space-y-4">{heading}</div>;

  const current = Math.min(day, maxDay);
  const date = new Intl.DateTimeFormat(locale === "mn" ? "mn-MN" : "en-US", { dateStyle: "medium", timeZone: "UTC" }).format(
    new Date(dayToTimestamp(dataset.startDate, current)),
  );
  const delay = signalDelay(environment, current);
  const quests = dailyQuests(a, mode);
  const learning = current < 14;

  return (
    <div className="space-y-4">
      {heading}
      <div className="grid gap-4 lg:grid-cols-[1.25fr_1fr]">
        <Card title={`${member.name} · ${member.role}`}>
          <StatusRing regions={allRegionStatuses(a)} overall={a.overall} label={member.name} />
          {learning && <p className="mt-3 text-sm text-accent">◔ {t("status.learning")}</p>}
        </Card>

        <Card title={t("home.mission")}>
          <dl className="grid grid-cols-2 gap-3">
            <div>
              <dt className="text-xs text-muted">{t("clock.label")}</dt>
              <dd className="font-mono text-3xl tabular-nums">{current}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted">{t("home.date")}</dt>
              <dd className="font-mono text-lg">{date}</dd>
            </div>
            {mode === "space" && (
              <div className="col-span-2">
                <dt className="text-xs text-muted">📡 {t("signal.label")} ({t("signal.approx")})</dt>
                <dd className="font-mono text-2xl tabular-nums text-accent">{formatDelay(delay.oneWaySeconds)}</dd>
              </div>
            )}
          </dl>
          {mode === "space" && (
            <div className="mt-3 space-y-2">
              <p className="text-xs text-muted">{t("home.environment")}</p>
              <EnvironmentSelector />
            </div>
          )}
          {mode === "space" && (
            <div className="mt-4">
              <RadiationMeter radiation={a.radiation} />
            </div>
          )}
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.25fr_1fr]">
        <Card title={t("home.alerts")}>
          {a.alerts.length === 0 ? (
            <p className="text-sm text-ok">✓ {t("home.noAlerts")}</p>
          ) : (
            <ul className="space-y-2" data-testid="home-alerts">
              {a.alerts.slice(0, 3).map((alert) => (
                <AlertSummary key={alert.id} alert={alert} />
              ))}
            </ul>
          )}
          <Link href="/alerts" className="mt-3 inline-flex min-h-11 items-center text-sm text-accent hover:underline">
            {t("home.allAlerts")} →
          </Link>
        </Card>

        <Card title={t("home.quests")}>
          <ul className="space-y-1.5">
            {quests.map((q) => (
              <li key={q.id} className="flex items-start gap-2 text-sm">
                <span aria-hidden className="mt-0.5 text-accent">◇</span>
                <span className="flex-1">
                  {t(`quest.${q.kind}` as MessageKey)}
                  {q.reason && <span className="block text-xs text-amber">↳ {a.alerts.find((x) => x.ruleId === q.reason)?.title}</span>}
                </span>
                <span className="font-mono text-xs text-muted">+{q.xp} XP</span>
              </li>
            ))}
          </ul>
          <Link href="/quests" className="mt-3 inline-flex min-h-11 items-center text-sm text-accent hover:underline">
            {t("home.allQuests")} →
          </Link>
        </Card>
      </div>
    </div>
  );
}
