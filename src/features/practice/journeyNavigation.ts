import {
  getPracticeJourney,
  isJourneyExercise,
  type PracticeJourney,
} from "@/data/practiceJourneys";
import type { PracticeTabExampleId } from "@/data/practiceTabExamples";
import { resolvePracticeExerciseId } from "./exerciseAliases";

export type PracticeJourneyLocation = {
  canonicalPath: string;
  exerciseId: PracticeTabExampleId | null;
  journey: PracticeJourney | null;
  screen: "journey" | "library" | "session";
};

export const resolvePracticeJourneyLocation = ({
  exerciseId,
  journeyId,
}: {
  exerciseId?: string;
  journeyId?: string;
}): PracticeJourneyLocation => {
  const canonicalExerciseId = resolvePracticeExerciseId(exerciseId);
  const journey = getPracticeJourney(journeyId);

  if (journey) {
    if (
      canonicalExerciseId &&
      isJourneyExercise(journey, canonicalExerciseId)
    ) {
      return {
        canonicalPath: `/practice?journey=${encodeURIComponent(journey.id)}&exercise=${encodeURIComponent(canonicalExerciseId)}`,
        exerciseId: canonicalExerciseId,
        journey,
        screen: "session",
      };
    }

    return {
      canonicalPath: `/practice?journey=${encodeURIComponent(journey.id)}`,
      exerciseId: null,
      journey,
      screen: "journey",
    };
  }

  if (canonicalExerciseId) {
    return {
      canonicalPath: `/practice?exercise=${encodeURIComponent(canonicalExerciseId)}`,
      exerciseId: canonicalExerciseId,
      journey: null,
      screen: "session",
    };
  }

  return {
    canonicalPath: "/practice",
    exerciseId: null,
    journey: null,
    screen: "library",
  };
};
