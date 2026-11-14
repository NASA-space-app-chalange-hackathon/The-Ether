"use client";

import { Avatar } from "@/components/ui/Avatar";
import { useAssessment, useMission } from "@/lib/state/DataProvider";
import { useAppState, useT } from "@/lib/state/useAppState";
import type { DatasetMember } from "@/lib/data/dataset";

function MemberButton({ member, selected, onSelect }: { member: DatasetMember; selected: boolean; onSelect: () => void }) {
  const a = useAssessment(member.id);
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={`flex min-h-12 items-center gap-2 rounded-lg border px-3 py-1.5 text-left transition-colors focus-visible:outline-2 focus-visible:outline-accent ${
        selected ? "border-accent bg-accent/10" : "border-line bg-panel hover:border-muted"
      }`}
    >
      <Avatar shape={member.avatar} status={a?.overall} size={28} />
      <span className="leading-tight">
        <span className="block font-mono text-sm font-semibold">{member.name}</span>
        <span className="block text-xs text-muted">{member.role}</span>
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
    <div role="group" aria-label={t("home.crew")} className="flex flex-wrap gap-2">
      {members.map((m) => (
        <MemberButton key={m.id} member={m} selected={m.id === memberId} onSelect={() => setMemberId(m.id)} />
      ))}
    </div>
  );
}
