"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { regionIdsFor, type RegionId } from "@/lib/engine/regions";
import type { Status } from "@/lib/engine/types";
import type { MessageKey } from "@/lib/i18n";
import { useAppState, useT } from "@/lib/state/useAppState";
import { StatusBadge } from "./Badges";
import { STATUS_STYLE } from "./status";

const SIZE = 220;
const R = 92;
const STROKE = 18;
const GAP_DEG = 4;

function arcPath(startDeg: number, endDeg: number): string {
  const p = (deg: number) => {
    const a = ((deg - 90) * Math.PI) / 180;
    return `${SIZE / 2 + R * Math.cos(a)} ${SIZE / 2 + R * Math.sin(a)}`;
  };
  const large = endDeg - startDeg > 180 ? 1 : 0;
  return `M ${p(startDeg)} A ${R} ${R} 0 ${large} 1 ${p(endDeg)}`;
}

/** One ring segment per body system, colored by engine status; overall status in the middle. */
export function StatusRing({ regions, overall, label }: { regions: Record<RegionId, Status>; overall: Status; label: string }) {
  const t = useT();
  const { mode } = useAppState();
  const REGION_IDS = regionIdsFor(mode);
  const seg = 360 / REGION_IDS.length;
  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
      <div className="relative" style={{ width: SIZE, height: SIZE }}>
        <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} role="img" aria-label={`${label}: ${t(`status.${overall}` as MessageKey)}`}>
          <circle cx={SIZE / 2} cy={SIZE / 2} r={R} fill="none" stroke="#1e2a47" strokeWidth={STROKE} />
          {REGION_IDS.map((id, i) => (
            <motion.path
              key={id}
              d={arcPath(i * seg + GAP_DEG / 2, (i + 1) * seg - GAP_DEG / 2)}
              fill="none"
              strokeWidth={STROKE}
              strokeLinecap="butt"
              initial={{ pathLength: 0, stroke: STATUS_STYLE.unknown.fill }}
              animate={{ pathLength: 1, stroke: STATUS_STYLE[regions[id]].fill }}
              transition={{ pathLength: { duration: 0.8, delay: i * 0.05, ease: "easeOut" }, stroke: { duration: 0.4 } }}
            />
          ))}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-center">
          <span className="text-xs uppercase tracking-widest text-muted">{t("home.overall")}</span>
          <StatusBadge status={overall} size="lg" />
        </div>
      </div>
      <ul className="grid grid-cols-1 gap-1 text-sm" aria-label={t("home.regions")}>
        {REGION_IDS.map((id) => {
          const s = STATUS_STYLE[regions[id]];
          return (
            <li key={id}>
              <Link
                href={`/body?region=${id}`}
                className="flex min-h-8 items-center gap-2 rounded px-2 hover:bg-panel-2 focus-visible:outline-2 focus-visible:outline-accent"
              >
                <span aria-hidden className={`w-4 text-center ${s.text}`}>{s.icon}</span>
                <span>{t(`region.${id}` as MessageKey)}</span>
                <span className="sr-only">: {t(`status.${regions[id]}` as MessageKey)}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
