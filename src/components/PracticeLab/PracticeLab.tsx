"use client";

import { useEffect, useRef } from "react";
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
    dispatch,
    hasNextExercise,
    openExercise,
    openNextExercise,
    state,
  } = usePracticeExperience();
  const containerRef = useRef<HTMLElement>(null);
  const previousScreenRef = useRef(state.screen);

  useEffect(() => {
    if (previousScreenRef.current === state.screen) {
      return;
    }

    previousScreenRef.current = state.screen;
    containerRef.current
      ?.querySelector<HTMLElement>("[data-practice-screen-heading]")
      ?.focus();
  }, [state.screen]);

  const handlePrimaryAction = () => {
    if (state.transportStatus === "playing") {
      dispatch({ type: "pause" });
    } else if (state.transportStatus === "paused") {
      dispatch({ type: "resume" });
    } else {
      dispatch({ type: "start" });
    }
  };

  return (
    <section className="practiceLab" ref={containerRef}>
      {state.screen === "library" && (
        <PracticeLibrary onSelectExercise={openExercise} />
      )}

      {state.screen === "session" && (
        <PracticeSession
          activeSlot={state.activeSlot}
          example={activeExample}
          instrument={state.instrument}
          instrumentPlaybackEnabled={state.instrumentPlaybackEnabled}
          metronomeEnabled={state.metronomeEnabled}
          onBack={() => dispatch({ type: "back-to-library" })}
          onComplete={() => dispatch({ type: "complete" })}
          onInstrumentChange={(instrument) =>
            dispatch({ instrument, type: "set-instrument" })
          }
          onPrimaryAction={handlePrimaryAction}
          onSubdivisionChange={(subdivision) =>
            dispatch({ subdivision, type: "set-subdivision" })
          }
          onTempoChange={(tempo) => dispatch({ tempo, type: "set-tempo" })}
          onToggleInstrumentPlayback={() =>
            dispatch({ type: "toggle-instrument-playback" })
          }
          onToggleMetronome={() => dispatch({ type: "toggle-metronome" })}
          onVolumeChange={(volume) => dispatch({ type: "set-volume", volume })}
          routine={activeRoutine}
          step={activeStep}
          stepIndex={state.stepIndex}
          subdivision={state.subdivision}
          tempo={state.tempo}
          transportStatus={state.transportStatus}
          volume={state.volume}
        />
      )}

      {state.screen === "complete" && (
        <SessionComplete
          hasNextExercise={hasNextExercise}
          onBackToLibrary={() => dispatch({ type: "back-to-library" })}
          onNextExercise={openNextExercise}
          onRepeat={() => dispatch({ type: "repeat" })}
          step={activeStep}
          tempo={state.tempo}
        />
      )}
    </section>
  );
}
