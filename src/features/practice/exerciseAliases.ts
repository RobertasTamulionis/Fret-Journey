import {
  type PracticeTabExampleId,
  practiceTabExamples,
} from "@/data/practiceTabExamples";

export const practiceExerciseAliases = {
  "chugs-grid": "metal-tight-chugs",
  "chugs-riff": "metal-iron-pulse",
  "daily-mechanics": "alternate-cross",
} as const satisfies Readonly<Record<string, PracticeTabExampleId>>;

export const resolvePracticeExerciseId = (
  exerciseId?: string,
): PracticeTabExampleId | null => {
  if (!exerciseId) {
    return null;
  }

  const canonicalId =
    practiceExerciseAliases[
      exerciseId as keyof typeof practiceExerciseAliases
    ] ?? exerciseId;

  return canonicalId in practiceTabExamples
    ? (canonicalId as PracticeTabExampleId)
    : null;
};
