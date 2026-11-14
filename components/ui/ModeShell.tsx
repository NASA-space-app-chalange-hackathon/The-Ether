"use client";

import { useEffect, type ReactNode } from "react";
import { useAppState } from "@/lib/state/useAppState";

/** Applies the Space/Steppe theme and the document language. */
export function ModeShell({ children }: { children: ReactNode }) {
  const { mode, locale } = useAppState();
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);
  return (
    <div data-mode={mode} className="flex min-h-screen flex-col bg-bg text-fg transition-colors duration-500">
      {children}
    </div>
  );
}
