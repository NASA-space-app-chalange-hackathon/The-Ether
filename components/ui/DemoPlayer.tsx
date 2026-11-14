"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { MessageKey } from "@/lib/i18n";
import { DEMO_STEPS, scrubPath } from "@/lib/state/demo";
import { getSnapshot, updateState } from "@/lib/state/store";
import { useT } from "@/lib/state/useAppState";

const FRAME_MS = 40;
const sleep = (ms: number) => new Promise((r) => window.setTimeout(r, ms));

/** Plays the scripted demo story with captions — built for recording the 30-second video. */
export function DemoPlayer() {
  const t = useT();
  const router = useRouter();
  const [caption, setCaption] = useState<MessageKey | null>(null);
  const running = useRef(false);

  useEffect(() => () => void (running.current = false), []);

  const stop = () => {
    running.current = false;
    setCaption(null);
  };

  const play = async () => {
    running.current = true;
    for (const step of DEMO_STEPS) {
      if (!running.current) return;
      updateState((s) => ({ ...s, mode: step.mode, memberId: { ...s.memberId, [step.mode]: step.memberId } }));
      router.push(step.route);
      setCaption(step.caption);
      const path = scrubPath(getSnapshot().day[step.mode], step.day);
      for (const d of path) {
        if (!running.current) return;
        updateState((s) => ({ ...s, day: { ...s.day, [step.mode]: d } }));
        await sleep(FRAME_MS);
      }
      await sleep(Math.max(0, step.holdMs - path.length * FRAME_MS));
    }
    stop();
  };

  const active = caption !== null;
  return (
    <>
      <button
        type="button"
        onClick={() => (active ? stop() : void play())}
        aria-pressed={active}
        title={t(active ? "demo.stop" : "demo.startLabel")}
        data-testid="demo-button"
        className="flex min-h-10 items-center gap-1.5 rounded-full border border-line px-3 text-sm transition-colors hover:border-accent aria-pressed:border-red aria-pressed:text-red"
      >
        <span aria-hidden>{active ? "■" : "▶"}</span>
        <span className="sr-only sm:not-sr-only">{active ? t("demo.stop") : t("demo.start")}</span>
      </button>
      <AnimatePresence mode="wait">
        {active && caption !== "demo.end" && (
          <motion.div
            key={caption}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            role="status"
            data-testid="demo-caption"
            className="pointer-events-none fixed inset-x-0 bottom-6 z-50 mx-auto w-fit max-w-3xl rounded-xl border border-accent/40 bg-bg/90 px-6 py-3 text-center text-lg font-semibold shadow-2xl backdrop-blur"
          >
            {t(caption)}
          </motion.div>
        )}
        {caption === "demo.end" && (
          <motion.div
            key="end"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            role="status"
            data-testid="demo-caption"
            className="fixed inset-0 z-50 grid place-items-center bg-bg/95 backdrop-blur"
          >
            <div className="space-y-4 text-center">
              <p className="flex items-center justify-center gap-3 text-5xl font-semibold">
                <span aria-hidden className="h-6 w-6 rounded-full bg-accent shadow-[0_0_24px] shadow-accent" />
                {t("app.name")}
              </p>
              <p className="text-2xl text-muted">{t("demo.end")}</p>
              <p className="text-sm text-amber">⚠ {t("disclaimer")}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
