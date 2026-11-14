"use client";

import type { ReactNode } from "react";
import { DataProvider } from "@/lib/state/DataProvider";
import { ServiceWorker } from "./ServiceWorker";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <DataProvider>
      <ServiceWorker />
      {children}
    </DataProvider>
  );
}
