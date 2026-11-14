import type { Metadata } from "next";
import { TrendsScreen } from "@/components/charts/TrendsScreen";
import { t } from "@/lib/i18n";

export const metadata: Metadata = { title: t("nav.trends") };

export default function TrendsPage() {
  return <TrendsScreen />;
}
