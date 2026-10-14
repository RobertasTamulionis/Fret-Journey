import { motion, useReducedMotion } from "motion/react";
import type { PracticeJourney } from "@/data/practiceJourneys";
import type { PracticeStep } from "@/data/practiceRoutines";
import {
  type FretJourneyMotionCustom,
  practiceCompletionMarkVariants,
  practiceRevealContainerVariants,
  practiceRevealVariants,
} from "@/lib/motion";

type SessionCompleteProps = {
  completedCount: number;
  hasNextExercise: boolean;
  journey: PracticeJourney | null;
  onBackToLibrary: () => void;
  onNextExercise: () => void;
  onRepeat: () => void;
  onReturnToJourney: () => void;
  step: PracticeStep;
  tempo: number;
};

export default function SessionComplete({
  completedCount,
  hasNextExercise,
  journey,
  onBackToLibrary,
  onNextExercise,
  onRepeat,
  onReturnToJourney,
  step,
  tempo,
}: SessionCompleteProps) {
  const motionCustom: FretJourneyMotionCustom = {
    reducedMotion: Boolean(useReducedMotion()),
  };
  const journeyComplete = Boolean(
    journey && completedCount === journey.steps.length,
  );

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
        {journey
          ? journeyComplete
            ? `${journey.title} complete`
            : "Journey step completed"
          : "Exercise completed"}
      </motion.span>
      <motion.h1
        custom={motionCustom}
        data-practice-screen-heading
        tabIndex={-1}
        variants={practiceRevealVariants}
      >
        {journeyComplete && journey ? journey.title : step.title}
      </motion.h1>
      <motion.p custom={motionCustom} variants={practiceRevealVariants}>
        {journeyComplete && journey
          ? `${journey.finalOutcome} You completed every guided session; this records practice completion, not performance scoring.`
          : journey
            ? `You finished this focused practice session. ${completedCount} of ${journey.steps.length} Journey steps are complete.`
            : "You finished this focused practice session."}
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
          {journeyComplete ? "Repeat Iron Pulse" : "Repeat exercise"}
        </button>
        {journey ? (
          <>
            {!journeyComplete && (
              <button
                disabled={!hasNextExercise}
                onClick={onNextExercise}
                type="button"
              >
                Continue to next step
              </button>
            )}
            <button onClick={onReturnToJourney} type="button">
              {journeyComplete ? "View completed Journey" : "Return to Journey"}
            </button>
            {journeyComplete && (
              <button onClick={onBackToLibrary} type="button">
                Back to Practice Library
              </button>
            )}
          </>
        ) : (
          <>
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
          </>
        )}
      </motion.div>
    </motion.section>
  );
}
