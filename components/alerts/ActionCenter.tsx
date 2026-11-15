"use client";

import { CircleCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { CrewSwitcher } from "@/components/home/CrewSwitcher";
import { PageHeader } from "@/components/ui/PageHeader";
import { Segmented } from "@/components/ui/Segmented";
import type { DatasetMember } from "@/lib/data/dataset";
import { useAssessment, useMission } from "@/lib/state/DataProvider";
import { useAppState, useT } from "@/lib/state/useAppState";
import { useLabels } from "@/lib/state/useLabels";
import { AlertCard } from "./AlertCard";

function MemberAlerts({ member }: { member: DatasetMember }) {
  const a = useAssessment(member.id);
  const labels = useLabels();
  if (!a) return null;
  return (
    <>
      {a.alerts.map((alert) => (
        <AlertCard key={alert.id} alert={alert} memberName={labels.memberName(member)} />
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
    <div className="space-y-6">
      <PageHeader title={t("nav.alerts")} intro={t("alerts.intro")}>
        <CrewSwitcher />
      </PageHeader>
      {members.length > 1 && (
        <Segmented
          label={t("alerts.scope")}
          value={scope}
          onChange={setScope}
          options={[
            { value: "member", label: t("alerts.scopeMember") },
            { value: "crew", label: t("alerts.scopeCrew") },
          ]}
        />
      )}
      <div className="space-y-4" data-testid="alert-list">
        {shown.map((m) => (
          <MemberAlerts key={m.id} member={m} />
        ))}
        {scope === "member" && a && count === 0 && (
          <p className="surface flex items-center gap-2.5 p-4 text-sm text-ok">
            <CircleCheck size={16} strokeWidth={2.25} />
            {t("alerts.none")}
          </p>
        )}
      </div>
    </div>
  );
}
