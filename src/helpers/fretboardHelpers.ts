import {
  chromaticPitchClasses,
  getPitchClass,
  getPitchClassAtOffset,
  getScaleTone,
  getScaleTones,
  scaleDefinitions,
} from "./musicTheory";
import type {
  GuitarStringCount,
  IntervalName,
  PitchClass,
  ScaleDegree,
  ScaleDegreeLabel,
  ScaleName,
  ScaleShapeSystem,
  TonicName,
} from "./typesHelpers";

export type {
  ChordToneIntervalName,
  ScaleChord,
  ScaleDefinition,
  ScaleTone,
} from "./musicTheory";
export {
  chromaticPitchClasses,
  formatNoteName,
  formatPitchClass,
  getChordTone,
  getChordToneIntervalName,
  getDiatonicTriadNotes,
  getIntervalName,
  getNotesInCurrentScale,
  getPitchClass,
  getPitchClassAtOffset,
  getScaleChords,
  getScaleDegree,
  getScaleTone,
  getScaleTones,
  scaleDefinitions,
  tonicOptions,
} from "./musicTheory";

export type GuitarConfiguration = {
  stringCount: GuitarStringCount;
  label: string;
  defaultTuning: PitchClass[];
};

export type FretPosition = {
  stringIndex: number;
  fret: number;
  degreeLabel?: ScaleDegreeLabel;
  noteName?: string;
  pitchClass: PitchClass;
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
  position: {
    label: "Positions",
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

  if (shapeSystem === "3nps") {
    return {
      ...system,
      shapes: Array.from(
        { length: scaleDefinitions[currentScale].tones.length },
        (_, index) => ({
          label: `Position ${index + 1}`,
          shortLabel: String(index + 1),
        }),
      ),
    };
  }

  if (shapeSystem === "pentatonic" && currentScale === "blues") {
    return { ...system, label: "Blues Boxes" };
  }

  return system;
};

export const allNotes = chromaticPitchClasses;

export const getAvailableScaleShapeSystems = (
  currentScale: ScaleName,
): ScaleShapeSystem[] => {
  if (currentScale === "blues") {
    return ["position", "pentatonic"];
  }

  if (["harmonic-minor", "phrygian-dominant"].includes(currentScale)) {
    return ["3nps", "position"];
  }

  return ["3nps", "position", "pentatonic"];
};

export const guitarConfigurations: Record<
  GuitarStringCount,
  GuitarConfiguration
> = {
  6: {
    stringCount: 6,
    label: "6 String",
    defaultTuning: [4, 11, 7, 2, 9, 4],
  },
  7: {
    stringCount: 7,
    label: "7 String",
    defaultTuning: [4, 11, 7, 2, 9, 4, 11],
  },
  8: {
    stringCount: 8,
    label: "8 String",
    defaultTuning: [4, 11, 7, 2, 9, 4, 11, 6],
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

export const standardTuning: PitchClass[] = [
  ...guitarConfigurations[6].defaultTuning,
];

export const getDefaultTuning = (
  stringCount: GuitarStringCount,
): PitchClass[] => [...guitarConfigurations[stringCount].defaultTuning];

export const getFretPitchClass = (
  tuningPitchClass: PitchClass,
  fret: number,
): PitchClass => getPitchClassAtOffset(tuningPitchClass, fret);

export const getFretNote = getFretPitchClass;

export const buildFretPositions = (
  tuning: PitchClass[],
  fretCount: number,
  currentKey: TonicName,
  currentScale: ScaleName,
): FretPosition[][] =>
  tuning.map((tuningPitchClass, stringIndex) =>
    Array.from({ length: fretCount }, (_, fretIndex) => {
      const fret = fretIndex + 1;
      const pitchClass = getFretPitchClass(tuningPitchClass, fret);
      const scaleTone = getScaleTone(pitchClass, currentKey, currentScale);

      return {
        stringIndex,
        fret,
        pitchClass,
        degreeLabel: scaleTone?.degreeLabel,
        noteName: scaleTone?.name,
        scaleDegree: scaleTone?.ordinal,
        intervalName: scaleTone?.intervalName,
      };
    }),
  );

const getDescendingOpenStringPitches = (tuning: PitchClass[]): number[] => {
  if (tuning.length === 0) {
    return [];
  }

  const highStringPitch = tuning[0];
  const pitches = [highStringPitch];

  for (let stringIndex = 1; stringIndex < tuning.length; stringIndex++) {
    const pitchClass = tuning[stringIndex];
    const previousPitch = pitches[stringIndex - 1];
    let pitch = pitchClass;

    while (pitch >= previousPitch) {
      pitch -= chromaticPitchClasses.length;
    }

    pitches.push(pitch);
  }

  return pitches;
};

export const buildThreeNotesPerStringShape = (
  tuning: PitchClass[],
  fretCount: number,
  currentKey: TonicName,
  currentScale: ScaleName,
  shapeIndex: number,
): Set<string> => {
  const scalePitchClasses = getScaleTones(currentKey, currentScale).map(
    (tone) => tone.pitchClass,
  );

  if (
    tuning.length === 0 ||
    shapeIndex < 0 ||
    shapeIndex >= scalePitchClasses.length
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
      const targetPitchClass =
        scalePitchClasses[scaleNoteIndex % scalePitchClasses.length];
      let selectedFret: number | undefined;
      let selectedPitch: number | undefined;

      for (let fret = 1; fret <= fretCount; fret++) {
        const pitch = openPitch + fret;

        if (
          pitch > previousPitch &&
          ((pitch % chromaticPitchClasses.length) +
            chromaticPitchClasses.length) %
            chromaticPitchClasses.length ===
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

const getNextFretForPitchClass = (
  openPitchClass: PitchClass,
  targetPitchClass: PitchClass,
): number => {
  const fret =
    (targetPitchClass - openPitchClass + chromaticPitchClasses.length) %
    chromaticPitchClasses.length;

  return fret === 0 ? chromaticPitchClasses.length : fret;
};

// Preserve the hand-authored major and natural-minor position layouts.
const positionFretOffsetsByScale: Partial<Record<ScaleName, number[][][]>> = {
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

// Other scales use five overlapping position regions.
const positionWindowOffsets = [
  [-1, 3],
  [2, 6],
  [4, 8],
  [7, 11],
  [9, 13],
] as const;

const buildScaleShapeInFretWindow = (
  tuning: PitchClass[],
  fretCount: number,
  currentKey: TonicName,
  currentScale: ScaleName,
  shapeIndex: number,
): Set<string> => {
  const windowOffsets = positionWindowOffsets[shapeIndex];

  if (!windowOffsets) {
    return new Set();
  }

  let referenceRootFret = getNextFretForPitchClass(
    4,
    getPitchClass(currentKey),
  );

  while (referenceRootFret + windowOffsets[0] < 1) {
    referenceRootFret += chromaticPitchClasses.length;
  }

  const startFret = referenceRootFret + windowOffsets[0];
  const endFret = Math.min(fretCount, referenceRootFret + windowOffsets[1]);
  const scalePitchClasses = getScaleTones(currentKey, currentScale).map(
    (tone) => tone.pitchClass,
  );
  const positions = new Set<string>();

  tuning.forEach((openPitchClass, stringIndex) => {
    for (let fret = startFret; fret <= endFret; fret++) {
      if (scalePitchClasses.includes(getFretPitchClass(openPitchClass, fret))) {
        positions.add(`${stringIndex}-${fret}`);
      }
    }
  });

  return positions;
};

const getClosestFretForNote = (
  openPitchClass: PitchClass,
  targetPitchClass: PitchClass,
  referenceFret: number,
  fretCount: number,
): number | undefined => {
  const matchingFrets = Array.from(
    { length: fretCount },
    (_, index) => index + 1,
  )
    .filter(
      (fret) => getFretPitchClass(openPitchClass, fret) === targetPitchClass,
    )
    .sort(
      (firstFret, secondFret) =>
        Math.abs(firstFret - referenceFret) -
        Math.abs(secondFret - referenceFret),
    );

  return matchingFrets[0];
};

export const buildPositionScaleShape = (
  tuning: PitchClass[],
  fretCount: number,
  currentKey: TonicName,
  currentScale: ScaleName,
  shapeIndex: number,
): Set<string> => {
  const shapeOffsets = positionFretOffsetsByScale[currentScale]?.[shapeIndex];

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
  let referenceRootFret = getNextFretForPitchClass(
    4,
    getPitchClass(currentKey),
  );

  while (referenceRootFret + Math.min(...offsets) < 1) {
    referenceRootFret += chromaticPitchClasses.length;
  }

  const positions = new Set<string>();

  shapeOffsets.forEach((stringOffsets, stringIndex) => {
    stringOffsets.forEach((offset) => {
      const referenceFret = referenceRootFret + offset;
      const targetPitchClass = getFretPitchClass(
        standardTuning[stringIndex],
        referenceFret,
      );
      const fret = getClosestFretForNote(
        tuning[stringIndex],
        targetPitchClass,
        referenceFret,
        fretCount,
      );

      if (fret !== undefined) {
        positions.add(`${stringIndex}-${fret}`);
      }
    });
  });

  if (tuning.length > standardTuning.length) {
    const scalePitchClasses = getScaleTones(currentKey, currentScale).map(
      (tone) => tone.pitchClass,
    );
    const startFret = referenceRootFret + Math.min(...offsets);
    const endFret = referenceRootFret + Math.max(...offsets);

    for (
      let stringIndex = standardTuning.length;
      stringIndex < tuning.length;
      stringIndex++
    ) {
      for (let fret = startFret; fret <= Math.min(fretCount, endFret); fret++) {
        if (
          scalePitchClasses.includes(
            getFretPitchClass(tuning[stringIndex], fret),
          )
        ) {
          positions.add(`${stringIndex}-${fret}`);
        }
      }
    }
  }

  return positions;
};

// Five-note cores keep the Pentatonic system at two notes per string.
const pentatonicIntervalsByScale: Partial<Record<ScaleName, number[]>> = {
  major: [0, 2, 4, 7, 9],
  minor: [0, 3, 5, 7, 10],
  blues: [0, 3, 5, 7, 10],
};

const buildTwoNotesPerStringShape = (
  tuning: PitchClass[],
  fretCount: number,
  scalePitchClasses: PitchClass[],
  shapeIndex: number,
): Set<string> => {
  if (
    tuning.length === 0 ||
    shapeIndex < 0 ||
    shapeIndex >= scalePitchClasses.length
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
      const targetPitchClass =
        scalePitchClasses[scaleNoteIndex % scalePitchClasses.length];
      let selectedFret: number | undefined;
      let selectedPitch: number | undefined;

      for (let fret = 1; fret <= fretCount; fret++) {
        const pitch = openPitch + fret;

        if (
          pitch > previousPitch &&
          ((pitch % chromaticPitchClasses.length) +
            chromaticPitchClasses.length) %
            chromaticPitchClasses.length ===
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
  tuning: PitchClass[],
  fretCount: number,
  currentKey: TonicName,
  currentScale: ScaleName,
  shapeIndex: number,
): Set<string> => {
  const rootPitchClass = getPitchClass(currentKey);
  const pentatonicIntervals = pentatonicIntervalsByScale[currentScale];

  if (!pentatonicIntervals) {
    return new Set();
  }

  const pentatonicPitchClasses = pentatonicIntervals.map((interval) =>
    getPitchClassAtOffset(rootPitchClass, interval),
  );

  const positions = buildTwoNotesPerStringShape(
    tuning,
    fretCount,
    pentatonicPitchClasses,
    shapeIndex,
  );

  if (currentScale !== "blues" || positions.size === 0) {
    return positions;
  }

  const frets = [...positions].map((position) =>
    Number(position.split("-")[1]),
  );
  const startFret = Math.min(...frets);
  const endFret = Math.max(...frets);
  const blueNotePitchClass = getPitchClassAtOffset(rootPitchClass, 6);

  tuning.forEach((openPitchClass, stringIndex) => {
    for (let fret = startFret; fret <= endFret; fret++) {
      if (getFretPitchClass(openPitchClass, fret) === blueNotePitchClass) {
        positions.add(`${stringIndex}-${fret}`);
      }
    }
  });

  return positions;
};

export const buildScaleShape = (
  shapeSystem: ScaleShapeSystem,
  tuning: PitchClass[],
  fretCount: number,
  currentKey: TonicName,
  currentScale: ScaleName,
  shapeIndex: number,
): Set<string> => {
  if (shapeSystem === "position") {
    return buildPositionScaleShape(
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
