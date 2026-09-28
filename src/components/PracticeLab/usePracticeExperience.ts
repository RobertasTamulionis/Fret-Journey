import { useRouter } from "next/navigation";
import { useEffect, useMemo, useReducer, useRef, useState } from "react";
import {
  type PracticeRoutineId,
  practiceRoutines,
} from "@/data/practiceRoutines";
import { practiceTabExamples } from "@/data/practiceTabExamples";
import {
  getPracticeContextLabel,
  resolvePracticeTab,
} from "@/features/practice/resolvePracticeTab";
import {
  clampPracticeTempo,
  type PracticeExperienceScreen,
  type PracticeInstrument,
  practiceDefaultCountInBeats,
} from "@/features/practice/session";
import type { PracticeTabSubdivision } from "@/features/practice/tablature";
import { useAppSelector } from "@/lib/redux/store";
import usePracticeTransport from "./usePracticeTransport";

type PracticeExperienceState = {
  countInEnabled: boolean;
  instrument: PracticeInstrument;
  instrumentPlaybackEnabled: boolean;
  metronomeEnabled: boolean;
  metronomeVolume: number;
  routineId: PracticeRoutineId;
  screen: PracticeExperienceScreen;
  selectedSubdivision: PracticeTabSubdivision;
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
  | {
      selection: PracticeExerciseSelection | null;
      type: "sync-url";
    }
  | { type: "complete" }
  | { type: "repeat" }
  | { tempo: number; type: "set-tempo" }
  | { subdivision: PracticeTabSubdivision; type: "set-subdivision" }
  | { type: "toggle-count-in" }
  | { type: "toggle-metronome" }
  | { type: "toggle-instrument-playback" }
  | { instrument: PracticeInstrument; type: "set-instrument" }
  | { type: "set-volume"; volume: number }
  | { type: "set-metronome-volume"; volume: number };

const firstExample =
  practiceTabExamples[practiceRoutines[0].steps[0].exampleId];

type PracticeExerciseSelection = {
  routineId: PracticeRoutineId;
  stepIndex: number;
};

const defaultState: PracticeExperienceState = {
  countInEnabled: true,
  instrument: "clean-guitar",
  instrumentPlaybackEnabled: false,
  metronomeEnabled: false,
  metronomeVolume: 70,
  routineId: practiceRoutines[0].id,
  screen: "library",
  selectedSubdivision: firstExample.subdivision,
  stepIndex: 0,
  tempo: firstExample.bpm,
  volume: 70,
};

const findExerciseSelection = (
  exerciseId?: string,
): PracticeExerciseSelection | null => {
  if (!exerciseId) {
    return null;
  }

  for (const routine of practiceRoutines) {
    const stepIndex = routine.steps.findIndex(
      ({ exampleId }) => exampleId === exerciseId,
    );

    if (stepIndex !== -1) {
      return { routineId: routine.id, stepIndex };
    }
  }

  return null;
};

const openExerciseState = (
  state: PracticeExperienceState,
  selection: PracticeExerciseSelection,
): PracticeExperienceState => {
  const routine =
    practiceRoutines.find(({ id }) => id === selection.routineId) ??
    practiceRoutines[0];
  const step = routine.steps[selection.stepIndex] ?? routine.steps[0];
  const example = practiceTabExamples[step.exampleId];

  return {
    ...state,
    routineId: routine.id,
    screen: "session",
    selectedSubdivision: example.subdivision,
    stepIndex: routine.steps.indexOf(step),
    tempo: example.bpm,
  };
};

const createInitialState = (
  selection: PracticeExerciseSelection | null,
): PracticeExperienceState =>
  selection ? openExerciseState(defaultState, selection) : defaultState;

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
        routineId: action.routineId,
        screen: "session",
        selectedSubdivision: action.exampleSubdivision,
        stepIndex: action.stepIndex,
        tempo: action.exampleBpm,
      };
    case "back-to-library":
      return { ...state, screen: "library" };
    case "sync-url":
      if (!action.selection) {
        return state.screen === "library"
          ? state
          : { ...state, screen: "library" };
      }

      if (
        state.screen !== "library" &&
        state.routineId === action.selection.routineId &&
        state.stepIndex === action.selection.stepIndex
      ) {
        return state;
      }

      return openExerciseState(state, action.selection);
    case "complete":
      return { ...state, screen: "complete" };
    case "repeat":
      return { ...state, screen: "session" };
    case "set-tempo":
      return { ...state, tempo: clampPracticeTempo(action.tempo) };
    case "set-subdivision":
      return { ...state, selectedSubdivision: action.subdivision };
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

export default function usePracticeExperience(exerciseId?: string) {
  const router = useRouter();
  const { currentKey, currentScale, registeredTuning, stringCount, tuning } =
    useAppSelector((reduxState) => reduxState.fretboard);
  const urlSelection = useMemo(
    () => findExerciseSelection(exerciseId),
    [exerciseId],
  );
  const [state, dispatch] = useReducer(
    reducer,
    urlSelection,
    createInitialState,
  );
  const activeRoutine =
    practiceRoutines.find(({ id }) => id === state.routineId) ??
    practiceRoutines[0];
  const activeStep =
    activeRoutine.steps[state.stepIndex] ?? activeRoutine.steps[0];
  const practiceContext = useMemo(
    () => ({
      currentKey,
      currentScale,
      registeredTuning,
      stringCount,
      tuning,
    }),
    [currentKey, currentScale, registeredTuning, stringCount, tuning],
  );
  const activeExample = useMemo(
    () => resolvePracticeTab(activeStep.exampleId, practiceContext),
    [activeStep.exampleId, practiceContext],
  );
  const contextSignature = `${currentKey}|${currentScale}|${stringCount}|${tuning.join(",")}|${registeredTuning.status}`;
  const previousContextSignature = useRef(contextSignature);
  const [contextAnnouncement, setContextAnnouncement] = useState("");
  const orderIndex = exerciseOrder.findIndex(
    ({ routineId, stepIndex }) =>
      routineId === activeRoutine.id && stepIndex === state.stepIndex,
  );
  const nextExercise = exerciseOrder[orderIndex + 1];
  const transportConfig = {
    countInEnabled: state.countInEnabled,
    eventCount: activeExample.events.length,
    metronomeEnabled: state.metronomeEnabled,
    subdivision: state.selectedSubdivision,
    tempo: state.tempo,
    volume: state.metronomeVolume,
  };
  const transport = usePracticeTransport({
    ...transportConfig,
    countInBeats: practiceDefaultCountInBeats,
  });

  useEffect(() => {
    transport.stop();
    dispatch({ selection: urlSelection, type: "sync-url" });

    if (exerciseId && !urlSelection) {
      router.replace("/practice", { scroll: false });
    }
  }, [exerciseId, router, transport.stop, urlSelection]);

  useEffect(() => {
    if (previousContextSignature.current === contextSignature) {
      return;
    }

    previousContextSignature.current = contextSignature;
    transport.stop();
    setContextAnnouncement(
      `Practice stopped and reset for ${getPracticeContextLabel(practiceContext)}.`,
    );
  }, [contextSignature, practiceContext, transport.stop]);

  const openExercise = (
    routineId: PracticeRoutineId,
    stepIndex: number,
    navigation: "push" | "replace" = "push",
  ) => {
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
    router[navigation](
      `/practice?exercise=${encodeURIComponent(step.exampleId)}`,
      {
        scroll: false,
      },
    );
  };

  const openNextExercise = () => {
    if (nextExercise) {
      openExercise(nextExercise.routineId, nextExercise.stepIndex, "replace");
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

  const setSubdivision = (subdivision: PracticeTabSubdivision) => {
    configureTransport({ subdivision });
    dispatch({ subdivision, type: "set-subdivision" });
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
    router.replace("/practice", { scroll: false });
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
    contextAnnouncement,
    dispatch,
    handlePrimaryAction,
    hasNextExercise: nextExercise !== undefined,
    openExercise,
    openNextExercise,
    repeatExercise,
    setSubdivision,
    setMetronomeVolume,
    setTempo,
    state,
    toggleCountIn,
    toggleMetronome,
    transport,
  };
}
