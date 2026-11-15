"use client";

import { useMemo } from "react";
import { EVENTS_MN, MEMBERS_MN, ROLES_MN } from "@/content/labels-mn";
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

function eventLabel(e: MissionEvent, locale: "en" | "mn"): string {
  if (e.real?.source === "DONKI") return t("event.donki", locale, { date: formatDate(e.real.realDate, locale), day: e.day });
  if (e.real?.source === "POWER" && e.real.tMin !== undefined) {
    return t("event.power", locale, { date: formatDate(e.real.realDate, locale), tMin: formatTemp(e.real.tMin), day: e.day });
  }
  return locale === "mn" ? (EVENTS_MN[e.kind] ?? e.label) : e.label;
}

/** Localized display labels for indicators, events, and members. */
export function useLabels() {
  const { locale } = useAppState();
  return useMemo(
    () => ({
      indicator: (id: IndicatorId) => indicatorLabel(id, locale),
      event: (e: MissionEvent) => eventLabel(e, locale),
      memberName: (m: Pick<DatasetMember, "id" | "name">) => (locale === "mn" ? (MEMBERS_MN[m.id]?.name ?? m.name) : m.name),
      memberRole: (m: Pick<DatasetMember, "id" | "role">) =>
        locale === "mn" ? (MEMBERS_MN[m.id]?.role ?? ROLES_MN[m.role] ?? m.role) : m.role,
    }),
    [locale],
  );
}
