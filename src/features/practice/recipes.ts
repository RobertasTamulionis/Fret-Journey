import type { PracticeTabExampleId } from "@/data/practiceTabExamples";
import type { PitchClass, ScaleName, TonicName } from "@/helpers/typesHelpers";

export type PracticePitchPolicy =
  | "chromatic"
  | "scale"
  | "scale-five-tone"
  | "tonic-transpose"
  | "tonic-triad";

export type PracticeExerciseRecipe = {
  contextConstraint?: {
    compatibleScales?: readonly ScaleName[];
    key?: TonicName;
    scale: ScaleName;
    tuning?: "preset-default";
  };
  pitchPolicy: PracticePitchPolicy;
  sourceTonic: PitchClass;
  stringRange: "highest-six" | "lowest-six";
};

const recipe = (
  pitchPolicy: PracticePitchPolicy,
  sourceTonic: PitchClass,
  stringRange: PracticeExerciseRecipe["stringRange"] = "highest-six",
): PracticeExerciseRecipe => ({ pitchPolicy, sourceTonic, stringRange });

/**
 * Immutable transformation intent for each authored Standard-E reference tab.
 * The recipe says how to reinterpret pitches and string range; it never mutates
 * the reviewed source event data.
 */
export const practiceExerciseRecipes = {
  "daily-reset": recipe("chromatic", 0),
  "daily-foundation": {
    ...recipe("scale", 9),
    contextConstraint: {
      compatibleScales: [
        "major",
        "minor",
        "harmonic-minor",
        "phrygian-dominant",
      ],
      scale: "minor",
    },
  },
  "daily-ear": recipe("scale-five-tone", 9),
  "daily-play": {
    ...recipe("scale", 4),
    contextConstraint: {
      key: "E",
      scale: "minor",
      tuning: "preset-default",
    },
  },
  "scales-center": recipe("scale-five-tone", 9),
  "scales-sequence": recipe("scale", 9),
  "scales-connect": {
    ...recipe("scale", 4),
    contextConstraint: { scale: "minor", tuning: "preset-default" },
  },
  "scales-phrase": recipe("scale-five-tone", 9),
  "skipping-landing": recipe("chromatic", 0),
  "skipping-pentatonic": recipe("scale-five-tone", 9),
  "skipping-arpeggio": recipe("tonic-triad", 9),
  "skipping-phrase": {
    ...recipe("scale", 4),
    contextConstraint: { scale: "minor", tuning: "preset-default" },
  },
  "chugs-mute-depth": recipe("tonic-transpose", 4, "lowest-six"),
  "chugs-gallop": recipe("tonic-transpose", 4, "lowest-six"),
  "alternate-balance": recipe("scale", 9),
  "alternate-cross": recipe("scale", 9),
  "alternate-burst": recipe("scale", 9),
  "alternate-phrase": recipe("scale-five-tone", 9),
  "legato-pairs": recipe("chromatic", 0),
  "legato-flow": recipe("scale", 9),
  "legato-connect": recipe("scale", 9),
  "legato-phrase": {
    ...recipe("scale", 4),
    contextConstraint: { scale: "minor", tuning: "preset-default" },
  },
  "sweep-rake": recipe("chromatic", 0),
  "sweep-triad": recipe("tonic-triad", 9),
  "sweep-turn": recipe("tonic-triad", 0),
  "sweep-progression": recipe("scale", 9),
  "bends-reference": {
    ...recipe("tonic-transpose", 9),
    contextConstraint: {
      compatibleScales: ["minor", "blues"],
      scale: "blues",
    },
  },
  "bends-control": {
    ...recipe("tonic-transpose", 9),
    contextConstraint: {
      compatibleScales: ["minor", "blues"],
      scale: "blues",
    },
  },
  "vibrato-pulse": recipe("tonic-transpose", 9),
  "bends-phrase": {
    ...recipe("tonic-transpose", 9),
    contextConstraint: {
      compatibleScales: ["minor", "blues"],
      scale: "blues",
    },
  },
  "metal-tight-chugs": recipe("tonic-transpose", 4, "lowest-six"),
  "metal-accent-shift": recipe("tonic-transpose", 4, "lowest-six"),
  "metal-pedal-assault": {
    ...recipe("scale", 4, "lowest-six"),
    contextConstraint: {
      compatibleScales: ["major", "minor"],
      scale: "minor",
      tuning: "preset-default",
    },
  },
  "metal-three-three-two-engine": {
    ...recipe("scale", 4, "lowest-six"),
    contextConstraint: { scale: "minor", tuning: "preset-default" },
  },
  "metal-gallop-relay": {
    ...recipe("scale", 4, "lowest-six"),
    contextConstraint: { scale: "minor", tuning: "preset-default" },
  },
  "metal-gallop-control": {
    ...recipe("scale", 4, "lowest-six"),
    contextConstraint: {
      compatibleScales: ["major", "minor", "blues"],
      scale: "minor",
      tuning: "preset-default",
    },
  },
  "metal-burst-and-resolve": recipe("scale", 4),
  "metal-iron-pulse": {
    ...recipe("scale", 9, "lowest-six"),
    contextConstraint: { scale: "minor", tuning: "preset-default" },
  },
  "metal-phrygian-gravity": {
    ...recipe("scale", 4, "lowest-six"),
    contextConstraint: {
      scale: "phrygian-dominant",
      tuning: "preset-default",
    },
  },
  "metal-phrygian-tension": {
    ...recipe("scale", 4, "lowest-six"),
    contextConstraint: {
      scale: "phrygian-dominant",
      tuning: "preset-default",
    },
  },
  "metal-tremolo-horizon": recipe("scale", 4),
  "metal-syncopated-stops": {
    ...recipe("scale", 4, "lowest-six"),
    contextConstraint: {
      compatibleScales: ["major", "minor", "blues"],
      scale: "minor",
      tuning: "preset-default",
    },
  },
  "funk-pocket-stabs": recipe("tonic-triad", 9),
} as const satisfies Record<PracticeTabExampleId, PracticeExerciseRecipe>;
