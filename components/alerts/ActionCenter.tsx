"use client";

import { useEffect, useState } from "react";
import { CrewSwitcher } from "@/components/home/CrewSwitcher";
import type { DatasetMember } from "@/lib/data/dataset";
import { useAssessment, useMission } from "@/lib/state/DataProvider";
import { useAppState, useT } from "@/lib/state/useAppState";
import { AlertCard } from "./AlertCard";

function MemberAlerts({ member }: { member: DatasetMember }) {
  const a = useAssessment(member.id);
  if (!a) return null;
  return (
    <>
      {a.alerts.map((alert) => (
        <AlertCard key={alert.id} alert={alert} memberName={member.name} />
      ))}
    </>
  );
}

export function ActionCenter() {
  const t = useT();
  const { members } = useMission();
  const { memberId } = useAppState();
  const [scope, setScope] = useState<"member" | "crew">("member");
  const selected = members.find((m) => m.id === memberId);
  const shown = scope === "crew" ? members : selected ? [selected] : [];
  const a = useAssessment();
  const count = a?.alerts.length ?? 0;

  // Deep links from Home (/alerts#<alert id>) arrive before the data does.
  useEffect(() => {
    const id = decodeURIComponent(window.location.hash.slice(1));
    if (id) document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [count]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">{t("nav.alerts")}</h1>
          <p className="max-w-xl text-sm text-muted">{t("alerts.intro")}</p>
        </div>
        <CrewSwitcher />
      </div>
      {members.length > 1 && (
        <div role="radiogroup" aria-label={t("alerts.scope")} className="flex w-fit rounded-lg border border-line p-0.5 text-sm">
          {(["member", "crew"] as const).map((s) => (
            <button key={s} type="button" role="radio" aria-checked={scope === s} onClick={() => setScope(s)} className="min-h-10 rounded-md px-4 aria-checked:bg-accent/15 aria-checked:text-accent">
              {t(s === "member" ? "alerts.scopeMember" : "alerts.scopeCrew")}
            </button>
          ))}
        </div>
      )}
      <div className="space-y-4" data-testid="alert-list">
        {shown.map((m) => (
          <MemberAlerts key={m.id} member={m} />
        ))}
        {scope === "member" && a && count === 0 && <p className="rounded-xl border border-ok/30 bg-ok/10 p-4 text-ok">✓ {t("alerts.none")}</p>}
      </div>
    </div>
  );
}
