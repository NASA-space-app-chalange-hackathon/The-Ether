"use client";

import { TriangleAlert } from "lucide-react";
import { useT } from "@/lib/state/useAppState";

/** Permanent, always-visible disclaimer (contest + safety requirement). */
export function DisclaimerBar() {
  const t = useT();
  return (
    <div role="note" className="border-b border-line bg-panel">
      <p className="mx-auto flex max-w-6xl items-center justify-center gap-2 px-4 py-1.5 text-center text-xs text-muted">
        <TriangleAlert size={12} strokeWidth={2.25} className="shrink-0 text-amber" />
        {t("disclaimer")}
      </p>
    </div>
  );
}
