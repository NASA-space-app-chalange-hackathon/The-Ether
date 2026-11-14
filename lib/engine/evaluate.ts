import { BASELINE_DAYS, buildBaseline, updateBaseline, type DailyValue } from "./baseline";
import { detectBehavioralDrift, windowMean, type DriftResult, type WindowBadness } from "./composite";
import { boneTracker, radiationTracker, type BoneTracker, type RadiationTracker } from "./cumulative";
import { INDICATOR_RULE, RULES, resolveTier, stepsUpTo, tierRank, type RuleId } from "./escalation";
import { INDICATORS, INDICATOR_IDS } from "./indicators";
import { PERSIST_WINDOW, persistenceStatus, statusRank, worstStatus } from "./persistence";
import { checkThreshold, type AbsoluteThreshold } from "./thresholds";
import type { Alert, AlertEvidence, Baseline, IndicatorId, Reading, Severity, Status } from "./types";
import { badness, percentChange, robustZ } from "./zscore";

/** A reading older than this (days) no longer represents the current state. */
export const STALE_DAYS = 7;
/** Absolute thresholds act on a reading taken within this many days. */
export const THRESHOLD_RECENT_DAYS = 2;

export interface SeriesPoint {
  day: number;
  value: number;
  /** Baseline in force on that day (null during the learning window). */
  center: number | null;
  spread: number | null;
  z: number | null;
}

export interface IndicatorState {
  indicator: IndicatorId;
  status: Status;
  latest: DailyValue | null;
  baseline: Baseline | null;
  z: number | null;
  percentChange: number | null;
  /** First day of the current abnormal run (z-based or threshold). */
  sinceDay: number | null;
  threshold: AbsoluteThreshold | null;
  /** True while still inside the 14-day learning window. */
  learning: boolean;
  series: SeriesPoint[];
}

export interface MemberAssessment {
  memberId: string;
  day: number;
  indicators: Record<IndicatorId, IndicatorState>;
  drift: DriftResult & { sinceDay: number | null };
  radiation: RadiationTracker;
  bone: BoneTracker;
  alerts: Alert[];
  overall: Status;
}

export interface EvaluateOptions {
  /** Radiation dose from previous missions (mSv). */
  priorDose?: number;
}

/** Collapse readings to one value per day (mean), up to and including `uptoDay`. */
export function toDailySeries(readings: readonly Reading[], indicator: IndicatorId, uptoDay: number): DailyValue[] {
  const sums = new Map<number, { sum: number; n: number }>();
  for (const r of readings) {
    if (r.indicator !== indicator || r.day > uptoDay || !Number.isFinite(r.value)) continue;
    const acc = sums.get(r.day) ?? { sum: 0, n: 0 };
    acc.sum += r.value;
    acc.n += 1;
    sums.set(r.day, acc);
  }
  return [...sums.entries()].map(([day, { sum, n }]) => ({ day, value: sum / n })).sort((a, b) => a.day - b.day);
}

/** Walk the series day by day: baseline → z → persistence → (frozen) EWMA update. */
export function evaluateIndicator(
  memberId: string,
  indicator: IndicatorId,
  series: readonly DailyValue[],
  uptoDay: number,
): IndicatorState {
  const meta = INDICATORS[indicator];
  const latest = series.length ? series[series.length - 1] : null;
  let baseline = buildBaseline(memberId, indicator, series);
  const learning = uptoDay < BASELINE_DAYS || baseline === null;

  const byDay = new Map(series.map((p) => [p.day, p.value]));
  const badByDay = new Map<number, number>();
  const points: SeriesPoint[] = [];
  let zStatus: Exclude<Status, "unknown"> = "ok";
  let runStart: number | null = null;

  for (const p of series) {
    if (p.day < BASELINE_DAYS || baseline === null) {
      points.push({ day: p.day, value: p.value, center: null, spread: null, z: null });
      continue;
    }
    const z = robustZ(p.value, baseline);
    points.push({ day: p.day, value: p.value, center: baseline.center, spread: baseline.spread, z });
    badByDay.set(p.day, badness(z, meta.worseWhen));
    zStatus = persistenceStatus(windowBadness(badByDay, p.day));
    if (zStatus === "ok") runStart = null;
    else if (runStart === null) runStart = firstAbnormalDay(badByDay, p.day);
    baseline = updateBaseline(baseline, p, zStatus !== "ok");
  }

  // Re-evaluate persistence at uptoDay itself (it may have no reading).
  if (baseline !== null && uptoDay >= BASELINE_DAYS) {
    zStatus = persistenceStatus(windowBadness(badByDay, uptoDay));
    if (zStatus === "ok") runStart = null;
  }

  const recent = latest !== null && latest.day >= uptoDay - THRESHOLD_RECENT_DAYS;
  const threshold = recent && latest ? checkThreshold(indicator, latest.value) : null;
  const thresholdStart = threshold ? thresholdRunStart(byDay, indicator, threshold, latest!.day) : null;

  let status: Status = series.length ? worstStatus([zStatus, threshold?.severity ?? "ok"]) : "unknown";
  if (latest && latest.day < uptoDay - STALE_DAYS) status = "unknown";

  const starts = [status !== "ok" && zStatus !== "ok" ? runStart : null, thresholdStart].filter(
    (d): d is number => d !== null,
  );
  const z = latest && baseline && !learning ? robustZ(latest.value, baseline) : null;

  return {
    indicator,
    status,
    latest,
    baseline,
    z,
    percentChange: latest && baseline && !learning ? percentChange(latest.value, baseline.center) : null,
    sinceDay: status === "ok" || status === "unknown" || starts.length === 0 ? null : Math.min(...starts),
    threshold,
    learning,
    series: points,
  };
}

function windowBadness(badByDay: ReadonlyMap<number, number>, endDay: number): (number | null)[] {
  const out: (number | null)[] = [];
  for (let d = endDay - PERSIST_WINDOW + 1; d <= endDay; d++) out.push(badByDay.get(d) ?? null);
  return out;
}

function firstAbnormalDay(badByDay: ReadonlyMap<number, number>, endDay: number): number {
  for (let d = endDay - PERSIST_WINDOW + 1; d <= endDay; d++) if ((badByDay.get(d) ?? 0) > 2) return d;
  return endDay;
}

function thresholdRunStart(
  byDay: ReadonlyMap<number, number>,
  indicator: IndicatorId,
  threshold: AbsoluteThreshold,
  lastDay: number,
): number {
  let d = lastDay;
  while (byDay.has(d - 1) && checkThreshold(indicator, byDay.get(d - 1)!) !== null) d -= 1;
  return d;
}

/** Mean worse-direction z over the last window, per indicator. */
function recentBadness(state: IndicatorState, uptoDay: number): number | null {
  const meta = INDICATORS[state.indicator];
  return windowMean(zInWindow(state, uptoDay).map((z) => badness(z, meta.worseWhen)));
}

function recentSignedZ(state: IndicatorState, uptoDay: number): number | null {
  return windowMean(zInWindow(state, uptoDay));
}

/** z-scores for the PERSIST_WINDOW days ending at `endDay` (inclusive). */
function zInWindow(state: IndicatorState, endDay: number): number[] {
  return state.series
    .filter((p) => p.day > endDay - PERSIST_WINDOW && p.day <= endDay)
    .flatMap((p) => (p.z === null ? [] : [p.z]));
}

function evidenceFor(state: IndicatorState, uptoDay: number, windowed = false): AlertEvidence | null {
  if (!state.latest) return null;
  const center = state.baseline?.center ?? state.latest.value;
  let value = state.latest.value;
  if (windowed) {
    const recent = state.series.filter((p) => p.day > uptoDay - PERSIST_WINDOW && p.day <= uptoDay);
    if (recent.length) value = recent.reduce((s, p) => s + p.value, 0) / recent.length;
  }
  const z = state.baseline ? robustZ(value, state.baseline) : 0;
  return {
    indicator: state.indicator,
    value,
    baseline: center,
    zScore: z,
    percentChange: percentChange(value, center),
    sinceDay: state.sinceDay ?? state.latest.day,
  };
}

function describe(e: AlertEvidence): string {
  const label = INDICATORS[e.indicator].label;
  const pct = Math.round(e.percentChange);
  const sign = pct > 0 ? "+" : pct < 0 ? "−" : "±";
  return `${label} ${sign}${Math.abs(pct)}% vs. your normal`;
}

function makeAlert(
  memberId: string,
  ruleId: RuleId,
  severity: Severity,
  sinceDay: number,
  uptoDay: number,
  evidence: AlertEvidence[],
  whatChanged: string,
): Alert {
  const rule = RULES[ruleId];
  const durationDays = uptoDay - sinceDay + 1;
  const tier = resolveTier(rule, severity, durationDays);
  return {
    id: `${memberId}:${ruleId}`,
    memberId,
    ruleId,
    title: rule.title,
    severity,
    tier,
    day: uptoDay,
    sinceDay,
    whatChanged,
    whyItMatters: rule.whyItMatters,
    doNow: stepsUpTo(rule, tier),
    sources: [...rule.sources],
    evidence,
  };
}

const daysPhrase = (since: number, upto: number) => {
  const n = upto - since + 1;
  return `for ${n} day${n === 1 ? "" : "s"} (since day ${since})`;
};

/** Behavioral drift evaluated on a given day; also used to find when the run began. */
function driftOn(states: Record<IndicatorId, IndicatorState>, day: number): DriftResult {
  const w: WindowBadness = {};
  for (const id of ["sleepHours", "pvtMeanRT", "pvtLapses", "crewPulse"] as const) w[id] = recentBadness(states[id], day);
  return detectBehavioralDrift(w, recentSignedZ(states.mood, day));
}

/**
 * Full, explainable assessment of one crew member as of `uptoDay`.
 * Pure: same readings + day → same result.
 */
export function evaluateMember(
  memberId: string,
  readings: readonly Reading[],
  uptoDay: number,
  options: EvaluateOptions = {},
): MemberAssessment {
  const mine = readings.filter((r) => r.memberId === memberId);
  const indicators = {} as Record<IndicatorId, IndicatorState>;
  for (const id of INDICATOR_IDS) indicators[id] = evaluateIndicator(memberId, id, toDailySeries(mine, id, uptoDay), uptoDay);

  // Composite drift + when it started (walk back while it holds).
  const drift = driftOn(indicators, uptoDay);
  let driftSince: number | null = null;
  if (drift.severity) {
    driftSince = uptoDay;
    while (driftSince > BASELINE_DAYS && driftOn(indicators, driftSince - 1).severity) driftSince -= 1;
  }

  const radiation = radiationTracker(toDailySeries(mine, "radiationDose", uptoDay), uptoDay, options.priorDose ?? 0);
  const bone = boneTracker(toDailySeries(mine, "exerciseMinutes", uptoDay), uptoDay);

  const alerts: Alert[] = [];
  const merged = new Set<RuleId>(drift.severity ? ["sleep", "vigilance"] : []);

  // Indicator-driven rules, grouped by rule.
  const byRule = new Map<RuleId, IndicatorState[]>();
  for (const id of INDICATOR_IDS) {
    const st = indicators[id];
    const ruleId = INDICATOR_RULE[id];
    if (!ruleId || merged.has(ruleId) || (st.status !== "watch" && st.status !== "critical")) continue;
    byRule.set(ruleId, [...(byRule.get(ruleId) ?? []), st]);
  }
  for (const [ruleId, states] of byRule) {
    const severity: Severity = states.some((s) => s.status === "critical") ? "critical" : "watch";
    const since = Math.min(...states.map((s) => s.sinceDay ?? uptoDay));
    const evidence = states.map((s) => evidenceFor(s, uptoDay)).filter((e): e is AlertEvidence => e !== null);
    const thresholdNotes = states.flatMap((s) => (s.threshold ? [s.threshold.label] : []));
    const what = [evidence.map(describe).join("; ") + ` ${daysPhrase(since, uptoDay)}.`, ...thresholdNotes].join(" ");
    alerts.push(makeAlert(memberId, ruleId, severity, since, uptoDay, evidence, what));
  }

  if (drift.severity && driftSince !== null) {
    const ids: IndicatorId[] = ["sleepHours", "pvtMeanRT", "pvtLapses", "crewPulse", "mood"];
    const evidence = ids
      .map((id) => evidenceFor(indicators[id], uptoDay, true))
      .filter((e): e is AlertEvidence => e !== null)
      .map((e) => ({ ...e, sinceDay: driftSince }));
    const objective = evidence.filter((e) => e.indicator !== "mood" && e.indicator !== "crewPulse");
    const what =
      `${objective.map(describe).join("; ")} ${daysPhrase(driftSince, uptoDay)}, ` +
      `while self-reported mood stayed at your normal → possible hidden fatigue.`;
    alerts.push(makeAlert(memberId, "behavioral-drift", drift.severity, driftSince, uptoDay, evidence, what));
  }

  if (radiation.eventActive && radiation.eventSinceDay !== null) {
    const today = radiation.todayDose ?? 0;
    const usual = radiation.usualDailyDose ?? 0;
    const evidence: AlertEvidence[] = [
      {
        indicator: "radiationDose",
        value: today,
        baseline: usual,
        zScore: 0,
        percentChange: percentChange(today, usual),
        sinceDay: radiation.eventSinceDay,
      },
    ];
    const what = `Dose rate spiked to ${today.toFixed(2)} mSv/day (usual ${usual.toFixed(2)}) since day ${radiation.eventSinceDay}.`;
    alerts.push(makeAlert(memberId, "radiation-event", "critical", radiation.eventSinceDay, uptoDay, evidence, what));
  }
  if (radiation.fractionOfLimit >= 0.5) {
    const severity: Severity = radiation.fractionOfLimit >= 0.8 ? "critical" : "watch";
    const what = `Career dose ${radiation.totalDose.toFixed(0)} mSv = ${(radiation.fractionOfLimit * 100).toFixed(0)}% of the 600 mSv limit.`;
    alerts.push(makeAlert(memberId, "radiation-cumulative", severity, uptoDay, uptoDay, [], what));
  }
  if ((bone.status === "watch" || bone.status === "critical") && bone.sinceDay !== null) {
    const pct = bone.adherence === null ? "—" : `${Math.round(bone.adherence * 100)}%`;
    const what = `Bone-loss risk score ${bone.score.toFixed(0)}/100; exercise target met ${pct} over the last 14 days.`;
    alerts.push(makeAlert(memberId, "bone-loss", bone.status, bone.sinceDay, uptoDay, [], what));
  }

  alerts.sort(
    (a, b) =>
      statusRank(b.severity) - statusRank(a.severity) || tierRank(b.tier) - tierRank(a.tier) || a.sinceDay - b.sinceDay,
  );

  const overall = worstStatus([
    ...INDICATOR_IDS.map((id) => indicators[id].status),
    radiation.status,
    bone.status,
    drift.severity ?? "ok",
  ]);

  return {
    memberId,
    day: uptoDay,
    indicators,
    drift: { ...drift, sinceDay: driftSince },
    radiation,
    bone,
    alerts,
    overall,
  };
}
