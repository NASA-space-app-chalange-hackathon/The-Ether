"use client";

import { ArrowUpRight, BadgeCheck } from "lucide-react";
import type { FeedStatus } from "@/lib/nasa/feeds";
import { useT } from "@/lib/state/useAppState";

/**
 * Small "Real NASA data" marker with an optional source link. Everything without it is
 * simulated crew data. `status` says whether the numbers came live or from the committed snapshot.
 */
export function RealDataBadge({ source, href, status, className = "" }: { source?: string; href?: string; status?: FeedStatus; className?: string }) {
  const t = useT();
  return (
    <span className={`inline-flex flex-wrap items-center gap-x-2 gap-y-1 text-xs ${className}`} data-testid="real-data-badge">
      <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-md px-1.5 py-0.5 font-medium text-accent ring-1 ring-inset ring-accent/30">
        <BadgeCheck size={12} strokeWidth={2.25} />
        {t("real.badge")}
      </span>
      {source &&
        (href ? (
          <a href={href} target="_blank" rel="noreferrer" className="link group inline-flex items-center gap-0.5">
            {source}
            <ArrowUpRight size={11} strokeWidth={2} className="opacity-60 transition-transform duration-150 group-hover:-translate-y-px group-hover:translate-x-px group-hover:opacity-100" />
          </a>
        ) : (
          <span className="text-muted">{source}</span>
        ))}
      {status && <span className="text-muted">{t(status === "live" ? "real.live" : "real.snapshot")}</span>}
    </span>
  );
}
