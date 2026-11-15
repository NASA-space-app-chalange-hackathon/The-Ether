"use client";

import { ChevronRight } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { REGION_IDS, type RegionId } from "@/lib/engine/regions";
import type { Status } from "@/lib/engine/types";
import type { MessageKey } from "@/lib/i18n";
import { motionTokens } from "@/lib/motion-tokens";
import { useT } from "@/lib/state/useAppState";
import { StatusIcon } from "./Badges";
import { STATUS_STYLE } from "./status";
import { THEME } from "./theme";

const SIZE = 196;
const R = 86;
const STROKE = 8;
const GAP_DEG = 5;
const { duration, easing } = motionTokens;

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
  const seg = 360 / REGION_IDS.length;
  const o = STATUS_STYLE[overall];
  return (
    <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center">
      <div className="relative shrink-0" style={{ width: SIZE, height: SIZE }}>
        <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} role="img" aria-label={`${label}: ${t(`status.${overall}` as MessageKey)}`}>
          <circle cx={SIZE / 2} cy={SIZE / 2} r={R - 16} fill="none" stroke={THEME.line} strokeWidth={1} strokeDasharray="2 4" />
          {REGION_IDS.map((id, i) => (
            <motion.path
              key={id}
              d={arcPath(i * seg + GAP_DEG / 2, (i + 1) * seg - GAP_DEG / 2)}
              fill="none"
              strokeWidth={STROKE}
              strokeLinecap="round"
              initial={{ pathLength: 0, stroke: STATUS_STYLE.unknown.fill }}
              animate={{ pathLength: 1, stroke: STATUS_STYLE[regions[id]].fill }}
              transition={{
                pathLength: { duration: duration.slow, delay: i * (duration.instant / 2), ease: easing.smooth },
                stroke: { duration: duration.normal, ease: easing.smooth },
              }}
            />
          ))}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 text-center">
          <span className="eyebrow">{t("home.overall")}</span>
          <span className={`flex items-center gap-1.5 text-xl font-semibold tracking-tight ${o.text}`}>
            <StatusIcon status={overall} size={18} />
            {t(`status.${overall}` as MessageKey)}
          </span>
        </div>
      </div>
      <ul className="grid w-full grid-cols-1 gap-px text-sm" aria-label={t("home.regions")}>
        {REGION_IDS.map((id) => {
          const status = regions[id];
          return (
            <li key={id}>
              <Link
                href={`/body?region=${id}`}
                className="group flex min-h-9 items-center gap-2.5 rounded-md px-2 transition-colors duration-150 hover:bg-panel-2"
              >
                <StatusIcon status={status} />
                <span className="flex-1">{t(`region.${id}` as MessageKey)}</span>
                <span className={`text-xs ${status === "ok" ? "text-muted" : STATUS_STYLE[status].text}`}>{t(`status.${status}` as MessageKey)}</span>
                <ChevronRight size={14} className="-ml-1 text-muted opacity-0 transition-[opacity,transform] duration-150 group-hover:translate-x-0.5 group-hover:opacity-100" />
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
