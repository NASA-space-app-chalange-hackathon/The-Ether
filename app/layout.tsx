import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { AppProviders } from "@/components/ui/AppProviders";
import { DisclaimerBar } from "@/components/ui/DisclaimerBar";
import { MissionClock } from "@/components/ui/MissionClock";
import { NavBar } from "@/components/ui/NavBar";
import { TopBar } from "@/components/ui/TopBar";
import { t } from "@/lib/i18n";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin", "cyrillic"] });
const mono = JetBrains_Mono({ variable: "--font-jetbrains", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: t("app.name"), template: `%s · ${t("app.name")}` },
  description: t("app.tagline"),
};

export const viewport: Viewport = {
  themeColor: "#050a18",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} ${mono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <AppProviders>
          <DisclaimerBar />
          <TopBar />
          <NavBar />
          <MissionClock />
          <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">{children}</main>
        </AppProviders>
      </body>
    </html>
  );
}
