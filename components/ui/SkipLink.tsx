"use client";

import { useT } from "@/lib/state/useAppState";

export function SkipLink() {
  const t = useT();
  return (
    <a href="#content" className="sr-only z-50 rounded-lg bg-accent px-4 py-2 font-semibold text-bg focus:not-sr-only focus:fixed focus:left-4 focus:top-4">
      {t("a11y.skip")}
    </a>
  );
}
