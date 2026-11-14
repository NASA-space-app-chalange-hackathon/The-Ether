import type { Metadata } from "next";
import { QuestsScreen } from "@/components/quests/QuestsScreen";
import { t } from "@/lib/i18n";

export const metadata: Metadata = { title: t("nav.quests") };

export default function QuestsPage() {
  return <QuestsScreen />;
}
