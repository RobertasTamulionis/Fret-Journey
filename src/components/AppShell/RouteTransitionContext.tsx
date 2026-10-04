"use client";

import { usePathname } from "next/navigation";
import {
  createContext,
  type ReactNode,
  useContext,
  useMemo,
  useState,
} from "react";
import type { RouteTransitionDirection } from "@/lib/motion";

export type { RouteTransitionDirection } from "@/lib/motion";

type RouteTransitionContextValue = {
  beginTransition: (direction: RouteTransitionDirection) => void;
  direction: RouteTransitionDirection;
  finishTransition: () => void;
  pendingPathname: string | null;
};

const RouteTransitionContext =
  createContext<RouteTransitionContextValue | null>(null);

export function RouteTransitionProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [direction, setDirection] =
    useState<RouteTransitionDirection>("forward");
  const [pendingPathname, setPendingPathname] = useState<string | null>(null);
  const value = useMemo(
    () => ({
      beginTransition: (nextDirection: RouteTransitionDirection) => {
        setDirection(nextDirection);
        setPendingPathname(pathname);
      },
      direction,
      finishTransition: () => setPendingPathname(null),
      pendingPathname,
    }),
    [direction, pathname, pendingPathname],
  );

  return (
    <RouteTransitionContext.Provider value={value}>
      {children}
    </RouteTransitionContext.Provider>
  );
}

export function useRouteTransition() {
  const context = useContext(RouteTransitionContext);

  if (!context) {
    throw new Error(
      "useRouteTransition must be used within RouteTransitionProvider",
    );
  }

  return context;
}
