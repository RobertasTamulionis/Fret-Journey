"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { LayoutRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useContext, useEffect, useRef, useState } from "react";
import { useRouteTransition } from "@/components/AppShell/RouteTransitionContext";
import {
  type FretJourneyRouteMotionCustom,
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
  const { direction, finishTransition, pendingPathname } = useRouteTransition();
  const isNavigationPending = pendingPathname === pathname;
  const motionCustom: FretJourneyRouteMotionCustom = {
    direction,
    reducedMotion,
  };

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (pendingPathname && pendingPathname !== pathname) {
      finishTransition();
    }
  }, [finishTransition, pathname, pendingPathname]);

  if (!isHydrated) {
    return (
      <div className="appShell__route">
        <div className="appShell__routeContent">{children}</div>
      </div>
    );
  }

  return (
    <AnimatePresence custom={motionCustom} initial={false} mode="sync">
      <motion.div
        animate={isNavigationPending ? "pending" : "animate"}
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
