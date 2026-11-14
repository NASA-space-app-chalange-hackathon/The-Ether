import type { Metadata } from "next";
import { LearnScreen } from "@/components/learn/LearnScreen";
import { t } from "@/lib/i18n";

export const metadata: Metadata = { title: t("nav.learn") };

export default function LearnPage() {
  return <LearnScreen />;
}
