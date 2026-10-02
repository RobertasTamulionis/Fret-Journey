"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { LayoutRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useContext, useEffect, useRef, useState } from "react";
import {
  type FretJourneyMotionCustom,
  routeTransitionVariants,
} from "@/lib/motion";

type RouteTransitionProps = {
  children: ReactNode;
};

function FrozenRouter({ children }: RouteTransitionProps) {
  const routerContext = useContext(LayoutRouterContext);
  const pathname = usePathname();
  const frozenRouterContext = useRef(routerContext).current;
  const frozenPathname = useRef(pathname).current;
  // Same-route query changes must stay live; only freeze a tree that is exiting.
  const activeRouterContext =
    pathname === frozenPathname ? routerContext : frozenRouterContext;

  return (
    <LayoutRouterContext.Provider value={activeRouterContext}>
      {children}
    </LayoutRouterContext.Provider>
  );
}

export default function RouteTransition({ children }: RouteTransitionProps) {
  const pathname = usePathname();
  const [isHydrated, setIsHydrated] = useState(false);
  const reducedMotion = Boolean(useReducedMotion());
  const motionCustom: FretJourneyMotionCustom = {
    reducedMotion,
  };

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  if (!isHydrated) {
    return (
      <div className="appShell__route">
        <div className="appShell__routeContent">{children}</div>
      </div>
    );
  }

  return (
    <AnimatePresence initial={false} mode="wait">
      <motion.div
        animate="animate"
        className="appShell__route"
        custom={motionCustom}
        exit="exit"
        initial="initial"
        key={pathname}
        variants={routeTransitionVariants}
      >
        <div className="appShell__routeContent">
          <FrozenRouter>{children}</FrozenRouter>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
