"use client";

import { Info } from "lucide-react";
import Link from "next/link";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { GLOSSARY_BY_ID, type GlossaryId } from "@/content/glossary";
import { useAppState, useT } from "@/lib/state/useAppState";

/**
 * A word that needs a short explanation: the text plus a small (i) button that opens a
 * plain-language tooltip on tap, click, hover or focus. Escape or clicking elsewhere closes it.
 */
export function Term({ id, children, className = "" }: { id: GlossaryId; children?: ReactNode; className?: string }) {
  const t = useT();
  const { locale } = useAppState();
  const entry = GLOSSARY_BY_ID[id];
  const [open, setOpen] = useState(false);
  const tipId = useId();
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);

  return (
    <span ref={ref} className={`relative inline-flex items-center gap-0.5 ${className}`} onMouseLeave={() => setOpen(false)}>
      {children ?? entry.term[locale]}
      <button
        type="button"
        aria-label={t("term.explain", { term: entry.term[locale] })}
        aria-expanded={open}
        aria-describedby={open ? tipId : undefined}
        // Click/tap always opens (hover may already have); Escape, clicking elsewhere or leaving closes.
        onClick={() => setOpen(true)}
        onMouseEnter={() => setOpen(true)}
        onFocus={() => setOpen(true)}
        data-testid={`term-${id}`}
        className="inline-grid h-5 w-5 shrink-0 place-items-center rounded-full text-muted transition-colors duration-150 hover:text-fg focus-visible:text-fg"
      >
        <Info size={12} strokeWidth={2} />
      </button>
      {open && (
        <span
          role="tooltip"
          id={tipId}
          className="absolute left-0 top-full z-40 mt-1 block w-64 max-w-[calc(100vw-2rem)] space-y-1.5 rounded-lg border border-line-strong bg-panel-2 p-3 text-left font-sans text-xs font-normal normal-case leading-relaxed tracking-normal text-fg shadow-[0_8px_24px_rgb(0_0_0/0.45)]"
        >
          <span className="block font-medium">{entry.term[locale]}</span>
          <span className="block text-fg/85">{entry.short[locale]}</span>
          <Link href={`/learn#glossary-${id}`} className="link block" onClick={() => setOpen(false)}>
            {t("term.more")}
          </Link>
        </span>
      )}
    </span>
  );
}
