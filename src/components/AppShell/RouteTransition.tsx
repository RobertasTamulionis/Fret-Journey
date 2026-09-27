"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import {
  type FretJourneyMotionCustom,
  type FretJourneyRouteCurtainCustom,
  routeCurtainVariants,
  routeTransitionVariants,
} from "@/lib/motion";

type RouteTransitionProps = {
  children: ReactNode;
};

type RenderedRoute = {
  children: ReactNode;
  pathname: string;
};

const routeCurtainColumns = [
  "route-curtain-1",
  "route-curtain-2",
  "route-curtain-3",
  "route-curtain-4",
  "route-curtain-5",
] as const;

export default function RouteTransition({ children }: RouteTransitionProps) {
  const pathname = usePathname();
  const [isHydrated, setIsHydrated] = useState(false);
  const [renderedRoute, setRenderedRoute] = useState<RenderedRoute>({
    children,
    pathname,
  });
  const reducedMotion = Boolean(useReducedMotion());
  const motionCustom: FretJourneyMotionCustom = {
    reducedMotion,
  };

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    setRenderedRoute((currentRoute) => {
      if (
        currentRoute.pathname === pathname &&
        currentRoute.children === children
      ) {
        return currentRoute;
      }

      return { children, pathname };
    });
  }, [children, pathname]);

  if (!isHydrated) {
    return (
      <div className="appShell__route">
        <div className="appShell__routeContent">{children}</div>
      </div>
    );
  }

  return (
    <AnimatePresence initial={false} mode="wait">
      <motion.div className="appShell__route" key={renderedRoute.pathname}>
        <motion.div
          animate="animate"
          className="appShell__routeContent"
          custom={motionCustom}
          exit="exit"
          initial="initial"
          variants={routeTransitionVariants}
        >
          {renderedRoute.children}
        </motion.div>
        <div aria-hidden="true" className="appShell__routeCurtain">
          {routeCurtainColumns.map((columnId, column) => {
            const curtainCustom: FretJourneyRouteCurtainCustom = {
              column,
              reducedMotion,
            };

            return (
              <motion.span
                animate="animate"
                custom={curtainCustom}
                exit="exit"
                initial="initial"
                key={columnId}
                variants={routeCurtainVariants}
              />
            );
          })}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
