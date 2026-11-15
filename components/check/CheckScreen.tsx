"use client";

import { Annoyed, ArrowLeft, ArrowRight, ArrowUpRight, Check, ChevronRight, CircleCheck, Frown, Info, Laugh, Meh, RotateCcw, Smile, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { useState, type ReactNode } from "react";
import { CrewSwitcher } from "@/components/home/CrewSwitcher";
import { StatusBadge } from "@/components/ui/Badges";
import { PageHeader } from "@/components/ui/PageHeader";
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

const FACES: LucideIcon[] = [Frown, Annoyed, Meh, Smile, Laugh];

function Why({ step }: { step: Exclude<StepId, "review"> }) {
  const t = useT();
  const w = WHY[step];
  return (
    <details className="group rounded-lg border border-line bg-panel-2/40 text-sm">
      <summary className="flex min-h-10 cursor-pointer list-none items-center gap-2 rounded-lg px-3 font-medium text-muted transition-colors duration-150 hover:text-fg [&::-webkit-details-marker]:hidden">
        <Info size={14} strokeWidth={2} />
        {t("check.why")}
        <ChevronRight size={14} className="ml-auto transition-transform duration-200 ease-smooth group-open:rotate-90" />
      </summary>
      <div className="space-y-2 border-t border-line px-3 py-3">
        <p className="leading-relaxed text-fg/90">{t(w.key)}</p>
        <ul className="space-y-1">
          {w.sources.map((s) => (
            <li key={s.id}>
              <a href={s.url} target="_blank" rel="noreferrer" className="link inline-flex items-center gap-1 text-xs">
                {s.title}
                <ArrowUpRight size={11} className="opacity-60" />
              </a>
            </li>
          ))}
        </ul>
      </div>
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
    <label className="block space-y-1.5">
      <span className="text-sm text-fg/90">
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
          className="field min-h-11 w-32 px-3 font-mono text-base"
        />
        <span className="font-mono text-sm text-muted">{unit}</span>
      </span>
      {!valid && <span className="block text-xs text-red">{t("check.invalid", { min, max })}</span>}
    </label>
  );
}

function Scale({ label, value, onChange, faces }: { label: string; value: number | undefined; onChange: (v: number) => void; faces?: boolean }) {
  const t = useT();
  return (
    <fieldset className="space-y-2">
      <legend className="mb-2 text-sm text-fg/90">{label}</legend>
      <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-5">
        {[1, 2, 3, 4, 5].map((n) => {
          const Face = FACES[n - 1];
          return (
            <button
              key={n}
              type="button"
              aria-pressed={value === n}
              onClick={() => onChange(n)}
              className="flex min-h-14 flex-col items-center justify-center gap-1 rounded-lg border border-line px-2 py-2 text-xs text-muted transition-[background-color,border-color,color,transform] duration-150 hover:border-line-strong hover:text-fg active:scale-[0.97] aria-pressed:border-accent/60 aria-pressed:bg-accent/10 aria-pressed:text-fg"
            >
              {faces && <Face size={20} strokeWidth={1.75} />}
              <span>
                <span className="font-mono">{n}</span> · {t(`scale.${n}` as MessageKey)}
              </span>
            </button>
          );
        })}
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
          <p className="flex items-center gap-2 text-sm text-ok" data-testid="camera-recorded"><CircleCheck size={14} strokeWidth={2.25} />{t("camera.recorded", { bpm: draft.heartRate, q: Math.round((draft.heartRateQuality ?? 0) * 100) })}</p>
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
        <label className="block space-y-1.5">
          <span className="text-sm text-fg/90">{t("check.note")}</span>
          <textarea value={draft.note ?? ""} onChange={(e) => set({ note: e.target.value })} rows={2} className="field block w-full p-3 text-sm" />
        </label>
      </div>
    ),
    review: (
      <div className="space-y-3" data-testid="check-review">
        {readings.length === 0 ? (
          <p className="text-muted">{t("check.nothing")}</p>
        ) : (
          <ul className="divide-y divide-line overflow-hidden rounded-lg border border-line font-mono text-sm">
            {readings.map((r) => (
              <li key={r.indicator} className="flex justify-between px-3 py-2">
                <span className="font-sans">{labels.indicator(r.indicator)}</span>
                <span>{r.value} <span className="text-muted">{INDICATORS[r.indicator].unit}</span></span>
              </li>
            ))}
          </ul>
        )}
      </div>
    ),
  };

  if (saved) {
    return (
      <div className="space-y-6">
        <PageHeader title={t("nav.check")} />
        <div className="surface space-y-5 p-5 sm:p-6" data-testid="check-saved">
          <div className="flex flex-wrap items-center gap-3">
            <p className="flex items-center gap-2 font-medium text-ok">
              <CircleCheck size={18} strokeWidth={2.25} />
              {t("check.saved")}
            </p>
            {assessment && <StatusBadge status={assessment.overall} size="lg" />}
          </div>
          <div className="flex flex-wrap gap-2 text-sm">
            {(["/", "/body", "/trends", "/alerts"] as const).map((href) => (
              <Link key={href} href={href} className="btn btn-secondary group">
                {t(href === "/" ? "nav.home" : href === "/body" ? "nav.body" : href === "/trends" ? "nav.trends" : "nav.alerts")}
                <ArrowRight size={14} className="transition-transform duration-150 group-hover:translate-x-0.5" />
              </Link>
            ))}
          </div>
          <button type="button" onClick={() => { setDraft({}); setSaved(false); setStep("hr"); }} className="btn btn-ghost -ml-2">
            <RotateCcw size={14} />
            {t("check.again")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("nav.check")}
        intro={
          <>
            <p>{t("check.intro")}</p>
            {member && <p className="mt-1.5 font-mono text-xs text-accent">{t("check.savingFor", { member: labels.memberName(member), day: current })}</p>}
          </>
        }
      >
        <CrewSwitcher />
      </PageHeader>

      <nav aria-label={t("check.steps")}>
        <ol className="flex flex-wrap gap-1.5">
          {STEPS.map((s, i) => {
            const current = s === step;
            const done = i < idx;
            return (
              <li key={s}>
                <button
                  type="button"
                  onClick={() => setStep(s)}
                  aria-current={current ? "step" : undefined}
                  className={`flex min-h-10 items-center gap-2 rounded-lg border px-3 text-[13px] font-medium transition-[background-color,border-color,color] duration-150 ${
                    current ? "border-line-strong bg-panel-2 text-fg" : done ? "border-line text-fg/80 hover:border-line-strong" : "border-line text-muted hover:border-line-strong hover:text-fg"
                  }`}
                >
                  <span
                    className={`grid h-5 w-5 place-items-center rounded-full font-mono text-[10px] ${current ? "bg-fg text-bg" : done ? "bg-accent/15 text-accent" : "bg-panel-2 text-muted"}`}
                  >
                    {done ? <Check size={11} strokeWidth={3} aria-hidden /> : i + 1}
                  </span>
                  {t(`check.step.${s}` as MessageKey)}
                </button>
              </li>
            );
          })}
        </ol>
      </nav>

      <section className="surface space-y-5 p-5 sm:p-6" aria-labelledby="step-title">
        <h2 id="step-title" className="text-lg font-semibold tracking-tight">{t(`check.step.${step}` as MessageKey)}</h2>
        {step !== "review" && <Why step={step} />}
        {body[step]}
      </section>

      <div className="flex flex-wrap gap-2">
        {idx > 0 && (
          <button type="button" onClick={() => setStep(STEPS[idx - 1])} className="btn btn-secondary">
            <ArrowLeft size={14} />
            {t("check.back")}
          </button>
        )}
        {step !== "review" ? (
          <>
            <button type="button" onClick={() => setStep(STEPS[idx + 1])} className="btn btn-primary group">
              {t("check.next")}
              <ArrowRight size={14} className="transition-transform duration-150 group-hover:translate-x-0.5" />
            </button>
            <button type="button" onClick={() => setStep(STEPS[idx + 1])} className="btn btn-ghost">
              {t("check.skip")}
            </button>
          </>
        ) : (
          <button type="button" onClick={save} disabled={readings.length === 0 || hasInvalid} className="btn btn-primary">
            <Check size={14} strokeWidth={2.5} />
            {t("check.save")}
          </button>
        )}
      </div>
    </div>
  );
}
