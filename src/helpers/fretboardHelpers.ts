import {
  chromaticPitchClasses,
  getPitchClass,
  getPitchClassAtOffset,
  getScaleTone,
  getScaleTones,
  normalizePitchClass,
  scaleDefinitions,
} from "./musicTheory";
import type {
  GuitarStringCount,
  IntervalName,
  PitchClass,
  RegisteredTuningState,
  ScaleDegree,
  ScaleDegreeLabel,
  ScaleName,
  ScaleShapeSystem,
  TonicName,
} from "./typesHelpers";

export type {
  ChordToneIntervalName,
  ChordToneRole,
  ScaleChord,
  ScaleChordTone,
  ScaleDefinition,
  ScaleTone,
} from "./musicTheory";
export {
  chromaticPitchClasses,
  formatNoteName,
  formatPitchClass,
  getChordTone,
  getChordToneIntervalName,
  getDiatonicChordNotes,
  getDiatonicTriadNotes,
  getIntervalName,
  getNotesInCurrentScale,
  getPitchClass,
  getPitchClassAtOffset,
  getScaleChords,
  getScaleDegree,
  getScaleTone,
  getScaleTones,
  normalizePitchClass,
  scaleDefinitions,
  tonicOptions,
} from "./musicTheory";

export type GuitarConfiguration = {
  stringCount: GuitarStringCount;
  label: string;
  defaultTuning: PitchClass[];
  defaultRegisteredTuning: number[];
  tuningLabel: string;
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
  caged: {
    label: "CAGED",
    shapes: ["C", "A", "G", "E", "D"].map((form) => ({
      label: `${form} shape`,
      shortLabel: form,
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

export const guitarConfigurations: Record<
  GuitarStringCount,
  GuitarConfiguration
> = {
  6: {
    stringCount: 6,
    label: "6 String",
    defaultTuning: [4, 11, 7, 2, 9, 4],
    defaultRegisteredTuning: [64, 59, 55, 50, 45, 40],
    tuningLabel: "Standard E tuning",
  },
  7: {
    stringCount: 7,
    label: "7 String",
    defaultTuning: [4, 11, 7, 2, 9, 4, 11],
    defaultRegisteredTuning: [64, 59, 55, 50, 45, 40, 35],
    tuningLabel: "Standard B tuning",
  },
  8: {
    stringCount: 8,
    label: "8 String",
    defaultTuning: [4, 11, 7, 2, 9, 4, 11, 6],
    defaultRegisteredTuning: [64, 59, 55, 50, 45, 40, 35, 30],
    tuningLabel: "Standard F♯ tuning",
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

export const hasCagedTuning = (tuning: PitchClass[]): boolean => {
  if (tuning.length < standardTuning.length) {
    return false;
  }

  const tuningOffset = normalizePitchClass(tuning[0] - standardTuning[0]);

  return standardTuning.every(
    (pitchClass, stringIndex) =>
      normalizePitchClass(tuning[stringIndex] - pitchClass) === tuningOffset,
  );
};

export const getDefaultTuning = (
  stringCount: GuitarStringCount,
): PitchClass[] => [...guitarConfigurations[stringCount].defaultTuning];

export const getDefaultRegisteredTuning = (
  stringCount: GuitarStringCount,
): RegisteredTuningState => ({
  midiPitches: [...guitarConfigurations[stringCount].defaultRegisteredTuning],
  source: "preset-default",
  status: "verified",
  version: 1,
});

export const getRegisteredTuningState = (
  stringCount: GuitarStringCount,
  tuning: PitchClass[],
): RegisteredTuningState => {
  const isPresetDefault =
    tuning.length === guitarConfigurations[stringCount].defaultTuning.length &&
    tuning.every(
      (pitchClass, stringIndex) =>
        pitchClass ===
        guitarConfigurations[stringCount].defaultTuning[stringIndex],
    );

  if (isPresetDefault) {
    return getDefaultRegisteredTuning(stringCount);
  }

  return {
    midiPitches: null,
    reason: "pitch-class-only-custom",
    status: "unregistered",
    version: 1,
  };
};

export const getTuningLabel = (
  stringCount: GuitarStringCount,
  registeredTuning: RegisteredTuningState,
): string =>
  registeredTuning.status === "verified"
    ? guitarConfigurations[stringCount].tuningLabel
    : "Custom tuning";

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

const octaveFretCount = chromaticPitchClasses.length;

const isCyclicShapeView = (fretCount: number): boolean =>
  fretCount === octaveFretCount || fretCount === octaveFretCount * 2;

const getShapeSourceFretCount = (fretCount: number): number =>
  fretCount === octaveFretCount ? fretCount * 2 : fretCount;

const getShapeDisplayFret = (fret: number, fretCount: number): number =>
  isCyclicShapeView(fretCount) ? ((fret - 1) % fretCount) + 1 : fret;

const getShapePlacementOffsets = (fretCount: number): number[] =>
  fretCount === octaveFretCount * 2 ? [0, octaveFretCount] : [0];

const projectShapePositions = (
  positions: Set<string>,
  fretCount: number,
): Set<string> => {
  if (!isCyclicShapeView(fretCount)) {
    return positions;
  }

  return new Set(
    [...positions].flatMap((position) => {
      const [stringIndex, fret] = position.split("-").map(Number);

      return getShapePlacementOffsets(fretCount).map(
        (placementOffset) =>
          `${stringIndex}-${getShapeDisplayFret(
            fret + placementOffset,
            fretCount,
          )}`,
      );
    }),
  );
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
  const sourceFretCount = getShapeSourceFretCount(fretCount);
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

      for (let fret = 1; fret <= sourceFretCount; fret++) {
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
        return projectShapePositions(positions, fretCount);
      }

      positions.add(`${stringIndex}-${selectedFret}`);
      previousPitch = selectedPitch;
      scaleNoteIndex++;
    }
  }

  return projectShapePositions(positions, fretCount);
};

// CAGED scale layouts in physical neck order: E, D, C, A, G.
const cagedScaleFretOffsetsByScale: Partial<Record<ScaleName, number[][][]>> = {
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

type CagedScaleName = "major" | "minor";

// Canonical C, A, G, E, D controls map to the physical E, D, C, A, G layouts.
const cagedSourceShapeIndexes = [2, 3, 4, 0, 1] as const;

const cagedChordFretOffsetsByScale: Record<
  CagedScaleName,
  Array<Array<number | null>>
> = {
  major: [
    [4, 5, 4, 6, 7, null],
    [7, 9, 9, 9, 7, null],
    [12, 9, 9, 9, 11, 12],
    [0, 0, 1, 2, 2, 0],
    [4, 5, 4, 2, null, null],
  ],
  minor: [
    [7, 5, 4, 5, 7, null],
    [7, 8, 9, 9, 7, null],
    [12, 12, 9, 9, 10, 12],
    [0, 0, 0, 2, 2, 0],
    [3, 5, 4, 2, null, null],
  ],
};

type CagedShapeLayout = {
  chordOffsets: Array<number | null>;
  referenceRootFret: number;
  scaleOffsets: number[][];
};

const isCagedScale = (scaleName: ScaleName): scaleName is CagedScaleName =>
  scaleName === "major" || scaleName === "minor";

const getCagedShapeLayout = (
  tuning: PitchClass[],
  fretCount: number,
  currentKey: TonicName,
  currentScale: ScaleName,
  shapeIndex: number,
): CagedShapeLayout | undefined => {
  if (
    !hasCagedTuning(tuning) ||
    !isCagedScale(currentScale) ||
    shapeIndex < 0 ||
    shapeIndex >= cagedSourceShapeIndexes.length
  ) {
    return undefined;
  }

  const sourceShapeIndex = cagedSourceShapeIndexes[shapeIndex];
  const scaleOffsets =
    cagedScaleFretOffsetsByScale[currentScale]?.[sourceShapeIndex];
  const chordOffsets = cagedChordFretOffsetsByScale[currentScale][shapeIndex];

  if (!scaleOffsets || !chordOffsets) {
    return undefined;
  }

  const flattenedOffsets = scaleOffsets.flat();
  const minimumOffset = Math.min(...flattenedOffsets);
  const maximumOffset = Math.max(...flattenedOffsets);
  const rawReferenceFret = normalizePitchClass(
    getPitchClass(currentKey) - tuning[0],
  );
  const octaveShift = Math.ceil(
    (1 - minimumOffset - rawReferenceFret) / chromaticPitchClasses.length,
  );
  const referenceRootFret =
    rawReferenceFret + octaveShift * chromaticPitchClasses.length;

  if (referenceRootFret + maximumOffset > getShapeSourceFretCount(fretCount)) {
    return undefined;
  }

  return { chordOffsets, referenceRootFret, scaleOffsets };
};

const canRenderCompleteCagedSystem = (
  tuning: PitchClass[],
  fretCount: number,
  currentKey: TonicName,
  currentScale: ScaleName,
): boolean =>
  scaleShapeSystems.caged.shapes.every((_, shapeIndex) =>
    Boolean(
      getCagedShapeLayout(
        tuning,
        fretCount,
        currentKey,
        currentScale,
        shapeIndex,
      ),
    ),
  );

export const getAvailableScaleShapeSystems = (
  currentScale: ScaleName,
  tuning: PitchClass[],
  currentKey: TonicName,
  fretCount: number,
): ScaleShapeSystem[] => {
  if (currentScale === "blues") {
    return ["pentatonic"];
  }

  if (["harmonic-minor", "phrygian-dominant"].includes(currentScale)) {
    return ["3nps"];
  }

  return canRenderCompleteCagedSystem(
    tuning,
    fretCount,
    currentKey,
    currentScale,
  )
    ? ["3nps", "caged", "pentatonic"]
    : ["3nps", "pentatonic"];
};

export const buildCagedScaleShape = (
  tuning: PitchClass[],
  fretCount: number,
  currentKey: TonicName,
  currentScale: ScaleName,
  shapeIndex: number,
): Set<string> => {
  const layout = getCagedShapeLayout(
    tuning,
    fretCount,
    currentKey,
    currentScale,
    shapeIndex,
  );
  const positions = new Set<string>();

  if (!layout) {
    return positions;
  }

  layout.scaleOffsets.forEach((stringOffsets, stringIndex) => {
    stringOffsets.forEach((offset) => {
      const fret = layout.referenceRootFret + offset;
      positions.add(`${stringIndex}-${fret}`);
    });
  });

  return projectShapePositions(positions, fretCount);
};

export const buildCagedChordShape = (
  tuning: PitchClass[],
  fretCount: number,
  currentKey: TonicName,
  currentScale: ScaleName,
  shapeIndex: number,
): Set<string> => {
  const layout = getCagedShapeLayout(
    tuning,
    fretCount,
    currentKey,
    currentScale,
    shapeIndex,
  );
  const positions = new Set<string>();

  if (!layout) {
    return positions;
  }

  layout.chordOffsets.forEach((offset, stringIndex) => {
    if (offset !== null) {
      const fret = layout.referenceRootFret + offset;
      positions.add(`${stringIndex}-${fret}`);
    }
  });

  return projectShapePositions(positions, fretCount);
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
  const sourceFretCount = getShapeSourceFretCount(fretCount);

  const positions = buildTwoNotesPerStringShape(
    tuning,
    sourceFretCount,
    pentatonicPitchClasses,
    shapeIndex,
  );

  if (currentScale !== "blues" || positions.size === 0) {
    return projectShapePositions(positions, fretCount);
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

  return projectShapePositions(positions, fretCount);
};

export const buildScaleShape = (
  shapeSystem: ScaleShapeSystem,
  tuning: PitchClass[],
  fretCount: number,
  currentKey: TonicName,
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
