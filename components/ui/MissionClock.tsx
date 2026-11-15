"use client";

import { ChevronLeft, ChevronRight, Pause, Play, RadioTower } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import type { MissionEvent } from "@/lib/data/dataset";
import { formatDelay } from "@/lib/engine/signal";
import type { MessageKey } from "@/lib/i18n";
import { useMission } from "@/lib/state/DataProvider";
import { useSignalDelay } from "@/lib/state/NasaProvider";
import { getSnapshot } from "@/lib/state/store";
import { useAppState, useT } from "@/lib/state/useAppState";
import { useLabels } from "@/lib/state/useLabels";
import { EVENT_ICON } from "./icons";
import { Term } from "./Term";

const PLAY_INTERVAL_MS = 140;
/** Half the slider thumb width: the thumb's centre travels from THUMB_R to (width − THUMB_R). */
const THUMB_R = 7;
/** Events closer than this many days share one marker, so icons never overlap. */
const CLUSTER_DAYS = 4;

/** Group events that sit within CLUSTER_DAYS of the first event in the group. */
export function clusterEvents(events: readonly MissionEvent[]): MissionEvent[][] {
  const groups: MissionEvent[][] = [];
  for (const e of [...events].sort((a, b) => a.day - b.day)) {
    const last = groups[groups.length - 1];
    if (last && e.day - last[0].day < CLUSTER_DAYS) last.push(e);
    else groups.push([e]);
  }
  return groups;
}

/** The hero control: scrub the whole UI through the mission, day 0 → end. */
export function MissionClock() {
  const t = useT();
  const labels = useLabels();
  const { day, setDay, mode } = useAppState();
  const { status, events, maxDay } = useMission();
  const [playing, setPlaying] = useState(false);
  const current = Math.min(day, maxDay);
  const signalDelay = useSignalDelay(current);

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
      <div role="alert" className="border-b border-red/30 bg-red/10 px-4 py-3 text-center text-sm text-red">
        {t("data.error")}
      </div>
    );
  }
  if (status === "loading") {
    return (
      <div className="border-b border-line bg-bg px-4 py-3.5" aria-busy="true">
        <p className="mx-auto flex max-w-6xl items-center gap-2 text-sm text-muted">
          <span aria-hidden className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" />
          {t("data.loading")}
        </p>
      </div>
    );
  }

  const delay = signalDelay;
  const step = (delta: number) => setDay(Math.min(maxDay, Math.max(0, current + delta)));
  const pct = (d: number) => (maxDay === 0 ? 0 : (d / maxDay) * 100);

  return (
    <div className="sticky top-0 z-30 border-b border-line bg-bg/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-5 gap-y-2 px-4 py-2">
        <div className="flex items-center gap-1">
          <ClockButton label={t("clock.prev")} onClick={() => step(-1)}>
            <ChevronLeft size={16} strokeWidth={2} />
          </ClockButton>
          <ClockButton
            label={playing ? t("clock.pause") : t("clock.play")}
            onClick={() => {
              if (!playing && current >= maxDay) setDay(0);
              setPlaying((p) => !p);
            }}
            pressed={playing}
          >
            {playing ? <Pause size={14} strokeWidth={2.25} fill="currentColor" /> : <Play size={14} strokeWidth={2.25} fill="currentColor" className="translate-x-px" />}
          </ClockButton>
          <ClockButton label={t("clock.next")} onClick={() => step(1)}>
            <ChevronRight size={16} strokeWidth={2} />
          </ClockButton>
        </div>

        <div className="min-w-28">
          <output className="block font-mono text-sm text-fg" aria-live="polite" data-testid="clock-day">
            {t("clock.dayOf", { day: current, max: maxDay })}
          </output>
          <p className="text-[11px] leading-tight text-muted" id="clock-help" data-testid="clock-help">
            {t(`clock.timeline.${mode}`)}
          </p>
        </div>

        <div className="relative min-w-60 flex-1 pt-6">
          <ul aria-label={t("clock.events")} className="absolute top-0 h-6" style={{ left: THUMB_R, right: THUMB_R }}>
            {clusterEvents(events).map((group) => {
              const e = group[0];
              const Icon = EVENT_ICON[mode][e.kind];
              const passed = current >= e.day;
              const label = group.map((x) => (group.length > 1 ? `${t("clock.dayShort", { day: x.day })}: ` : "") + labels.event(x)).join("; ");
              return (
                <li key={`${e.day}-${e.kind}`} className="group absolute -translate-x-1/2" style={{ left: `${pct(e.day)}%` }}>
                  <button
                    type="button"
                    onClick={() => setDay(e.day)}
                    title={`${t("clock.dayOf", { day: e.day, max: maxDay })} — ${label}`}
                    aria-label={t("clock.jump", { day: e.day, label })}
                    data-real={e.real ? e.real.source : undefined}
                    className={`grid h-6 w-6 place-items-center rounded-md transition-[color,background-color,transform] duration-150 hover:-translate-y-px hover:bg-panel-2 hover:text-fg ${
                      passed ? "text-fg" : "text-muted/70"
                    }`}
                  >
                    <Icon size={13} strokeWidth={2} />
                  </button>
                  {/* Visible label on hover / keyboard focus (the title attribute is slow and absent on touch). */}
                  <span
                    aria-hidden
                    className="pointer-events-none absolute left-1/2 top-full z-40 mt-7 hidden w-max max-w-64 -translate-x-1/2 rounded-md border border-line-strong bg-panel-2 px-2 py-1 text-[11px] leading-snug text-fg shadow-[0_8px_24px_rgb(0_0_0/0.45)] group-focus-within:block group-hover:block"
                  >
                    {t("clock.dayShort", { day: e.day })} · {label}
                  </span>
                </li>
              );
            })}
          </ul>
          <input
            type="range"
            min={0}
            max={maxDay}
            step={1}
            value={current}
            onChange={(ev) => setDay(Number(ev.target.value))}
            aria-label={t("clock.label")}
            aria-describedby="clock-help"
            aria-valuetext={t("clock.dayOf", { day: current, max: maxDay })}
            className="range block"
            style={{ ["--pct" as string]: `${pct(current)}%` }}
          />
        </div>

        {mode === "space" && (
          <p className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm" data-testid="signal-delay">
            <RadioTower size={14} strokeWidth={2} className="shrink-0 text-muted" />
            <Term id="signal" className="whitespace-nowrap text-muted">{t("signal.label")}</Term>
            <span className="whitespace-nowrap font-mono text-fg">{formatDelay(delay.oneWaySeconds)}</span>
            <span className="text-xs text-muted">({t(`signal.src.${delay.source}` as MessageKey)})</span>
          </p>
        )}
      </div>
    </div>
  );
}

function ClockButton({ label, onClick, pressed, children }: { label: string; onClick: () => void; pressed?: boolean; children: ReactNode }) {
  return (
    <button type="button" onClick={onClick} aria-label={label} aria-pressed={pressed} title={label} className="icon-btn">
      {children}
    </button>
  );
}
