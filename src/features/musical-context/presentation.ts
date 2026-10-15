const chordIntervalNames: Readonly<Record<string, string>> = {
  R: "root",
  m2: "minor second",
  M2: "major second",
  A2: "augmented second",
  m3: "minor third",
  M3: "major third",
  A3: "augmented third",
  P4: "perfect fourth",
  A4: "augmented fourth",
  d5: "diminished fifth",
  P5: "perfect fifth",
  A5: "augmented fifth",
  m6: "minor sixth",
  M6: "major sixth",
  A6: "augmented sixth",
  d7: "diminished seventh",
  m7: "minor seventh",
  M7: "major seventh",
  m9: "minor ninth",
  M9: "major ninth",
  A9: "augmented ninth",
};

export const formatChordIntervalName = (interval: string): string =>
  chordIntervalNames[interval] ?? interval;
