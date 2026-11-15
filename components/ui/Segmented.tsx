"use client";

import { motion } from "motion/react";
import { useId, type ReactNode } from "react";
import { springs } from "@/lib/motion-tokens";

export interface SegmentOption<T extends string | number | boolean> {
  value: T;
  label: ReactNode;
}

/**
 * Radio-group segmented control with a sliding selection pill.
 * Outer radius 10px = inner 8px + 2px padding (concentric).
 */
export function Segmented<T extends string | number | boolean>({
  label,
  value,
  options,
  onChange,
  className = "",
}: {
  label: string;
  value: T;
  options: readonly SegmentOption<T>[];
  onChange: (value: T) => void;
  className?: string;
}) {
  const id = useId();
  return (
    <div role="radiogroup" aria-label={label} className={`inline-flex w-fit rounded-[10px] border border-line bg-panel p-0.5 text-sm ${className}`}>
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button
            key={String(o.value)}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(o.value)}
            className="relative flex min-h-10 items-center gap-1.5 whitespace-nowrap rounded-lg px-3.5 font-medium text-muted transition-colors duration-150 hover:text-fg aria-checked:text-fg"
          >
            {on && (
              <motion.span
                layoutId={`seg-${id}`}
                transition={springs.snappy}
                aria-hidden
                className="absolute inset-0 rounded-lg border border-line-strong bg-panel-2 shadow-[0_1px_2px_rgb(0_0_0/0.4)]"
              />
            )}
            <span className="relative flex items-center gap-1.5">{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}
