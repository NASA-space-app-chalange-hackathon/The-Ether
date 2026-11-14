"use client";

import { useT } from "@/lib/state/useAppState";

/** Permanent, always-visible disclaimer (contest + safety requirement). */
export function DisclaimerBar() {
  const t = useT();
  return (
    <div role="note" className="bg-amber/15 text-amber border-b border-amber/30">
      <p className="mx-auto max-w-6xl px-4 py-1.5 text-center text-xs font-medium">
        <span aria-hidden>⚠ </span>
        {t("disclaimer")}
      </p>
    </div>
  );
}
