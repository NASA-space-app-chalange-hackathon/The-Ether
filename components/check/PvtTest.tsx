"use client";

import { Play, RotateCcw } from "lucide-react";
import { useEffect, useEffectEvent, useRef, useState } from "react";
import { Segmented } from "@/components/ui/Segmented";
import { GAP_MAX_MS, GAP_MIN_MS, nextGap, scorePvt, TIMEOUT_MS, type PvtResult, type PvtTrial } from "@/lib/engine/pvt";
import { useT } from "@/lib/state/useAppState";

type Phase = "ready" | "wait" | "stimulus" | "done";

const FULL_MS = 60_000;
/** Demo-only short run (labelled in the UI); gaps shortened so it still yields several trials. */
const QUICK_MS = 15_000;
const QUICK_GAP: [number, number] = [1000, 3500];

export function PvtTest({ onResult }: { onResult: (r: PvtResult | null) => void }) {
  const t = useT();
  const [quick, setQuick] = useState(false);
  const [phase, setPhase] = useState<Phase>("ready");
  const [counter, setCounter] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [falseStart, setFalseStart] = useState(false);
  const [result, setResult] = useState<PvtResult | null>(null);

  const phaseRef = useRef<Phase>("ready");
  const trials = useRef<PvtTrial[]>([]);
  const startedAt = useRef(0);
  const stimAt = useRef(0);
  const timer = useRef<number | undefined>(undefined);
  const raf = useRef<number | undefined>(undefined);
  const config = useRef({ duration: FULL_MS, gap: [GAP_MIN_MS, GAP_MAX_MS] as [number, number] });

  const go = (p: Phase) => {
    phaseRef.current = p;
    setPhase(p);
  };
  const clearTimers = () => {
    window.clearTimeout(timer.current);
    if (raf.current !== undefined) cancelAnimationFrame(raf.current);
  };

  const finish = () => {
    clearTimers();
    const r = scorePvt(trials.current);
    setResult(r);
    go("done");
    onResult(r.validTrials >= 3 ? r : null);
  };

  const showStimulus = () => {
    stimAt.current = performance.now();
    go("stimulus");
    const tick = () => {
      setCounter(performance.now() - stimAt.current);
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    timer.current = window.setTimeout(() => {
      if (raf.current !== undefined) cancelAnimationFrame(raf.current);
      trials.current.push({ kind: "timeout" });
      scheduleNext();
    }, TIMEOUT_MS);
  };

  function scheduleNext() {
    if (performance.now() - startedAt.current >= config.current.duration) {
      finish();
      return;
    }
    go("wait");
    const [min, max] = config.current.gap;
    timer.current = window.setTimeout(showStimulus, nextGap(Math.random, min, max));
  }

  const start = () => {
    config.current = quick ? { duration: QUICK_MS, gap: QUICK_GAP } : { duration: FULL_MS, gap: [GAP_MIN_MS, GAP_MAX_MS] };
    trials.current = [];
    startedAt.current = performance.now();
    setResult(null);
    setFalseStart(false);
    setElapsed(0);
    onResult(null);
    scheduleNext();
  };

  const respond = () => {
    if (phaseRef.current === "wait") {
      clearTimers();
      trials.current.push({ kind: "false-start" });
      setFalseStart(true);
      scheduleNext();
    } else if (phaseRef.current === "stimulus") {
      const rt = performance.now() - stimAt.current;
      clearTimers();
      trials.current.push({ kind: "response", rtMs: rt });
      setCounter(rt);
      setFalseStart(false);
      scheduleNext();
    }
  };

  const running = phase === "wait" || phase === "stimulus";
  const onKey = useEffectEvent((e: KeyboardEvent) => {
    if (e.code === "Space") {
      e.preventDefault();
      respond();
    }
  });
  useEffect(() => {
    if (!running) return;
    const tickId = window.setInterval(() => setElapsed(performance.now() - startedAt.current), 250);
    window.addEventListener("keydown", onKey);
    return () => {
      window.clearInterval(tickId);
      window.removeEventListener("keydown", onKey);
    };
  }, [running]);
  useEffect(() => () => clearTimers(), []);

  if (phase === "ready" || phase === "done") {
    return (
      <div className="space-y-3">
        <p className="text-sm text-fg/90">{t("check.pvt.instructions")}</p>
        <Segmented
          label={t("check.pvt.duration")}
          value={quick}
          onChange={setQuick}
          options={[
            { value: false, label: t("check.pvt.full") },
            { value: true, label: t("check.pvt.quick") },
          ]}
        />
        {result && (
          <p className="rounded-lg border border-line bg-panel-2/50 p-3 font-mono text-sm" data-testid="pvt-result">
            {result.validTrials >= 3
              ? t("check.pvt.result", { rt: result.meanRT ?? "—", lapses: result.lapses, falseStarts: result.falseStarts })
              : t("check.pvt.tooFew")}
          </p>
        )}
        <button type="button" onClick={start} className="btn btn-primary">
          {result ? <RotateCcw size={14} /> : <Play size={13} fill="currentColor" />}
          {result ? t("check.pvt.redo") : t("check.pvt.start")}
        </button>
      </div>
    );
  }

  const remaining = Math.max(0, Math.ceil((config.current.duration - elapsed) / 1000));
  return (
    <div className="space-y-2">
      <button
        type="button"
        onPointerDown={respond}
        data-testid={phase === "stimulus" ? "pvt-stimulus" : "pvt-wait"}
        className={`grid h-56 w-full touch-manipulation select-none place-items-center rounded-xl border text-center transition-colors duration-75 ${
          phase === "stimulus" ? "border-amber/60 bg-amber/10" : "border-line bg-panel-2/40"
        }`}
      >
        {phase === "stimulus" ? (
          <span>
            <span className="block font-mono text-6xl font-medium tracking-tight text-amber">{Math.round(counter)}</span>
            <span className="text-sm font-medium">{t("check.pvt.tap")}</span>
          </span>
        ) : (
          <span className="text-lg text-muted">{falseStart ? t("check.pvt.falseStart") : t("check.pvt.wait")}</span>
        )}
      </button>
      <p className="text-right font-mono text-xs text-muted" aria-live="off">{t("check.pvt.remaining", { s: remaining })}</p>
    </div>
  );
}
