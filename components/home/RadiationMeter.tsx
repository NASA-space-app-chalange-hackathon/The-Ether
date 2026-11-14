"use client";

import { motion } from "framer-motion";
import { CAREER_LIMIT_MSV, type RadiationTracker } from "@/lib/engine/cumulative";
import { useT } from "@/lib/state/useAppState";
import { StatusBadge } from "@/components/ui/Badges";
import { STATUS_STYLE } from "@/components/ui/status";

export function RadiationMeter({ radiation }: { radiation: RadiationTracker }) {
  const t = useT();
  const pct = Math.min(100, radiation.fractionOfLimit * 100);
  const priorPct = Math.min(100, (radiation.priorDose / CAREER_LIMIT_MSV) * 100);
  return (
    <div className="space-y-2" data-testid="radiation-meter">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold">☢ {t("radiation.title")}</h3>
        <StatusBadge status={radiation.status} />
      </div>
      <div className="relative h-3 overflow-hidden rounded-full bg-line" role="meter" aria-valuemin={0} aria-valuemax={CAREER_LIMIT_MSV} aria-valuenow={Math.round(radiation.totalDose)} aria-label={t("radiation.title")}>
        <div className="absolute inset-y-0 left-0 bg-grey" style={{ width: `${priorPct}%` }} />
        <motion.div
          className="absolute inset-y-0 left-0"
          style={{ backgroundColor: STATUS_STYLE[radiation.status].fill, opacity: 0.85 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.3 }}
        />
        <div className="absolute inset-y-0 left-1/2 w-px bg-fg/40" aria-hidden />
      </div>
      <p className="flex flex-wrap justify-between gap-2 font-mono text-xs text-muted tabular-nums">
        <span>{t("radiation.career", { total: radiation.totalDose.toFixed(0), limit: CAREER_LIMIT_MSV })}</span>
        {radiation.todayDose !== null && <span>{t("radiation.today", { dose: radiation.todayDose.toFixed(2) })}</span>}
      </p>
      {radiation.eventActive && (
        <p className="animate-pulse rounded-md border border-red/50 bg-red/15 px-3 py-2 text-sm font-semibold text-red">
          ☀️ {t("radiation.event")}
        </p>
      )}
    </div>
  );
}
