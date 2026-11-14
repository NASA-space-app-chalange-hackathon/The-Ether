"use client";

import type { MessageKey } from "@/lib/i18n";
import { useT } from "@/lib/state/useAppState";

export function PlaceholderPage({ titleKey }: { titleKey: MessageKey }) {
  const t = useT();
  return (
    <section className="space-y-2">
      <h1 className="text-2xl font-semibold">{t(titleKey)}</h1>
      <p className="text-muted">{t("page.comingSoon")}</p>
    </section>
  );
}
