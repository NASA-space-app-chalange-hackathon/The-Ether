"use client";

import { Hospital, Phone, Signal } from "lucide-react";
import Link from "next/link";
import { STEPPE_RISK_ICON } from "@/components/ui/icons";
import { STEPPE_CARE, STEPPE_RISKS } from "@/content/steppe";
import { useAppState, useT } from "@/lib/state/useAppState";

/** Steppe-mode replacement for the signal-delay + radiation panel: distance to care and 103. */
export function SteppeCareCard() {
  const t = useT();
  const { locale } = useAppState();
  return (
    <div className="space-y-4" data-testid="steppe-care">
      <div className="space-y-1">
        <p className="eyebrow flex items-center gap-1.5">
          <Hospital size={12} strokeWidth={2} />
          {t("steppe.care")}
        </p>
        <p className="text-lg font-medium tracking-tight">{t("steppe.hospital", { km: STEPPE_CARE.hospitalKm, travel: STEPPE_CARE.travel[locale] })}</p>
      </div>
      <a href="tel:103" className="btn border border-red/35 bg-red/10 text-red hover:bg-red/15">
        <Phone size={14} strokeWidth={2} />
        {t("steppe.emergency")}
      </a>
      <p className="flex items-center gap-2 text-sm text-muted">
        <Signal size={14} strokeWidth={2} className="shrink-0" />
        {t("steppe.signal")}
      </p>
      <div className="space-y-2 border-t border-line pt-4">
        <p className="eyebrow">{t("steppe.risks")}</p>
        <ul className="flex flex-wrap gap-1.5">
          {STEPPE_RISKS.map((r) => {
            const Icon = STEPPE_RISK_ICON[r.id];
            return (
              <li key={r.id}>
                <Link href="/learn" className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-line px-3 text-[13px] transition-colors duration-150 hover:border-line-strong hover:bg-panel-2">
                  <Icon size={14} strokeWidth={2} className="text-muted" />
                  {r.title[locale]}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
      <p className="text-xs text-muted italic">{t("steppe.demo")}</p>
    </div>
  );
}
