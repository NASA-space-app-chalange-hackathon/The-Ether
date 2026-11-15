"use client";

import { useMemo } from "react";
import { EVENTS_MN, EVENTS_SPACE_MN, MEMBERS_MN, ROLES_MN } from "@/content/labels-mn";
import type { DatasetMember, MissionEvent } from "@/lib/data/dataset";
import type { IndicatorId } from "@/lib/engine/types";
import { t } from "@/lib/i18n";
import { indicatorLabel } from "@/lib/i18n/alerts";
import { formatDate } from "@/lib/i18n/date";
import { useAppState } from "./useAppState";

/** "−34.1" with a typographic minus. */
export function formatTemp(c: number): string {
  return `${c < 0 ? "−" : ""}${Math.abs(c).toFixed(1)}`;
}

function eventLabel(e: MissionEvent, locale: "en" | "mn", mode: "space" | "steppe"): string {
  if (e.real?.source === "DONKI") return t("event.donki", locale, { date: formatDate(e.real.realDate, locale), day: e.day });
  if (e.real?.source === "POWER" && e.real.tMin !== undefined) {
    return t("event.power", locale, { date: formatDate(e.real.realDate, locale), tMin: formatTemp(e.real.tMin), day: e.day });
  }
  if (locale === "en") return e.label;
  return (mode === "space" ? EVENTS_SPACE_MN : EVENTS_MN)[e.kind] ?? e.label;
}

/** Localized display labels for indicators, events, and members. */
export function useLabels() {
  const { locale, mode } = useAppState();
  return useMemo(
    () => ({
      indicator: (id: IndicatorId) => (id === "crewPulse" && mode === "steppe" ? t("ind.crewPulseSteppe", locale) : indicatorLabel(id, locale)),
      event: (e: MissionEvent) => eventLabel(e, locale, mode),
      memberName: (m: Pick<DatasetMember, "id" | "name">) => (locale === "mn" ? (MEMBERS_MN[m.id]?.name ?? m.name) : m.name),
      memberRole: (m: Pick<DatasetMember, "id" | "role">) =>
        locale === "mn" ? (MEMBERS_MN[m.id]?.role ?? ROLES_MN[m.role] ?? m.role) : m.role,
    }),
    [locale, mode],
  );
}
