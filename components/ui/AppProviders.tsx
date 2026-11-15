"use client";

import { MotionConfig } from "motion/react";
import type { ReactNode } from "react";
import { DataProvider } from "@/lib/state/DataProvider";
import { ServiceWorker } from "./ServiceWorker";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      <DataProvider>
        <ServiceWorker />
        {children}
      </DataProvider>
    </MotionConfig>
  );
}
