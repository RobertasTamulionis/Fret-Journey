import { useEffect, useReducer } from "react";
import {
  type PracticeRoutineId,
  practiceRoutines,
} from "@/data/practiceRoutines";
import { practiceTabExamples } from "@/data/practiceTabExamples";
import {
  clampPracticeTempo,
  getPracticeSlotDurationMs,
  type PracticeExperienceScreen,
  type PracticeInstrument,
  type PracticeTransportStatus,
} from "@/features/practice/session";
import {
  type PracticeTabSubdivision,
  practiceTabSlotCount,
} from "@/features/practice/tablature";

type PracticeExperienceState = {
  activeSlot: number;
  instrument: PracticeInstrument;
  instrumentPlaybackEnabled: boolean;
  metronomeEnabled: boolean;
  routineId: PracticeRoutineId;
  screen: PracticeExperienceScreen;
  stepIndex: number;
  subdivision: PracticeTabSubdivision;
  tempo: number;
  transportStatus: PracticeTransportStatus;
  volume: number;
};

type PracticeExperienceAction =
  | {
      exampleBpm: number;
      exampleSubdivision: PracticeTabSubdivision;
      routineId: PracticeRoutineId;
      stepIndex: number;
      type: "open-exercise";
    }
  | { type: "back-to-library" }
  | { type: "start" }
  | { type: "pause" }
  | { type: "resume" }
  | { type: "complete" }
  | { type: "repeat" }
  | { elapsedSlots: number; slotCount: number; type: "advance-slot" }
  | { tempo: number; type: "set-tempo" }
  | { subdivision: PracticeTabSubdivision; type: "set-subdivision" }
  | { type: "toggle-metronome" }
  | { type: "toggle-instrument-playback" }
  | { instrument: PracticeInstrument; type: "set-instrument" }
  | { type: "set-volume"; volume: number };

const firstExample =
  practiceTabExamples[practiceRoutines[0].steps[0].exampleId];

const initialState: PracticeExperienceState = {
  activeSlot: 0,
  instrument: "clean-guitar",
  instrumentPlaybackEnabled: false,
  metronomeEnabled: false,
  routineId: practiceRoutines[0].id,
  screen: "library",
  stepIndex: 0,
  subdivision: firstExample.subdivision,
  tempo: firstExample.bpm,
  transportStatus: "idle",
  volume: 70,
};

const reducer = (
  state: PracticeExperienceState,
  action: PracticeExperienceAction,
): PracticeExperienceState => {
  switch (action.type) {
    case "open-exercise":
      return {
        ...state,
        activeSlot: 0,
        routineId: action.routineId,
        screen: "session",
        stepIndex: action.stepIndex,
        subdivision: action.exampleSubdivision,
        tempo: action.exampleBpm,
        transportStatus: "idle",
      };
    case "back-to-library":
      return { ...state, screen: "library", transportStatus: "idle" };
    case "start":
    case "resume":
      return { ...state, transportStatus: "playing" };
    case "pause":
      return { ...state, transportStatus: "paused" };
    case "complete":
      return { ...state, screen: "complete", transportStatus: "idle" };
    case "repeat":
      return {
        ...state,
        activeSlot: 0,
        screen: "session",
        transportStatus: "idle",
      };
    case "advance-slot":
      return {
        ...state,
        activeSlot: (state.activeSlot + action.elapsedSlots) % action.slotCount,
      };
    case "set-tempo":
      return { ...state, tempo: clampPracticeTempo(action.tempo) };
    case "set-subdivision":
      return { ...state, subdivision: action.subdivision };
    case "toggle-metronome":
      return { ...state, metronomeEnabled: !state.metronomeEnabled };
    case "toggle-instrument-playback":
      return {
        ...state,
        instrumentPlaybackEnabled: !state.instrumentPlaybackEnabled,
      };
    case "set-instrument":
      return { ...state, instrument: action.instrument };
    case "set-volume":
      return { ...state, volume: Math.min(100, Math.max(0, action.volume)) };
  }
};

const exerciseOrder = practiceRoutines.flatMap((routine) =>
  routine.steps.map((_, stepIndex) => ({ routineId: routine.id, stepIndex })),
);

export default function usePracticeExperience() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const activeRoutine =
    practiceRoutines.find(({ id }) => id === state.routineId) ??
    practiceRoutines[0];
  const activeStep =
    activeRoutine.steps[state.stepIndex] ?? activeRoutine.steps[0];
  const activeExample = practiceTabExamples[activeStep.exampleId];
  const activeSlotCount = practiceTabSlotCount[activeExample.subdivision];
  const orderIndex = exerciseOrder.findIndex(
    ({ routineId, stepIndex }) =>
      routineId === activeRoutine.id && stepIndex === state.stepIndex,
  );
  const nextExercise = exerciseOrder[orderIndex + 1];

  useEffect(() => {
    if (state.transportStatus !== "playing") {
      return;
    }

    const slotDuration = getPracticeSlotDurationMs(
      state.tempo,
      activeExample.subdivision,
    );
    let nextSlotAt = performance.now() + slotDuration;
    let timeoutId: number;

    const scheduleNextSlot = () => {
      timeoutId = window.setTimeout(
        () => {
          const now = performance.now();
          const elapsedSlots = Math.max(
            1,
            Math.floor((now - nextSlotAt) / slotDuration) + 1,
          );

          nextSlotAt += elapsedSlots * slotDuration;
          dispatch({
            elapsedSlots,
            slotCount: activeSlotCount,
            type: "advance-slot",
          });
          scheduleNextSlot();
        },
        Math.max(0, nextSlotAt - performance.now()),
      );
    };

    scheduleNextSlot();

    return () => window.clearTimeout(timeoutId);
  }, [
    activeExample.subdivision,
    activeSlotCount,
    state.tempo,
    state.transportStatus,
  ]);

  const openExercise = (routineId: PracticeRoutineId, stepIndex: number) => {
    const routine =
      practiceRoutines.find(({ id }) => id === routineId) ??
      practiceRoutines[0];
    const step = routine.steps[stepIndex] ?? routine.steps[0];
    const example = practiceTabExamples[step.exampleId];

    dispatch({
      exampleBpm: example.bpm,
      exampleSubdivision: example.subdivision,
      routineId: routine.id,
      stepIndex: routine.steps.indexOf(step),
      type: "open-exercise",
    });
  };

  const openNextExercise = () => {
    if (nextExercise) {
      openExercise(nextExercise.routineId, nextExercise.stepIndex);
    }
  };

  return {
    activeExample,
    activeRoutine,
    activeStep,
    dispatch,
    hasNextExercise: nextExercise !== undefined,
    openExercise,
    openNextExercise,
    state,
  };
}
