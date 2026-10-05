import type {
  ResolvedChord,
  ResolvedChordTone,
  ResolvedProgressionStep,
} from "@/features/progressions";
import type { ScaleTone } from "@/helpers/musicTheory";
import type { PitchClass, ScaleDegreeLabel } from "@/helpers/typesHelpers";

export type ScaleDegreeAnalysis = {
  readonly inScale: boolean;
  readonly tone?: ScaleTone;
};

export type ChordToneAnalysis = {
  readonly isChordTone: boolean;
  readonly tone?: ResolvedChordTone;
};

export type NoteContextAnalysis = {
  readonly chord: ChordToneAnalysis;
  readonly isChordRoot: boolean;
  readonly isScaleTonic: boolean;
  readonly pitchClass: PitchClass;
  readonly scale: ScaleDegreeAnalysis;
};

export type PitchClassContext = NoteContextAnalysis & {
  readonly isScaleColorDegree: boolean;
};

export type PitchClassContextMap = ReadonlyMap<PitchClass, PitchClassContext>;

export type ScaleColorDegree = {
  readonly degreeLabel: ScaleDegreeLabel;
  readonly intervalName: ScaleTone["intervalName"];
  readonly semitones: number;
};

export type ChordToneRelationship = {
  readonly pitchClass: PitchClass;
  readonly toneInFromChord: ResolvedChordTone;
  readonly toneInToChord: ResolvedChordTone;
};

export type PitchClassTarget = {
  readonly ascendingDistanceSemitones: number;
  readonly descendingDistanceSemitones: number;
  readonly minimumDistanceSemitones: number;
  readonly sourcePitchClass: PitchClass;
  readonly targetTone: ResolvedChordTone;
};

export type ChordTransitionAnalysis = {
  readonly commonTones: readonly ChordToneRelationship[];
  readonly enteringTones: readonly ResolvedChordTone[];
  readonly fromChord: ResolvedChord;
  readonly leavingTones: readonly ResolvedChordTone[];
  readonly nearestPitchClassTargets: ReadonlyArray<{
    readonly sourceTone: ResolvedChordTone;
    readonly targets: readonly PitchClassTarget[];
  }>;
  readonly toChord: ResolvedChord;
};

export type ProgressionStepContextAnalysis = {
  readonly chordToneContexts: readonly NoteContextAnalysis[];
  readonly nextTransition?: ChordTransitionAnalysis;
  readonly previousTransition?: ChordTransitionAnalysis;
  readonly step: ResolvedProgressionStep;
  readonly stepIndex: number;
};

export type ProgressionContextAnalysis = {
  readonly scaleTones: readonly ScaleTone[];
  readonly steps: readonly ProgressionStepContextAnalysis[];
};
