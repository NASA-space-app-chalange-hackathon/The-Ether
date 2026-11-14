"use client";

import Link from "next/link";
import { STEPPE_CARE, STEPPE_RISKS } from "@/content/steppe";
import { useAppState, useT } from "@/lib/state/useAppState";

/** Steppe-mode replacement for the signal-delay + radiation panel: distance to care and 103. */
export function SteppeCareCard() {
  const t = useT();
  const { locale } = useAppState();
  return (
    <div className="space-y-3" data-testid="steppe-care">
      <p className="text-xs text-muted">🏥 {t("steppe.care")}</p>
      <p className="text-lg font-semibold">{t("steppe.hospital", { km: STEPPE_CARE.hospitalKm, travel: STEPPE_CARE.travel[locale] })}</p>
      <a href="tel:103" className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-red/60 bg-red/15 px-4 font-semibold text-red hover:bg-red/25">
        📞 {t("steppe.emergency")}
      </a>
      <p className="text-sm text-muted">📶 {t("steppe.signal")}</p>
      <div className="space-y-1.5 pt-1">
        <p className="text-xs text-muted">{t("steppe.risks")}</p>
        <ul className="flex flex-wrap gap-1.5">
          {STEPPE_RISKS.map((r) => (
            <li key={r.id}>
              <Link href="/learn" className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-line px-3 text-sm hover:border-accent">
                <span aria-hidden>{r.icon}</span>
                {r.title[locale]}
              </Link>
            </li>
          ))}
        </ul>
      </div>
      <p className="text-xs italic text-muted">{t("steppe.demo")}</p>
    </div>
  );
}
