import type { ResolvedChord, TonalContext } from "@/features/progressions";
import {
  getPitchClass,
  getScaleTone,
  scaleDefinitions,
} from "@/helpers/musicTheory";
import type {
  PitchClass,
  ScaleDegreeLabel,
  ScaleName,
} from "@/helpers/typesHelpers";
import type {
  ChordToneAnalysis,
  NoteContextAnalysis,
  ScaleColorDegree,
  ScaleColorDegrees,
  ScaleDegreeAnalysis,
} from "./types";

export const analyzeScaleDegree = (
  context: TonalContext,
  pitchClass: PitchClass,
): ScaleDegreeAnalysis => {
  const tone = getScaleTone(
    pitchClass,
    context.currentKey,
    context.currentScale,
  );

  return tone ? { inScale: true, tone } : { inScale: false };
};

export const analyzeChordTone = (
  chord: ResolvedChord,
  pitchClass: PitchClass,
): ChordToneAnalysis => {
  const tone = chord.tones.find(
    (chordTone) => chordTone.pitchClass === pitchClass,
  );

  return tone ? { isChordTone: true, tone } : { isChordTone: false };
};

export const analyzeNoteInContext = (
  context: TonalContext,
  pitchClass: PitchClass,
  chord?: ResolvedChord,
): NoteContextAnalysis => ({
  chord: chord ? analyzeChordTone(chord, pitchClass) : { isChordTone: false },
  isChordRoot: chord?.root.pitchClass === pitchClass,
  isScaleTonic: getPitchClass(context.currentKey) === pitchClass,
  pitchClass,
  scale: analyzeScaleDegree(context, pitchClass),
});

export const scaleColorDegreeLabels = {
  major: [],
  minor: ["b6"],
  blues: ["b5"],
  "harmonic-minor": ["7"],
  "phrygian-dominant": ["b2", "3"],
} as const satisfies ScaleColorDegrees;

export const getScaleColorDegrees = (
  scale: ScaleName,
): readonly ScaleColorDegree[] =>
  scaleColorDegreeLabels[scale].map((degreeLabel) => {
    const tone = scaleDefinitions[scale].tones.find(
      (candidate) => candidate.degreeLabel === degreeLabel,
    );

    if (!tone) {
      throw new Error(
        `Scale color degree ${degreeLabel} is not present in ${scale}`,
      );
    }

    return {
      degreeLabel: degreeLabel as ScaleDegreeLabel,
      intervalName: tone.intervalName,
      semitones: tone.semitones,
    };
  });
