import Link from "next/link";
import { t } from "@/lib/i18n";

export function TopBar() {
  return (
    <header className="border-b border-line bg-panel">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4">
        <Link
          href="/"
          className="flex items-center gap-2 rounded focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
        >
          <span aria-hidden className="h-3 w-3 rounded-full bg-accent shadow-[0_0_12px] shadow-accent" />
          <span className="text-lg font-semibold tracking-wide">{t("app.name")}</span>
        </Link>
        <span className="hidden text-sm text-muted sm:inline">{t("app.tagline")}</span>
      </div>
    </header>
  );
}
