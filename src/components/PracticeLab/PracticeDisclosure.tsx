import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { type ReactNode, useId, useState } from "react";
import {
  type FretJourneyMotionCustom,
  practiceDisclosureVariants,
} from "@/lib/motion";

type PracticeDisclosureProps = {
  children: ReactNode;
  className?: string;
  label: string;
};

export default function PracticeDisclosure({
  children,
  className = "",
  label,
}: PracticeDisclosureProps) {
  const [expanded, setExpanded] = useState(false);
  const contentId = useId();
  const motionCustom: FretJourneyMotionCustom = {
    reducedMotion: Boolean(useReducedMotion()),
  };

  return (
    <div className={`practiceDisclosure ${className}`.trim()}>
      <button
        aria-controls={contentId}
        aria-expanded={expanded}
        className="practiceDisclosure__trigger"
        onClick={() => setExpanded((current) => !current)}
        type="button"
      >
        {label}
      </button>
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            animate="animate"
            className="practiceDisclosure__content"
            custom={motionCustom}
            exit="exit"
            id={contentId}
            initial="initial"
            key="content"
            variants={practiceDisclosureVariants}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
