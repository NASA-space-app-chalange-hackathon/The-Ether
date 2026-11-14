"use client";

import { useEffect } from "react";

/** Registers the hand-written service worker in production builds only. */
export function ServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch((err: unknown) => console.warn("Service worker registration failed", err));
  }, []);
  return null;
}
