"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState } from "react";
import { CrewSwitcher } from "@/components/home/CrewSwitcher";
import { Avatar } from "@/components/ui/Avatar";
import { autoCompleted, crewGoal, dailyQuests, LEVEL_XP, questProgress, type Quest, type QuestProgress } from "@/lib/engine/quests";
import type { MessageKey } from "@/lib/i18n";
import { useAssessment, useData, useMission } from "@/lib/state/DataProvider";
import { usePersistentSet } from "@/lib/state/persistentSets";
import { useAppState, useT } from "@/lib/state/useAppState";
import { useLabels } from "@/lib/state/useLabels";

const REWARD_PCT = 0.8;

function Burst({ xp }: { xp: number }) {
  return (
    <motion.span className="pointer-events-none absolute inset-0 grid place-items-center" initial={{ opacity: 1 }} animate={{ opacity: 0 }} transition={{ duration: 1, delay: 0.4 }} aria-hidden>
      {Array.from({ length: 10 }, (_, i) => {
        const a = (i / 10) * Math.PI * 2;
        return (
          <motion.span
            key={i}
            className="absolute h-1.5 w-1.5 rounded-full bg-amber"
            initial={{ x: 0, y: 0, scale: 1 }}
            animate={{ x: Math.cos(a) * 60, y: Math.sin(a) * 26, scale: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
          />
        );
      })}
      <motion.span className="font-mono text-sm font-bold text-amber" initial={{ y: 0 }} animate={{ y: -22 }} transition={{ duration: 0.8 }}>
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

  if (!a) return <h1 className="text-2xl font-semibold">{t("nav.quests")}</h1>;

  const quests = dailyQuests(a, mode);
  const auto = autoCompleted(readings.filter((r) => r.memberId === memberId && r.day === today));
  const isDone = (q: Quest) => auto.has(q.kind) || ticked.includes(q.id);
  const manualXp = quests.filter((q) => ticked.includes(q.id) && !auto.has(q.kind)).reduce((s, q) => s + q.xp, 0);
  const mine = progressByMember[memberId] ? questProgress(readings.filter((r) => r.memberId === memberId), today, manualXp) : null;
  const goal = crewGoal(progressByMember, today);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">{t("nav.quests")}</h1>
          <p className="max-w-2xl text-sm text-muted">{t("quests.intro")}</p>
        </div>
        <CrewSwitcher />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
        <section className="space-y-3 rounded-xl border border-line bg-panel p-4">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted">{t("quests.today")}</h2>
          <ul className="space-y-2" data-testid="quest-list">
            {quests.map((q) => {
              const done = isDone(q);
              const locked = auto.has(q.kind);
              const reason = q.reason ? a.alerts.find((x) => x.ruleId === q.reason)?.title : null;
              return (
                <li key={q.id} className="relative">
                  <label className={`flex min-h-14 cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors ${done ? "border-ok/40 bg-ok/10" : "border-line hover:border-muted"}`}>
                    <input
                      type="checkbox"
                      checked={done}
                      disabled={locked}
                      onChange={() => {
                        if (!ticked.includes(q.id)) setBurst({ id: q.id, n: (burst?.n ?? 0) + 1 });
                        toggle(q.id);
                      }}
                      className="h-6 w-6 shrink-0 accent-ok"
                    />
                    <span className="flex-1">
                      <span className={done ? "text-muted line-through" : ""}>{t(`quest.${q.kind}` as MessageKey)}</span>
                      {locked && <span className="block text-xs text-ok">✓ {t("quests.verified")}</span>}
                      {reason && <span className="block text-xs text-amber">↳ {t("quests.because", { reason })}</span>}
                    </span>
                    <span className="font-mono text-sm text-amber">+{q.xp}</span>
                  </label>
                  <AnimatePresence>{burst?.id === q.id && <Burst key={burst.n} xp={q.xp} />}</AnimatePresence>
                </li>
              );
            })}
          </ul>
        </section>

        <div className="space-y-4">
          {mine && (
            <section className="space-y-3 rounded-xl border border-line bg-panel p-4" data-testid="quest-level">
              <p className="text-2xl font-semibold">⭐ {t("quests.level", { n: mine.level })}</p>
              <div className="h-3 overflow-hidden rounded-full bg-line" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(mine.levelProgress * 100)}>
                <motion.div className="h-full bg-amber" animate={{ width: `${mine.levelProgress * 100}%` }} />
              </div>
              <p className="font-mono text-xs text-muted">{t("quests.xp", { xp: mine.xp, next: LEVEL_XP - (mine.xp % LEVEL_XP) })}</p>
              <dl className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <dt className="text-xs text-muted">🔥 {t("quests.checkinStreak")}</dt>
                  <dd className="font-mono text-xl">{t("quests.days", { n: mine.checkinStreak })}</dd>
                </div>
                {mode === "space" && (
                  <div>
                    <dt className="text-xs text-muted">🏋 {t("quests.exerciseStreak")}</dt>
                    <dd className="font-mono text-xl" data-testid="exercise-streak">{t("quests.days", { n: mine.exerciseStreak })}</dd>
                  </div>
                )}
              </dl>
            </section>
          )}

          {members.length > 1 && (
            <section className="space-y-3 rounded-xl border border-line bg-panel p-4" data-testid="crew-goal">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-muted">{t("quests.crewGoal")}</h2>
              <div className="relative h-4 overflow-hidden rounded-full bg-line">
                <motion.div className={`h-full ${goal.pct >= REWARD_PCT ? "bg-ok" : "bg-accent"}`} animate={{ width: `${goal.pct * 100}%` }} />
                <div className="absolute inset-y-0 w-0.5 bg-fg/60" style={{ left: `${REWARD_PCT * 100}%` }} aria-hidden />
              </div>
              <p className="text-sm">{t("quests.crewGoalText", { done: goal.done, possible: goal.possible })} · <span className="font-mono">{Math.round(goal.pct * 100)}%</span></p>
              <p className={`text-sm ${goal.pct >= REWARD_PCT ? "font-semibold text-ok" : "text-muted"}`}>{t(goal.pct >= REWARD_PCT ? "quests.unlocked" : "quests.reward")}</p>
              <h3 className="pt-1 text-xs text-muted">{t("quests.contribution")}</h3>
              <ul className="space-y-1.5">
                {members.map((m) => {
                  const n = goal.byMember[m.id] ?? 0;
                  const max = goal.possible / members.length || 1;
                  return (
                    <li key={m.id} className="flex items-center gap-2 text-sm">
                      <Avatar shape={m.avatar} size={20} />
                      <span className="w-20 font-mono text-xs">{labels.memberName(m)}</span>
                      <span className="h-2 flex-1 overflow-hidden rounded-full bg-line">
                        <span className="block h-full bg-accent" style={{ width: `${(n / max) * 100}%` }} />
                      </span>
                      <span className="w-8 text-right font-mono text-xs">{n}</span>
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
