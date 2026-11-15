"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { CrewSwitcher } from "@/components/home/CrewSwitcher";
import { StatusBadge } from "@/components/ui/Badges";
import { draftToReadings, inBounds, INPUT_BOUNDS, type CheckInDraft } from "@/lib/data/checkin";
import { dayToTimestamp } from "@/lib/data/dataset";
import { getDB } from "@/lib/db/schema";
import { INDICATORS } from "@/lib/engine/indicators";
import { SOURCES } from "@/lib/engine/sources";
import type { IndicatorId, Source } from "@/lib/engine/types";
import type { MessageKey } from "@/lib/i18n";
import { useAssessment, useMission } from "@/lib/state/DataProvider";
import { useAppState, useT } from "@/lib/state/useAppState";
import { useLabels } from "@/lib/state/useLabels";
import { CameraHeartRate } from "./CameraHeartRate";
import { PvtTest } from "./PvtTest";

type StepId = "hr" | "pvt" | "vitals" | "sleep" | "mood" | "review";
const STEPS: StepId[] = ["hr", "pvt", "vitals", "sleep", "mood", "review"];

const WHY: Record<Exclude<StepId, "review">, { key: MessageKey; sources: Source[] }> = {
  hr: { key: "check.hr.why", sources: [SOURCES.riskCardio, SOURCES.verkruysse2008] },
  pvt: { key: "check.pvt.why", sources: [SOURCES.basnerPvt, SOURCES.nasaBodyInSpace, SOURCES.riskSleep] },
  vitals: { key: "check.vitals.why", sources: [SOURCES.riskCardio, SOURCES.accAha2017, SOURCES.riskHypoxia, SOURCES.whoPulseOx, SOURCES.riskImmune, SOURCES.cdcFever, SOURCES.riskNutrition, SOURCES.adaHypoglycemia] },
  sleep: { key: "check.sleep.why", sources: [SOURCES.riskSleep] },
  mood: { key: "check.mood.why", sources: [SOURCES.riskBehavioral, SOURCES.riskTeamwork, SOURCES.hrpHazards] },
};

const FACES = ["😫", "🙁", "😐", "🙂", "😄"];

function Why({ step }: { step: Exclude<StepId, "review"> }) {
  const t = useT();
  const w = WHY[step];
  return (
    <details className="group rounded-lg border border-line bg-panel-2 p-3 text-sm">
      <summary className="flex min-h-8 cursor-pointer items-center gap-2 font-semibold text-accent">ⓘ {t("check.why")}</summary>
      <p className="mt-2 leading-relaxed">{t(w.key)}</p>
      <ul className="mt-2 space-y-1">
        {w.sources.map((s) => (
          <li key={s.id}>
            <a href={s.url} target="_blank" rel="noreferrer" className="text-xs text-accent hover:underline">{s.title} ↗</a>
          </li>
        ))}
      </ul>
    </details>
  );
}

function NumberField({ id, label, unit, value, onChange, step = 1, optional }: {
  id: IndicatorId; label: string; unit: string; value: number | undefined; onChange: (v: number | undefined) => void; step?: number; optional?: boolean;
}) {
  const t = useT();
  const [min, max] = INPUT_BOUNDS[id] ?? [0, 1000];
  const valid = inBounds(id, value);
  return (
    <label className="block space-y-1">
      <span className="text-sm">
        {label} {optional && <span className="text-xs text-muted">({t("check.optional")})</span>}
      </span>
      <span className="flex items-center gap-2">
        <input
          type="number"
          inputMode="decimal"
          step={step}
          min={min}
          max={max}
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value === "" ? undefined : Number(e.target.value))}
          aria-invalid={!valid}
          className="min-h-11 w-32 rounded-lg border border-line bg-bg px-3 font-mono text-lg tabular-nums focus:border-accent focus:outline-none aria-invalid:border-red"
        />
        <span className="text-sm text-muted">{unit}</span>
      </span>
      {!valid && <span className="block text-xs text-red">{t("check.invalid", { min, max })}</span>}
    </label>
  );
}

function Scale({ label, value, onChange, faces }: { label: string; value: number | undefined; onChange: (v: number) => void; faces?: boolean }) {
  const t = useT();
  return (
    <fieldset className="space-y-2">
      <legend className="text-sm">{label}</legend>
      <div className="flex flex-wrap gap-2">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            aria-pressed={value === n}
            onClick={() => onChange(n)}
            className="flex min-h-14 min-w-20 flex-col items-center justify-center rounded-lg border border-line px-2 text-xs aria-pressed:border-accent aria-pressed:bg-accent/15"
          >
            {faces && <span aria-hidden className="text-2xl">{FACES[n - 1]}</span>}
            <span>{n} · {t(`scale.${n}` as MessageKey)}</span>
          </button>
        ))}
      </div>
    </fieldset>
  );
}

export function CheckScreen() {
  const t = useT();
  const labels = useLabels();
  const { memberId, day, mode } = useAppState();
  const { dataset, members, maxDay } = useMission();
  const assessment = useAssessment();
  const [step, setStep] = useState<StepId>("hr");
  const [draft, setDraft] = useState<CheckInDraft>({});
  const [saved, setSaved] = useState(false);
  const member = members.find((m) => m.id === memberId);
  const current = Math.min(day, maxDay);
  const set = (patch: Partial<CheckInDraft>) => setDraft((d) => ({ ...d, ...patch }));
  const idx = STEPS.indexOf(step);
  const readings = draftToReadings(draft, memberId, current, dataset ? dayToTimestamp(dataset.startDate, current) : "");
  const hasInvalid = (Object.keys(INPUT_BOUNDS) as IndicatorId[]).some((id) => !inBounds(id, draft[id as keyof CheckInDraft] as number | undefined));

  const save = async () => {
    if (!dataset || readings.length === 0) return;
    const now = new Date().toISOString();
    await getDB().readings.bulkAdd(readings.map((r) => ({ ...r, timestamp: now })));
    if (draft.note) await getDB().meta.put({ key: `note:${memberId}:${current}`, value: draft.note });
    setSaved(true);
  };

  const body: Record<StepId, ReactNode> = {
    hr: (
      <div className="space-y-3">
        <CameraHeartRate onResult={(bpm, quality) => set({ heartRate: bpm, heartRateSource: "camera", heartRateQuality: quality })} />
        {draft.heartRateSource === "camera" && draft.heartRate !== undefined && (
          <p className="text-sm text-ok" data-testid="camera-recorded">✓ {t("camera.recorded", { bpm: draft.heartRate, q: Math.round((draft.heartRateQuality ?? 0) * 100) })}</p>
        )}
        <NumberField id="heartRate" label={t("check.hr.manual")} unit="bpm" value={draft.heartRate} onChange={(v) => set({ heartRate: v, heartRateSource: "manual" })} />
      </div>
    ),
    pvt: <PvtTest onResult={(r) => set({ pvt: r })} />,
    vitals: (
      <div className="grid gap-4 sm:grid-cols-2">
        <NumberField id="systolicBP" label={t("check.sys")} unit="mmHg" value={draft.systolicBP} onChange={(v) => set({ systolicBP: v })} />
        <NumberField id="diastolicBP" label={t("check.dia")} unit="mmHg" value={draft.diastolicBP} onChange={(v) => set({ diastolicBP: v })} />
        <NumberField id="glucose" label={t("check.glucose")} unit="mg/dL" value={draft.glucose} onChange={(v) => set({ glucose: v })} />
        <NumberField id="temperature" label={t("check.temp")} unit="°C" step={0.1} value={draft.temperature} onChange={(v) => set({ temperature: v })} />
        <NumberField id="spo2" label={t("check.spo2")} unit="%" value={draft.spo2} onChange={(v) => set({ spo2: v })} optional />
        <NumberField id="bodyMass" label={t("check.mass")} unit="kg" step={0.1} value={draft.bodyMass} onChange={(v) => set({ bodyMass: v })} optional />
        {mode === "steppe" && (
          <NumberField id="coldExposure" label={t("check.cold")} unit="h" step={0.5} value={draft.coldExposure} onChange={(v) => set({ coldExposure: v })} optional />
        )}
      </div>
    ),
    sleep: (
      <div className="space-y-4">
        <NumberField id="sleepHours" label={t("check.sleepHours")} unit="h" step={0.5} value={draft.sleepHours} onChange={(v) => set({ sleepHours: v })} />
        <Scale label={t("check.sleepQuality")} value={draft.sleepQuality} onChange={(v) => set({ sleepQuality: v })} />
      </div>
    ),
    mood: (
      <div className="space-y-5">
        <Scale label={t("check.mood")} value={draft.mood} onChange={(v) => set({ mood: v })} faces />
        <Scale label={t(mode === "steppe" ? "check.crewPulseSteppe" : "check.crewPulse")} value={draft.crewPulse} onChange={(v) => set({ crewPulse: v })} />
        <label className="block space-y-1">
          <span className="text-sm">{t("check.note")}</span>
          <textarea value={draft.note ?? ""} onChange={(e) => set({ note: e.target.value })} rows={2} className="w-full rounded-lg border border-line bg-bg p-2 text-sm focus:border-accent focus:outline-none" />
        </label>
      </div>
    ),
    review: (
      <div className="space-y-3" data-testid="check-review">
        {readings.length === 0 ? (
          <p className="text-muted">{t("check.nothing")}</p>
        ) : (
          <ul className="divide-y divide-line rounded-lg border border-line font-mono text-sm">
            {readings.map((r) => (
              <li key={r.indicator} className="flex justify-between px-3 py-1.5">
                <span className="font-sans">{labels.indicator(r.indicator)}</span>
                <span className="tabular-nums">{r.value} {INDICATORS[r.indicator].unit}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    ),
  };

  if (saved) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">{t("nav.check")}</h1>
        <div className="space-y-3 rounded-xl border border-ok/40 bg-ok/10 p-5" data-testid="check-saved">
          <p className="font-semibold text-ok">✓ {t("check.saved")}</p>
          {assessment && <StatusBadge status={assessment.overall} size="lg" />}
          <div className="flex flex-wrap gap-3 text-sm">
            <Link href="/" className="text-accent hover:underline">{t("nav.home")} →</Link>
            <Link href="/body" className="text-accent hover:underline">{t("nav.body")} →</Link>
            <Link href="/trends" className="text-accent hover:underline">{t("nav.trends")} →</Link>
            <Link href="/alerts" className="text-accent hover:underline">{t("nav.alerts")} →</Link>
          </div>
          <button type="button" onClick={() => { setDraft({}); setSaved(false); setStep("hr"); }} className="min-h-11 rounded-lg border border-line px-4 text-sm">
            {t("check.again")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">{t("nav.check")}</h1>
          <p className="text-sm text-muted">{t("check.intro")}</p>
          {member && <p className="font-mono text-xs text-accent">{t("check.savingFor", { member: labels.memberName(member), day: current })}</p>}
        </div>
        <CrewSwitcher />
      </div>

      <nav aria-label={t("check.steps")}>
        <ol className="flex flex-wrap gap-1.5">
          {STEPS.map((s, i) => (
            <li key={s}>
              <button
                type="button"
                onClick={() => setStep(s)}
                aria-current={s === step ? "step" : undefined}
                className={`flex min-h-10 items-center gap-2 rounded-full border px-3 text-sm ${s === step ? "border-accent bg-accent/15 text-accent" : i < idx ? "border-line text-fg" : "border-line text-muted"}`}
              >
                <span className="font-mono text-xs">{i + 1}</span>
                {t(`check.step.${s}` as MessageKey)}
              </button>
            </li>
          ))}
        </ol>
      </nav>

      <section className="space-y-4 rounded-xl border border-line bg-panel p-5" aria-labelledby="step-title">
        <h2 id="step-title" className="text-lg font-semibold">{t(`check.step.${step}` as MessageKey)}</h2>
        {step !== "review" && <Why step={step} />}
        {body[step]}
      </section>

      <div className="flex flex-wrap gap-2">
        {idx > 0 && (
          <button type="button" onClick={() => setStep(STEPS[idx - 1])} className="min-h-11 rounded-lg border border-line px-4">← {t("check.back")}</button>
        )}
        {step !== "review" ? (
          <>
            <button type="button" onClick={() => setStep(STEPS[idx + 1])} className="min-h-11 rounded-lg bg-accent px-5 font-semibold text-bg">{t("check.next")} →</button>
            <button type="button" onClick={() => setStep(STEPS[idx + 1])} className="min-h-11 px-3 text-sm text-muted hover:text-fg">{t("check.skip")}</button>
          </>
        ) : (
          <button type="button" onClick={save} disabled={readings.length === 0 || hasInvalid} className="min-h-11 rounded-lg bg-accent px-5 font-semibold text-bg disabled:opacity-40">
            ✓ {t("check.save")}
          </button>
        )}
      </div>
    </div>
  );
}
