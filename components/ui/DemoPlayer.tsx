"use client";

import { Play, Square, TriangleAlert } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { MessageKey } from "@/lib/i18n";
import { motionTokens } from "@/lib/motion-tokens";
import { DEMO_STEPS, scrubPath } from "@/lib/state/demo";
import { getSnapshot, updateState } from "@/lib/state/store";
import { useT } from "@/lib/state/useAppState";
import { LogoMark } from "./Logo";

const FRAME_MS = 40;
const sleep = (ms: number) => new Promise((r) => window.setTimeout(r, ms));
const { duration, easing, distance } = motionTokens;

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
        className="btn btn-ghost min-h-10 min-w-10 px-2.5 aria-pressed:text-red sm:px-3"
      >
        {active ? <Square size={13} strokeWidth={2.25} fill="currentColor" /> : <Play size={13} strokeWidth={2.25} fill="currentColor" />}
        <span className="sr-only sm:not-sr-only">{active ? t("demo.stop") : t("demo.start")}</span>
      </button>
      <AnimatePresence mode="wait">
        {active && caption !== "demo.end" && (
          <motion.div
            key={caption}
            initial={{ opacity: 0, y: distance.md, filter: "blur(4px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, transition: { duration: duration.fast } }}
            transition={{ duration: duration.normal, ease: easing.smooth }}
            role="status"
            data-testid="demo-caption"
            className="pointer-events-none fixed inset-x-4 bottom-6 z-50 mx-auto w-fit max-w-3xl rounded-xl border border-line-strong bg-panel/90 px-5 py-3 text-center text-base font-medium shadow-[0_12px_40px_rgb(0_0_0/0.55)] backdrop-blur-md"
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
            transition={{ duration: duration.normal, ease: easing.smooth }}
            role="status"
            data-testid="demo-caption"
            className="fixed inset-0 z-50 grid place-items-center bg-bg/95 px-4 backdrop-blur"
          >
            <div className="space-y-4 text-center">
              <p className="flex items-center justify-center gap-3 text-5xl font-semibold tracking-tight">
                <LogoMark size={44} />
                {t("app.name")}
              </p>
              <p className="text-xl text-muted">{t("demo.end")}</p>
              <p className="flex items-center justify-center gap-2 text-sm text-muted">
                <TriangleAlert size={14} strokeWidth={2.25} className="text-amber" />
                {t("disclaimer")}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
