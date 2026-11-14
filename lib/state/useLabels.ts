"use client";

import { useMemo } from "react";
import { EVENTS_MN, MEMBERS_MN, ROLES_MN } from "@/content/labels-mn";
import type { DatasetMember, MissionEvent } from "@/lib/data/dataset";
import type { IndicatorId } from "@/lib/engine/types";
import { indicatorLabel } from "@/lib/i18n/alerts";
import { useAppState } from "./useAppState";

/** Localized display labels for indicators, events, and members. */
export function useLabels() {
  const { locale } = useAppState();
  return useMemo(
    () => ({
      indicator: (id: IndicatorId) => indicatorLabel(id, locale),
      event: (e: MissionEvent) => (locale === "mn" ? (EVENTS_MN[e.kind] ?? e.label) : e.label),
      memberName: (m: Pick<DatasetMember, "id" | "name">) => (locale === "mn" ? (MEMBERS_MN[m.id]?.name ?? m.name) : m.name),
      memberRole: (m: Pick<DatasetMember, "id" | "role">) =>
        locale === "mn" ? (MEMBERS_MN[m.id]?.role ?? ROLES_MN[m.role] ?? m.role) : m.role,
    }),
    [locale],
  );
}
