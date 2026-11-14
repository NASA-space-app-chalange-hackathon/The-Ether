import type { Metadata } from "next";
import { t } from "@/lib/i18n";
import { PlaceholderPage } from "@/components/ui/PlaceholderPage";

export const metadata: Metadata = { title: t("nav.body") };

export default function BodyPage() {
  return <PlaceholderPage titleKey="nav.body" />;
}
