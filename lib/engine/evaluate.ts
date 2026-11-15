import { BASELINE_DAYS, buildBaseline, updateBaseline, type DailyValue } from "./baseline";
import { detectBehavioralDrift, windowMean, type DriftResult, type WindowBadness } from "./composite";
import { SPE_ACTIVE_DAYS, boneTracker, lowAdherenceSince, radiationTracker, type BoneTracker, type RadiationTracker } from "./cumulative";
import { INDICATOR_RULE, LONG_DELAY_SECONDS, RULES, resolveTier, stepsUpTo, tierRank, type RuleId } from "./escalation";
import { formatChange, formatValue } from "./format";
import { INDICATORS, INDICATOR_IDS } from "./indicators";
import { PERSIST_WINDOW, WATCH_Z, persistenceStatus, statusRank, worstStatus } from "./persistence";
import { checkThreshold, type AbsoluteThreshold } from "./thresholds";
import type { Alert, AlertEvidence, Baseline, IndicatorId, Reading, Severity, SpaceWeatherEvent, Status } from "./types";
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
  /** The last PERSIST_WINDOW days, so the UI can explain a status that today's value alone doesn't show. */
  recent: RecentWindow;
}

export interface RecentWindow {
  /** Mean of the readings in the window (null if none). */
  mean: number | null;
  /** Days in the window that were beyond ±2 SD in the worse direction (the persistence rule counts these). */
  abnormalDays: number;
  /** Which side of the normal those days fell on. */
  direction: "above" | "below" | null;
  window: number;
}

export interface MemberAssessment {
  memberId: string;
  day: number;
  indicators: Record<IndicatorId, IndicatorState>;
  drift: DriftResult & { sinceDay: number | null };
  radiation: RadiationTracker;
  bone: BoneTracker;
  /** Real NASA DONKI event active on this day (replayed), if any. */
  spaceWeather: SpaceWeatherEvent | null;
  alerts: Alert[];
  overall: Status;
}

export interface EvaluateOptions {
  /** Radiation dose from previous missions (mSv). */
  priorDose?: number;
  /** Real solar particle events (NASA DONKI) replayed on mission days; they act as a shelter warning for everyone. */
  spaceWeather?: readonly SpaceWeatherEvent[];
  /** One-way light time to Earth on this day (seconds), e.g. from JPL Horizons. */
  commsDelaySeconds?: number;
}

/** A replayed solar particle event keeps its shelter guidance active for this many days. Demo parameter. */
export const SEP_WARNING_DAYS = SPE_ACTIVE_DAYS;

/** The most recent replayed event still active on `day`, if any. */
export function activeSpaceWeather(events: readonly SpaceWeatherEvent[], day: number): SpaceWeatherEvent | null {
  const active = events.filter((e) => e.day <= day && day - e.day < SEP_WARNING_DAYS);
  return active.length ? active.reduce((a, b) => (b.day > a.day ? b : a)) : null;
}

/**
 * Collapse readings to one value per day (mean), up to and including `uptoDay`.
 * A reading the person entered (any source but "seed") replaces seeded data for that day.
 */
export function toDailySeries(readings: readonly Reading[], indicator: IndicatorId, uptoDay: number): DailyValue[] {
  const sums = new Map<number, { sum: number; n: number; user: boolean }>();
  for (const r of readings) {
    if (r.indicator !== indicator || r.day > uptoDay || !Number.isFinite(r.value)) continue;
    const user = r.source !== "seed";
    const acc = sums.get(r.day);
    if (!acc || (user && !acc.user)) sums.set(r.day, { sum: r.value, n: 1, user });
    else if (user === acc.user) {
      acc.sum += r.value;
      acc.n += 1;
    }
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

  const latestIsRecent = latest !== null && latest.day >= uptoDay - THRESHOLD_RECENT_DAYS;
  const threshold = latestIsRecent && latest ? checkThreshold(indicator, latest.value) : null;
  const thresholdStart = threshold ? thresholdRunStart(byDay, indicator, threshold, latest!.day) : null;

  let status: Status = series.length ? worstStatus([zStatus, threshold?.severity ?? "ok"]) : "unknown";
  if (latest && latest.day < uptoDay - STALE_DAYS) status = "unknown";

  const starts = [status !== "ok" && zStatus !== "ok" ? runStart : null, thresholdStart].filter(
    (d): d is number => d !== null,
  );
  const z = latest && baseline && !learning ? robustZ(latest.value, baseline) : null;

  // Explain the persistence window ending today.
  const inWindow = points.filter((p) => p.day > uptoDay - PERSIST_WINDOW && p.day <= uptoDay);
  const abnormal = inWindow.filter((p) => p.z !== null && badness(p.z, meta.worseWhen) > WATCH_Z);
  const zSum = abnormal.reduce((sum, p) => sum + (p.z ?? 0), 0);
  const recent: RecentWindow = {
    mean: inWindow.length ? inWindow.reduce((sum, p) => sum + p.value, 0) / inWindow.length : null,
    abnormalDays: abnormal.length,
    direction: abnormal.length === 0 ? null : zSum >= 0 ? "above" : "below",
    window: PERSIST_WINDOW,
  };

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
    recent,
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
  let windowDays: number | undefined;
  if (windowed) {
    const recent = state.series.filter((p) => p.day > uptoDay - PERSIST_WINDOW && p.day <= uptoDay);
    if (recent.length) {
      value = recent.reduce((s, p) => s + p.value, 0) / recent.length;
      windowDays = PERSIST_WINDOW;
    }
  }
  const z = state.baseline ? robustZ(value, state.baseline) : 0;
  return {
    indicator: state.indicator,
    value,
    baseline: center,
    zScore: z,
    percentChange: percentChange(value, center),
    sinceDay: state.sinceDay ?? state.latest.day,
    ...(windowDays ? { windowDays } : { valueDay: state.latest.day }),
    ...(!windowed && !state.threshold && state.recent.direction && state.recent.abnormalDays > 0
      ? { trend: { abnormalDays: state.recent.abnormalDays, window: state.recent.window, direction: state.recent.direction } }
      : {}),
  };
}

/** "Sleep duration 5.4 h vs. your normal 7.0 h (−23%)" / "Attention lapses 3.0 vs. your normal 0.4". */
function describe(e: AlertEvidence): string {
  const meta = INDICATORS[e.indicator];
  const unit = meta.unit && meta.unit !== "/5" ? ` ${meta.unit}` : "";
  const base = `${meta.label} ${formatValue(e.indicator, e.value)}${unit} vs. your normal ${formatValue(e.indicator, e.baseline)}${unit}`;
  const change = formatChange(e);
  const text = change.percent ? `${base} (${change.percent})` : base;
  return e.trend ? `${text}, ${e.trend.direction} your normal on ${e.trend.abnormalDays} of the last ${e.trend.window} days` : text;
}

function makeAlert(
  memberId: string,
  ruleId: RuleId,
  severity: Severity,
  sinceDay: number,
  uptoDay: number,
  evidence: AlertEvidence[],
  whatChanged: string,
  commsDelaySeconds?: number,
): Alert {
  const rule = RULES[ruleId];
  const durationDays = uptoDay - sinceDay + 1;
  const tier = resolveTier(rule, severity, durationDays);
  // Earth is needed but can't answer quickly → the Crew Medical Officer acts first.
  const delayed = tier === "EARTH" && commsDelaySeconds !== undefined && commsDelaySeconds >= LONG_DELAY_SECONDS;
  const hazards = [...rule.hazards];
  if (delayed && !hazards.includes("distance")) hazards.push("distance");
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
    hazards,
    ...(delayed ? { firstResponder: "CMO" as const } : {}),
    ...(commsDelaySeconds !== undefined ? { commsDelaySeconds } : {}),
  };
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
/** "2024-06-08" → "8 Jun 2024" (fixed English; the engine has no locale). */
export function formatIsoDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return `${d} ${MONTHS[m - 1]} ${y}`;
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

  const delay = options.commsDelaySeconds;
  const sep = activeSpaceWeather(options.spaceWeather ?? [], uptoDay);
  const measured = radiationTracker(toDailySeries(mine, "radiationDose", uptoDay), uptoDay, options.priorDose ?? 0);
  // A real solar particle event is a shelter warning even before the dosimeter shows it.
  const radiation: RadiationTracker =
    sep && !measured.eventActive && measured.status !== "unknown"
      ? { ...measured, eventActive: true, eventSinceDay: sep.day, status: "critical" }
      : measured;
  const exercise = toDailySeries(mine, "exerciseMinutes", uptoDay);
  const bone = boneTracker(exercise, uptoDay);
  const lowExerciseSince = lowAdherenceSince(exercise, uptoDay);
  // Exercise status follows 14-day adherence, not day-to-day z-scores.
  const ex = indicators.exerciseMinutes;
  if (ex.status !== "unknown") {
    indicators.exerciseMinutes = { ...ex, status: lowExerciseSince === null ? "ok" : "watch", sinceDay: lowExerciseSince };
  }

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
    alerts.push(makeAlert(memberId, ruleId, severity, since, uptoDay, evidence, what, delay));
  }

  if (drift.severity && driftSince !== null) {
    const ids: IndicatorId[] = ["sleepHours", "pvtMeanRT", "pvtLapses", "crewPulse", "mood"];
    const evidence = ids
      .map((id) => evidenceFor(indicators[id], uptoDay, true))
      .filter((e): e is AlertEvidence => e !== null)
      .map((e) => ({ ...e, sinceDay: driftSince }));
    const objective = evidence.filter((e) => e.indicator !== "mood" && e.indicator !== "crewPulse");
    const what =
      `${PERSIST_WINDOW}-day averages: ${objective.map(describe).join("; ")} — ${daysPhrase(driftSince, uptoDay)}, ` +
      `while self-reported mood stayed at your normal → possible hidden fatigue.`;
    alerts.push(makeAlert(memberId, "behavioral-drift", drift.severity, driftSince, uptoDay, evidence, what, delay));
  }

  if (radiation.eventActive && radiation.eventSinceDay !== null) {
    const today = radiation.todayDose ?? 0;
    const usual = radiation.usualDailyDose ?? 0;
    const since = Math.min(radiation.eventSinceDay, measured.eventSinceDay ?? Infinity, sep?.day ?? Infinity);
    const evidence: AlertEvidence[] = radiation.todayDose === null
      ? []
      : [{ indicator: "radiationDose", value: today, baseline: usual, zScore: 0, percentChange: percentChange(today, usual), sinceDay: since, valueDay: uptoDay }];
    const parts: string[] = [];
    if (sep) {
      parts.push(
        `NASA DONKI recorded a real solar particle event on ${formatIsoDate(sep.realDate)} (seen near Earth by GOES${sep.highEnergy ? ", protons above 100 MeV" : ""}), replayed on mission day ${sep.day}.`,
      );
    }
    parts.push(
      measured.eventActive
        ? `Dosimeter: dose rate spiked to ${today.toFixed(2)} mSv/day (usual ${usual.toFixed(2)}) since day ${measured.eventSinceDay}.`
        : `Dosimeter: no spike yet (today ${today.toFixed(2)} mSv, usual ${usual.toFixed(2)}) — shelter anyway until the Crew Medical Officer confirms the dose.`,
    );
    const alert = makeAlert(memberId, "radiation-event", "critical", since, uptoDay, evidence, parts.join(" "), delay);
    if (sep) {
      alert.realData = [{ source: "DONKI", realDate: sep.realDate, ...(sep.url ? { url: sep.url } : {}) }];
      alert.sources = [
        {
          id: `donki-${sep.realDate}`,
          title: `NASA DONKI — Solar energetic particle event, ${formatIsoDate(sep.realDate)} (real data)`,
          ...(sep.url ? { url: sep.url } : {}),
        },
        ...alert.sources,
      ];
    }
    alerts.push(alert);
  }
  if (radiation.fractionOfLimit >= 0.5) {
    const severity: Severity = radiation.fractionOfLimit >= 0.8 ? "critical" : "watch";
    const what = `Career dose ${radiation.totalDose.toFixed(0)} mSv = ${(radiation.fractionOfLimit * 100).toFixed(0)}% of the 600 mSv limit.`;
    alerts.push(makeAlert(memberId, "radiation-cumulative", severity, uptoDay, uptoDay, [], what, delay));
  }
  if (lowExerciseSince !== null && bone.adherence !== null) {
    const what = `Exercise target met ${Math.round(bone.adherence * 100)}% over the last 14 days ${daysPhrase(lowExerciseSince, uptoDay)}.`;
    alerts.push(makeAlert(memberId, "fitness", "watch", lowExerciseSince, uptoDay, [], what, delay));
  }
  if ((bone.status === "watch" || bone.status === "critical") && bone.sinceDay !== null) {
    const pct = bone.adherence === null ? "—" : `${Math.round(bone.adherence * 100)}%`;
    const what = `Bone-loss risk score ${bone.score.toFixed(0)}/100; exercise target met ${pct} over the last 14 days.`;
    alerts.push(makeAlert(memberId, "bone-loss", bone.status, bone.sinceDay, uptoDay, [], what, delay));
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
    spaceWeather: sep,
    alerts,
    overall,
  };
}
