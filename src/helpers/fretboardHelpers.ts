import type {
  ChordQuality,
  GuitarStringCount,
  IntervalName,
  Note,
  ScaleDegree,
  ScaleName,
  ScaleShapeSystem,
} from "./typesHelpers";

type ScaleDefinition = {
  name: ScaleName;
  label: string;
  intervals: number[];
  intervalNames: IntervalName[];
  chordStrategy: "diatonic-triads" | "blues-dominant-sevenths";
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

export type ChordToneIntervalName =
  | "R"
  | "M3"
  | "m3"
  | "P5"
  | "d5"
  | "A5"
  | "m7";

export type FretPosition = {
  stringIndex: number;
  fret: number;
  note: Note;
  scaleDegree?: ScaleDegree;
  intervalName?: IntervalName;
};

export type ScaleShapeOption = {
  label: string;
  shortLabel: string;
};

export const scaleShapeSystems: Record<
  ScaleShapeSystem,
  { label: string; shapes: ScaleShapeOption[] }
> = {
  "3nps": {
    label: "3NPS",
    shapes: Array.from({ length: 7 }, (_, index) => ({
      label: `Position ${index + 1}`,
      shortLabel: String(index + 1),
    })),
  },
  caged: {
    label: "CAGED",
    shapes: Array.from({ length: 5 }, (_, index) => ({
      label: `Position ${index + 1}`,
      shortLabel: String(index + 1),
    })),
  },
  pentatonic: {
    label: "Pentatonic",
    shapes: Array.from({ length: 5 }, (_, index) => ({
      label: `Box ${index + 1}`,
      shortLabel: String(index + 1),
    })),
  },
};

export const getScaleShapeSystem = (
  shapeSystem: ScaleShapeSystem,
  currentScale: ScaleName,
): { label: string; shapes: ScaleShapeOption[] } => {
  const system = scaleShapeSystems[shapeSystem];

  if (shapeSystem !== "3nps") {
    return system;
  }

  return {
    ...system,
    shapes: Array.from(
      { length: scaleDefinitions[currentScale].intervals.length },
      (_, index) => ({
        label: `Position ${index + 1}`,
        shortLabel: String(index + 1),
      }),
    ),
  };
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
    chordStrategy: "diatonic-triads",
  },
  minor: {
    name: "minor",
    label: "Natural Minor",
    intervals: [0, 2, 3, 5, 7, 8, 10],
    intervalNames: ["R", "M2", "m3", "P4", "P5", "m6", "m7"],
    chordStrategy: "diatonic-triads",
  },
  blues: {
    name: "blues",
    label: "Blues Scale",
    intervals: [0, 3, 5, 6, 7, 10],
    intervalNames: ["R", "m3", "P4", "TT", "P5", "m7"],
    chordStrategy: "blues-dominant-sevenths",
  },
  "harmonic-minor": {
    name: "harmonic-minor",
    label: "Harmonic Minor",
    intervals: [0, 2, 3, 5, 7, 8, 11],
    intervalNames: ["R", "M2", "m3", "P4", "P5", "m6", "M7"],
    chordStrategy: "diatonic-triads",
  },
  "phrygian-dominant": {
    name: "phrygian-dominant",
    label: "Phrygian Dominant",
    intervals: [0, 1, 4, 5, 7, 8, 10],
    intervalNames: ["R", "m2", "M3", "P4", "P5", "m6", "m7"],
    chordStrategy: "diatonic-triads",
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

const getSemitoneDistance = (root: Note, note: Note): number =>
  (allNotes.indexOf(note) - allNotes.indexOf(root) + allNotes.length) %
  allNotes.length;

const getTriadQuality = (notes: Note[]): ChordQuality => {
  const intervals = notes
    .slice(1)
    .map((note) => getSemitoneDistance(notes[0], note))
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

// Minor-blues harmony is represented by the practical I7-IV7-V7 progression.
const bluesChordDefinitions = [
  { degree: 1, rootInterval: 0 },
  { degree: 4, rootInterval: 5 },
  { degree: 5, rootInterval: 7 },
] as const;

export const getScaleChords = (
  currentKey: Note,
  currentScale: ScaleName,
): ScaleChord[] => {
  const scaleDefinition = scaleDefinitions[currentScale];
  const scaleNotes = getNotesInCurrentScale(currentKey, currentScale);

  if (scaleDefinition.chordStrategy === "blues-dominant-sevenths") {
    return bluesChordDefinitions.map(({ degree, rootInterval }) => {
      const root = getNoteAtSemitoneOffset(currentKey, rootInterval);

      return {
        root,
        quality: "dominant7",
        notes: [0, 4, 7, 10].map((interval) =>
          getNoteAtSemitoneOffset(root, interval),
        ),
        degree,
      };
    });
  }

  return scaleNotes.map((root, index) => {
    const notes = getDiatonicTriadNotes(scaleNotes, index);

    return {
      root,
      quality: getTriadQuality(notes),
      notes,
      degree: (index + 1) as ScaleDegree,
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

const getNextFretForNote = (openNote: Note, targetNote: Note): number => {
  const openNoteIndex = allNotes.indexOf(openNote);
  const targetNoteIndex = allNotes.indexOf(targetNote);
  const fret =
    (targetNoteIndex - openNoteIndex + allNotes.length) % allNotes.length;

  return fret === 0 ? allNotes.length : fret;
};

// Preserve the hand-authored major and natural-minor CAGED positions.
const cagedFretOffsetsByScale: Partial<Record<ScaleName, number[][][]>> = {
  major: [
    [
      [-1, 0, 2],
      [0, 2],
      [-1, 1, 2],
      [-1, 1, 2],
      [-1, 0, 2],
      [-1, 0, 2],
    ],
    [
      [2, 4, 5],
      [2, 4, 5],
      [1, 2, 4],
      [1, 2, 4],
      [2, 4],
      [2, 4, 5],
    ],
    [
      [4, 5, 7],
      [4, 5, 7],
      [4, 6],
      [4, 6, 7],
      [4, 6, 7],
      [4, 5, 7],
    ],
    [
      [7, 9],
      [7, 9, 10],
      [6, 8, 9],
      [6, 7, 9],
      [6, 7, 9],
      [5, 7, 9],
    ],
    [
      [9, 11, 12],
      [9, 10, 12],
      [8, 9, 11],
      [9, 11],
      [9, 11, 12],
      [9, 11, 12],
    ],
  ],
  minor: [
    [
      [0, 2, 3],
      [0, 1, 3],
      [-1, 0, 2],
      [0, 2],
      [0, 2, 3],
      [0, 2, 3],
    ],
    [
      [2, 3, 5],
      [3, 5],
      [2, 4, 5],
      [2, 4, 5],
      [2, 3, 5],
      [2, 3, 5],
    ],
    [
      [5, 7, 8],
      [5, 7, 8],
      [4, 5, 7],
      [4, 5, 7],
      [5, 7],
      [5, 7, 8],
    ],
    [
      [7, 8, 10],
      [7, 8, 10],
      [7, 9],
      [7, 9, 10],
      [7, 9, 10],
      [7, 8, 10],
    ],
    [
      [10, 12],
      [10, 12, 13],
      [9, 11, 12],
      [9, 10, 12],
      [9, 10, 12],
      [8, 10, 12],
    ],
  ],
};

// Other scales use five overlapping CAGED-style fretboard regions.
const cagedWindowOffsets = [
  [-1, 3],
  [2, 6],
  [4, 8],
  [7, 11],
  [9, 13],
] as const;

const buildScaleShapeInFretWindow = (
  tuning: Note[],
  fretCount: number,
  currentKey: Note,
  currentScale: ScaleName,
  shapeIndex: number,
): Set<string> => {
  const windowOffsets = cagedWindowOffsets[shapeIndex];

  if (!windowOffsets) {
    return new Set();
  }

  let referenceRootFret = getNextFretForNote("E", currentKey);

  while (referenceRootFret + windowOffsets[0] < 1) {
    referenceRootFret += allNotes.length;
  }

  const startFret = referenceRootFret + windowOffsets[0];
  const endFret = Math.min(fretCount, referenceRootFret + windowOffsets[1]);
  const scaleNotes = getNotesInCurrentScale(currentKey, currentScale);
  const positions = new Set<string>();

  tuning.forEach((openNote, stringIndex) => {
    for (let fret = startFret; fret <= endFret; fret++) {
      if (scaleNotes.includes(getFretNote(openNote, fret))) {
        positions.add(`${stringIndex}-${fret}`);
      }
    }
  });

  return positions;
};

const getClosestFretForNote = (
  openNote: Note,
  targetNote: Note,
  referenceFret: number,
  fretCount: number,
): number | undefined => {
  const matchingFrets = Array.from(
    { length: fretCount },
    (_, index) => index + 1,
  )
    .filter((fret) => getFretNote(openNote, fret) === targetNote)
    .sort(
      (firstFret, secondFret) =>
        Math.abs(firstFret - referenceFret) -
        Math.abs(secondFret - referenceFret),
    );

  return matchingFrets[0];
};

export const buildCagedScaleShape = (
  tuning: Note[],
  fretCount: number,
  currentKey: Note,
  currentScale: ScaleName,
  shapeIndex: number,
): Set<string> => {
  const shapeOffsets = cagedFretOffsetsByScale[currentScale]?.[shapeIndex];

  if (!shapeOffsets) {
    return buildScaleShapeInFretWindow(
      tuning,
      fretCount,
      currentKey,
      currentScale,
      shapeIndex,
    );
  }

  if (tuning.length < 6) {
    return new Set();
  }

  const offsets = shapeOffsets.flat();
  let referenceRootFret = getNextFretForNote("E", currentKey);

  while (referenceRootFret + Math.min(...offsets) < 1) {
    referenceRootFret += allNotes.length;
  }

  const positions = new Set<string>();

  shapeOffsets.forEach((stringOffsets, stringIndex) => {
    stringOffsets.forEach((offset) => {
      const referenceFret = referenceRootFret + offset;
      const targetNote = getFretNote(
        standardTuning[stringIndex],
        referenceFret,
      );
      const fret = getClosestFretForNote(
        tuning[stringIndex],
        targetNote,
        referenceFret,
        fretCount,
      );

      if (fret !== undefined) {
        positions.add(`${stringIndex}-${fret}`);
      }
    });
  });

  if (tuning.length > standardTuning.length) {
    const scaleNotes = getNotesInCurrentScale(currentKey, currentScale);
    const startFret = referenceRootFret + Math.min(...offsets);
    const endFret = referenceRootFret + Math.max(...offsets);

    for (
      let stringIndex = standardTuning.length;
      stringIndex < tuning.length;
      stringIndex++
    ) {
      for (let fret = startFret; fret <= Math.min(fretCount, endFret); fret++) {
        if (scaleNotes.includes(getFretNote(tuning[stringIndex], fret))) {
          positions.add(`${stringIndex}-${fret}`);
        }
      }
    }
  }

  return positions;
};

// Five-note cores keep the Pentatonic system at two notes per string.
const pentatonicIntervalsByScale: Record<ScaleName, number[]> = {
  major: [0, 2, 4, 7, 9],
  minor: [0, 3, 5, 7, 10],
  blues: [0, 3, 5, 7, 10],
  "harmonic-minor": [0, 3, 5, 7, 11],
  "phrygian-dominant": [0, 1, 4, 7, 10],
};

const buildTwoNotesPerStringShape = (
  tuning: Note[],
  fretCount: number,
  scaleNotes: Note[],
  shapeIndex: number,
): Set<string> => {
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

    for (let noteOnString = 0; noteOnString < 2; noteOnString++) {
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

export const buildPentatonicScaleShape = (
  tuning: Note[],
  fretCount: number,
  currentKey: Note,
  currentScale: ScaleName,
  shapeIndex: number,
): Set<string> => {
  const pentatonicNotes = pentatonicIntervalsByScale[currentScale].map(
    (interval) => getNoteAtSemitoneOffset(currentKey, interval),
  );

  return buildTwoNotesPerStringShape(
    tuning,
    fretCount,
    pentatonicNotes,
    shapeIndex,
  );
};

export const buildScaleShape = (
  shapeSystem: ScaleShapeSystem,
  tuning: Note[],
  fretCount: number,
  currentKey: Note,
  currentScale: ScaleName,
  shapeIndex: number,
): Set<string> => {
  if (shapeSystem === "caged") {
    return buildCagedScaleShape(
      tuning,
      fretCount,
      currentKey,
      currentScale,
      shapeIndex,
    );
  }

  if (shapeSystem === "pentatonic") {
    return buildPentatonicScaleShape(
      tuning,
      fretCount,
      currentKey,
      currentScale,
      shapeIndex,
    );
  }

  return buildThreeNotesPerStringShape(
    tuning,
    fretCount,
    currentKey,
    currentScale,
    shapeIndex,
  );
};
