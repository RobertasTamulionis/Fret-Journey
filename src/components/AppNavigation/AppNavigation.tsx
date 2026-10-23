"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import "./appNavigation.scss";

const navigationItems = [
  { href: "/", label: "Fretboard" },
  { href: "/progressions", label: "Progressions" },
  { href: "/practice", label: "Practice" },
] as const;

const isCurrentRoute = (pathname: string, href: string): boolean =>
  href === "/"
    ? pathname === href
    : pathname === href || pathname.startsWith(`${href}/`);

export default function AppNavigation() {
  const pathname = usePathname();

  return (
    <nav aria-label="Primary" className="appNavigation">
      {navigationItems.map(({ href, label }) => {
        const isCurrent = isCurrentRoute(pathname, href);

        return (
          <Link
            aria-current={isCurrent ? "page" : undefined}
            className="appNavigation__link"
            href={href}
            key={href}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
