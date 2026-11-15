"use client";

import { AnimatePresence, motion } from "framer-motion";
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
    <AnimatePresence>
      {show && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="border-b border-accent/30 bg-accent/10" data-testid="intro-banner">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-2.5">
            <button
              type="button"
              onClick={() => {
                dismissIntro();
                window.dispatchEvent(new Event(DEMO_START_EVENT));
              }}
              className="min-h-11 rounded-lg bg-accent px-4 font-semibold text-bg hover:opacity-90"
            >
              {t("intro.watch")}
            </button>
            <p className="flex-1 text-sm text-muted">{t("intro.body")}</p>
            <button type="button" onClick={dismissIntro} aria-label={t("intro.dismiss")} className="grid h-11 w-11 place-items-center rounded-lg text-muted hover:text-fg">
              <span aria-hidden>✕</span>
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
