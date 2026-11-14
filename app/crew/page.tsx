import type { Metadata } from "next";
import { CrewScreen } from "@/components/crew/CrewScreen";
import { t } from "@/lib/i18n";

export const metadata: Metadata = { title: t("nav.crew") };

export default function CrewPage() {
  return <CrewScreen />;
}
