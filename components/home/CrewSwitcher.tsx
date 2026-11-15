"use client";

import { Avatar } from "@/components/ui/Avatar";
import { useAssessment, useMission } from "@/lib/state/DataProvider";
import { useAppState, useT } from "@/lib/state/useAppState";
import type { DatasetMember } from "@/lib/data/dataset";
import { useLabels } from "@/lib/state/useLabels";

function MemberButton({ member, selected, onSelect }: { member: DatasetMember; selected: boolean; onSelect: () => void }) {
  const a = useAssessment(member.id);
  const labels = useLabels();
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={`flex min-h-12 items-center gap-2.5 rounded-lg border py-1.5 pl-2 pr-3 text-left transition-[background-color,border-color,transform] duration-150 active:scale-[0.98] ${
        selected ? "border-line-strong bg-panel-2 shadow-[inset_0_1px_0_rgb(255_255_255/0.04)]" : "border-line bg-panel hover:border-line-strong"
      }`}
    >
      <Avatar shape={member.avatar} status={a?.overall} size={26} />
      <span className="leading-tight">
        <span className={`block font-mono text-[13px] font-medium ${selected ? "text-fg" : "text-fg/80"}`}>{labels.memberName(member)}</span>
        <span className="block text-xs text-muted">{labels.memberRole(member)}</span>
      </span>
    </button>
  );
}

export function CrewSwitcher() {
  const t = useT();
  const { members } = useMission();
  const { memberId, setMemberId } = useAppState();
  if (members.length < 2) return null;
  return (
    <div role="group" aria-label={t("home.crew")} className="flex flex-wrap gap-1.5">
      {members.map((m) => (
        <MemberButton key={m.id} member={m} selected={m.id === memberId} onSelect={() => setMemberId(m.id)} />
      ))}
    </div>
  );
}
