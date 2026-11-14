"use client";

import { useEffect, useState } from "react";
import { formatDelay, signalDelay } from "@/lib/engine/signal";
import { useMission } from "@/lib/state/DataProvider";
import { getSnapshot } from "@/lib/state/store";
import { useAppState, useT } from "@/lib/state/useAppState";

const PLAY_INTERVAL_MS = 140;

/** The hero control: scrub the whole UI through the mission, day 0 → end. */
export function MissionClock() {
  const t = useT();
  const { day, setDay, mode, environment } = useAppState();
  const { status, events, maxDay } = useMission();
  const [playing, setPlaying] = useState(false);
  const current = Math.min(day, maxDay);

  useEffect(() => {
    if (!playing) return;
    const id = window.setInterval(() => {
      const now = getSnapshot().day[mode];
      if (now >= maxDay) setPlaying(false);
      else setDay(now + 1);
    }, PLAY_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [playing, maxDay, mode, setDay]);

  if (status === "error") {
    return (
      <div role="alert" className="border-b border-line bg-red/10 px-4 py-3 text-center text-sm text-red">
        {t("data.error")}
      </div>
    );
  }
  if (status === "loading") {
    return (
      <div className="border-b border-line bg-panel/80 px-4 py-3" aria-busy="true">
        <p className="mx-auto max-w-6xl text-sm text-muted">{t("data.loading")}</p>
      </div>
    );
  }

  const delay = signalDelay(environment, current);
  const step = (delta: number) => setDay(Math.min(maxDay, Math.max(0, current + delta)));
  const pct = (d: number) => (maxDay === 0 ? 0 : (d / maxDay) * 100);

  return (
    <div className="sticky top-0 z-30 border-b border-line bg-panel/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2">
        <div className="flex items-center gap-1">
          <ClockButton label={t("clock.prev")} onClick={() => step(-1)}>◀</ClockButton>
          <ClockButton
            label={playing ? t("clock.pause") : t("clock.play")}
            onClick={() => {
              if (!playing && current >= maxDay) setDay(0);
              setPlaying((p) => !p);
            }}
            pressed={playing}
          >
            {playing ? "❚❚" : "▶"}
          </ClockButton>
          <ClockButton label={t("clock.next")} onClick={() => step(1)}>▶▏</ClockButton>
        </div>

        <output className="min-w-28 font-mono text-lg tabular-nums" aria-live="polite" data-testid="clock-day">
          {t("clock.dayOf", { day: current, max: maxDay })}
        </output>

        <div className="relative min-w-60 flex-1 pt-5">
          <ul aria-label={t("clock.events")} className="absolute inset-x-2 top-0 h-5">
            {events.map((e) => (
              <li key={`${e.day}-${e.kind}`} className="absolute -translate-x-1/2" style={{ left: `${pct(e.day)}%` }}>
                <button
                  type="button"
                  onClick={() => setDay(e.day)}
                  title={`${t("clock.dayOf", { day: e.day, max: maxDay })} — ${e.label}`}
                  aria-label={t("clock.jump", { day: e.day, label: e.label })}
                  className={`grid h-5 w-6 place-items-center rounded text-sm leading-none transition-transform hover:scale-125 focus-visible:outline-2 focus-visible:outline-accent ${
                    current >= e.day ? "opacity-100" : "opacity-50"
                  }`}
                >
                  <span aria-hidden>{e.icon}</span>
                </button>
              </li>
            ))}
          </ul>
          <input
            type="range"
            min={0}
            max={maxDay}
            step={1}
            value={current}
            onChange={(ev) => setDay(Number(ev.target.value))}
            aria-label={t("clock.label")}
            aria-valuetext={t("clock.dayOf", { day: current, max: maxDay })}
            className="h-8 w-full cursor-pointer accent-accent"
          />
        </div>

        {mode === "space" && (
          <p className="flex items-baseline gap-2 text-sm" data-testid="signal-delay">
            <span aria-hidden>📡</span>
            <span className="text-muted">{t("signal.label")}</span>
            <span className="font-mono tabular-nums text-fg">{formatDelay(delay.oneWaySeconds)}</span>
            <span className="text-xs text-muted">({t("signal.approx")})</span>
          </p>
        )}
      </div>
    </div>
  );
}

function ClockButton({
  label,
  onClick,
  pressed,
  children,
}: {
  label: string;
  onClick: () => void;
  pressed?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={pressed}
      title={label}
      className="grid h-11 w-11 place-items-center rounded-lg border border-line bg-panel-2 text-sm text-fg transition-colors hover:border-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent aria-pressed:border-accent aria-pressed:text-accent"
    >
      <span aria-hidden>{children}</span>
    </button>
  );
}
