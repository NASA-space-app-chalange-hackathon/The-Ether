"use client";

import { MousePointerClick, Radiation } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { CrewSwitcher } from "@/components/home/CrewSwitcher";
import { StatusIcon } from "@/components/ui/Badges";
import { PageHeader } from "@/components/ui/PageHeader";
import { Segmented } from "@/components/ui/Segmented";
import { allRegionStatuses, regionIdsFor, type RegionId } from "@/lib/engine/regions";
import type { MessageKey } from "@/lib/i18n";
import { motionTokens } from "@/lib/motion-tokens";
import { useAssessment } from "@/lib/state/DataProvider";
import { useAppState, useT } from "@/lib/state/useAppState";
import { BodyFigure, type BodySide } from "./BodyFigure";
import { RegionPanel } from "./RegionPanel";

const FRONT_ONLY: readonly RegionId[] = ["eyes", "heart", "gut"];
const { duration, easing, distance } = motionTokens;

function isRegion(v: string | null, ids: readonly RegionId[]): v is RegionId {
  return v !== null && (ids as readonly string[]).includes(v);
}

export function BodyScreen() {
  const t = useT();
  const { mode } = useAppState();
  const params = useSearchParams();
  const regionIds = regionIdsFor(mode);
  const initial = params.get("region");
  const [chosen, setSelected] = useState<RegionId | null>(isRegion(initial, regionIds) ? initial : null);
  // A region from the other mode (e.g. eyes after switching to Steppe) is simply not shown.
  const selected = chosen && regionIds.includes(chosen) ? chosen : null;
  const [side, setSide] = useState<BodySide>("front");
  const [radiation, setRadiation] = useState(initial === "radiation");
  const a = useAssessment();
  const statuses = a ? allRegionStatuses(a) : null;

  const select = (id: RegionId) => {
    setSelected(id);
    if (id === "radiation") setRadiation(true);
    if (side === "back" && FRONT_ONLY.includes(id)) setSide("front");
  };

  return (
    <div className="space-y-6">
      <PageHeader title={t("nav.body")}>
        <CrewSwitcher />
      </PageHeader>
      {a && statuses && (
        <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
          <section className="surface space-y-4 p-4 sm:p-5">
            <div className="flex flex-wrap items-center gap-3">
              <Segmented
                label={t("body.view")}
                value={side}
                onChange={setSide}
                options={[
                  { value: "front", label: t("body.front") },
                  { value: "back", label: t("body.back") },
                ]}
              />
              {mode === "space" && (
                <label className="ml-auto flex min-h-10 cursor-pointer items-center gap-2.5 rounded-lg px-2 text-sm text-muted transition-colors duration-150 hover:text-fg">
                  <input type="checkbox" checked={radiation} onChange={(e) => setRadiation(e.target.checked)} className="checkbox" />
                  <Radiation size={14} strokeWidth={2} />
                  {t("body.radiationOverlay")}
                </label>
              )}
            </div>
            <div className="mx-auto h-[460px] max-w-xs">
              <BodyFigure side={side} regions={regionIds} statuses={statuses} selected={selected} onSelect={select} radiationOverlay={radiation && mode === "space"} />
            </div>
            <ul aria-label={t("body.systems")} className="grid grid-cols-2 gap-1.5 border-t border-line pt-4 sm:grid-cols-3">
              {regionIds.map((id) => {
                const status = statuses[id];
                const on = selected === id;
                return (
                  <li key={id}>
                    <button
                      type="button"
                      onClick={() => select(id)}
                      aria-pressed={on}
                      className={`flex min-h-10 w-full items-center gap-2 rounded-lg border px-2.5 text-left text-[13px] transition-[background-color,border-color,color] duration-150 ${
                        on ? "border-line-strong bg-panel-2 text-fg" : "border-transparent text-fg/80 hover:bg-panel-2"
                      }`}
                    >
                      <StatusIcon status={status} size={13} />
                      <span className="flex-1">{t(`region.${id}` as MessageKey)}</span>
                      <span className="sr-only">{t(`status.${status}` as MessageKey)}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
          <AnimatePresence mode="wait" initial={false}>
            {selected ? (
              <motion.div
                key={selected}
                initial={{ opacity: 0, x: distance.sm }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, transition: { duration: duration.instant } }}
                transition={{ duration: duration.fast, ease: easing.smooth }}
              >
                <RegionPanel region={selected} assessment={a} onClose={() => setSelected(null)} />
              </motion.div>
            ) : (
              <motion.p
                key="hint"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: duration.fast }}
                className="flex flex-col items-center gap-3 rounded-[0.875rem] border border-dashed border-line-strong px-6 py-16 text-center text-sm text-muted"
              >
                <MousePointerClick size={20} strokeWidth={1.75} />
                {t("body.hint")}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
