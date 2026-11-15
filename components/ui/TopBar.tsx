"use client";

import { Rocket, Tent } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { springs } from "@/lib/motion-tokens";
import { useAppState, useT } from "@/lib/state/useAppState";
import { DemoPlayer } from "./DemoPlayer";
import { LogoMark } from "./Logo";
import { NavBar } from "./NavBar";

function ModeToggle() {
  const t = useT();
  const { mode, setMode } = useAppState();
  const next = mode === "space" ? "steppe" : "space";
  return (
    <div role="group" aria-label={t("mode.label")} className="flex rounded-[10px] border border-line bg-panel p-0.5 text-sm">
      {(["space", "steppe"] as const).map((m) => {
        const Icon = m === "space" ? Rocket : Tent;
        const on = mode === m;
        return (
          <button
            key={m}
            type="button"
            aria-pressed={on}
            onClick={() => setMode(m)}
            title={m === next ? t("mode.switchTo", { mode: t(`mode.${m}`) }) : undefined}
            data-testid={`mode-${m}`}
            className="relative flex min-h-10 min-w-10 items-center justify-center gap-1.5 rounded-lg px-2.5 font-medium text-muted transition-colors duration-150 hover:text-fg aria-pressed:text-bg sm:px-3"
          >
            {on && <motion.span layoutId="mode-pill" transition={springs.snappy} aria-hidden className="absolute inset-0 rounded-lg bg-fg" />}
            <span className="relative flex items-center gap-1.5">
              <Icon size={15} strokeWidth={2} />
              <span className="sr-only sm:not-sr-only">{t(`mode.${m}`)}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

/** Brand, primary navigation and global actions. Nav wraps to its own row below lg. */
export function TopBar() {
  const t = useT();
  return (
    <header className="border-b border-line bg-bg">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-5 px-4">
        <Link href="/" className="flex h-14 shrink-0 items-center gap-2.5 rounded-md">
          <LogoMark size={22} />
          <span className="text-[15px] font-semibold tracking-tight">{t("app.name")}</span>
        </Link>
        <NavBar />
        <div className="ml-auto flex h-14 shrink-0 items-center gap-2">
          <DemoPlayer />
          <ModeToggle />
        </div>
      </div>
    </header>
  );
}
