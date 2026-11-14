"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useT } from "@/lib/state/useAppState";
import { ROUTES } from "./routes";

export function NavBar() {
  const t = useT();
  const pathname = usePathname();

  return (
    <nav aria-label="Main" className="border-b border-line bg-panel/60">
      <ul className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4">
        {ROUTES.map(({ href, labelKey }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-11 items-center whitespace-nowrap border-b-2 px-3 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
                  active
                    ? "border-accent text-fg"
                    : "border-transparent text-muted hover:text-fg"
                }`}
              >
                {t(labelKey)}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
