import type { PracticeTabExampleId } from "@/data/practiceTabExamples";

export type PracticeJourneyId = "rhythm-to-riff";

export type PracticeJourneyStep = {
  exerciseId: PracticeTabExampleId;
  objective: string;
  transition: string;
};

export type PracticeJourney = {
  description: string;
  finalOutcome: string;
  id: PracticeJourneyId;
  steps: readonly PracticeJourneyStep[];
  title: string;
};

export const practiceJourneys = [
  {
    description:
      "Build a controlled metal rhythm foundation, then apply it in a complete two-bar riff.",
    finalOutcome:
      "From your first controlled palm-muted note to a complete metal riff.",
    id: "rhythm-to-riff",
    steps: [
      {
        exerciseId: "chugs-mute-depth",
        objective:
          "Choose the mute depth deliberately while keeping the pedal pitch recognizable.",
        transition:
          "Carry that controlled tone into an even, repeatable picking grid.",
      },
      {
        exerciseId: "metal-tight-chugs",
        objective:
          "Keep medium-muted downstrokes even while beats one and three remain clearly accented.",
        transition:
          "Keep the grid steady when gallops and full-beat silence interrupt it.",
      },
      {
        exerciseId: "chugs-gallop",
        objective:
          "Control forward gallops, reverse gallops, silence, and an in-time re-entry.",
        transition:
          "Combine the trained tone, pulse, and gaps inside a complete musical riff.",
      },
      {
        exerciseId: "metal-iron-pulse",
        objective:
          "Combine the muted pedal, open chord accents, exact cutoff, and two-chord turnaround.",
        transition:
          "This is the destination: rhythm mechanics functioning as a complete two-bar riff.",
      },
    ],
    title: "Rhythm → Riff",
  },
] as const satisfies readonly PracticeJourney[];

export const getPracticeJourney = (
  journeyId?: string,
): PracticeJourney | null =>
  practiceJourneys.find(({ id }) => id === journeyId) ?? null;

export const isJourneyExercise = (
  journey: PracticeJourney,
  exerciseId: PracticeTabExampleId,
): boolean => journey.steps.some((step) => step.exerciseId === exerciseId);

export const getJourneyRecommendedExerciseId = (
  journey: PracticeJourney,
  completedExerciseIds: readonly PracticeTabExampleId[],
): PracticeTabExampleId | null =>
  journey.steps.find(
    ({ exerciseId }) => !completedExerciseIds.includes(exerciseId),
  )?.exerciseId ?? null;
