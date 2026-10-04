import type {
  ResolvedChord,
  ResolvedChordTone,
  ResolvedProgressionStep,
} from "@/features/progressions";
import type { ScaleTone } from "@/helpers/musicTheory";
import type {
  PitchClass,
  ScaleDegreeLabel,
  ScaleName,
} from "@/helpers/typesHelpers";

export type ScaleDegreeAnalysis = {
  inScale: boolean;
  tone?: ScaleTone;
};

export type ChordToneAnalysis = {
  isChordTone: boolean;
  tone?: ResolvedChordTone;
};

export type NoteContextAnalysis = {
  chord: ChordToneAnalysis;
  isChordRoot: boolean;
  isScaleTonic: boolean;
  pitchClass: PitchClass;
  scale: ScaleDegreeAnalysis;
};

export type ScaleColorDegree = {
  degreeLabel: ScaleDegreeLabel;
  intervalName: ScaleTone["intervalName"];
  semitones: number;
};

export type ChordToneRelationship = {
  pitchClass: PitchClass;
  toneInFromChord: ResolvedChordTone;
  toneInToChord: ResolvedChordTone;
};

export type PitchClassTarget = {
  ascendingDistanceSemitones: number;
  descendingDistanceSemitones: number;
  minimumDistanceSemitones: number;
  sourcePitchClass: PitchClass;
  targetTone: ResolvedChordTone;
};

export type ChordTransitionAnalysis = {
  commonTones: readonly ChordToneRelationship[];
  enteringTones: readonly ResolvedChordTone[];
  fromChord: ResolvedChord;
  leavingTones: readonly ResolvedChordTone[];
  nearestPitchClassTargets: ReadonlyArray<{
    sourceTone: ResolvedChordTone;
    targets: readonly PitchClassTarget[];
  }>;
  toChord: ResolvedChord;
};

export type ProgressionStepContextAnalysis = {
  chordToneContexts: readonly NoteContextAnalysis[];
  nextTransition?: ChordTransitionAnalysis;
  previousTransition?: ChordTransitionAnalysis;
  step: ResolvedProgressionStep;
  stepIndex: number;
};

export type ProgressionContextAnalysis = {
  scaleTones: readonly ScaleTone[];
  steps: readonly ProgressionStepContextAnalysis[];
};

export type ScaleColorDegrees = Readonly<
  Record<ScaleName, readonly ScaleDegreeLabel[]>
>;
