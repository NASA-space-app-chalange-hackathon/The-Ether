"use client";

import { Radiation, Sun } from "lucide-react";
import { motion } from "motion/react";
import { CAREER_LIMIT_MSV, type RadiationTracker } from "@/lib/engine/cumulative";
import type { SpaceWeatherEvent } from "@/lib/engine/types";
import { formatDate } from "@/lib/i18n/date";
import { motionTokens } from "@/lib/motion-tokens";
import { useNasa } from "@/lib/state/NasaProvider";
import { useAppState, useT } from "@/lib/state/useAppState";
import { RealDataBadge } from "@/components/ui/RealDataBadge";
import { StatusBadge } from "@/components/ui/Badges";
import { STATUS_STYLE } from "@/components/ui/status";

export function RadiationMeter({ radiation, spaceWeather = null }: { radiation: RadiationTracker; spaceWeather?: SpaceWeatherEvent | null }) {
  const t = useT();
  const { locale } = useAppState();
  const { spaceWeather: feed } = useNasa();
  const fraction = Math.min(1, radiation.fractionOfLimit);
  const prior = Math.min(1, radiation.priorDose / CAREER_LIMIT_MSV);
  return (
    <div className="space-y-2.5" data-testid="radiation-meter">
      <div className="flex items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 text-sm font-medium">
          <Radiation size={14} strokeWidth={2} className="text-muted" />
          {t("radiation.title")}
        </h3>
        <StatusBadge status={radiation.status} />
      </div>
      <div className="track" role="meter" aria-valuemin={0} aria-valuemax={CAREER_LIMIT_MSV} aria-valuenow={Math.round(radiation.totalDose)} aria-label={t("radiation.title")}>
        <motion.div
          className="absolute inset-0 origin-left"
          style={{ backgroundColor: STATUS_STYLE[radiation.status].fill }}
          initial={false}
          animate={{ scaleX: fraction }}
          transition={{ duration: motionTokens.duration.normal, ease: motionTokens.easing.smooth }}
        />
        <div className="absolute inset-0 origin-left bg-grey" style={{ transform: `scaleX(${prior})` }} />
        <div className="absolute inset-y-0 left-1/2 w-px bg-fg/40" aria-hidden />
      </div>
      <p className="flex flex-wrap justify-between gap-2 font-mono text-xs text-muted">
        <span>{t("radiation.career", { total: radiation.totalDose.toFixed(0), limit: CAREER_LIMIT_MSV })}</span>
        {radiation.todayDose !== null && <span>{t("radiation.today", { dose: radiation.todayDose.toFixed(2) })}</span>}
      </p>
      {radiation.eventActive && (
        <p className="flex items-center gap-2.5 rounded-lg border border-red/30 bg-red/10 px-3 py-2 text-sm font-medium text-red">
          <span aria-hidden className="relative flex h-2 w-2 shrink-0">
            <span className="absolute inset-0 animate-ping rounded-full bg-red opacity-60 motion-reduce:hidden" />
            <span className="relative h-2 w-2 rounded-full bg-red" />
          </span>
          <Sun size={14} strokeWidth={2} className="shrink-0" />
          {t("radiation.event")}
        </p>
      )}
      {spaceWeather && (
        <div className="space-y-1.5" data-testid="donki-event">
          <p className="text-sm text-fg/90">
            {t("radiation.donki", { date: formatDate(spaceWeather.realDate, locale), day: spaceWeather.day })}
            {spaceWeather.highEnergy && <> {t("radiation.donkiHigh")}</>}
          </p>
          <RealDataBadge source="NASA DONKI" href={spaceWeather.url ?? undefined} status={feed.status} />
        </div>
      )}
    </div>
  );
}
