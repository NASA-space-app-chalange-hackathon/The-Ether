import type { Locale } from "./index";

/** Format an ISO date. Mongolian is built by hand because browsers often lack mn locale data. */
export function formatDate(iso: string, locale: Locale): string {
  const d = new Date(iso);
  if (locale === "mn") return `${d.getUTCFullYear()} оны ${d.getUTCMonth() + 1}-р сарын ${d.getUTCDate()}`;
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeZone: "UTC" }).format(d);
}
