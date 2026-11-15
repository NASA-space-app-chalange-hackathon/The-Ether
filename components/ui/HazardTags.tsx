"use client";

import Link from "next/link";
import { HAZARDS_MN } from "@/content/learn";
import { HAZARDS } from "@/content/risks";
import type { HazardId } from "@/lib/engine/hazards";
import { useAppState, useT } from "@/lib/state/useAppState";
import { HAZARD_ICON } from "./icons";

export function hazardName(id: HazardId, locale: "en" | "mn"): string {
  return locale === "mn" ? HAZARDS_MN[id].name : HAZARDS.find((h) => h.id === id)!.name;
}

/**
 * Subtle labels naming the NASA HRP hazard(s) behind an alert, indicator or body system.
 * Each links to that hazard on the Learn page. Space mode only: on the steppe the
 * same problems are told as herder risks instead.
 */
export function HazardTags({ ids, className = "" }: { ids: readonly HazardId[]; className?: string }) {
  const t = useT();
  const { mode, locale } = useAppState();
  if (mode !== "space" || ids.length === 0) return null;
  return (
    <ul className={`flex flex-wrap items-center gap-1 ${className}`} aria-label={t("hazard.label")} data-testid="hazard-tags">
      {ids.map((id) => {
        const Icon = HAZARD_ICON[id];
        return (
          <li key={id}>
            <Link
              href={`/learn#hazard-${id}`}
              title={t("hazard.tooltip", { hazard: hazardName(id, locale) })}
              className="inline-flex items-center gap-1 whitespace-nowrap rounded-md px-1.5 py-0.5 text-[11px] text-muted ring-1 ring-inset ring-line transition-colors duration-150 hover:text-fg hover:ring-line-strong"
            >
              <Icon size={11} strokeWidth={2} />
              {hazardName(id, locale)}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
