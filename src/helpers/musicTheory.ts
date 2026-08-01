import type {
  Accidental,
  ChordQuality,
  IntervalName,
  NoteLetter,
  PitchClass,
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
  chordStrategy: "diatonic-triads" | "blues-dominant-sevenths";
  label: string;
  name: ScaleName;
  tones: ScaleInterval[];
};

export type ScaleTone = ScaleInterval &
  SpelledNote & {
    ordinal: ScaleDegree;
  };

export type ScaleChord = {
  degree: ScaleDegree;
  notes: SpelledNote[];
  quality: ChordQuality;
  root: SpelledNote;
};

export type ChordToneIntervalName =
  | "R"
  | "M3"
  | "m3"
  | "P5"
  | "d5"
  | "A5"
  | "m7";

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

const normalizePitchClass = (value: number): PitchClass =>
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

const spellPitchClassAtDegree = (
  tonicName: string,
  pitchClass: PitchClass,
  degree: ScaleDegree,
): SpelledNote => {
  const { letter: tonicLetter } = parseNoteName(tonicName);
  const tonicLetterIndex = noteLetters.indexOf(tonicLetter);
  const letter =
    noteLetters[(tonicLetterIndex + degree - 1) % noteLetters.length];
  const accidental = getAccidentalForPitchClass(letter, pitchClass);
  return createSpelledNote(letter, accidental);
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
    chordStrategy: "diatonic-triads",
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
    chordStrategy: "diatonic-triads",
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
    chordStrategy: "blues-dominant-sevenths",
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
    chordStrategy: "diatonic-triads",
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
    chordStrategy: "diatonic-triads",
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

export const getDiatonicTriadNotes = (
  scaleTones: ScaleTone[],
  rootIndex: number,
): SpelledNote[] => [
  scaleTones[rootIndex],
  scaleTones[(rootIndex + 2) % scaleTones.length],
  scaleTones[(rootIndex + 4) % scaleTones.length],
];

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

const bluesChordDefinitions = [
  { degree: 1, rootInterval: 0 },
  { degree: 4, rootInterval: 5 },
  { degree: 5, rootInterval: 7 },
] as const;

const dominantSeventhIntervals = [
  { semitones: 0, degree: 1 },
  { semitones: 4, degree: 3 },
  { semitones: 7, degree: 5 },
  { semitones: 10, degree: 7 },
] as const;

export const getScaleChords = (
  currentKey: TonicName,
  currentScale: ScaleName,
): ScaleChord[] => {
  const scaleDefinition = scaleDefinitions[currentScale];
  const scaleTones = getScaleTones(currentKey, currentScale);

  if (scaleDefinition.chordStrategy === "blues-dominant-sevenths") {
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

      return {
        root,
        quality: "dominant7",
        notes: dominantSeventhIntervals.map((interval) =>
          spellPitchClassAtDegree(
            root.name,
            getPitchClassAtOffset(chordRootPitchClass, interval.semitones),
            interval.degree,
          ),
        ),
        degree,
      };
    });
  }

  return scaleTones.map((root, index) => {
    const notes = getDiatonicTriadNotes(scaleTones, index);

    return {
      root,
      quality: getTriadQuality(notes),
      notes,
      degree: root.degree,
    };
  });
};

const chordToneIntervalsByQuality: Record<
  ChordQuality,
  readonly ChordToneIntervalName[]
> = {
  major: ["R", "M3", "P5"],
  minor: ["R", "m3", "P5"],
  diminished: ["R", "m3", "d5"],
  augmented: ["R", "M3", "A5"],
  dominant7: ["R", "M3", "P5", "m7"],
};

export const getChordTone = (
  chord: ScaleChord,
  pitchClass: PitchClass,
): SpelledNote | undefined =>
  chord.notes.find((note) => note.pitchClass === pitchClass);

export const getChordToneIntervalName = (
  chord: ScaleChord,
  pitchClass: PitchClass,
): ChordToneIntervalName | undefined => {
  const chordToneIndex = chord.notes.findIndex(
    (note) => note.pitchClass === pitchClass,
  );

  if (chordToneIndex === -1) {
    return undefined;
  }

  return chordToneIntervalsByQuality[chord.quality][chordToneIndex];
};
