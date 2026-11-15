"use client";

import { ArrowUpRight } from "lucide-react";
import type { Source } from "@/lib/engine/types";
import { useT } from "@/lib/state/useAppState";

/** Citations: external links keep their original title; the demo-parameter label is translated. */
export function SourceList({ sources, className = "space-y-1.5 text-sm" }: { sources: readonly Source[]; className?: string }) {
  const t = useT();
  return (
    <ul className={className}>
      {sources.map((s) => (
        <li key={s.id}>
          {s.url ? (
            <a href={s.url} target="_blank" rel="noreferrer" className="link group inline-flex items-start gap-1">
              <span>{s.title}</span>
              <ArrowUpRight size={12} strokeWidth={2} className="mt-[0.2em] shrink-0 opacity-60 transition-transform duration-150 group-hover:-translate-y-px group-hover:translate-x-px group-hover:opacity-100" />
            </a>
          ) : (
            <span className="text-muted italic">{s.demo ? t("source.demo") : s.title}</span>
          )}
        </li>
      ))}
    </ul>
  );
}
