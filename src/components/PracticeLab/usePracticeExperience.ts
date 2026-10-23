import { useRouter } from "next/navigation";
import { useEffect, useMemo, useReducer, useRef, useState } from "react";
import { practiceExerciseMetadata } from "@/data/practiceExerciseMetadata";
import {
  isJourneyExercise,
  type PracticeJourneyId,
  practiceJourneys,
} from "@/data/practiceJourneys";
import {
  type PracticeRoutineId,
  practiceRoutines,
} from "@/data/practiceRoutines";
import { practiceTabExamples } from "@/data/practiceTabExamples";
import { buildPracticeAudioEvents } from "@/features/practice/audio/buildPracticeAudioEvents";
import { resolvePracticeExerciseId } from "@/features/practice/exerciseAliases";
import { resolvePracticeJourneyLocation } from "@/features/practice/journeyNavigation";
import {
  completeJourneyExercise,
  emptyPracticeJourneyProgress,
  getCompletedJourneyExerciseIds,
  isJourneyAttemptQualified,
  readPracticeJourneyProgress,
  writePracticeJourneyProgress,
} from "@/features/practice/journeyProgress";
import {
  getPracticeContextCompatibility,
  getPracticeContextLabel,
  getPracticeContextSignature,
  resolvePracticeTab,
} from "@/features/practice/resolvePracticeTab";
import {
  clampPracticeDurationMinutes,
  clampPracticeTempo,
  getPracticeDurationSeconds,
  getPracticeRemainingSeconds,
  type PracticeExperienceScreen,
  type PracticeInstrument,
  practiceDefaultCountInBeats,
} from "@/features/practice/session";
import type { PracticeTabSubdivision } from "@/features/practice/tablature";
import { createPracticePlaybackTimeline } from "@/features/practice/tablature";
import {
  setKey,
  setScale,
  setStringCount,
} from "@/lib/redux/slices/fretboardSlice";
import { useAppDispatch, useAppSelector } from "@/lib/redux/store";
import usePracticeTransport from "./usePracticeTransport";

type PracticeExperienceState = {
  countInEnabled: boolean;
  durationSeconds: number;
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
      exerciseDurationSeconds: number;
      exampleSubdivision: PracticeTabSubdivision;
      routineId: PracticeRoutineId;
      stepIndex: number;
      type: "open-exercise";
    }
  | { screen: "journey" | "library"; type: "show-overview" }
  | {
      journeyOverview: boolean;
      selection: PracticeExerciseSelection | null;
      type: "sync-url";
    }
  | { type: "complete" }
  | { type: "repeat" }
  | { tempo: number; type: "set-tempo" }
  | { durationSeconds: number; type: "set-duration" }
  | { subdivision: PracticeTabSubdivision; type: "set-subdivision" }
  | { type: "toggle-count-in" }
  | { type: "toggle-metronome" }
  | { type: "toggle-instrument-playback" }
  | { instrument: PracticeInstrument; type: "set-instrument" }
  | { type: "set-volume"; volume: number }
  | { type: "set-metronome-volume"; volume: number };

const firstExampleId = practiceRoutines[0].steps[0].exampleId;
const firstExample = practiceTabExamples[firstExampleId];

type PracticeExerciseSelection = {
  routineId: PracticeRoutineId;
  stepIndex: number;
};

const defaultState: PracticeExperienceState = {
  countInEnabled: true,
  durationSeconds: getPracticeDurationSeconds(
    practiceRoutines[0].steps[0].duration,
  ),
  instrument: "clean-electric",
  instrumentPlaybackEnabled: false,
  metronomeEnabled: false,
  metronomeVolume: 70,
  routineId: practiceRoutines[0].id,
  screen: "library",
  selectedSubdivision: firstExample.subdivision,
  stepIndex: 0,
  tempo: practiceExerciseMetadata[firstExampleId].tempo.recommended,
  volume: 70,
};

const findExerciseSelection = (
  exerciseId?: string,
): PracticeExerciseSelection | null => {
  const canonicalExerciseId = resolvePracticeExerciseId(exerciseId);

  if (!canonicalExerciseId) {
    return null;
  }

  for (const routine of practiceRoutines) {
    const stepIndex = routine.steps.findIndex(
      ({ exampleId, isSharedReference }) =>
        exampleId === canonicalExerciseId && !isSharedReference,
    );

    if (stepIndex !== -1) {
      return { routineId: routine.id, stepIndex };
    }
  }

  for (const routine of practiceRoutines) {
    const stepIndex = routine.steps.findIndex(
      ({ exampleId }) => exampleId === canonicalExerciseId,
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
    durationSeconds: getPracticeDurationSeconds(step.duration),
    routineId: routine.id,
    screen: "session",
    selectedSubdivision: example.subdivision,
    stepIndex: routine.steps.indexOf(step),
    tempo: practiceExerciseMetadata[step.exampleId].tempo.recommended,
  };
};

const createInitialState = ({
  journeyOverview,
  selection,
}: {
  journeyOverview: boolean;
  selection: PracticeExerciseSelection | null;
}): PracticeExperienceState =>
  selection
    ? openExerciseState(defaultState, selection)
    : { ...defaultState, screen: journeyOverview ? "journey" : "library" };

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
        durationSeconds: action.exerciseDurationSeconds,
        routineId: action.routineId,
        screen: "session",
        selectedSubdivision: action.exampleSubdivision,
        stepIndex: action.stepIndex,
        tempo: action.exampleBpm,
      };
    case "show-overview":
      return { ...state, screen: action.screen };
    case "sync-url":
      if (!action.selection) {
        const screen = action.journeyOverview ? "journey" : "library";
        return state.screen === screen ? state : { ...state, screen };
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
    case "set-duration":
      return { ...state, durationSeconds: action.durationSeconds };
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

export default function usePracticeExperience(
  exerciseId?: string,
  journeyId?: string,
) {
  const router = useRouter();
  const reduxDispatch = useAppDispatch();
  const { currentKey, currentScale, registeredTuning, stringCount, tuning } =
    useAppSelector((reduxState) => reduxState.fretboard);
  const journeyLocation = resolvePracticeJourneyLocation({
    exerciseId,
    journeyId,
  });
  const canonicalExerciseId = journeyLocation.exerciseId;
  const activeJourney = journeyLocation.journey;
  const validJourneyExercise = Boolean(
    activeJourney &&
      canonicalExerciseId &&
      isJourneyExercise(activeJourney, canonicalExerciseId),
  );
  const urlSelection = useMemo(
    () =>
      activeJourney && !validJourneyExercise
        ? null
        : findExerciseSelection(canonicalExerciseId ?? undefined),
    [activeJourney, canonicalExerciseId, validJourneyExercise],
  );
  const [state, dispatch] = useReducer(
    reducer,
    {
      journeyOverview: Boolean(activeJourney && !validJourneyExercise),
      selection: urlSelection,
    },
    createInitialState,
  );
  const [journeyProgress, setJourneyProgress] = useState(
    emptyPracticeJourneyProgress,
  );
  const [journeyAttemptDuration, setJourneyAttemptDuration] = useState<
    number | null
  >(null);
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
  const contextCompatibility = useMemo(
    () =>
      getPracticeContextCompatibility(activeStep.exampleId, practiceContext),
    [activeStep.exampleId, practiceContext],
  );
  const activeExample = useMemo(
    () =>
      contextCompatibility.compatible
        ? resolvePracticeTab(activeStep.exampleId, practiceContext)
        : practiceTabExamples[activeStep.exampleId],
    [activeStep.exampleId, contextCompatibility.compatible, practiceContext],
  );
  const playbackExample = useMemo(
    () =>
      createPracticePlaybackTimeline(activeExample, state.selectedSubdivision),
    [activeExample, state.selectedSubdivision],
  );
  const contextSignature = getPracticeContextSignature(practiceContext);
  const instrumentPlan = useMemo(
    () => buildPracticeAudioEvents(playbackExample),
    [playbackExample],
  );
  const previousContextSignature = useRef(contextSignature);
  const [contextAnnouncement, setContextAnnouncement] = useState("");
  const orderIndex = exerciseOrder.findIndex(
    ({ routineId, stepIndex }) =>
      routineId === activeRoutine.id && stepIndex === state.stepIndex,
  );
  const nextExercise = exerciseOrder[orderIndex + 1];
  const transportConfig = {
    authoredScore: playbackExample,
    clickSubdivision: state.selectedSubdivision,
    countInEnabled: state.countInEnabled,
    instrumentEnabled: state.instrumentPlaybackEnabled,
    instrumentPlan,
    instrumentPreset: state.instrument,
    instrumentVolume: state.volume,
    metronomeEnabled: state.metronomeEnabled,
    playbackSpeedMultiplier: 1,
    tempo: state.tempo,
    volume: state.metronomeVolume,
  };
  const transport = usePracticeTransport({
    ...transportConfig,
    countInBeats: practiceDefaultCountInBeats,
  });
  const remainingSeconds = getPracticeRemainingSeconds(
    state.durationSeconds,
    transport.snapshot.elapsedExerciseSeconds,
  );
  const completedJourneyExerciseIds = getCompletedJourneyExerciseIds(
    journeyProgress,
    activeJourney?.id ?? practiceJourneys[0].id,
  );
  const activeJourneyStepIndex = activeJourney
    ? activeJourney.steps.findIndex(
        ({ exerciseId: candidateId }) => candidateId === activeStep.exampleId,
      )
    : -1;
  const journeyAttemptQualified = isJourneyAttemptQualified({
    compatible: contextCompatibility.compatible,
    elapsedExerciseSeconds: transport.snapshot.elapsedExerciseSeconds,
    journeyExercise: Boolean(activeJourney && activeJourneyStepIndex >= 0),
    qualifyingDurationSeconds: journeyAttemptDuration,
  });

  useEffect(() => {
    setJourneyProgress(readPracticeJourneyProgress());
  }, []);

  useEffect(() => {
    if (remainingSeconds === 0 && transport.snapshot.phase === "playing") {
      transport.pause();
    }
  }, [remainingSeconds, transport.pause, transport.snapshot.phase]);

  useEffect(() => {
    transport.stop();
    setJourneyAttemptDuration(null);

    if (journeyId && !activeJourney) {
      router.replace(
        canonicalExerciseId
          ? `/practice?exercise=${encodeURIComponent(canonicalExerciseId)}`
          : "/practice",
        { scroll: false },
      );
      dispatch({
        journeyOverview: false,
        selection: findExerciseSelection(canonicalExerciseId ?? undefined),
        type: "sync-url",
      });
      return;
    }

    if (activeJourney && exerciseId && !validJourneyExercise) {
      router.replace(
        `/practice?journey=${encodeURIComponent(activeJourney.id)}`,
        { scroll: false },
      );
      dispatch({ journeyOverview: true, selection: null, type: "sync-url" });
      return;
    }

    dispatch({
      journeyOverview: Boolean(activeJourney && !urlSelection),
      selection: urlSelection,
      type: "sync-url",
    });

    if (
      exerciseId &&
      canonicalExerciseId &&
      exerciseId !== canonicalExerciseId
    ) {
      router.replace(
        activeJourney
          ? `/practice?journey=${encodeURIComponent(activeJourney.id)}&exercise=${encodeURIComponent(canonicalExerciseId)}`
          : `/practice?exercise=${encodeURIComponent(canonicalExerciseId)}`,
        { scroll: false },
      );
    } else if (exerciseId && !urlSelection) {
      router.replace("/practice", { scroll: false });
    }
  }, [
    activeJourney,
    canonicalExerciseId,
    exerciseId,
    journeyId,
    router,
    transport.stop,
    urlSelection,
    validJourneyExercise,
  ]);

  useEffect(() => {
    if (previousContextSignature.current === contextSignature) {
      return;
    }

    previousContextSignature.current = contextSignature;
    transport.stop();
    setJourneyAttemptDuration(null);
    setContextAnnouncement(
      contextCompatibility.compatible
        ? `Practice stopped and reset for ${getPracticeContextLabel(practiceContext)}.`
        : (contextCompatibility.reason ?? "This context is unavailable."),
    );
  }, [
    contextCompatibility.compatible,
    contextCompatibility.reason,
    contextSignature,
    practiceContext,
    transport.stop,
  ]);

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
    setJourneyAttemptDuration(null);
    dispatch({
      exampleBpm: practiceExerciseMetadata[step.exampleId].tempo.recommended,
      exerciseDurationSeconds: getPracticeDurationSeconds(step.duration),
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

  const openJourney = (nextJourneyId: PracticeJourneyId) => {
    transport.stop();
    setJourneyAttemptDuration(null);
    dispatch({ screen: "journey", type: "show-overview" });
    router.push(`/practice?journey=${encodeURIComponent(nextJourneyId)}`, {
      scroll: false,
    });
  };

  const openJourneyExercise = (
    nextExerciseId: string,
    navigation: "push" | "replace" = "push",
  ) => {
    if (!activeJourney) return;
    const canonicalId = resolvePracticeExerciseId(nextExerciseId);
    if (!canonicalId || !isJourneyExercise(activeJourney, canonicalId)) return;
    const selection = findExerciseSelection(canonicalId);
    if (!selection) return;

    const routine =
      practiceRoutines.find(({ id }) => id === selection.routineId) ??
      practiceRoutines[0];
    const step = routine.steps[selection.stepIndex] ?? routine.steps[0];
    const example = practiceTabExamples[step.exampleId];

    transport.stop();
    setJourneyAttemptDuration(null);
    dispatch({
      exampleBpm: practiceExerciseMetadata[step.exampleId].tempo.recommended,
      exerciseDurationSeconds: getPracticeDurationSeconds(step.duration),
      exampleSubdivision: example.subdivision,
      routineId: routine.id,
      stepIndex: routine.steps.indexOf(step),
      type: "open-exercise",
    });
    router[navigation](
      `/practice?journey=${encodeURIComponent(activeJourney.id)}&exercise=${encodeURIComponent(canonicalId)}`,
      { scroll: false },
    );
  };

  const openNextExercise = () => {
    if (activeJourney && activeJourneyStepIndex >= 0) {
      const nextJourneyStep = activeJourney.steps[activeJourneyStepIndex + 1];
      if (nextJourneyStep) {
        openJourneyExercise(nextJourneyStep.exerciseId, "replace");
      } else {
        returnToJourney();
      }
      return;
    }

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

  const setDurationMinutes = (minutes: number) => {
    if (journeyAttemptDuration !== null) {
      transport.stop();
      setJourneyAttemptDuration(null);
    }
    dispatch({
      durationSeconds: clampPracticeDurationMinutes(minutes) * 60,
      type: "set-duration",
    });
  };

  const setSubdivision = (subdivision: PracticeTabSubdivision) => {
    configureTransport({ clickSubdivision: subdivision });
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

  const toggleInstrumentPlayback = () => {
    configureTransport({
      instrumentEnabled: !state.instrumentPlaybackEnabled,
      instrumentPreset: state.instrument,
    });
    dispatch({ type: "toggle-instrument-playback" });
  };

  const setInstrumentVolume = (volume: number) => {
    const nextVolume = clampVolume(volume);
    configureTransport({ instrumentVolume: nextVolume });
    dispatch({ type: "set-volume", volume: nextVolume });
  };

  const setMetronomeVolume = (volume: number) => {
    const nextVolume = clampVolume(volume);
    configureTransport({ volume: nextVolume });
    dispatch({ type: "set-metronome-volume", volume: nextVolume });
  };

  const handlePrimaryAction = async () => {
    if (!contextCompatibility.compatible) {
      return;
    }

    if (
      transport.snapshot.phase === "counting-in" ||
      transport.snapshot.phase === "playing"
    ) {
      transport.pause();
    } else if (transport.snapshot.phase === "paused") {
      if (remainingSeconds === 0) {
        transport.stop();
        await transport.start();
      } else {
        await transport.resume();
      }
    } else {
      if (activeJourney && journeyAttemptDuration === null) {
        setJourneyAttemptDuration(state.durationSeconds);
      }
      await transport.start();
    }
  };

  const resolveContextCompatibility = () => {
    if (contextCompatibility.resolution === "use-authored-context") {
      if (contextCompatibility.requiredKey) {
        reduxDispatch(setKey(contextCompatibility.requiredKey));
      }
      if (contextCompatibility.requiredScale) {
        reduxDispatch(setScale(contextCompatibility.requiredScale));
      }
      return;
    }

    if (contextCompatibility.resolution === "restore-preset-tuning") {
      reduxDispatch(setStringCount(stringCount));
    }
  };

  const backToLibrary = () => {
    transport.stop();
    setJourneyAttemptDuration(null);
    dispatch({ screen: "library", type: "show-overview" });
    router.replace("/practice", { scroll: false });
  };

  const returnToJourney = () => {
    if (!activeJourney) {
      backToLibrary();
      return;
    }

    transport.stop();
    setJourneyAttemptDuration(null);
    dispatch({ screen: "journey", type: "show-overview" });
    router.replace(
      `/practice?journey=${encodeURIComponent(activeJourney.id)}`,
      {
        scroll: false,
      },
    );
  };

  const backFromSession = () => {
    if (activeJourney) returnToJourney();
    else backToLibrary();
  };

  const completeExercise = () => {
    if (activeJourney) {
      if (!journeyAttemptQualified) return;

      const currentProgress = readPracticeJourneyProgress();
      const nextProgress = completeJourneyExercise(
        currentProgress,
        activeJourney.id,
        activeStep.exampleId,
      );
      writePracticeJourneyProgress(nextProgress);
      setJourneyProgress(nextProgress);
    }

    transport.stop();
    dispatch({ type: "complete" });
  };

  const repeatExercise = () => {
    transport.stop();
    setJourneyAttemptDuration(null);
    dispatch({ type: "repeat" });
  };

  return {
    activeExample: playbackExample,
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
    hasNextExercise: activeJourney
      ? activeJourneyStepIndex >= 0 &&
        activeJourneyStepIndex < activeJourney.steps.length - 1
      : nextExercise !== undefined,
    journeyAttemptQualified,
    journeyProgress,
    openExercise,
    openJourney,
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
  };
}
