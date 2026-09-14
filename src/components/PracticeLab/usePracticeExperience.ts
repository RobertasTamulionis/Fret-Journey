import { useReducer } from "react";
import {
  type PracticeRoutineId,
  practiceRoutines,
} from "@/data/practiceRoutines";
import { practiceTabExamples } from "@/data/practiceTabExamples";
import {
  clampPracticeTempo,
  type PracticeExperienceScreen,
  type PracticeInstrument,
  practiceDefaultCountInBeats,
} from "@/features/practice/session";
import type { PracticeTabSubdivision } from "@/features/practice/tablature";
import usePracticeTransport from "./usePracticeTransport";

type PracticeExperienceState = {
  clickSubdivision: PracticeTabSubdivision;
  countInEnabled: boolean;
  instrument: PracticeInstrument;
  instrumentPlaybackEnabled: boolean;
  metronomeEnabled: boolean;
  metronomeVolume: number;
  routineId: PracticeRoutineId;
  screen: PracticeExperienceScreen;
  stepIndex: number;
  tempo: number;
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
  | { type: "complete" }
  | { type: "repeat" }
  | { tempo: number; type: "set-tempo" }
  | { subdivision: PracticeTabSubdivision; type: "set-click-subdivision" }
  | { type: "toggle-count-in" }
  | { type: "toggle-metronome" }
  | { type: "toggle-instrument-playback" }
  | { instrument: PracticeInstrument; type: "set-instrument" }
  | { type: "set-volume"; volume: number }
  | { type: "set-metronome-volume"; volume: number };

const firstExample =
  practiceTabExamples[practiceRoutines[0].steps[0].exampleId];

const initialState: PracticeExperienceState = {
  clickSubdivision: firstExample.subdivision,
  countInEnabled: true,
  instrument: "clean-guitar",
  instrumentPlaybackEnabled: false,
  metronomeEnabled: false,
  metronomeVolume: 70,
  routineId: practiceRoutines[0].id,
  screen: "library",
  stepIndex: 0,
  tempo: firstExample.bpm,
  volume: 70,
};

const clampVolume = (volume: number): number =>
  Math.min(100, Math.max(0, volume));

const reducer = (
  state: PracticeExperienceState,
  action: PracticeExperienceAction,
): PracticeExperienceState => {
  switch (action.type) {
    case "open-exercise":
      return {
        ...state,
        clickSubdivision: action.exampleSubdivision,
        routineId: action.routineId,
        screen: "session",
        stepIndex: action.stepIndex,
        tempo: action.exampleBpm,
      };
    case "back-to-library":
      return { ...state, screen: "library" };
    case "complete":
      return { ...state, screen: "complete" };
    case "repeat":
      return { ...state, screen: "session" };
    case "set-tempo":
      return { ...state, tempo: clampPracticeTempo(action.tempo) };
    case "set-click-subdivision":
      return { ...state, clickSubdivision: action.subdivision };
    case "toggle-count-in":
      return { ...state, countInEnabled: !state.countInEnabled };
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
      return { ...state, volume: clampVolume(action.volume) };
    case "set-metronome-volume":
      return { ...state, metronomeVolume: clampVolume(action.volume) };
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
  const orderIndex = exerciseOrder.findIndex(
    ({ routineId, stepIndex }) =>
      routineId === activeRoutine.id && stepIndex === state.stepIndex,
  );
  const nextExercise = exerciseOrder[orderIndex + 1];
  const transportConfig = {
    authoredSubdivision: activeExample.subdivision,
    clickSubdivision: state.clickSubdivision,
    countInEnabled: state.countInEnabled,
    metronomeEnabled: state.metronomeEnabled,
    tempo: state.tempo,
    volume: state.metronomeVolume,
  };
  const transport = usePracticeTransport({
    ...transportConfig,
    countInBeats: practiceDefaultCountInBeats,
  });

  const openExercise = (routineId: PracticeRoutineId, stepIndex: number) => {
    const routine =
      practiceRoutines.find(({ id }) => id === routineId) ??
      practiceRoutines[0];
    const step = routine.steps[stepIndex] ?? routine.steps[0];
    const example = practiceTabExamples[step.exampleId];

    transport.stop();
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

  const configureTransport = (overrides: Partial<typeof transportConfig>) => {
    transport.configure({ ...transportConfig, ...overrides });
  };

  const setTempo = (tempo: number) => {
    const nextTempo = clampPracticeTempo(tempo);
    configureTransport({ tempo: nextTempo });
    dispatch({ tempo: nextTempo, type: "set-tempo" });
  };

  const setClickSubdivision = (subdivision: PracticeTabSubdivision) => {
    configureTransport({ clickSubdivision: subdivision });
    dispatch({ subdivision, type: "set-click-subdivision" });
  };

  const toggleCountIn = () => {
    configureTransport({ countInEnabled: !state.countInEnabled });
    dispatch({ type: "toggle-count-in" });
  };

  const toggleMetronome = () => {
    configureTransport({ metronomeEnabled: !state.metronomeEnabled });
    dispatch({ type: "toggle-metronome" });
  };

  const setMetronomeVolume = (volume: number) => {
    const nextVolume = clampVolume(volume);
    configureTransport({ volume: nextVolume });
    dispatch({ type: "set-metronome-volume", volume: nextVolume });
  };

  const handlePrimaryAction = async () => {
    if (
      transport.snapshot.phase === "counting-in" ||
      transport.snapshot.phase === "playing"
    ) {
      transport.pause();
    } else if (transport.snapshot.phase === "paused") {
      await transport.resume();
    } else {
      await transport.start();
    }
  };

  const backToLibrary = () => {
    transport.stop();
    dispatch({ type: "back-to-library" });
  };

  const completeExercise = () => {
    transport.stop();
    dispatch({ type: "complete" });
  };

  const repeatExercise = () => {
    transport.stop();
    dispatch({ type: "repeat" });
  };

  return {
    activeExample,
    activeRoutine,
    activeStep,
    backToLibrary,
    completeExercise,
    dispatch,
    handlePrimaryAction,
    hasNextExercise: nextExercise !== undefined,
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
  };
}
