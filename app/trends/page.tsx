import type { Metadata } from "next";
import { t } from "@/lib/i18n";
import { PlaceholderPage } from "@/components/ui/PlaceholderPage";

export const metadata: Metadata = { title: t("nav.trends") };

export default function TrendsPage() {
  return <PlaceholderPage titleKey="nav.trends" />;
}
