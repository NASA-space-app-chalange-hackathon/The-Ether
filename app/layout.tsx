import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AppProviders } from "@/components/ui/AppProviders";
import { DisclaimerBar } from "@/components/ui/DisclaimerBar";
import { MissionClock } from "@/components/ui/MissionClock";
import { ModeShell } from "@/components/ui/ModeShell";
import { SkipLink } from "@/components/ui/SkipLink";
import { TopBar } from "@/components/ui/TopBar";
import { THEME } from "@/components/ui/theme";
import { t } from "@/lib/i18n";
import "./globals.css";

const geist = Geist({ variable: "--font-geist", subsets: ["latin", "cyrillic"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin", "cyrillic"] });

export const metadata: Metadata = {
  title: { default: t("app.name"), template: `%s · ${t("app.name")}` },
  description: t("app.tagline"),
};

export const viewport: Viewport = {
  themeColor: THEME.bg,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geist.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <AppProviders>
          <ModeShell>
            <SkipLink />
            <DisclaimerBar />
            <TopBar />
            <MissionClock />
            <main id="content" tabIndex={-1} className="mx-auto w-full max-w-6xl flex-1 px-4 pb-16 pt-8 outline-none">
              {children}
            </main>
          </ModeShell>
        </AppProviders>
      </body>
    </html>
  );
}
