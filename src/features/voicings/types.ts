import type { GuitarStringCount, PitchClass } from "@/helpers/typesHelpers";

export type VoicingToneRole =
  | "root"
  | "second"
  | "third"
  | "fourth"
  | "fifth"
  | "sixth"
  | "seventh"
  | "ninth";

export type ChordVoicingTone = {
  name: string;
  pitchClass: PitchClass;
  required: boolean;
  role: VoicingToneRole;
};

export type ChordVoicingRequest = {
  bassPitchClass?: PitchClass;
  chordName: string;
  registeredOpenMidi?: readonly number[] | null;
  rootPitchClass: PitchClass;
  stringCount: GuitarStringCount;
  tones: readonly ChordVoicingTone[];
  tuning: readonly PitchClass[];
};

type VoicingOpenString = {
  openMidi?: number;
  openPitchClass: PitchClass;
  stringIndex: number;
};

type SoundingStringState = VoicingOpenString & {
  midi?: number;
  noteName: string;
  pitchClass: PitchClass;
  role: VoicingToneRole;
};

export type VoicingStringState =
  | (VoicingOpenString & {
      kind: "muted";
    })
  | (SoundingStringState & {
      fret: 0;
      kind: "open";
    })
  | (SoundingStringState & {
      fret: number;
      kind: "fretted";
    });

export type VoicingDifficulty = {
  label: "easy" | "moderate" | "advanced";
  score: number;
};

export type PlayableVoicing = {
  authoredBassPitchClass?: PitchClass;
  barre?: Array<{
    fret: number;
    fromStringIndex: number;
    toStringIndex: number;
  }>;
  baseFret: number;
  bass?: {
    midi: number;
    noteName: string;
    pitchClass: PitchClass;
    role: VoicingToneRole;
  };
  chordName: string;
  difficulty: VoicingDifficulty;
  doublings: VoicingToneRole[];
  fingers?: Array<{
    finger: 1 | 2 | 3 | 4;
    stringIndex: number;
  }>;
  fretSpan: number;
  generatorVersion: "dynamic-chord-v1";
  omissions: VoicingToneRole[];
  rank: number;
  registerStatus: "pitch-class-only" | "verified";
  requiredTones: VoicingToneRole[];
  signature: string;
  stringCount: GuitarStringCount;
  strings: VoicingStringState[];
  toneRoles: VoicingToneRole[];
};
