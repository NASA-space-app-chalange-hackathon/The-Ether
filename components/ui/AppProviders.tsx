"use client";

import type { ReactNode } from "react";
import { DataProvider } from "@/lib/state/DataProvider";

export function AppProviders({ children }: { children: ReactNode }) {
  return <DataProvider>{children}</DataProvider>;
}
