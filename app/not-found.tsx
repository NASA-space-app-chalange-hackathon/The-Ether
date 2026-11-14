"use client";

import Link from "next/link";
import { useT } from "@/lib/state/useAppState";

export default function NotFound() {
  const t = useT();
  return (
    <section className="space-y-3 py-12 text-center">
      <h1 className="text-2xl font-semibold">{t("notFound.title")}</h1>
      <Link href="/" className="inline-flex min-h-11 items-center text-accent hover:underline">← {t("notFound.back")}</Link>
    </section>
  );
}
