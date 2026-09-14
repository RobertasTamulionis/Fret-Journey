import type { Transition, Variants } from "motion/react";

export const motionDurations = {
  fast: 0.15,
  normal: 0.2,
  slow: 0.3,
} as const;

export const motionEase: [number, number, number, number] = [0.22, 1, 0.36, 1];

export type FretJourneyMotionCustom = {
  reducedMotion: boolean;
};

export const getMotionTransition = (
  reducedMotion: boolean,
  duration: number = motionDurations.normal,
): Transition =>
  reducedMotion ? { duration: 0 } : { duration, ease: motionEase };

export const practiceScreenVariants: Variants = {
  animate: ({ reducedMotion }: FretJourneyMotionCustom) => ({
    opacity: 1,
    transition: getMotionTransition(reducedMotion),
    y: 0,
  }),
  exit: ({ reducedMotion }: FretJourneyMotionCustom) => ({
    opacity: 0,
    transition: getMotionTransition(reducedMotion, motionDurations.fast),
    y: reducedMotion ? 0 : -6,
  }),
  initial: ({ reducedMotion }: FretJourneyMotionCustom) => ({
    opacity: reducedMotion ? 1 : 0,
    y: reducedMotion ? 0 : 8,
  }),
};

export const practiceRevealContainerVariants: Variants = {
  hidden: {},
  visible: ({ reducedMotion }: FretJourneyMotionCustom) => ({
    transition: reducedMotion
      ? { delayChildren: 0, staggerChildren: 0 }
      : { delayChildren: 0.02, staggerChildren: 0.04 },
  }),
};

export const practiceRevealVariants: Variants = {
  hidden: ({ reducedMotion }: FretJourneyMotionCustom) => ({
    opacity: reducedMotion ? 1 : 0,
    y: reducedMotion ? 0 : 6,
  }),
  visible: ({ reducedMotion }: FretJourneyMotionCustom) => ({
    opacity: 1,
    transition: getMotionTransition(reducedMotion),
    y: 0,
  }),
};

export const practiceSwapVariants: Variants = {
  animate: ({ reducedMotion }: FretJourneyMotionCustom) => ({
    opacity: 1,
    scale: 1,
    transition: getMotionTransition(reducedMotion, motionDurations.fast),
    y: 0,
  }),
  exit: ({ reducedMotion }: FretJourneyMotionCustom) => ({
    opacity: 0,
    scale: reducedMotion ? 1 : 1.02,
    transition: getMotionTransition(reducedMotion, motionDurations.fast),
    y: reducedMotion ? 0 : -2,
  }),
  initial: ({ reducedMotion }: FretJourneyMotionCustom) => ({
    opacity: reducedMotion ? 1 : 0,
    scale: reducedMotion ? 1 : 0.96,
    y: reducedMotion ? 0 : 2,
  }),
};

export const practiceCountInVariants: Variants = {
  animate: ({ reducedMotion }: FretJourneyMotionCustom) => ({
    opacity: 1,
    scale: 1,
    transition: getMotionTransition(reducedMotion, motionDurations.fast),
  }),
  exit: ({ reducedMotion }: FretJourneyMotionCustom) => ({
    opacity: 0,
    scale: reducedMotion ? 1 : 1.04,
    transition: getMotionTransition(reducedMotion, motionDurations.fast),
  }),
  initial: ({ reducedMotion }: FretJourneyMotionCustom) => ({
    opacity: reducedMotion ? 1 : 0,
    scale: reducedMotion ? 1 : 0.92,
  }),
};

export const practiceDisclosureVariants: Variants = {
  animate: ({ reducedMotion }: FretJourneyMotionCustom) => ({
    height: "auto",
    opacity: 1,
    transition: getMotionTransition(reducedMotion),
    y: 0,
  }),
  exit: ({ reducedMotion }: FretJourneyMotionCustom) => ({
    height: 0,
    opacity: 0,
    transition: getMotionTransition(reducedMotion, motionDurations.fast),
    y: reducedMotion ? 0 : -4,
  }),
  initial: ({ reducedMotion }: FretJourneyMotionCustom) => ({
    height: 0,
    opacity: reducedMotion ? 1 : 0,
    y: reducedMotion ? 0 : -4,
  }),
};

export const practiceCompletionMarkVariants: Variants = {
  hidden: ({ reducedMotion }: FretJourneyMotionCustom) => ({
    opacity: reducedMotion ? 1 : 0,
    scale: reducedMotion ? 1 : 0.9,
  }),
  visible: ({ reducedMotion }: FretJourneyMotionCustom) => ({
    opacity: 1,
    scale: 1,
    transition: getMotionTransition(reducedMotion, motionDurations.slow),
  }),
};
