"use client";

import {
  AnimatePresence,
  MotionConfig,
  motion,
  useReducedMotion,
} from "motion/react";
import { useEffect, useRef } from "react";
import {
  type FretJourneyMotionCustom,
  practiceScreenVariants,
} from "@/lib/motion";
import PracticeJourneyOverview from "./PracticeJourneyOverview";
import PracticeLibrary from "./PracticeLibrary";
import PracticeSession from "./PracticeSession";
import SessionComplete from "./SessionComplete";
import usePracticeExperience from "./usePracticeExperience";
import "./practiceLab.scss";

type PracticeLabProps = {
  exerciseId?: string;
  journeyId?: string;
};

export default function PracticeLab({
  exerciseId,
  journeyId,
}: PracticeLabProps) {
  const {
    activeExample,
    activeJourney,
    activeJourneyStepIndex,
    activeRoutine,
    activeStep,
    backFromSession,
    backToLibrary,
    completedJourneyExerciseIds,
    completeExercise,
    contextCompatibility,
    contextAnnouncement,
    dispatch,
    handlePrimaryAction,
    hasNextExercise,
    journeyAttemptQualified,
    openExercise,
    openJourneyExercise,
    openNextExercise,
    repeatExercise,
    returnToJourney,
    resolveContextCompatibility,
    remainingSeconds,
    setDurationMinutes,
    setInstrumentVolume,
    setSubdivision,
    setMetronomeVolume,
    setTempo,
    state,
    toggleCountIn,
    toggleInstrumentPlayback,
    toggleMetronome,
    transport,
  } = usePracticeExperience(exerciseId, journeyId);
  const containerRef = useRef<HTMLElement>(null);
  const previousScreenRef = useRef(state.screen);
  const motionCustom: FretJourneyMotionCustom = {
    reducedMotion: Boolean(useReducedMotion()),
  };

  useEffect(() => {
    if (previousScreenRef.current === state.screen) {
      return;
    }

    previousScreenRef.current = state.screen;
    containerRef.current
      ?.querySelector<HTMLElement>(
        `[data-practice-screen="${state.screen}"] [data-practice-screen-heading]`,
      )
      ?.focus();
  }, [state.screen]);

  return (
    <section className="practiceLab" ref={containerRef}>
      <output aria-live="polite" className="practiceVisuallyHidden">
        {contextAnnouncement}
      </output>
      <MotionConfig reducedMotion="user">
        <AnimatePresence initial={false} mode="popLayout">
          <motion.div
            animate="animate"
            custom={motionCustom}
            data-practice-screen={state.screen}
            exit="exit"
            initial="initial"
            key={state.screen}
            variants={practiceScreenVariants}
          >
            {state.screen === "library" && (
              <PracticeLibrary onSelectExercise={openExercise} />
            )}

            {state.screen === "journey" && activeJourney && (
              <PracticeJourneyOverview
                completedExerciseIds={completedJourneyExerciseIds}
                journey={activeJourney}
                onBack={backToLibrary}
                onSelectExercise={openJourneyExercise}
              />
            )}

            {state.screen === "session" && (
              <PracticeSession
                activeEventIndex={transport.snapshot.activeEventIndex}
                authoredSlot={transport.snapshot.authoredSlot}
                audioError={transport.audioError}
                countInBeatsRemaining={transport.snapshot.countInBeatsRemaining}
                countInEnabled={state.countInEnabled}
                contextCompatibility={contextCompatibility}
                example={activeExample}
                instrument={state.instrument}
                instrumentPlaybackEnabled={state.instrumentPlaybackEnabled}
                instrumentPlaybackError={transport.snapshot.instrumentError}
                instrumentPlaybackStatus={transport.snapshot.instrumentStatus}
                metronomeEnabled={state.metronomeEnabled}
                metronomeVolume={state.metronomeVolume}
                durationMinutes={state.durationSeconds / 60}
                journey={
                  activeJourney && activeJourneyStepIndex >= 0
                    ? {
                        objective:
                          activeJourney.steps[activeJourneyStepIndex].objective,
                        stepIndex: activeJourneyStepIndex,
                        title: activeJourney.title,
                        totalSteps: activeJourney.steps.length,
                      }
                    : null
                }
                journeyCompletionEnabled={journeyAttemptQualified}
                onBack={backFromSession}
                onComplete={completeExercise}
                onDurationChange={setDurationMinutes}
                onInstrumentChange={(instrument) =>
                  dispatch({ instrument, type: "set-instrument" })
                }
                onPrimaryAction={handlePrimaryAction}
                onResolveContext={resolveContextCompatibility}
                onSubdivisionChange={setSubdivision}
                onTempoChange={setTempo}
                onToggleCountIn={toggleCountIn}
                onToggleInstrumentPlayback={toggleInstrumentPlayback}
                onToggleMetronome={toggleMetronome}
                onMetronomeVolumeChange={setMetronomeVolume}
                onVolumeChange={setInstrumentVolume}
                remainingSeconds={remainingSeconds}
                routine={activeRoutine}
                step={activeStep}
                stepIndex={state.stepIndex}
                subdivision={state.selectedSubdivision}
                tempo={state.tempo}
                transportStatus={transport.snapshot.phase}
                volume={state.volume}
              />
            )}

            {state.screen === "complete" && (
              <SessionComplete
                completedCount={completedJourneyExerciseIds.length}
                hasNextExercise={hasNextExercise}
                onBackToLibrary={backToLibrary}
                onNextExercise={openNextExercise}
                onRepeat={repeatExercise}
                onReturnToJourney={returnToJourney}
                journey={activeJourney}
                step={activeStep}
                tempo={state.tempo}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </MotionConfig>
    </section>
  );
}
