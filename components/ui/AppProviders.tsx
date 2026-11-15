"use client";

import { MotionConfig } from "motion/react";
import type { ReactNode } from "react";
import { DataProvider } from "@/lib/state/DataProvider";
import { NasaProvider } from "@/lib/state/NasaProvider";
import { ServiceWorker } from "./ServiceWorker";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      <NasaProvider>
        <DataProvider>
          <ServiceWorker />
          {children}
        </DataProvider>
      </NasaProvider>
    </MotionConfig>
  );
}
