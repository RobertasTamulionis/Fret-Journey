import type {
  ChordQuality,
  GuitarStringCount,
  IntervalName,
  Note,
  ScaleDegree,
  ScaleName,
} from "./typesHelpers";

type ScaleDefinition = {
  name: ScaleName;
  label: string;
  intervals: number[];
  intervalNames: IntervalName[];
  triadQualities: ChordQuality[];
};

export type GuitarConfiguration = {
  stringCount: GuitarStringCount;
  label: string;
  defaultTuning: Note[];
};

export type ScaleChord = {
  root: Note;
  quality: ChordQuality;
  notes: Note[];
  degree: ScaleDegree;
};

export type ChordToneIntervalName = "R" | "M3" | "m3" | "P5" | "d5";

export type FretPosition = {
  stringIndex: number;
  fret: number;
  note: Note;
  scaleDegree?: ScaleDegree;
  intervalName?: IntervalName;
};

export const allNotes: Note[] = [
  "A",
  "A#/Bb",
  "B",
  "C",
  "C#/Db",
  "D",
  "D#/Eb",
  "E",
  "F",
  "F#/Gb",
  "G",
  "G#/Ab",
];

export const intervalNamesBySemitone: IntervalName[] = [
  "R",
  "m2",
  "M2",
  "m3",
  "M3",
  "P4",
  "TT",
  "P5",
  "m6",
  "M6",
  "m7",
  "M7",
];

export const scaleDefinitions: Record<ScaleName, ScaleDefinition> = {
  major: {
    name: "major",
    label: "Major",
    intervals: [0, 2, 4, 5, 7, 9, 11],
    intervalNames: ["R", "M2", "M3", "P4", "P5", "M6", "M7"],
    triadQualities: [
      "major",
      "minor",
      "minor",
      "major",
      "major",
      "minor",
      "diminished",
    ],
  },
  minor: {
    name: "minor",
    label: "Natural Minor",
    intervals: [0, 2, 3, 5, 7, 8, 10],
    intervalNames: ["R", "M2", "m3", "P4", "P5", "m6", "m7"],
    triadQualities: [
      "minor",
      "diminished",
      "major",
      "minor",
      "minor",
      "major",
      "major",
    ],
  },
};

export const guitarConfigurations: Record<
  GuitarStringCount,
  GuitarConfiguration
> = {
  6: {
    stringCount: 6,
    label: "6 String",
    defaultTuning: ["E", "B", "G", "D", "A", "E"],
  },
  7: {
    stringCount: 7,
    label: "7 String",
    defaultTuning: ["E", "B", "G", "D", "A", "E", "B"],
  },
  8: {
    stringCount: 8,
    label: "8 String",
    defaultTuning: ["E", "B", "G", "D", "A", "E", "B", "F#/Gb"],
  },
};

export const guitarStringIds = [
  "string-1",
  "string-2",
  "string-3",
  "string-4",
  "string-5",
  "string-6",
  "string-7",
  "string-8",
] as const;

export const standardTuning: Note[] = [
  ...guitarConfigurations[6].defaultTuning,
];

export const getDefaultTuning = (stringCount: GuitarStringCount): Note[] => [
  ...guitarConfigurations[stringCount].defaultTuning,
];

export const getNoteAtSemitoneOffset = (
  rootNote: Note,
  semitoneOffset: number,
): Note => {
  const rootNoteIndex = allNotes.indexOf(rootNote);

  if (rootNoteIndex === -1) {
    throw new Error(`Unknown root note: ${rootNote}`);
  }

  const noteIndex = (rootNoteIndex + semitoneOffset) % allNotes.length;
  return allNotes[noteIndex < 0 ? noteIndex + allNotes.length : noteIndex];
};

export const getNotesInCurrentScale = (
  currentKey: Note,
  currentScale: ScaleName,
): Note[] => {
  const scaleDefinition = scaleDefinitions[currentScale];

  return scaleDefinition.intervals.map((interval) =>
    getNoteAtSemitoneOffset(currentKey, interval),
  );
};

export const getScaleDegree = (
  note: Note,
  currentKey: Note,
  currentScale: ScaleName,
): ScaleDegree | undefined => {
  const noteIndex = getNotesInCurrentScale(currentKey, currentScale).indexOf(
    note,
  );

  if (noteIndex === -1) {
    return undefined;
  }

  return (noteIndex + 1) as ScaleDegree;
};

export const getIntervalName = (
  note: Note,
  currentKey: Note,
  currentScale: ScaleName,
): IntervalName | undefined => {
  const scaleDegree = getScaleDegree(note, currentKey, currentScale);

  if (!scaleDegree) {
    return undefined;
  }

  return scaleDefinitions[currentScale].intervalNames[scaleDegree - 1];
};

export const getDiatonicTriadNotes = (
  scaleNotes: Note[],
  rootIndex: number,
): Note[] => [
  scaleNotes[rootIndex],
  scaleNotes[(rootIndex + 2) % scaleNotes.length],
  scaleNotes[(rootIndex + 4) % scaleNotes.length],
];

export const getScaleChords = (
  currentKey: Note,
  currentScale: ScaleName,
): ScaleChord[] => {
  const scaleDefinition = scaleDefinitions[currentScale];
  const scaleNotes = getNotesInCurrentScale(currentKey, currentScale);

  return scaleNotes.map((root, index) => ({
    root,
    quality: scaleDefinition.triadQualities[index],
    notes: getDiatonicTriadNotes(scaleNotes, index),
    degree: (index + 1) as ScaleDegree,
  }));
};

const chordToneIntervalsByQuality: Record<
  ChordQuality,
  [ChordToneIntervalName, ChordToneIntervalName, ChordToneIntervalName]
> = {
  major: ["R", "M3", "P5"],
  minor: ["R", "m3", "P5"],
  diminished: ["R", "m3", "d5"],
};

export const getChordToneIntervalName = (
  chord: ScaleChord,
  note: Note,
): ChordToneIntervalName | undefined => {
  const chordToneIndex = chord.notes.indexOf(note);

  if (chordToneIndex === -1) {
    return undefined;
  }

  return chordToneIntervalsByQuality[chord.quality][chordToneIndex];
};

export const getFretNote = (tuningNote: Note, fret: number): Note =>
  getNoteAtSemitoneOffset(tuningNote, fret);

export const buildFretPositions = (
  tuning: Note[],
  fretCount: number,
  currentKey: Note,
  currentScale: ScaleName,
): FretPosition[][] =>
  tuning.map((tuningNote, stringIndex) =>
    Array.from({ length: fretCount }, (_, fretIndex) => {
      const fret = fretIndex + 1;
      const note = getFretNote(tuningNote, fret);
      const scaleDegree = getScaleDegree(note, currentKey, currentScale);

      return {
        stringIndex,
        fret,
        note,
        scaleDegree,
        intervalName: scaleDegree
          ? scaleDefinitions[currentScale].intervalNames[scaleDegree - 1]
          : undefined,
      };
    }),
  );

const getDescendingOpenStringPitches = (tuning: Note[]): number[] => {
  if (tuning.length === 0) {
    return [];
  }

  const highStringPitch = allNotes.indexOf(tuning[0]);
  const pitches = [highStringPitch];

  for (let stringIndex = 1; stringIndex < tuning.length; stringIndex++) {
    const pitchClass = allNotes.indexOf(tuning[stringIndex]);
    const previousPitch = pitches[stringIndex - 1];
    let pitch = pitchClass;

    while (pitch >= previousPitch) {
      pitch -= allNotes.length;
    }

    pitches.push(pitch);
  }

  return pitches;
};

export const buildThreeNotesPerStringShape = (
  tuning: Note[],
  fretCount: number,
  currentKey: Note,
  currentScale: ScaleName,
  shapeIndex: number,
): Set<string> => {
  const scaleNotes = getNotesInCurrentScale(currentKey, currentScale);

  if (
    tuning.length === 0 ||
    shapeIndex < 0 ||
    shapeIndex >= scaleNotes.length
  ) {
    return new Set();
  }

  const openStringPitches = getDescendingOpenStringPitches(tuning);
  const positions = new Set<string>();
  let scaleNoteIndex = shapeIndex;
  let previousPitch = Number.NEGATIVE_INFINITY;

  for (let stringIndex = tuning.length - 1; stringIndex >= 0; stringIndex--) {
    const openPitch = openStringPitches[stringIndex];

    for (let noteOnString = 0; noteOnString < 3; noteOnString++) {
      const targetNote = scaleNotes[scaleNoteIndex % scaleNotes.length];
      const targetPitchClass = allNotes.indexOf(targetNote);
      let selectedFret: number | undefined;
      let selectedPitch: number | undefined;

      for (let fret = 1; fret <= fretCount; fret++) {
        const pitch = openPitch + fret;

        if (
          pitch > previousPitch &&
          ((pitch % allNotes.length) + allNotes.length) % allNotes.length ===
            targetPitchClass
        ) {
          selectedFret = fret;
          selectedPitch = pitch;
          break;
        }
      }

      if (selectedFret === undefined || selectedPitch === undefined) {
        return positions;
      }

      positions.add(`${stringIndex}-${selectedFret}`);
      previousPitch = selectedPitch;
      scaleNoteIndex++;
    }
  }

  return positions;
};
