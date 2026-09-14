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
import PracticeLibrary from "./PracticeLibrary";
import PracticeSession from "./PracticeSession";
import SessionComplete from "./SessionComplete";
import usePracticeExperience from "./usePracticeExperience";
import "./practiceLab.scss";

export default function PracticeLab() {
  const {
    activeExample,
    activeRoutine,
    activeStep,
    backToLibrary,
    completeExercise,
    dispatch,
    handlePrimaryAction,
    hasNextExercise,
    openExercise,
    openNextExercise,
    repeatExercise,
    setClickSubdivision,
    setMetronomeVolume,
    setTempo,
    state,
    toggleCountIn,
    toggleMetronome,
    transport,
  } = usePracticeExperience();
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

            {state.screen === "session" && (
              <PracticeSession
                activeSlot={transport.snapshot.activeSlot}
                audioError={transport.audioError}
                clickSubdivision={state.clickSubdivision}
                countInBeatsRemaining={transport.snapshot.countInBeatsRemaining}
                countInEnabled={state.countInEnabled}
                example={activeExample}
                instrument={state.instrument}
                instrumentPlaybackEnabled={state.instrumentPlaybackEnabled}
                metronomeEnabled={state.metronomeEnabled}
                metronomeVolume={state.metronomeVolume}
                onBack={backToLibrary}
                onComplete={completeExercise}
                onInstrumentChange={(instrument) =>
                  dispatch({ instrument, type: "set-instrument" })
                }
                onPrimaryAction={handlePrimaryAction}
                onSubdivisionChange={setClickSubdivision}
                onTempoChange={setTempo}
                onToggleCountIn={toggleCountIn}
                onToggleInstrumentPlayback={() =>
                  dispatch({ type: "toggle-instrument-playback" })
                }
                onToggleMetronome={toggleMetronome}
                onMetronomeVolumeChange={setMetronomeVolume}
                onVolumeChange={(volume) =>
                  dispatch({ type: "set-volume", volume })
                }
                routine={activeRoutine}
                step={activeStep}
                stepIndex={state.stepIndex}
                tempo={state.tempo}
                transportStatus={transport.snapshot.phase}
                volume={state.volume}
              />
            )}

            {state.screen === "complete" && (
              <SessionComplete
                hasNextExercise={hasNextExercise}
                onBackToLibrary={backToLibrary}
                onNextExercise={openNextExercise}
                onRepeat={repeatExercise}
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
