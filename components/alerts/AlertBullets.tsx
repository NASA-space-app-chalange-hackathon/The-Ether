"use client";

import type { Alert } from "@/lib/engine/types";
import { alertSummary } from "@/lib/i18n/alerts";
import { useAppState } from "@/lib/state/useAppState";
import { useLabels } from "@/lib/state/useLabels";

/** Plain headline + 1–3 short bullet lines for an alert (the full numbers live in the Action Center). */
export function useAlertSummary(alert: Alert) {
  const { locale, mode } = useAppState();
  const labels = useLabels();
  return alertSummary(alert, locale, mode, labels.indicator);
}

export function AlertBullets({ alert, className = "" }: { alert: Alert; className?: string }) {
  const { bullets } = useAlertSummary(alert);
  return (
    <ul className={`space-y-0.5 text-sm ${className}`} data-testid="alert-bullets">
      {bullets.map((b) => (
        <li key={b} className="flex gap-2">
          <span aria-hidden className="mt-[0.55em] h-1 w-1 shrink-0 rounded-full bg-muted" />
          <span>{b}</span>
        </li>
      ))}
    </ul>
  );
}

export function AlertHeadline({ alert, className = "" }: { alert: Alert; className?: string }) {
  const { headline } = useAlertSummary(alert);
  return (
    <span className={className} data-testid="alert-headline">
      {headline}
    </span>
  );
}
