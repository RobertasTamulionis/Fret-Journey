import type {
  PitchClass,
  ScaleDegree,
  ScaleName,
  SpelledNote,
  TonicName,
} from "@/helpers/typesHelpers";

export type DegreeAlteration = -2 | -1 | 0 | 1 | 2;

export type RelativeDegree = {
  readonly alteration: DegreeAlteration;
  readonly degree: ScaleDegree;
};

export type HarmonicScope =
  | "diatonic"
  | "borrowed"
  | "secondary-dominant"
  | "modal-interchange"
  | "chromatic";

export type ChordFormulaId =
  | "major"
  | "minor"
  | "diminished"
  | "augmented"
  | "dominant7"
  | "major7"
  | "minor7"
  | "half-diminished7"
  | "diminished7"
  | "sus2"
  | "sus4"
  | "add9"
  | "minor-add9"
  | "major6"
  | "minor6"
  | "dominant7sus4";

export type ChordToneRole =
  | "root"
  | "second"
  | "third"
  | "fourth"
  | "fifth"
  | "sixth"
  | "seventh"
  | "ninth";

export type ChordToneBehavior =
  | "structural"
  | "extension"
  | "suspension"
  | "addition"
  | "alteration";

export type ChordFormulaTone = {
  readonly behavior: ChordToneBehavior;
  readonly diatonicSteps: number;
  readonly required: boolean;
  readonly role: ChordToneRole;
  readonly semitones: number;
};

export type ChordToneAlteration = {
  readonly fromSemitones: number;
  readonly role: ChordToneRole;
  readonly toSemitones: number;
};

export type ChordFormulaBehavior = {
  readonly additions: readonly ChordToneRole[];
  readonly alterations: readonly ChordToneAlteration[];
  readonly family: "triad" | "seventh" | "suspended" | "added-tone" | "sixth";
  readonly omittable: readonly ChordToneRole[];
  readonly replaces: readonly ChordToneRole[];
};

export type ChordFormula = {
  readonly behavior: ChordFormulaBehavior;
  readonly displayName: string;
  readonly id: ChordFormulaId;
  readonly romanCase: "upper" | "lower";
  readonly romanSuffix: string;
  readonly suffix: string;
  readonly supportsAppliedDominant: boolean;
  readonly tones: readonly ChordFormulaTone[];
};

export type AppliedChordTarget = RelativeDegree & {
  readonly romanCase?: "upper" | "lower";
};

export type RelativeChordSpec = {
  readonly appliedTo?: AppliedChordTarget;
  readonly bass?: RelativeDegree;
  readonly formulaId: ChordFormulaId;
  readonly harmonicScope?: HarmonicScope;
  readonly root: RelativeDegree;
};

export type ProgressionStep = {
  annotation?: string;
  chord: RelativeChordSpec;
  durationBeats: number;
  id: string;
};

export type ProgressionCategory =
  | "major-diatonic"
  | "natural-minor"
  | "harmonic-minor"
  | "phrygian-dominant"
  | "blues"
  | "pop-rock-loop"
  | "cadence"
  | "circle-progression"
  | "jazz-turnaround"
  | "modal"
  | "borrowed-chord"
  | "secondary-dominant"
  | "chromatic-mediant"
  | "gospel-rnb"
  | "cinematic";

export type ProgressionDifficulty = "beginner" | "intermediate" | "advanced";

export type ProgressionForm = "loop" | "sequence";

export type ProgressionMeter = {
  beatUnit: 2 | 4 | 8 | 16;
  beatsPerBar: number;
};

export type ProgressionTemplate = {
  category: ProgressionCategory;
  compatibleScales: readonly ScaleName[];
  difficulty?: ProgressionDifficulty;
  explanation: string;
  form: ProgressionForm;
  harmonicDevices: readonly HarmonicScope[];
  id: string;
  meter?: ProgressionMeter;
  moodTags: readonly string[];
  reviewStatus: "draft" | "reviewed" | "verified";
  slug: string;
  sourceReferenceIds: readonly string[];
  steps: readonly ProgressionStep[];
  styleTags: readonly string[];
  title: string;
  tonalFramework: ScaleName;
};

export type ResolvedChordTone = SpelledNote & ChordFormulaTone;

export type ResolvedChord = {
  bass?: SpelledNote;
  formula: ChordFormula;
  harmonicScope: HarmonicScope;
  name: string;
  pitchClasses: readonly PitchClass[];
  romanNumeral: string;
  root: SpelledNote;
  source: RelativeChordSpec;
  tones: readonly ResolvedChordTone[];
};

export type ResolvedProgressionStep = Omit<ProgressionStep, "chord"> & {
  chord: ResolvedChord;
};

export type ResolvedProgression = {
  chordNames: readonly string[];
  compatible: boolean;
  formula: string;
  selectedScale: ScaleName;
  steps: readonly ResolvedProgressionStep[];
  template: ProgressionTemplate;
  tonic: TonicName;
};

export type TonalContext = {
  currentKey: TonicName;
  currentScale: ScaleName;
};

export type ProgressionUrlContext = {
  currentKey?: TonicName;
  currentScale?: ScaleName;
};
