import {
  getChordFormula,
  isChordFormulaId,
  isScaleName,
  isTonicName,
} from "@/features/progressions";
import { getPitchClass, getPitchClassAtOffset } from "@/helpers/musicTheory";
import {
  type AuthoredChordSpec,
  type AuthoredProgression,
  type AuthoredProgressionStep,
  authoredProgressionSchemaVersion,
  maximumAuthoredProgressionSteps,
  minimumSavedProgressionSteps,
} from "./types";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object";

export const isAuthoredChordSpec = (
  value: unknown,
): value is AuthoredChordSpec => {
  if (!isRecord(value)) return false;
  if (
    !isTonicName(value.root) ||
    !isChordFormulaId(value.formulaId) ||
    (value.bass !== undefined && !isTonicName(value.bass))
  ) {
    return false;
  }
  if (value.bass === undefined) return true;
  const rootPitchClass = getPitchClass(value.root);
  const bassPitchClass = getPitchClass(value.bass);
  return getChordFormula(value.formulaId).tones.some(
    ({ semitones }) =>
      getPitchClassAtOffset(rootPitchClass, semitones) === bassPitchClass,
  );
};

export const isAuthoredProgressionStep = (
  value: unknown,
): value is AuthoredProgressionStep =>
  isRecord(value) &&
  typeof value.id === "string" &&
  value.id.length > 0 &&
  isAuthoredChordSpec(value.chord);

export const isAuthoredProgression = (
  value: unknown,
): value is AuthoredProgression => {
  if (!isRecord(value) || !isRecord(value.context)) return false;
  if (
    value.version !== authoredProgressionSchemaVersion ||
    typeof value.id !== "string" ||
    value.id.length === 0 ||
    typeof value.name !== "string" ||
    value.name.length > 80 ||
    !isTonicName(value.context.tonic) ||
    !isScaleName(value.context.scale) ||
    (value.form !== "loop" && value.form !== "sequence") ||
    typeof value.createdAt !== "string" ||
    typeof value.updatedAt !== "string" ||
    !Array.isArray(value.steps) ||
    value.steps.length < minimumSavedProgressionSteps ||
    value.steps.length > maximumAuthoredProgressionSteps ||
    !value.steps.every(isAuthoredProgressionStep)
  ) {
    return false;
  }

  return new Set(value.steps.map(({ id }) => id)).size === value.steps.length;
};

export const validateDraftForSave = (
  draft: Pick<AuthoredProgression, "name" | "steps">,
): readonly string[] => {
  const issues: string[] = [];
  if (draft.name.trim().length > 80)
    issues.push("Name must be 80 characters or fewer.");
  if (
    draft.steps.length < minimumSavedProgressionSteps ||
    draft.steps.length > maximumAuthoredProgressionSteps
  ) {
    issues.push("A saved progression needs between 2 and 8 chords.");
  }
  return issues;
};
