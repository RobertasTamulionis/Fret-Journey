import type {
  Accidental,
  ChordQuality,
  IntervalName,
  NoteLetter,
  PitchClass,
  ScaleChordSize,
  ScaleDegree,
  ScaleDegreeLabel,
  ScaleName,
  SpelledNote,
  TonicName,
} from "./typesHelpers";

type ScaleInterval = {
  degree: ScaleDegree;
  degreeLabel: ScaleDegreeLabel;
  intervalName: IntervalName;
  semitones: number;
};

export type ScaleDefinition = {
  chordStrategy: "diatonic-tertian" | "blues-primary-chords";
  label: string;
  name: ScaleName;
  tones: ScaleInterval[];
};

export type ScaleTone = ScaleInterval &
  SpelledNote & {
    ordinal: ScaleDegree;
  };

export type ChordToneIntervalName =
  | "R"
  | "M3"
  | "m3"
  | "P5"
  | "d5"
  | "A5"
  | "d7"
  | "m7"
  | "M7"
  | "m9"
  | "M9"
  | "A9";

export type ChordToneRole = "root" | "third" | "fifth" | "seventh" | "ninth";

export type ScaleChordTone = SpelledNote & {
  intervalName: ChordToneIntervalName;
  role: ChordToneRole;
};

export type ScaleChord = {
  degree: ScaleDegree;
  label: string;
  notes: ScaleChordTone[];
  quality: ChordQuality;
  root: SpelledNote;
  size: ScaleChordSize;
};

const chromaticSize = 12;
const noteLetters: NoteLetter[] = ["C", "D", "E", "F", "G", "A", "B"];
const naturalPitchClasses: Record<NoteLetter, PitchClass> = {
  C: 0,
  D: 2,
  E: 4,
  F: 5,
  G: 7,
  A: 9,
  B: 11,
};

const accidentalSymbols: Record<Accidental, string> = {
  [-2]: "bb",
  [-1]: "b",
  0: "",
  1: "#",
  2: "##",
};

export const normalizePitchClass = (value: number): PitchClass =>
  (((value % chromaticSize) + chromaticSize) % chromaticSize) as PitchClass;

const parseNoteName = (
  noteName: string,
): { accidental: Accidental; letter: NoteLetter } => {
  const match = /^([A-G])(bb|##|b|#)?$/.exec(noteName);

  if (!match) {
    throw new Error(`Invalid note spelling: ${noteName}`);
  }

  const [, letter, accidentalText = ""] = match;
  const accidentalsByText: Record<string, Accidental> = {
    bb: -2,
    b: -1,
    "": 0,
    "#": 1,
    "##": 2,
  };

  return {
    accidental: accidentalsByText[accidentalText],
    letter: letter as NoteLetter,
  };
};

export const getPitchClass = (noteName: string): PitchClass => {
  const { accidental, letter } = parseNoteName(noteName);
  return normalizePitchClass(naturalPitchClasses[letter] + accidental);
};

export const getPitchClassAtOffset = (
  rootPitchClass: PitchClass,
  semitoneOffset: number,
): PitchClass => normalizePitchClass(rootPitchClass + semitoneOffset);

const getAccidentalForPitchClass = (
  letter: NoteLetter,
  pitchClass: PitchClass,
): Accidental => {
  let difference = normalizePitchClass(
    pitchClass - naturalPitchClasses[letter],
  ) as number;

  if (difference > 6) {
    difference -= chromaticSize;
  }

  if (difference < -2 || difference > 2) {
    throw new Error(
      `Pitch class ${pitchClass} requires more than a double accidental on ${letter}`,
    );
  }

  return difference as Accidental;
};

const createSpelledNote = (
  letter: NoteLetter,
  accidental: Accidental,
): SpelledNote => ({
  accidental,
  letter,
  name: `${letter}${accidentalSymbols[accidental]}`,
  pitchClass: normalizePitchClass(naturalPitchClasses[letter] + accidental),
});

export const spellPitchClassAtDiatonicOffset = (
  referenceNoteName: string,
  pitchClass: PitchClass,
  diatonicSteps: number,
): SpelledNote => {
  if (!Number.isInteger(diatonicSteps)) {
    throw new Error(`Diatonic steps must be an integer: ${diatonicSteps}`);
  }

  const { letter: referenceLetter } = parseNoteName(referenceNoteName);
  const referenceLetterIndex = noteLetters.indexOf(referenceLetter);
  const letterIndex =
    (((referenceLetterIndex + diatonicSteps) % noteLetters.length) +
      noteLetters.length) %
    noteLetters.length;
  const letter = noteLetters[letterIndex];
  const accidental = getAccidentalForPitchClass(letter, pitchClass);
  return createSpelledNote(letter, accidental);
};

const spellPitchClassAtDegree = (
  tonicName: string,
  pitchClass: PitchClass,
  degree: ScaleDegree,
): SpelledNote => {
  return spellPitchClassAtDiatonicOffset(tonicName, pitchClass, degree - 1);
};

export const formatNoteName = (noteName: string): string =>
  noteName
    .replace("##", "𝄪")
    .replace("bb", "𝄫")
    .replace("#", "♯")
    .replace("b", "♭");

export const chromaticPitchClasses: PitchClass[] = [
  0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11,
];

const chromaticDisplayNames: Record<PitchClass, string> = {
  0: "C",
  1: "C♯/D♭",
  2: "D",
  3: "D♯/E♭",
  4: "E",
  5: "F",
  6: "F♯/G♭",
  7: "G",
  8: "G♯/A♭",
  9: "A",
  10: "A♯/B♭",
  11: "B",
};

export const formatPitchClass = (pitchClass: PitchClass): string =>
  chromaticDisplayNames[pitchClass];

export const tonicOptions: Array<{
  label: string;
  name: TonicName;
  pitchClass: PitchClass;
}> = [
  "C",
  "C#",
  "Db",
  "D",
  "Eb",
  "E",
  "F",
  "F#",
  "Gb",
  "G",
  "Ab",
  "A",
  "Bb",
  "B",
  "Cb",
].map((name) => ({
  label: formatNoteName(name),
  name: name as TonicName,
  pitchClass: getPitchClass(name),
}));

export const scaleDefinitions: Record<ScaleName, ScaleDefinition> = {
  major: {
    name: "major",
    label: "Major",
    chordStrategy: "diatonic-tertian",
    tones: [
      { semitones: 0, degree: 1, degreeLabel: "1", intervalName: "R" },
      { semitones: 2, degree: 2, degreeLabel: "2", intervalName: "M2" },
      { semitones: 4, degree: 3, degreeLabel: "3", intervalName: "M3" },
      { semitones: 5, degree: 4, degreeLabel: "4", intervalName: "P4" },
      { semitones: 7, degree: 5, degreeLabel: "5", intervalName: "P5" },
      { semitones: 9, degree: 6, degreeLabel: "6", intervalName: "M6" },
      { semitones: 11, degree: 7, degreeLabel: "7", intervalName: "M7" },
    ],
  },
  minor: {
    name: "minor",
    label: "Natural Minor",
    chordStrategy: "diatonic-tertian",
    tones: [
      { semitones: 0, degree: 1, degreeLabel: "1", intervalName: "R" },
      { semitones: 2, degree: 2, degreeLabel: "2", intervalName: "M2" },
      { semitones: 3, degree: 3, degreeLabel: "b3", intervalName: "m3" },
      { semitones: 5, degree: 4, degreeLabel: "4", intervalName: "P4" },
      { semitones: 7, degree: 5, degreeLabel: "5", intervalName: "P5" },
      { semitones: 8, degree: 6, degreeLabel: "b6", intervalName: "m6" },
      { semitones: 10, degree: 7, degreeLabel: "b7", intervalName: "m7" },
    ],
  },
  blues: {
    name: "blues",
    label: "Minor Blues",
    chordStrategy: "blues-primary-chords",
    tones: [
      { semitones: 0, degree: 1, degreeLabel: "1", intervalName: "R" },
      { semitones: 3, degree: 3, degreeLabel: "b3", intervalName: "m3" },
      { semitones: 5, degree: 4, degreeLabel: "4", intervalName: "P4" },
      { semitones: 6, degree: 5, degreeLabel: "b5", intervalName: "TT" },
      { semitones: 7, degree: 5, degreeLabel: "5", intervalName: "P5" },
      { semitones: 10, degree: 7, degreeLabel: "b7", intervalName: "m7" },
    ],
  },
  "harmonic-minor": {
    name: "harmonic-minor",
    label: "Harmonic Minor",
    chordStrategy: "diatonic-tertian",
    tones: [
      { semitones: 0, degree: 1, degreeLabel: "1", intervalName: "R" },
      { semitones: 2, degree: 2, degreeLabel: "2", intervalName: "M2" },
      { semitones: 3, degree: 3, degreeLabel: "b3", intervalName: "m3" },
      { semitones: 5, degree: 4, degreeLabel: "4", intervalName: "P4" },
      { semitones: 7, degree: 5, degreeLabel: "5", intervalName: "P5" },
      { semitones: 8, degree: 6, degreeLabel: "b6", intervalName: "m6" },
      { semitones: 11, degree: 7, degreeLabel: "7", intervalName: "M7" },
    ],
  },
  "phrygian-dominant": {
    name: "phrygian-dominant",
    label: "Phrygian Dominant",
    chordStrategy: "diatonic-tertian",
    tones: [
      { semitones: 0, degree: 1, degreeLabel: "1", intervalName: "R" },
      { semitones: 1, degree: 2, degreeLabel: "b2", intervalName: "m2" },
      { semitones: 4, degree: 3, degreeLabel: "3", intervalName: "M3" },
      { semitones: 5, degree: 4, degreeLabel: "4", intervalName: "P4" },
      { semitones: 7, degree: 5, degreeLabel: "5", intervalName: "P5" },
      { semitones: 8, degree: 6, degreeLabel: "b6", intervalName: "m6" },
      { semitones: 10, degree: 7, degreeLabel: "b7", intervalName: "m7" },
    ],
  },
};

export const getScaleTones = (
  currentKey: TonicName,
  currentScale: ScaleName,
): ScaleTone[] => {
  const rootPitchClass = getPitchClass(currentKey);

  return scaleDefinitions[currentScale].tones.map((tone, index) => {
    const pitchClass = getPitchClassAtOffset(rootPitchClass, tone.semitones);

    return {
      ...spellPitchClassAtDegree(currentKey, pitchClass, tone.degree),
      ...tone,
      ordinal: (index + 1) as ScaleDegree,
    };
  });
};

export const getNotesInCurrentScale = (
  currentKey: TonicName,
  currentScale: ScaleName,
): SpelledNote[] => getScaleTones(currentKey, currentScale);

export const getScaleTone = (
  pitchClass: PitchClass,
  currentKey: TonicName,
  currentScale: ScaleName,
): ScaleTone | undefined =>
  getScaleTones(currentKey, currentScale).find(
    (tone) => tone.pitchClass === pitchClass,
  );

export const getScaleDegree = (
  pitchClass: PitchClass,
  currentKey: TonicName,
  currentScale: ScaleName,
): ScaleDegree | undefined =>
  getScaleTone(pitchClass, currentKey, currentScale)?.ordinal;

export const getIntervalName = (
  pitchClass: PitchClass,
  currentKey: TonicName,
  currentScale: ScaleName,
): IntervalName | undefined =>
  getScaleTone(pitchClass, currentKey, currentScale)?.intervalName;

const chordToneCountBySize: Record<ScaleChordSize, 3 | 4 | 5> = {
  triad: 3,
  seventh: 4,
  ninth: 5,
};

const chordToneRoles: ChordToneRole[] = [
  "root",
  "third",
  "fifth",
  "seventh",
  "ninth",
];

const chordToneIntervalNamesByRole: Record<
  ChordToneRole,
  Partial<Record<number, ChordToneIntervalName>>
> = {
  root: { 0: "R" },
  third: { 3: "m3", 4: "M3" },
  fifth: { 6: "d5", 7: "P5", 8: "A5" },
  seventh: { 9: "d7", 10: "m7", 11: "M7" },
  ninth: { 1: "m9", 2: "M9", 3: "A9" },
};

export const getDiatonicChordNotes = (
  scaleTones: ScaleTone[],
  rootIndex: number,
  size: ScaleChordSize,
): SpelledNote[] => {
  if (scaleTones.length !== 7) {
    throw new Error("Diatonic tertian chords require a seven-note scale");
  }

  return Array.from(
    { length: chordToneCountBySize[size] },
    (_, toneIndex) =>
      scaleTones[(rootIndex + toneIndex * 2) % scaleTones.length],
  );
};

export const getDiatonicTriadNotes = (
  scaleTones: ScaleTone[],
  rootIndex: number,
): SpelledNote[] => getDiatonicChordNotes(scaleTones, rootIndex, "triad");

const buildChordTones = (notes: SpelledNote[]): ScaleChordTone[] => {
  const root = notes[0];

  if (!root) {
    throw new Error("A chord requires a root note");
  }

  return notes.map((note, toneIndex) => {
    const role = chordToneRoles[toneIndex];

    if (!role) {
      throw new Error(`Unsupported chord tone at index ${toneIndex}`);
    }

    const semitones = normalizePitchClass(note.pitchClass - root.pitchClass);
    const intervalName = chordToneIntervalNamesByRole[role][semitones];

    if (!intervalName) {
      throw new Error(
        `Unsupported ${role} interval of ${semitones} semitones above ${root.name}`,
      );
    }

    return { ...note, intervalName, role };
  });
};

const getTriadQuality = (notes: SpelledNote[]): ChordQuality => {
  const rootPitchClass = notes[0].pitchClass;
  const intervals = notes
    .slice(1)
    .map((note) => normalizePitchClass(note.pitchClass - rootPitchClass))
    .sort((firstInterval, secondInterval) => firstInterval - secondInterval)
    .join("-");
  const qualitiesByIntervals: Record<string, ChordQuality> = {
    "3-6": "diminished",
    "3-7": "minor",
    "4-7": "major",
    "4-8": "augmented",
  };
  const quality = qualitiesByIntervals[intervals];

  if (!quality) {
    throw new Error(`Unsupported diatonic triad intervals: ${intervals}`);
  }

  return quality;
};

const triadLabels: Record<ChordQuality, string> = {
  major: "Maj",
  minor: "Min",
  diminished: "Dim",
  augmented: "Aug",
};

const seventhLabelsBySignature: Record<string, string> = {
  "M3-P5-M7": "Maj7",
  "M3-P5-m7": "7",
  "m3-P5-m7": "Min7",
  "m3-P5-M7": "Min(Maj7)",
  "m3-d5-m7": "Min7♭5",
  "m3-d5-d7": "Dim7",
  "M3-A5-M7": "Maj7(♯5)",
  "M3-A5-m7": "7(♯5)",
};

const getSeventhChordLabel = (tones: ScaleChordTone[]): string => {
  const signature = tones
    .slice(1, 4)
    .map(({ intervalName }) => intervalName)
    .join("-");
  const label = seventhLabelsBySignature[signature];

  if (!label) {
    throw new Error(`Unsupported seventh-chord signature: ${signature}`);
  }

  return label;
};

const unalteredNinthLabels: Record<string, string> = {
  Maj7: "Maj9",
  "7": "9",
  Min7: "Min9",
  "Min(Maj7)": "Min(Maj9)",
  "Min7♭5": "Min9♭5",
  Dim7: "Dim9",
  "Maj7(♯5)": "Maj9(♯5)",
  "7(♯5)": "9(♯5)",
};

const getNinthChordLabel = (tones: ScaleChordTone[]): string => {
  const seventhLabel = getSeventhChordLabel(tones);
  const ninthInterval = tones[4]?.intervalName;

  if (ninthInterval === "M9") {
    const label = unalteredNinthLabels[seventhLabel];

    if (label) {
      return label;
    }
  }

  if (ninthInterval === "m9") {
    return `${seventhLabel}(♭9)`;
  }

  if (ninthInterval === "A9") {
    return `${seventhLabel}(♯9)`;
  }

  throw new Error(
    `Unsupported ninth-chord signature: ${seventhLabel}-${ninthInterval}`,
  );
};

const getChordLabel = (
  quality: ChordQuality,
  size: ScaleChordSize,
  tones: ScaleChordTone[],
): string => {
  if (size === "triad") {
    return triadLabels[quality];
  }

  if (size === "seventh") {
    return getSeventhChordLabel(tones);
  }

  return getNinthChordLabel(tones);
};

const createScaleChord = (
  root: SpelledNote,
  degree: ScaleDegree,
  size: ScaleChordSize,
  notes: SpelledNote[],
): ScaleChord => {
  const tones = buildChordTones(notes);
  const quality = getTriadQuality(tones.slice(0, 3));

  return {
    degree,
    label: getChordLabel(quality, size, tones),
    notes: tones,
    quality,
    root,
    size,
  };
};

const bluesChordDefinitions = [
  { degree: 1, rootInterval: 0 },
  { degree: 4, rootInterval: 5 },
  { degree: 5, rootInterval: 7 },
] as const;

const bluesChordToneDefinitionsBySize = {
  triad: [
    { semitones: 0, degree: 1 },
    { semitones: 4, degree: 3 },
    { semitones: 7, degree: 5 },
  ],
  seventh: [
    { semitones: 0, degree: 1 },
    { semitones: 4, degree: 3 },
    { semitones: 7, degree: 5 },
    { semitones: 10, degree: 7 },
  ],
  ninth: [
    { semitones: 0, degree: 1 },
    { semitones: 4, degree: 3 },
    { semitones: 7, degree: 5 },
    { semitones: 10, degree: 7 },
    { semitones: 2, degree: 2 },
  ],
} as const satisfies Record<
  ScaleChordSize,
  ReadonlyArray<{ degree: ScaleDegree; semitones: number }>
>;

export const getScaleChords = (
  currentKey: TonicName,
  currentScale: ScaleName,
  size: ScaleChordSize,
): ScaleChord[] => {
  const scaleDefinition = scaleDefinitions[currentScale];
  const scaleTones = getScaleTones(currentKey, currentScale);

  if (scaleDefinition.chordStrategy === "blues-primary-chords") {
    const rootPitchClass = getPitchClass(currentKey);

    return bluesChordDefinitions.map(({ degree, rootInterval }) => {
      const chordRootPitchClass = getPitchClassAtOffset(
        rootPitchClass,
        rootInterval,
      );
      const root = spellPitchClassAtDegree(
        currentKey,
        chordRootPitchClass,
        degree,
      );

      const notes = bluesChordToneDefinitionsBySize[size].map((interval) =>
        spellPitchClassAtDegree(
          root.name,
          getPitchClassAtOffset(chordRootPitchClass, interval.semitones),
          interval.degree,
        ),
      );

      return createScaleChord(root, degree, size, notes);
    });
  }

  return scaleTones.map((root, index) => {
    const notes = getDiatonicChordNotes(scaleTones, index, size);

    return createScaleChord(root, root.degree, size, notes);
  });
};

export const getChordTone = (
  chord: ScaleChord,
  pitchClass: PitchClass,
): ScaleChordTone | undefined =>
  chord.notes.find((note) => note.pitchClass === pitchClass);

export const getChordToneIntervalName = (
  chord: ScaleChord,
  pitchClass: PitchClass,
): ChordToneIntervalName | undefined =>
  getChordTone(chord, pitchClass)?.intervalName;
