"use client";

import { ArrowLeftRight, CircleCheck, Handshake, Lock } from "lucide-react";
import { useState } from "react";
import { AlertSummary } from "@/components/alerts/AlertSummary";
import { Avatar } from "@/components/ui/Avatar";
import { StatusBadge, StatusIcon, TierBadge } from "@/components/ui/Badges";
import { PageHeader } from "@/components/ui/PageHeader";
import { Segmented } from "@/components/ui/Segmented";
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
    <li className="surface relative space-y-4 overflow-hidden p-5" data-testid="crew-card" data-member={member.id}>
      <span aria-hidden className="absolute inset-x-0 top-0 h-px" style={{ background: `linear-gradient(to right, transparent, ${STATUS_STYLE[a.overall].fill}, transparent)` }} />
      <header className="flex items-center gap-3">
        <Avatar shape={member.avatar} status={a.overall} size={36} />
        <div className="flex-1">
          <p className="font-mono text-sm font-medium">{labels.memberName(member)}</p>
          <p className="text-xs text-muted">{labels.memberRole(member)}</p>
        </div>
        <StatusBadge status={a.overall} size="lg" />
      </header>
      <ul className="flex flex-wrap gap-1" aria-label={t("home.regions")}>
        {regionIdsFor(mode).map((id) => {
          const s = STATUS_STYLE[regions[id]];
          return (
            <li key={id} title={t(`region.${id}` as MessageKey)} className={`grid h-8 w-8 place-items-center rounded-md ring-1 ring-inset ${s.ring} ${s.bg}`}>
              <StatusIcon status={regions[id]} size={13} />
              <span className="sr-only">{t(`region.${id}` as MessageKey)}: {t(`status.${regions[id]}` as MessageKey)}</span>
            </li>
          );
        })}
      </ul>
      <div className="space-y-2">
        <p className="eyebrow">{t("crew.alerts")}</p>
        <div className="flex flex-wrap gap-x-4 gap-y-2">
          {(["SELF", "CMO", "EARTH"] as const).map((tier) => (
            <span key={tier} className="flex items-center gap-1.5">
              <TierBadge tier={tier} />
              <span className="font-mono text-sm text-fg" data-testid={`count-${tier}`}>{byTier(tier)}</span>
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
          <p className="flex items-center gap-2 text-sm text-ok">
            <CircleCheck size={14} strokeWidth={2.25} />
            {t("crew.noAlerts")}
          </p>
        )
      ) : (
        <p className="flex items-center gap-2.5 rounded-lg border border-dashed border-line-strong p-3 text-sm text-muted" data-testid="crew-private">
          <Lock size={14} strokeWidth={2} className="shrink-0" />
          {t("crew.private")}
        </p>
      )}
      {member.sharesDetails && viewer === "crew" && (
        <p className="flex items-center gap-1.5 text-xs text-muted">
          <ArrowLeftRight size={12} strokeWidth={2} />
          {t("crew.shares")}
        </p>
      )}
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
    <section className="surface space-y-3 p-5" data-testid="cohesion">
      <h2 className="eyebrow flex items-center gap-1.5">
        <Handshake size={12} strokeWidth={2} />
        {t("crew.cohesion")}
      </h2>
      <div className="track">
        <div className={`absolute inset-0 origin-left transition-transform duration-300 ease-smooth ${recent < base - 0.5 ? "bg-amber" : "bg-ok"}`} style={{ transform: `scaleX(${pct / 100})` }} />
      </div>
      <p className="font-mono text-sm text-fg/90">{t("crew.cohesionText", { avg: recent.toFixed(1), base: base.toFixed(1) })}</p>
    </section>
  );
}

export function CrewScreen() {
  const t = useT();
  const { members } = useMission();
  const [viewer, setViewer] = useState<Viewer>("crew");
  return (
    <div className="space-y-6">
      <PageHeader title={t("nav.crew")} intro={t("crew.intro")}>
        <Segmented
          label={t("crew.viewer")}
          value={viewer}
          onChange={setViewer}
          options={[
            { value: "crew", label: t("crew.asCrew") },
            { value: "cmo", label: t("crew.asCmo") },
          ]}
        />
      </PageHeader>
      <Cohesion />
      <ul className="grid gap-4 md:grid-cols-2">
        {members.map((m) => (
          <MemberCard key={m.id} member={m} viewer={viewer} />
        ))}
      </ul>
    </div>
  );
}
