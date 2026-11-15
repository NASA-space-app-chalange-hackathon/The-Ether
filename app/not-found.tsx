"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useT } from "@/lib/state/useAppState";

export default function NotFound() {
  const t = useT();
  return (
    <section className="flex flex-col items-center gap-4 py-20 text-center">
      <p className="eyebrow" aria-hidden>
        404
      </p>
      <h1 className="text-2xl font-semibold tracking-tight">{t("notFound.title")}</h1>
      <Link href="/" className="btn btn-secondary">
        <ArrowLeft size={14} />
        {t("notFound.back")}
      </Link>
    </section>
  );
}
