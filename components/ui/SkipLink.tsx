"use client";

import { useT } from "@/lib/state/useAppState";

export function SkipLink() {
  const t = useT();
  return (
    <a href="#content" className="btn btn-primary sr-only z-50 focus:not-sr-only focus:fixed focus:left-4 focus:top-4">
      {t("a11y.skip")}
    </a>
  );
}
