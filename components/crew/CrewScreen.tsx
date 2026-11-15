"use client";

import { useState } from "react";
import { AlertSummary } from "@/components/alerts/AlertSummary";
import { Avatar } from "@/components/ui/Avatar";
import { StatusBadge, TierBadge } from "@/components/ui/Badges";
import { STATUS_STYLE } from "@/components/ui/status";
import type { DatasetMember } from "@/lib/data/dataset";
import { allRegionStatuses, regionIdsFor } from "@/lib/engine/regions";
import type { Tier } from "@/lib/engine/types";
import type { MessageKey } from "@/lib/i18n";
import { useAssessment, useData, useMission } from "@/lib/state/DataProvider";
import { useAppState, useT } from "@/lib/state/useAppState";
import { useLabels } from "@/lib/state/useLabels";

type Viewer = "crew" | "cmo";

function MemberCard({ member, viewer }: { member: DatasetMember; viewer: Viewer }) {
  const t = useT();
  const a = useAssessment(member.id);
  const labels = useLabels();
  const { mode } = useAppState();
  if (!a) return null;
  const regions = allRegionStatuses(a);
  const details = viewer === "cmo" || member.sharesDetails;
  const byTier = (tier: Tier) => a.alerts.filter((x) => x.tier === tier).length;
  return (
    <li className={`space-y-3 rounded-xl border bg-panel p-4 ${STATUS_STYLE[a.overall].border}`} data-testid="crew-card" data-member={member.id}>
      <header className="flex items-center gap-3">
        <Avatar shape={member.avatar} status={a.overall} size={40} />
        <div className="flex-1">
          <p className="font-mono font-semibold">{labels.memberName(member)}</p>
          <p className="text-xs text-muted">{labels.memberRole(member)}</p>
        </div>
        <StatusBadge status={a.overall} size="lg" />
      </header>
      <ul className="flex flex-wrap gap-1.5" aria-label={t("home.regions")}>
        {regionIdsFor(mode).map((id) => {
          const s = STATUS_STYLE[regions[id]];
          return (
            <li key={id} title={t(`region.${id}` as MessageKey)} className={`grid h-8 w-8 place-items-center rounded-md border text-sm ${s.border} ${s.bg} ${s.text}`}>
              <span aria-hidden>{s.icon}</span>
              <span className="sr-only">{t(`region.${id}` as MessageKey)}: {t(`status.${regions[id]}` as MessageKey)}</span>
            </li>
          );
        })}
      </ul>
      <div className="space-y-1">
        <p className="text-xs uppercase tracking-widest text-muted">{t("crew.alerts")}</p>
        <div className="flex flex-wrap gap-2">
          {(["SELF", "CMO", "EARTH"] as const).map((tier) => (
            <span key={tier} className="flex items-center gap-1.5">
              <TierBadge tier={tier} />
              <span className="font-mono text-sm" data-testid={`count-${tier}`}>{byTier(tier)}</span>
            </span>
          ))}
        </div>
      </div>
      {details ? (
        a.alerts.length ? (
          <ul className="space-y-2" data-testid="crew-details">
            {a.alerts.slice(0, 3).map((x) => (
              <AlertSummary key={x.id} alert={x} />
            ))}
          </ul>
        ) : (
          <p className="text-sm text-ok">✓ {t("crew.noAlerts")}</p>
        )
      ) : (
        <p className="rounded-lg border border-dashed border-line p-3 text-sm text-muted" data-testid="crew-private">🔒 {t("crew.private")}</p>
      )}
      {member.sharesDetails && viewer === "crew" && <p className="text-xs text-muted">↔ {t("crew.shares")}</p>}
    </li>
  );
}

function Cohesion() {
  const t = useT();
  const { day } = useAppState();
  const { members, maxDay } = useMission();
  const { readings } = useData();
  const today = Math.min(day, maxDay);
  const ids = new Set(members.map((m) => m.id));
  const pulse = readings.filter((r) => r.indicator === "crewPulse" && ids.has(r.memberId));
  const avg = (rs: typeof pulse) => (rs.length ? rs.reduce((s, r) => s + r.value, 0) / rs.length : null);
  const recent = avg(pulse.filter((r) => r.day > today - 7 && r.day <= today));
  const base = avg(pulse.filter((r) => r.day < 14));
  if (recent === null || base === null) return null;
  const pct = (recent / 5) * 100;
  return (
    <section className="space-y-2 rounded-xl border border-line bg-panel p-4" data-testid="cohesion">
      <h2 className="text-xs font-semibold uppercase tracking-widest text-muted">🤝 {t("crew.cohesion")}</h2>
      <div className="h-3 overflow-hidden rounded-full bg-line">
        <div className={`h-full ${recent < base - 0.5 ? "bg-amber" : "bg-ok"}`} style={{ width: `${pct}%` }} />
      </div>
      <p className="font-mono text-sm">{t("crew.cohesionText", { avg: recent.toFixed(1), base: base.toFixed(1) })}</p>
    </section>
  );
}

export function CrewScreen() {
  const t = useT();
  const { members } = useMission();
  const [viewer, setViewer] = useState<Viewer>("crew");
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">{t("nav.crew")}</h1>
          <p className="max-w-2xl text-sm text-muted">{t("crew.intro")}</p>
        </div>
        <div role="radiogroup" aria-label={t("crew.viewer")} className="flex rounded-lg border border-line p-0.5 text-sm">
          {(["crew", "cmo"] as const).map((v) => (
            <button key={v} type="button" role="radio" aria-checked={viewer === v} onClick={() => setViewer(v)} className="min-h-10 rounded-md px-4 aria-checked:bg-accent/15 aria-checked:text-accent">
              {t(v === "crew" ? "crew.asCrew" : "crew.asCmo")}
            </button>
          ))}
        </div>
      </div>
      <Cohesion />
      <ul className="grid gap-4 md:grid-cols-2">
        {members.map((m) => (
          <MemberCard key={m.id} member={m} viewer={viewer} />
        ))}
      </ul>
    </div>
  );
}
