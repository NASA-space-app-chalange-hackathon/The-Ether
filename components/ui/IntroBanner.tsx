"use client";

import { Play, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { motionTokens } from "@/lib/motion-tokens";
import { useMission } from "@/lib/state/DataProvider";
import { useAppState, useT } from "@/lib/state/useAppState";
import { DEMO_START_EVENT } from "./DemoPlayer";

/** First-visit invitation to the demo story; dismissed (or used) once, then gone for good. */
export function IntroBanner() {
  const t = useT();
  const { state, dismissIntro } = useAppState();
  const { status } = useMission();
  const show = status === "ready" && !state.introDismissed;
  return (
    <AnimatePresence initial={false}>
      {show && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: motionTokens.duration.normal, ease: motionTokens.easing.smooth }}
          className="overflow-hidden border-b border-line bg-panel"
          data-testid="intro-banner"
        >
          <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-2.5">
            <button
              type="button"
              onClick={() => {
                dismissIntro();
                window.dispatchEvent(new Event(DEMO_START_EVENT));
              }}
              className="btn btn-primary"
            >
              <Play size={14} strokeWidth={2.25} fill="currentColor" />
              {t("intro.watch")}
            </button>
            <p className="min-w-0 flex-1 text-sm text-muted">{t("intro.body")}</p>
            <button type="button" onClick={dismissIntro} aria-label={t("intro.dismiss")} title={t("intro.dismiss")} className="icon-btn">
              <X size={16} strokeWidth={2} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
