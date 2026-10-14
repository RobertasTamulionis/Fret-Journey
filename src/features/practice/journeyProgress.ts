import {
  getPracticeJourney,
  type PracticeJourneyId,
  practiceJourneys,
} from "@/data/practiceJourneys";
import type { PracticeTabExampleId } from "@/data/practiceTabExamples";

export const practiceJourneyProgressStorageKey =
  "fret-journey-practice-journeys-v1";

export type PracticeJourneyProgress = {
  journeys: Partial<
    Record<PracticeJourneyId, { completedExerciseIds: PracticeTabExampleId[] }>
  >;
  version: 1;
};

export const emptyPracticeJourneyProgress = (): PracticeJourneyProgress => ({
  journeys: {},
  version: 1,
});

export const sanitizePracticeJourneyProgress = (
  value: unknown,
): PracticeJourneyProgress => {
  if (!value || typeof value !== "object") {
    return emptyPracticeJourneyProgress();
  }

  const candidate = value as {
    journeys?: Record<string, { completedExerciseIds?: unknown }>;
    version?: unknown;
  };

  if (candidate.version !== 1 || !candidate.journeys) {
    return emptyPracticeJourneyProgress();
  }

  const progress = emptyPracticeJourneyProgress();

  for (const journey of practiceJourneys) {
    const completed = candidate.journeys[journey.id]?.completedExerciseIds;
    if (!Array.isArray(completed)) continue;

    progress.journeys[journey.id] = {
      completedExerciseIds: journey.steps
        .map(({ exerciseId }) => exerciseId)
        .filter((exerciseId) => completed.includes(exerciseId)),
    };
  }

  return progress;
};

export const parsePracticeJourneyProgress = (
  serialized: string | null,
): PracticeJourneyProgress => {
  if (!serialized) return emptyPracticeJourneyProgress();

  try {
    return sanitizePracticeJourneyProgress(JSON.parse(serialized));
  } catch {
    return emptyPracticeJourneyProgress();
  }
};

export const getCompletedJourneyExerciseIds = (
  progress: PracticeJourneyProgress,
  journeyId: PracticeJourneyId,
): PracticeTabExampleId[] =>
  progress.journeys[journeyId]?.completedExerciseIds ?? [];

export const completeJourneyExercise = (
  progress: PracticeJourneyProgress,
  journeyId: PracticeJourneyId,
  exerciseId: PracticeTabExampleId,
): PracticeJourneyProgress => {
  const journey = getPracticeJourney(journeyId);
  if (
    !journey ||
    !journey.steps.some((step) => step.exerciseId === exerciseId)
  ) {
    return progress;
  }

  const completed = getCompletedJourneyExerciseIds(progress, journeyId);
  if (completed.includes(exerciseId)) return progress;

  return {
    ...progress,
    journeys: {
      ...progress.journeys,
      [journeyId]: {
        completedExerciseIds: [...completed, exerciseId],
      },
    },
  };
};

export const isJourneyAttemptQualified = ({
  compatible,
  elapsedExerciseSeconds,
  journeyExercise,
  qualifyingDurationSeconds,
}: {
  compatible: boolean;
  elapsedExerciseSeconds: number;
  journeyExercise: boolean;
  qualifyingDurationSeconds: number | null;
}): boolean =>
  journeyExercise &&
  compatible &&
  qualifyingDurationSeconds !== null &&
  elapsedExerciseSeconds >= qualifyingDurationSeconds;

export const readPracticeJourneyProgress = (): PracticeJourneyProgress => {
  if (typeof window === "undefined") return emptyPracticeJourneyProgress();
  try {
    return parsePracticeJourneyProgress(
      window.localStorage.getItem(practiceJourneyProgressStorageKey),
    );
  } catch {
    return emptyPracticeJourneyProgress();
  }
};

export const writePracticeJourneyProgress = (
  progress: PracticeJourneyProgress,
): void => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      practiceJourneyProgressStorageKey,
      JSON.stringify(sanitizePracticeJourneyProgress(progress)),
    );
  } catch {
    // Progress is best-effort browser storage; the active session still completes.
  }
};
