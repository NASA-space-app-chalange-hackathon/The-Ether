"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { springs } from "@/lib/motion-tokens";
import { useT } from "@/lib/state/useAppState";
import { ROUTES } from "./routes";

/**
 * Primary navigation. Inline in the header on lg+ (takes the free space and scrolls
 * sideways if a locale's labels don't fit), on its own scrollable row below lg.
 */
export function NavBar() {
  const t = useT();
  const pathname = usePathname();

  return (
    <nav
      aria-label="Main"
      className="order-last -mx-4 w-[calc(100%+2rem)] overflow-x-auto border-t border-line [scrollbar-width:none] lg:order-none lg:mx-0 lg:w-auto lg:min-w-0 lg:flex-1 lg:border-t-0"
    >
      <ul className="flex px-2 lg:px-0">
        {ROUTES.map(({ href, labelKey }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <li key={href} className="relative shrink-0">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex h-11 items-center whitespace-nowrap rounded-md px-2.5 text-[13px] font-medium transition-colors duration-150 lg:h-14 lg:px-2 ${
                  active ? "text-fg" : "text-muted hover:text-fg"
                }`}
              >
                {t(labelKey)}
              </Link>
              {active && (
                <motion.span
                  layoutId="nav-indicator"
                  transition={springs.snappy}
                  aria-hidden
                  className="absolute inset-x-2.5 bottom-0 h-px bg-fg lg:inset-x-2"
                />
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
