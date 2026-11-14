import type { Metadata } from "next";
import { ActionCenter } from "@/components/alerts/ActionCenter";
import { t } from "@/lib/i18n";

export const metadata: Metadata = { title: t("nav.alerts") };

export default function AlertsPage() {
  return <ActionCenter />;
}
