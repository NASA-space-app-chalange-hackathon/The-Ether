"use client";

import Link from "next/link";
import type { Alert } from "@/lib/engine/types";
import { useT } from "@/lib/state/useAppState";
import { StatusBadge, TierBadge } from "@/components/ui/Badges";
import { STATUS_STYLE } from "@/components/ui/status";

/** Compact alert row for Home and the crew view; links into the Action Center. */
export function AlertSummary({ alert }: { alert: Alert }) {
  const t = useT();
  return (
    <li>
      <Link
        href={`/alerts#${encodeURIComponent(alert.id)}`}
        className={`block rounded-lg border-l-4 bg-panel-2 px-3 py-2 transition-colors hover:bg-line/60 focus-visible:outline-2 focus-visible:outline-accent ${STATUS_STYLE[alert.severity].border}`}
      >
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={alert.severity} />
          <span className="font-semibold">{alert.title}</span>
          <span className="ml-auto"><TierBadge tier={alert.tier} /></span>
        </div>
        <p className="mt-1 line-clamp-2 text-sm text-muted">{alert.whatChanged}</p>
        <p className="mt-0.5 font-mono text-xs text-muted">{t("home.since", { day: alert.sinceDay })}</p>
      </Link>
    </li>
  );
}
