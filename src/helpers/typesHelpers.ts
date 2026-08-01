export type PitchClass = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11;

export type NoteLetter = "A" | "B" | "C" | "D" | "E" | "F" | "G";

export type Accidental = -2 | -1 | 0 | 1 | 2;

export type TonicName =
  | "C"
  | "C#"
  | "Db"
  | "D"
  | "Eb"
  | "E"
  | "F"
  | "F#"
  | "Gb"
  | "G"
  | "Ab"
  | "A"
  | "Bb"
  | "B"
  | "Cb";

export type SpelledNote = {
  accidental: Accidental;
  letter: NoteLetter;
  name: string;
  pitchClass: PitchClass;
};

export type ScaleName =
  | "major"
  | "minor"
  | "blues"
  | "harmonic-minor"
  | "phrygian-dominant";

export type IntervalName =
  | "R"
  | "m2"
  | "M2"
  | "m3"
  | "M3"
  | "P4"
  | "TT"
  | "P5"
  | "m6"
  | "M6"
  | "m7"
  | "M7";

export type ChordQuality =
  | "major"
  | "minor"
  | "diminished"
  | "augmented"
  | "dominant7";

export type ScaleDegree = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export type ScaleDegreeLabel =
  | "1"
  | "b2"
  | "2"
  | "b3"
  | "3"
  | "4"
  | "b5"
  | "5"
  | "b6"
  | "6"
  | "b7"
  | "7";

export type GuitarStringCount = 6 | 7 | 8;

export type FretboardDisplayMode =
  | "notes"
  | "degrees"
  | "intervals"
  | "chord-tones";

export type ScaleShapeSystem = "3nps" | "position" | "pentatonic";
