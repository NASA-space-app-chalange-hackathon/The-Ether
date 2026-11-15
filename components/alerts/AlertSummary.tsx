"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";
import type { Alert } from "@/lib/engine/types";
import type { MessageKey } from "@/lib/i18n";
import { useT } from "@/lib/state/useAppState";
import { StatusIcon, TierBadge } from "@/components/ui/Badges";
import { STATUS_STYLE } from "@/components/ui/status";

/** Compact alert row for Home and the crew view; links into the Action Center. */
export function AlertSummary({ alert }: { alert: Alert }) {
  const t = useT();
  return (
    <li>
      <Link
        href={`/alerts#${encodeURIComponent(alert.id)}`}
        className="group relative block overflow-hidden rounded-lg border border-line bg-panel-2/40 py-2.5 pl-4 pr-3 transition-[background-color,border-color] duration-150 hover:border-line-strong hover:bg-panel-2"
      >
        <span aria-hidden className="absolute inset-y-2.5 left-0 w-0.5 rounded-r-full" style={{ backgroundColor: STATUS_STYLE[alert.severity].fill }} />
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <StatusIcon status={alert.severity} />
          <span className="sr-only">{t(`status.${alert.severity}` as MessageKey)}:</span>
          <span className="font-medium">{alert.title}</span>
          <span className="ml-auto flex items-center gap-1.5">
            <TierBadge tier={alert.tier} />
            <ChevronRight size={14} className="text-muted transition-transform duration-150 group-hover:translate-x-0.5" />
          </span>
        </div>
        <p className="mt-1 line-clamp-2 text-sm text-muted">{alert.whatChanged}</p>
        <p className="mt-1 font-mono text-[11px] text-muted">{t("home.since", { day: alert.sinceDay })}</p>
      </Link>
    </li>
  );
}
