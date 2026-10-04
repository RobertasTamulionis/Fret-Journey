"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRouteTransition } from "@/components/AppShell/RouteTransitionContext";
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
  const { beginTransition } = useRouteTransition();
  const currentIndex = navigationItems.findIndex(({ href }) =>
    isCurrentRoute(pathname, href),
  );

  return (
    <nav aria-label="Primary" className="appNavigation">
      {navigationItems.map(({ href, label }, destinationIndex) => {
        const isCurrent = isCurrentRoute(pathname, href);
        const isReturningToParent = isCurrent && pathname !== href;
        const direction =
          isReturningToParent ||
          (currentIndex >= 0 && destinationIndex < currentIndex)
            ? "backward"
            : "forward";

        return (
          <Link
            aria-current={isCurrent ? "page" : undefined}
            className="appNavigation__link"
            href={href}
            key={href}
            onClick={() => beginTransition(direction)}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
