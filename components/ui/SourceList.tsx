"use client";

import type { Source } from "@/lib/engine/types";
import { useT } from "@/lib/state/useAppState";

/** Citations: external links keep their original title; the demo-parameter label is translated. */
export function SourceList({ sources, className = "space-y-1 text-sm" }: { sources: readonly Source[]; className?: string }) {
  const t = useT();
  return (
    <ul className={className}>
      {sources.map((s) => (
        <li key={s.id}>
          {s.url ? (
            <a href={s.url} target="_blank" rel="noreferrer" className="text-accent underline-offset-2 hover:underline">
              {s.title} ↗
            </a>
          ) : (
            <span className="italic text-muted">{s.demo ? t("source.demo") : s.title}</span>
          )}
        </li>
      ))}
    </ul>
  );
}
