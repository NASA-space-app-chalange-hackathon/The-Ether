import type { MessageKey } from "@/lib/i18n";

export interface AppRoute {
  href: string;
  labelKey: MessageKey;
}

/** Single source of truth for navigation and the e2e smoke test. */
export const ROUTES: readonly AppRoute[] = [
  { href: "/", labelKey: "nav.home" },
  { href: "/body", labelKey: "nav.body" },
  { href: "/check", labelKey: "nav.check" },
  { href: "/alerts", labelKey: "nav.alerts" },
  { href: "/trends", labelKey: "nav.trends" },
  { href: "/quests", labelKey: "nav.quests" },
  { href: "/crew", labelKey: "nav.crew" },
  { href: "/learn", labelKey: "nav.learn" },
];
