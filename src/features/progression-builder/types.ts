import type { ChordFormulaId, ProgressionForm } from "@/features/progressions";
import type { ScaleName, TonicName } from "@/helpers/typesHelpers";

export const authoredProgressionSchemaVersion = 1 as const;
export const maximumAuthoredProgressionSteps = 8;
export const minimumSavedProgressionSteps = 2;

export type AuthoredChordSpec = {
  readonly bass?: TonicName;
  readonly formulaId: ChordFormulaId;
  readonly root: TonicName;
};

export type AuthoredProgressionStep = {
  readonly chord: AuthoredChordSpec;
  readonly id: string;
};

export type AuthoredProgression = {
  readonly context: {
    readonly scale: ScaleName;
    readonly tonic: TonicName;
  };
  readonly createdAt: string;
  readonly form: ProgressionForm;
  readonly id: string;
  readonly name: string;
  readonly steps: readonly AuthoredProgressionStep[];
  readonly updatedAt: string;
  readonly version: typeof authoredProgressionSchemaVersion;
};

export type AuthoredProgressionStore = {
  readonly progressions: readonly AuthoredProgression[];
  readonly version: typeof authoredProgressionSchemaVersion;
};
