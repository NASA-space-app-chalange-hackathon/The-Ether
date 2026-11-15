"use client";

import { Term } from "@/components/ui/Term";
import { CircleCheck, CornerDownRight, Dumbbell, Flame, Trophy } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useMemo, useState } from "react";
import { CrewSwitcher } from "@/components/home/CrewSwitcher";
import { Avatar } from "@/components/ui/Avatar";
import { PageHeader } from "@/components/ui/PageHeader";
import { autoCompleted, crewGoal, dailyQuests, LEVEL_XP, questProgress, type Quest, type QuestProgress } from "@/lib/engine/quests";
import type { MessageKey } from "@/lib/i18n";
import { motionTokens } from "@/lib/motion-tokens";
import { useAssessment, useData, useMission } from "@/lib/state/DataProvider";
import { usePersistentSet } from "@/lib/state/persistentSets";
import { useAppState, useT } from "@/lib/state/useAppState";
import { useLabels } from "@/lib/state/useLabels";

const REWARD_PCT = 0.8;
const { duration, easing, distance } = motionTokens;
const BAR_TRANSITION = { duration: duration.normal, ease: easing.smooth };

/** Completion feedback: a short ring of sparks and a rising "+XP" that fades. */
function Burst({ xp }: { xp: number }) {
  return (
    <motion.span
      className="pointer-events-none absolute inset-y-0 right-14 grid place-items-center"
      initial={{ opacity: 1 }}
      animate={{ opacity: 0 }}
      transition={{ duration: duration.crawl, delay: duration.normal }}
      aria-hidden
    >
      {Array.from({ length: 8 }, (_, i) => {
        const a = (i / 8) * Math.PI * 2;
        return (
          <motion.span
            key={i}
            className="absolute h-1 w-1 rounded-full bg-ok"
            initial={{ x: 0, y: 0, scale: 1 }}
            animate={{ x: Math.cos(a) * distance.xl * 0.6, y: Math.sin(a) * distance.lg, scale: 0 }}
            transition={{ duration: duration.slow, ease: easing.smooth }}
          />
        );
      })}
      <motion.span
        className="font-mono text-xs font-semibold text-ok"
        initial={{ y: 0 }}
        animate={{ y: -distance.lg }}
        transition={{ duration: duration.slow, ease: easing.smooth }}
      >
        +{xp} XP
      </motion.span>
    </motion.span>
  );
}

export function QuestsScreen() {
  const t = useT();
  const labels = useLabels();
  const { memberId, day, mode } = useAppState();
  const { members, maxDay } = useMission();
  const { readings } = useData();
  const a = useAssessment();
  const today = Math.min(day, maxDay);
  const { items: ticked, toggle } = usePersistentSet("the-ether:quests:v1", `${memberId}:${today}`);
  const [burst, setBurst] = useState<{ id: string; n: number } | null>(null);

  const progressByMember = useMemo(() => {
    const out: Record<string, QuestProgress> = {};
    for (const m of members) out[m.id] = questProgress(readings.filter((r) => r.memberId === m.id), today);
    return out;
  }, [members, readings, today]);

  if (!a) return <PageHeader title={t("nav.quests")} />;

  const quests = dailyQuests(a, mode);
  const auto = autoCompleted(readings.filter((r) => r.memberId === memberId && r.day === today));
  const isDone = (q: Quest) => auto.has(q.kind) || ticked.includes(q.id);
  const manualXp = quests.filter((q) => ticked.includes(q.id) && !auto.has(q.kind)).reduce((s, q) => s + q.xp, 0);
  const mine = progressByMember[memberId] ? questProgress(readings.filter((r) => r.memberId === memberId), today, manualXp) : null;
  const goal = crewGoal(progressByMember, today);

  return (
    <div className="space-y-6">
      <PageHeader title={t("nav.quests")} intro={t("quests.intro")}>
        <CrewSwitcher />
      </PageHeader>

      <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
        <section className="surface space-y-4 p-5">
          <h2 className="eyebrow">{t("quests.today")}</h2>
          <ul className="space-y-1.5" data-testid="quest-list">
            {quests.map((q) => {
              const done = isDone(q);
              const locked = auto.has(q.kind);
              const reason = q.reason ? a.alerts.find((x) => x.ruleId === q.reason)?.title : null;
              return (
                <li key={q.id} className="relative">
                  <label
                    className={`flex min-h-14 cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 transition-[background-color,border-color] duration-150 ${
                      done ? "border-ok/25 bg-ok/[0.06]" : "border-line hover:border-line-strong hover:bg-panel-2/50"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={done}
                      disabled={locked}
                      onChange={() => {
                        if (!ticked.includes(q.id)) setBurst({ id: q.id, n: (burst?.n ?? 0) + 1 });
                        toggle(q.id);
                      }}
                      className="checkbox checkbox-ok"
                    />
                    <span className="flex-1">
                      <span className={`text-sm transition-colors duration-150 ${done ? "text-muted line-through decoration-muted/60" : ""}`}>{t(`quest.${q.kind}` as MessageKey)}</span>
                      {locked && (
                        <span className="mt-0.5 flex items-center gap-1 text-xs text-ok">
                          <CircleCheck size={12} strokeWidth={2.25} />
                          {t("quests.verified")}
                        </span>
                      )}
                      {reason && (
                        <span className="mt-0.5 flex items-center gap-1 text-xs text-amber">
                          <CornerDownRight size={12} className="shrink-0" />
                          {t("quests.because", { reason })}
                        </span>
                      )}
                    </span>
                    <span className={`font-mono text-xs ${done ? "text-ok" : "text-muted"}`}>+{q.xp}</span>
                  </label>
                  <AnimatePresence>{burst?.id === q.id && <Burst key={burst.n} xp={q.xp} />}</AnimatePresence>
                </li>
              );
            })}
          </ul>
        </section>

        <div className="space-y-4">
          {mine && (
            <section className="surface space-y-4 p-5" data-testid="quest-level">
              <p className="flex items-center gap-2.5 text-2xl font-semibold tracking-tight">
                <Trophy size={20} strokeWidth={1.75} className="text-amber" />
                {t("quests.level", { n: mine.level })}
              </p>
              <div className="track" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(mine.levelProgress * 100)}>
                <motion.div className="absolute inset-0 origin-left bg-amber" initial={false} animate={{ scaleX: mine.levelProgress }} transition={BAR_TRANSITION} />
              </div>
              <p className="flex items-center gap-0.5 font-mono text-xs text-muted">
                {t("quests.xp", { xp: mine.xp, next: LEVEL_XP - (mine.xp % LEVEL_XP) })}
                <Term id="xp">{""}</Term>
              </p>
              <dl className="grid grid-cols-2 gap-4 border-t border-line pt-4">
                <div className="space-y-1">
                  <dt className="eyebrow flex items-center gap-1.5">
                    <Flame size={12} strokeWidth={2} />
                    {t("quests.checkinStreak")}
                  </dt>
                  <dd className="font-mono text-xl font-medium">{t("quests.days", { n: mine.checkinStreak })}</dd>
                </div>
                {mode === "space" && (
                  <div className="space-y-1">
                    <dt className="eyebrow flex items-center gap-1.5">
                      <Dumbbell size={12} strokeWidth={2} />
                      {t("quests.exerciseStreak")}
                    </dt>
                    <dd className="font-mono text-xl font-medium" data-testid="exercise-streak">
                      {t("quests.days", { n: mine.exerciseStreak })}
                    </dd>
                  </div>
                )}
              </dl>
            </section>
          )}

          {members.length > 1 && (
            <section className="surface space-y-4 p-5" data-testid="crew-goal">
              <h2 className="eyebrow">{t("quests.crewGoal")}</h2>
              <div className="track h-2">
                <motion.div
                  className={`absolute inset-0 origin-left ${goal.pct >= REWARD_PCT ? "bg-ok" : "bg-accent"}`}
                  initial={false}
                  animate={{ scaleX: Math.min(1, goal.pct) }}
                  transition={BAR_TRANSITION}
                />
                <div className="absolute inset-y-0 w-px bg-fg/70" style={{ left: `${REWARD_PCT * 100}%` }} aria-hidden />
              </div>
              <p className="text-sm">{t("quests.crewGoalText", { done: goal.done, possible: goal.possible })} · <span className="font-mono">{Math.round(goal.pct * 100)}%</span></p>
              <p className={`text-sm ${goal.pct >= REWARD_PCT ? "font-semibold text-ok" : "text-muted"}`}>{t(goal.pct >= REWARD_PCT ? "quests.unlocked" : "quests.reward")}</p>
              <h3 className="eyebrow border-t border-line pt-4">{t("quests.contribution")}</h3>
              <ul className="space-y-2">
                {members.map((m) => {
                  const n = goal.byMember[m.id] ?? 0;
                  const max = goal.possible / members.length || 1;
                  return (
                    <li key={m.id} className="flex items-center gap-2 text-sm">
                      <Avatar shape={m.avatar} size={20} />
                      <span className="w-20 font-mono text-xs">{labels.memberName(m)}</span>
                      <span className="track h-1 flex-1">
                        <span className="absolute inset-0 origin-left bg-accent/80" style={{ transform: `scaleX(${Math.min(1, n / max)})` }} />
                      </span>
                      <span className="w-8 text-right font-mono text-xs text-muted">{n}</span>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
