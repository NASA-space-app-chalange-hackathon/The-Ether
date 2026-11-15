"use client";

import { Camera, Heart, Lock, RotateCcw, TriangleAlert } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { THEME } from "@/components/ui/theme";
import { estimateHeartRate, liveWaveform, MIN_QUALITY, type HeartRateEstimate, type Sample } from "@/lib/engine/rppg";
import { useT } from "@/lib/state/useAppState";

declare global {
  interface Window {
    /** e2e hook: shorten the 30 s measurement. */
    __ETHER_RPPG_SECONDS__?: number;
  }
}

type Phase = "idle" | "starting" | "measuring" | "result" | "denied" | "unavailable";

const DEFAULT_SECONDS = 30;
/** Region of interest: forehead band of a centred face (fractions of the frame). */
const ROI = { x: 0.38, y: 0.18, w: 0.24, h: 0.14 };
const GUIDE = { x: 0.3, y: 0.08, w: 0.4, h: 0.62 };

function Waveform({ points }: { points: number[] }) {
  if (points.length < 2) return <div className="h-16" />;
  const max = Math.max(...points.map(Math.abs)) || 1;
  const d = points.map((v, i) => `${(i / (points.length - 1)) * 300},${32 - (v / max) * 28}`).join(" ");
  return (
    <svg viewBox="0 0 300 64" className="h-16 w-full" aria-hidden data-testid="rppg-waveform">
      <polyline points={d} fill="none" stroke={THEME.red} strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

export function CameraHeartRate({ onResult }: { onResult: (bpm: number, quality: number) => void }) {
  const t = useT();
  const [phase, setPhase] = useState<Phase>("idle");
  const [remaining, setRemaining] = useState(DEFAULT_SECONDS);
  const [wave, setWave] = useState<number[]>([]);
  const [live, setLive] = useState<number | null>(null);
  const [estimate, setEstimate] = useState<HeartRateEstimate | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const samples = useRef<Sample[]>([]);
  const raf = useRef<number | undefined>(undefined);
  const uiTimer = useRef<number | undefined>(undefined);

  const stop = () => {
    if (raf.current !== undefined) cancelAnimationFrame(raf.current);
    window.clearInterval(uiTimer.current);
    streamRef.current?.getTracks().forEach((tr) => tr.stop());
    streamRef.current = null;
  };
  useEffect(() => () => stop(), []);

  const start = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setPhase("unavailable");
      return;
    }
    setPhase("starting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } }, audio: false });
      streamRef.current = stream;
      const video = videoRef.current;
      if (!video) throw new Error("no video element");
      video.srcObject = stream;
      await video.play();
      measure(video);
    } catch (err) {
      stop();
      const name = err instanceof DOMException ? err.name : "";
      setPhase(name === "NotAllowedError" || name === "SecurityError" ? "denied" : "unavailable");
    }
  };

  const measure = (video: HTMLVideoElement) => {
    const seconds = window.__ETHER_RPPG_SECONDS__ ?? DEFAULT_SECONDS;
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) {
      setPhase("unavailable");
      stop();
      return;
    }
    samples.current = [];
    const t0 = performance.now();
    setPhase("measuring");
    setRemaining(seconds);
    setEstimate(null);
    setLive(null);

    const frame = () => {
      const w = video.videoWidth;
      const h = video.videoHeight;
      if (w && h) {
        const sx = Math.round(ROI.x * w);
        const sy = Math.round(ROI.y * h);
        const sw = Math.max(1, Math.round(ROI.w * w));
        const sh = Math.max(1, Math.round(ROI.h * h));
        canvas.width = sw;
        canvas.height = sh;
        ctx.drawImage(video, sx, sy, sw, sh, 0, 0, sw, sh);
        const px = ctx.getImageData(0, 0, sw, sh).data;
        let g = 0;
        for (let i = 1; i < px.length; i += 4) g += px[i];
        samples.current.push({ t: performance.now(), g: g / (px.length / 4) }); // only the mean is kept — no frames stored
      }
      raf.current = requestAnimationFrame(frame);
    };
    raf.current = requestAnimationFrame(frame);

    uiTimer.current = window.setInterval(() => {
      const elapsed = (performance.now() - t0) / 1000;
      setRemaining(Math.max(0, Math.ceil(seconds - elapsed)));
      setWave(liveWaveform(samples.current));
      if (elapsed > 10) setLive(estimateHeartRate(samples.current).bpm);
      if (elapsed >= seconds) {
        stop();
        setEstimate(estimateHeartRate(samples.current));
        setPhase("result");
      }
    }, 250);
  };

  const good = estimate !== null && estimate.bpm !== null && estimate.quality >= MIN_QUALITY;

  return (
    <div className="space-y-4 rounded-xl border border-line bg-panel-2/40 p-4 sm:p-5" data-testid="camera-hr">
      <div className="relative mx-auto aspect-[4/3] w-full max-w-sm overflow-hidden rounded-lg bg-bg outline outline-1 -outline-offset-1 outline-white/10" hidden={phase !== "starting" && phase !== "measuring"}>
        <video ref={videoRef} muted playsInline className="h-full w-full -scale-x-100 object-cover" />
        <div
          aria-hidden
          className="absolute rounded-[45%] border-[1.5px] border-dashed border-white/50"
          style={{ left: `${GUIDE.x * 100}%`, top: `${GUIDE.y * 100}%`, width: `${GUIDE.w * 100}%`, height: `${GUIDE.h * 100}%` }}
        />
        <div aria-hidden className="absolute rounded-sm border-[1.5px] border-red/80" style={{ left: `${ROI.x * 100}%`, top: `${ROI.y * 100}%`, width: `${ROI.w * 100}%`, height: `${ROI.h * 100}%` }} />
      </div>

      {phase === "idle" && (
        <>
          <p className="flex items-start gap-2.5 text-sm text-fg/90">
            <Camera size={16} strokeWidth={2} className="mt-0.5 shrink-0 text-muted" />
            {t("camera.intro")}
          </p>
          <button type="button" onClick={start} className="btn btn-primary">
            <Camera size={14} strokeWidth={2} />
            {t("camera.start")}
          </button>
        </>
      )}
      {phase === "starting" && <p className="text-sm text-muted">{t("camera.starting")}</p>}
      {phase === "measuring" && (
        <div className="space-y-1" aria-live="polite">
          <p className="text-sm">{t("camera.hold")}</p>
          <Waveform points={wave} />
          <p className="flex justify-between font-mono text-sm">
            <span className="flex items-center gap-1.5">
              <Heart size={13} className="text-red motion-safe:animate-pulse" fill="currentColor" />
              {live ? `~${live} bpm` : "…"}
            </span>
            <span data-testid="camera-remaining">{t("camera.remaining", { s: remaining })}</span>
          </p>
        </div>
      )}
      {phase === "result" && estimate && (
        <div className="space-y-2" data-testid="camera-result">
          {good ? (
            <>
              <p className="flex items-baseline gap-2 font-mono text-4xl font-medium tracking-tight text-fg">
                <Heart size={22} className="self-center text-red" fill="currentColor" />
                {estimate.bpm} <span className="text-base text-muted">bpm</span>
              </p>
              <p className="text-xs text-muted">{t("camera.quality", { q: Math.round(estimate.quality * 100) })}</p>
              <button type="button" onClick={() => onResult(estimate.bpm!, estimate.quality)} className="btn btn-primary">
                {t("camera.use")}
              </button>
            </>
          ) : (
            <p className="flex items-center gap-2 text-sm text-amber">
              <TriangleAlert size={14} strokeWidth={2.25} />
              {t("camera.lowQuality")}
            </p>
          )}
          <button type="button" onClick={start} className="btn btn-ghost">
            <RotateCcw size={14} />
            {t("camera.retry")}
          </button>
        </div>
      )}
      {phase === "denied" && (
        <p role="alert" className="flex items-center gap-2 text-sm text-amber">
          <TriangleAlert size={14} strokeWidth={2.25} className="shrink-0" />
          {t("camera.denied")}
        </p>
      )}
      {phase === "unavailable" && (
        <p role="alert" className="flex items-center gap-2 text-sm text-amber">
          <TriangleAlert size={14} strokeWidth={2.25} className="shrink-0" />
          {t("camera.unavailable")}
        </p>
      )}
      <p className="flex items-center gap-2 text-xs text-muted">
        <Lock size={12} strokeWidth={2} className="shrink-0" />
        {t("camera.privacy")}
      </p>
    </div>
  );
}
