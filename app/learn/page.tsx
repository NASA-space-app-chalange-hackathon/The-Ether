import type { Metadata } from "next";
import { t } from "@/lib/i18n";
import { PlaceholderPage } from "@/components/ui/PlaceholderPage";

export const metadata: Metadata = { title: t("nav.learn") };

export default function LearnPage() {
  return <PlaceholderPage titleKey="nav.learn" />;
}
