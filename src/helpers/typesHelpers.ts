export type Note =
  | "A"
  | "A#/Bb"
  | "B"
  | "C"
  | "C#/Db"
  | "D"
  | "D#/Eb"
  | "E"
  | "F"
  | "F#/Gb"
  | "G"
  | "G#/Ab";

export type ScaleName = "major" | "minor";

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

export type ChordQuality = "major" | "minor" | "diminished";

export type ScaleDegree = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export type GuitarStringCount = 6 | 7 | 8;

export type FretboardDisplayMode =
  | "notes"
  | "degrees"
  | "intervals"
  | "chord-tones";

export type ScaleShapeSystem = "3nps" | "caged" | "pentatonic";
