import type { Metadata } from "next";
import { Suspense } from "react";
import { BodyScreen } from "@/components/body/BodyScreen";
import { t } from "@/lib/i18n";

export const metadata: Metadata = { title: t("nav.body") };

export default function BodyPage() {
  return (
    <Suspense fallback={<h1 className="text-2xl font-semibold">{t("nav.body")}</h1>}>
      <BodyScreen />
    </Suspense>
  );
}
