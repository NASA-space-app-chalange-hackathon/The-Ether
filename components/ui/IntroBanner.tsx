"use client";

import { ArrowRight, Play, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { motionTokens } from "@/lib/motion-tokens";
import { useMission } from "@/lib/state/DataProvider";
import { useAppState, useT } from "@/lib/state/useAppState";
import { useLabels } from "@/lib/state/useLabels";
import { DEMO_START_EVENT } from "./DemoPlayer";

/**
 * First-visit introduction above Mission Home: what the app is, whose (simulated) data
 * you're looking at, and the two things to do first. Each mode has its own version and
 * is dismissed separately.
 */
export function IntroBanner() {
  const t = useT();
  const labels = useLabels();
  const { mode, day, memberId, introDismissed, dismissIntro } = useAppState();
  const { status, members, maxDay } = useMission();
  const member = members.find((m) => m.id === memberId);
  const show = status === "ready" && !introDismissed && member !== undefined;
  return (
    <AnimatePresence initial={false} mode="wait">
      {show && (
        <motion.section
          key={mode}
          initial={{ opacity: 0, y: -motionTokens.distance.sm }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, transition: { duration: motionTokens.duration.fast } }}
          transition={{ duration: motionTokens.duration.normal, ease: motionTokens.easing.smooth }}
          aria-labelledby="intro-title"
          className="surface relative overflow-hidden p-5 sm:p-6"
          data-testid="intro-banner"
        >
          <span aria-hidden className="absolute inset-y-0 left-0 w-0.5 bg-accent" />
          <div className="flex items-start gap-3">
            <div className="max-w-3xl flex-1 space-y-2">
              <h2 id="intro-title" className="font-medium text-accent">
                {t(`intro.${mode}.title`)}
              </h2>
              <p className="text-sm leading-relaxed text-fg/90">{t(`intro.${mode}.what`)}</p>
              <p className="text-sm text-muted" data-testid="intro-viewing">
                {t(`intro.${mode}.viewing`, { name: labels.memberName(member!), day: Math.min(day, maxDay) })}
              </p>
            </div>
            <button type="button" onClick={dismissIntro} aria-label={t("intro.dismiss")} title={t("intro.dismiss")} className="icon-btn shrink-0">
              <X size={16} strokeWidth={2} />
            </button>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                dismissIntro();
                window.dispatchEvent(new Event(DEMO_START_EVENT));
              }}
              className="btn btn-secondary"
            >
              <Play size={14} strokeWidth={2.25} fill="currentColor" />
              {t("intro.watch")}
            </button>
            <Link href="/check" onClick={dismissIntro} className="btn btn-secondary">
              {t("intro.check")}
              <ArrowRight size={14} />
            </Link>
          </div>
        </motion.section>
      )}
    </AnimatePresence>
  );
}
