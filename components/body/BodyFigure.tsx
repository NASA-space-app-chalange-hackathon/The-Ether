"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useState, type KeyboardEvent, type ReactNode } from "react";
import type { RegionId } from "@/lib/engine/regions";
import type { Status } from "@/lib/engine/types";
import type { MessageKey } from "@/lib/i18n";
import { useT } from "@/lib/state/useAppState";
import { STATUS_STYLE } from "@/components/ui/status";

export type BodySide = "front" | "back";

interface Props {
  side: BodySide;
  statuses: Record<RegionId, Status>;
  selected: RegionId | null;
  onSelect: (id: RegionId) => void;
  radiationOverlay: boolean;
}

const SKIN = "#111c36";
const OUTLINE = "#2a3a60";

/** Neutral, abstract silhouette (no face, no gender cues). */
function Silhouette() {
  return (
    <g fill={SKIN} stroke={OUTLINE} strokeWidth={1.5} aria-hidden pointerEvents="none">
      <ellipse cx={100} cy={40} rx={25} ry={29} />
      <rect x={89} y={64} width={22} height={20} rx={6} />
      <path d="M56 86 Q100 74 144 86 L152 104 L142 200 Q140 230 134 246 L66 246 Q60 230 58 200 L48 104 Z" />
      <rect x={30} y={90} width={18} height={150} rx={9} transform="rotate(9 39 90)" />
      <rect x={152} y={90} width={18} height={150} rx={9} transform="rotate(-9 161 90)" />
      <circle cx={20} cy={252} r={10} />
      <circle cx={180} cy={252} r={10} />
      <rect x={68} y={238} width={29} height={182} rx={13} />
      <rect x={103} y={238} width={29} height={182} rx={13} />
    </g>
  );
}

const heartPath = "M106 112 C 100 104, 90 108, 92 118 C 94 128, 106 136, 108 140 C 110 136, 122 128, 124 118 C 126 108, 116 104, 110 112 Z";

/** Region shapes per side. Every visible region is a focusable button. */
function regionShapes(side: BodySide): Partial<Record<RegionId, ReactNode>> {
  const common: Partial<Record<RegionId, ReactNode>> = {
    brain: <ellipse cx={100} cy={side === "front" ? 32 : 36} rx={19} ry={17} />,
    immune: <ellipse cx={100} cy={76} rx={14} ry={7} />,
    lungs: (
      <>
        <ellipse cx={82} cy={120} rx={15} ry={25} />
        <ellipse cx={118} cy={120} rx={15} ry={25} />
      </>
    ),
  };
  if (side === "front") {
    return {
      ...common,
      eyes: (
        <>
          <ellipse cx={91} cy={48} rx={5} ry={3.5} />
          <ellipse cx={109} cy={48} rx={5} ry={3.5} />
        </>
      ),
      heart: <path d={heartPath} />,
      gut: <rect x={78} y={160} width={44} height={44} rx={15} />,
      bones: (
        <>
          <ellipse cx={100} cy={232} rx={30} ry={11} />
          <rect x={79} y={252} width={7} height={78} rx={3} />
          <rect x={114} y={252} width={7} height={78} rx={3} />
          <rect x={80} y={338} width={6} height={74} rx={3} />
          <rect x={114} y={338} width={6} height={74} rx={3} />
        </>
      ),
      muscles: (
        <>
          <ellipse cx={42} cy={142} rx={8} ry={22} transform="rotate(9 42 142)" />
          <ellipse cx={158} cy={142} rx={8} ry={22} transform="rotate(-9 158 142)" />
          <ellipse cx={90} cy={292} rx={8} ry={30} />
          <ellipse cx={110} cy={292} rx={8} ry={30} />
        </>
      ),
    };
  }
  return {
    ...common,
    bones: (
      <>
        {Array.from({ length: 12 }, (_, i) => (
          <rect key={i} x={96} y={88 + i * 12} width={8} height={9} rx={2} />
        ))}
        <ellipse cx={100} cy={236} rx={28} ry={10} />
      </>
    ),
    muscles: (
      <>
        <ellipse cx={76} cy={98} rx={18} ry={9} />
        <ellipse cx={124} cy={98} rx={18} ry={9} />
        <ellipse cx={85} cy={262} rx={13} ry={15} />
        <ellipse cx={115} cy={262} rx={13} ry={15} />
        <ellipse cx={82} cy={362} rx={9} ry={26} />
        <ellipse cx={118} cy={362} rx={9} ry={26} />
      </>
    ),
  };
}

export function BodyFigure({ side, statuses, selected, onSelect, radiationOverlay }: Props) {
  const t = useT();
  const reduceMotion = useReducedMotion();
  const [focused, setFocused] = useState<RegionId | null>(null);
  const shapes = regionShapes(side);
  const radStyle = STATUS_STYLE[statuses.radiation];

  const region = (id: RegionId, node: ReactNode) => {
    const status = statuses[id];
    const style = STATUS_STYLE[status];
    const isSel = selected === id;
    const isFocus = focused === id;
    const pulse = !reduceMotion && (status === "critical" || id === "heart");
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onSelect(id);
      }
    };
    return (
      <motion.g
        key={id}
        role="button"
        tabIndex={0}
        aria-pressed={isSel}
        aria-label={`${t(`region.${id}` as MessageKey)}: ${t(`status.${status}` as MessageKey)}`}
        data-region={id}
        data-status={status}
        onClick={() => onSelect(id)}
        onKeyDown={onKey}
        onFocus={() => setFocused(id)}
        onBlur={() => setFocused(null)}
        className="cursor-pointer outline-none"
        fill={style.fill}
        fillOpacity={isSel || isFocus ? 0.9 : 0.55}
        stroke={isSel || isFocus ? "#e6ecf8" : style.fill}
        strokeWidth={isSel || isFocus ? 2.5 : 1.25}
        style={{ transformBox: "fill-box", transformOrigin: "center" }}
        animate={pulse ? { scale: status === "critical" ? [1, 1.07, 1] : [1, 1.04, 1] } : { scale: 1 }}
        transition={pulse ? { duration: status === "critical" ? 0.8 : 1.1, repeat: Infinity, ease: "easeInOut" } : undefined}
        whileHover={{ fillOpacity: 0.9 }}
      >
        {node}
      </motion.g>
    );
  };

  return (
    <svg viewBox="0 0 200 430" className="h-full max-h-[560px] w-full" role="group" aria-label={`${t("body.figure")} — ${t(side === "front" ? "body.front" : "body.back")}`}>
      <defs>
        <radialGradient id="rad-aura">
          <stop offset="55%" stopColor={radStyle.fill} stopOpacity={0.05} />
          <stop offset="100%" stopColor={radStyle.fill} stopOpacity={0.35} />
        </radialGradient>
      </defs>
      {radiationOverlay && region("radiation", <ellipse cx={100} cy={222} rx={96} ry={214} fill="url(#rad-aura)" fillOpacity={1} />)}
      <Silhouette />
      {(Object.entries(shapes) as [RegionId, ReactNode][]).map(([id, node]) => region(id, node))}
    </svg>
  );
}
