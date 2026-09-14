import { motion, useReducedMotion } from "motion/react";
import type { PracticeStep } from "@/data/practiceRoutines";
import {
  type FretJourneyMotionCustom,
  practiceCompletionMarkVariants,
  practiceRevealContainerVariants,
  practiceRevealVariants,
} from "@/lib/motion";

type SessionCompleteProps = {
  hasNextExercise: boolean;
  onBackToLibrary: () => void;
  onNextExercise: () => void;
  onRepeat: () => void;
  step: PracticeStep;
  tempo: number;
};

export default function SessionComplete({
  hasNextExercise,
  onBackToLibrary,
  onNextExercise,
  onRepeat,
  step,
  tempo,
}: SessionCompleteProps) {
  const motionCustom: FretJourneyMotionCustom = {
    reducedMotion: Boolean(useReducedMotion()),
  };

  return (
    <motion.section
      animate="visible"
      className="sessionComplete"
      custom={motionCustom}
      initial="hidden"
      variants={practiceRevealContainerVariants}
    >
      <motion.span
        aria-hidden="true"
        className="sessionComplete__mark"
        custom={motionCustom}
        variants={practiceCompletionMarkVariants}
      >
        ✓
      </motion.span>
      <motion.span
        className="sessionComplete__eyebrow"
        custom={motionCustom}
        variants={practiceRevealVariants}
      >
        Exercise completed
      </motion.span>
      <motion.h1
        custom={motionCustom}
        data-practice-screen-heading
        tabIndex={-1}
        variants={practiceRevealVariants}
      >
        {step.title}
      </motion.h1>
      <motion.p custom={motionCustom} variants={practiceRevealVariants}>
        You finished this focused practice session.
      </motion.p>
      <motion.dl custom={motionCustom} variants={practiceRevealVariants}>
        <div>
          <dt>Tempo used</dt>
          <dd>{tempo} BPM</dd>
        </div>
      </motion.dl>
      <motion.div
        className="sessionComplete__actions"
        custom={motionCustom}
        variants={practiceRevealVariants}
      >
        <button
          className="practicePrimaryAction"
          onClick={onRepeat}
          type="button"
        >
          Repeat exercise
        </button>
        <button
          disabled={!hasNextExercise}
          onClick={onNextExercise}
          type="button"
        >
          Next exercise
        </button>
        <button onClick={onBackToLibrary} type="button">
          Back to library
        </button>
      </motion.div>
    </motion.section>
  );
}
