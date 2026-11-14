import type { Metadata } from "next";
import { CheckScreen } from "@/components/check/CheckScreen";
import { t } from "@/lib/i18n";

export const metadata: Metadata = { title: t("nav.check") };

export default function CheckPage() {
  return <CheckScreen />;
}
