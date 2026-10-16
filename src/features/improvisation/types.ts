import type {
  ChordTransitionAnalysis,
  PitchClassContext,
} from "@/features/musical-context";
import type {
  ResolvedChordTone,
  ResolvedProgressionStep,
} from "@/features/progressions";
import type { PitchClass } from "@/helpers/typesHelpers";

export type ImprovisationObjective =
  | "chord-tones"
  | "target-third"
  | "connect-changes";

export type ImprovisationObjectiveAvailability =
  | { readonly available: true }
  | { readonly available: false; readonly reason: "missing-third" };

export type ApproachDirection = "ascending" | "descending";

export type ImprovisationApproach = {
  readonly direction: ApproachDirection;
  readonly distanceSemitones: 1 | 2;
  readonly sourceInScale: boolean;
  readonly sourcePitchClass: PitchClass;
  readonly targetTone: ResolvedChordTone;
};

export type ImprovisationPitchContext = PitchClassContext & {
  readonly approaches: readonly ImprovisationApproach[];
  readonly isCommonTone: boolean;
  readonly isEnteringTone: boolean;
  readonly isLeavingTone: boolean;
  readonly nextChordTone?: ResolvedChordTone;
};

export type ImprovisationGuidance = {
  readonly activeStep: ResolvedProgressionStep;
  readonly activeStepIndex: number;
  readonly activeThird?: ResolvedChordTone;
  readonly isLoopClosure: boolean;
  readonly nextStep?: ResolvedProgressionStep;
  readonly pitchContexts: ReadonlyMap<PitchClass, ImprovisationPitchContext>;
  readonly suggestedApproaches: readonly ImprovisationApproach[];
  readonly transition?: ChordTransitionAnalysis;
};
