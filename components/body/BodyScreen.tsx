"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { CrewSwitcher } from "@/components/home/CrewSwitcher";
import { STATUS_STYLE } from "@/components/ui/status";
import { allRegionStatuses, regionIdsFor, type RegionId } from "@/lib/engine/regions";
import type { MessageKey } from "@/lib/i18n";
import { useAssessment } from "@/lib/state/DataProvider";
import { useAppState, useT } from "@/lib/state/useAppState";
import { BodyFigure, type BodySide } from "./BodyFigure";
import { RegionPanel } from "./RegionPanel";

const FRONT_ONLY: readonly RegionId[] = ["eyes", "heart", "gut"];

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
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-2xl font-semibold">{t("nav.body")}</h1>
        <CrewSwitcher />
      </div>
      {a && statuses && (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
          <section className="space-y-3 rounded-xl border border-line bg-panel p-4">
            <div className="flex flex-wrap items-center gap-2">
              <div role="radiogroup" aria-label={t("body.view")} className="flex rounded-lg border border-line p-0.5">
                {(["front", "back"] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    role="radio"
                    aria-checked={side === s}
                    onClick={() => setSide(s)}
                    className="min-h-10 rounded-md px-4 text-sm aria-checked:bg-accent/15 aria-checked:text-accent"
                  >
                    {t(s === "front" ? "body.front" : "body.back")}
                  </button>
                ))}
              </div>
              {mode === "space" && <label className="ml-auto flex min-h-10 cursor-pointer items-center gap-2 text-sm">
                <input type="checkbox" checked={radiation} onChange={(e) => setRadiation(e.target.checked)} className="h-5 w-5 accent-accent" />
                ☢ {t("body.radiationOverlay")}
              </label>}
            </div>
            <div className="mx-auto h-[480px] max-w-xs">
              <BodyFigure side={side} regions={regionIds} statuses={statuses} selected={selected} onSelect={select} radiationOverlay={radiation && mode === "space"} />
            </div>
            <ul aria-label={t("body.systems")} className="grid grid-cols-2 gap-1 sm:grid-cols-3">
              {regionIds.map((id) => {
                const status = statuses[id];
                const s = STATUS_STYLE[status];
                return (
                  <li key={id}>
                    <button
                      type="button"
                      onClick={() => select(id)}
                      aria-pressed={selected === id}
                      className={`flex min-h-11 w-full items-center gap-2 rounded-lg border px-2 text-left text-sm transition-colors ${
                        selected === id ? "border-accent bg-accent/10" : "border-line hover:border-muted"
                      }`}
                    >
                      <span aria-hidden className={`w-4 text-center ${s.text}`}>{s.icon}</span>
                      <span className="flex-1">{t(`region.${id}` as MessageKey)}</span>
                      <span className="sr-only">{t(`status.${status}` as MessageKey)}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
          <AnimatePresence mode="wait">
            {selected ? (
              <motion.div key={selected} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 16 }} transition={{ duration: 0.2 }}>
                <RegionPanel region={selected} assessment={a} onClose={() => setSelected(null)} />
              </motion.div>
            ) : (
              <motion.p key="hint" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="self-start rounded-xl border border-dashed border-line p-6 text-muted">
                {t("body.hint")}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
