"use client";

import Link from "next/link";
import { useAppState, useT } from "@/lib/state/useAppState";
import { DemoPlayer } from "./DemoPlayer";

export function TopBar() {
  const t = useT();
  const { mode, setMode } = useAppState();
  const next = mode === "space" ? "steppe" : "space";
  return (
    <header className="border-b border-line bg-panel">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4">
        <Link
          href="/"
          className="flex items-center gap-2 rounded focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
        >
          <span aria-hidden className="h-3 w-3 rounded-full bg-accent shadow-[0_0_12px] shadow-accent" />
          <span className="text-lg font-semibold tracking-wide">{t("app.name")}</span>
        </Link>
        <span className="hidden text-sm text-muted sm:inline">{t("app.tagline")}</span>
        <div className="ml-auto">
          <DemoPlayer />
        </div>
        <div role="group" aria-label={t("mode.label")} className="flex rounded-full border border-line p-0.5 text-sm">
          {(["space", "steppe"] as const).map((m) => (
            <button
              key={m}
              type="button"
              aria-pressed={mode === m}
              onClick={() => setMode(m)}
              title={m === next ? t("mode.switchTo", { mode: t(`mode.${m}`) }) : undefined}
              data-testid={`mode-${m}`}
              className="flex min-h-10 items-center gap-1.5 rounded-full px-3 transition-colors aria-pressed:bg-accent aria-pressed:font-semibold aria-pressed:text-bg"
            >
              <span aria-hidden>{m === "space" ? "🚀" : "🐎"}</span>
              <span className="sr-only sm:not-sr-only">{t(`mode.${m}`)}</span>
            </button>
          ))}
        </div>
      </div>
    </header>
  );
}
