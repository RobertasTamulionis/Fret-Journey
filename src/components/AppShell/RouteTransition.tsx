"use client";

import { motion, useReducedMotion } from "motion/react";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import {
  type FretJourneyMotionCustom,
  routeTransitionVariants,
} from "@/lib/motion";

type RouteTransitionProps = {
  children: ReactNode;
};

export default function RouteTransition({ children }: RouteTransitionProps) {
  const pathname = usePathname();
  const [isHydrated, setIsHydrated] = useState(false);
  const reducedMotion = Boolean(useReducedMotion());
  const motionCustom: FretJourneyMotionCustom = { reducedMotion };

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
    <motion.div
      animate="animate"
      className="appShell__route"
      custom={motionCustom}
      initial="initial"
      key={pathname}
      variants={routeTransitionVariants}
    >
      <div className="appShell__routeContent">{children}</div>
    </motion.div>
  );
}
