import {
  assertValidProgressionCatalog,
  progressionCategories,
} from "@/features/progressions/catalogValidation";
import { deriveAppliedDominantRoot } from "@/features/progressions/resolver";
import type {
  ChordFormulaId,
  HarmonicScope,
  ProgressionCategory,
  ProgressionDifficulty,
  ProgressionForm,
  ProgressionTemplate,
  RelativeChordSpec,
  RelativeDegree,
} from "@/features/progressions/types";
import type { ScaleName } from "@/helpers/typesHelpers";
import type { ProgressionSourceId } from "./progressionSources";

const editorialSource =
  "fret-journey-editorial-2026-08" satisfies ProgressionSourceId;
const openMusicTheorySource =
  "open-music-theory-pop-rock-2022" satisfies ProgressionSourceId;

const degree = (
  value: RelativeDegree["degree"],
  alteration = 0,
): RelativeDegree => ({
  alteration: alteration as RelativeDegree["alteration"],
  degree: value,
});

const chord = (
  formulaId: ChordFormulaId,
  rootDegree: RelativeDegree["degree"],
  alteration = 0,
  harmonicScope?: HarmonicScope,
): RelativeChordSpec => ({
  formulaId,
  root: degree(rootDegree, alteration),
  ...(harmonicScope ? { harmonicScope } : {}),
});

const major = (
  rootDegree: RelativeDegree["degree"],
  alteration = 0,
  scope?: HarmonicScope,
) => chord("major", rootDegree, alteration, scope);
const minor = (
  rootDegree: RelativeDegree["degree"],
  alteration = 0,
  scope?: HarmonicScope,
) => chord("minor", rootDegree, alteration, scope);
const diminished = (
  rootDegree: RelativeDegree["degree"],
  alteration = 0,
  scope?: HarmonicScope,
) => chord("diminished", rootDegree, alteration, scope);
const augmented = (
  rootDegree: RelativeDegree["degree"],
  alteration = 0,
  scope?: HarmonicScope,
) => chord("augmented", rootDegree, alteration, scope);
const dominant7 = (
  rootDegree: RelativeDegree["degree"],
  alteration = 0,
  scope?: HarmonicScope,
) => chord("dominant7", rootDegree, alteration, scope);
const major7 = (
  rootDegree: RelativeDegree["degree"],
  alteration = 0,
  scope?: HarmonicScope,
) => chord("major7", rootDegree, alteration, scope);
const minor7 = (
  rootDegree: RelativeDegree["degree"],
  alteration = 0,
  scope?: HarmonicScope,
) => chord("minor7", rootDegree, alteration, scope);
const halfDiminished7 = (
  rootDegree: RelativeDegree["degree"],
  alteration = 0,
  scope?: HarmonicScope,
) => chord("half-diminished7", rootDegree, alteration, scope);
const sus2 = (rootDegree: RelativeDegree["degree"], alteration = 0) =>
  chord("sus2", rootDegree, alteration);
const sus4 = (rootDegree: RelativeDegree["degree"], alteration = 0) =>
  chord("sus4", rootDegree, alteration);
const add9 = (rootDegree: RelativeDegree["degree"], alteration = 0) =>
  chord("add9", rootDegree, alteration);
const minorAdd9 = (rootDegree: RelativeDegree["degree"], alteration = 0) =>
  chord("minor-add9", rootDegree, alteration);
const major6 = (rootDegree: RelativeDegree["degree"], alteration = 0) =>
  chord("major6", rootDegree, alteration);
const minor6 = (rootDegree: RelativeDegree["degree"], alteration = 0) =>
  chord("minor6", rootDegree, alteration);
const dominant7Sus4 = (rootDegree: RelativeDegree["degree"], alteration = 0) =>
  chord("dominant7sus4", rootDegree, alteration);

const withBass = (
  chordSpec: RelativeChordSpec,
  bassDegree: RelativeDegree["degree"],
  bassAlteration = 0,
): RelativeChordSpec => ({
  ...chordSpec,
  bass: degree(bassDegree, bassAlteration),
});

const appliedDominant = (
  targetDegree: RelativeDegree["degree"],
  targetRomanCase: "upper" | "lower" = "upper",
  formulaId: "major" | "dominant7" | "dominant7sus4" = "dominant7",
  targetAlteration = 0,
): RelativeChordSpec => {
  const appliedTo = {
    ...degree(targetDegree, targetAlteration),
    romanCase: targetRomanCase,
  } as const;

  return {
    appliedTo,
    formulaId,
    harmonicScope: "secondary-dominant",
    root: deriveAppliedDominantRoot(appliedTo),
  };
};

type CatalogSeed = {
  beats?: readonly number[];
  compatibleScales?: readonly ScaleName[];
  difficulty?: ProgressionDifficulty;
  explanation: string;
  form?: ProgressionForm;
  framework?: ScaleName;
  moodTags?: readonly string[];
  pattern: readonly RelativeChordSpec[];
  reference?: boolean;
  slug: string;
  styleTags?: readonly string[];
  title: string;
};

type CategoryProfile = {
  compatibleScales: readonly ScaleName[];
  difficulty?: ProgressionDifficulty;
  form: ProgressionForm;
  framework: ScaleName;
  harmonicDevices: readonly HarmonicScope[];
  moodTags: readonly string[];
  styleTags: readonly string[];
};

const categoryProfiles: Record<ProgressionCategory, CategoryProfile> = {
  "major-diatonic": {
    compatibleScales: ["major"],
    difficulty: "beginner",
    form: "loop",
    framework: "major",
    harmonicDevices: ["diatonic"],
    moodTags: ["bright", "resolved"],
    styleTags: ["foundations", "songwriting"],
  },
  "natural-minor": {
    compatibleScales: ["minor"],
    difficulty: "beginner",
    form: "loop",
    framework: "minor",
    harmonicDevices: ["diatonic"],
    moodTags: ["reflective", "dark"],
    styleTags: ["minor-key", "songwriting"],
  },
  "harmonic-minor": {
    compatibleScales: ["harmonic-minor"],
    difficulty: "intermediate",
    form: "sequence",
    framework: "harmonic-minor",
    harmonicDevices: ["diatonic"],
    moodTags: ["dramatic", "tense"],
    styleTags: ["minor-key", "classical-color"],
  },
  "phrygian-dominant": {
    compatibleScales: ["phrygian-dominant"],
    difficulty: "intermediate",
    form: "loop",
    framework: "phrygian-dominant",
    harmonicDevices: ["diatonic"],
    moodTags: ["tense", "exotic"],
    styleTags: ["modal", "riff-harmony"],
  },
  blues: {
    compatibleScales: ["blues"],
    difficulty: "beginner",
    form: "sequence",
    framework: "blues",
    harmonicDevices: ["diatonic"],
    moodTags: ["earthy", "driving"],
    styleTags: ["blues", "turnaround"],
  },
  "pop-rock-loop": {
    compatibleScales: ["major"],
    difficulty: "beginner",
    form: "loop",
    framework: "major",
    harmonicDevices: ["diatonic"],
    moodTags: ["anthemic", "immediate"],
    styleTags: ["pop", "rock"],
  },
  cadence: {
    compatibleScales: ["major"],
    difficulty: "beginner",
    form: "sequence",
    framework: "major",
    harmonicDevices: ["diatonic"],
    moodTags: ["resolved", "formal"],
    styleTags: ["cadence", "voice-leading"],
  },
  "circle-progression": {
    compatibleScales: ["major"],
    difficulty: "intermediate",
    form: "sequence",
    framework: "major",
    harmonicDevices: ["diatonic"],
    moodTags: ["flowing", "inevitable"],
    styleTags: ["circle", "voice-leading"],
  },
  "jazz-turnaround": {
    compatibleScales: ["major"],
    difficulty: "advanced",
    form: "sequence",
    framework: "major",
    harmonicDevices: ["diatonic", "secondary-dominant"],
    moodTags: ["sophisticated", "forward-moving"],
    styleTags: ["jazz", "turnaround"],
  },
  modal: {
    compatibleScales: ["minor"],
    difficulty: "intermediate",
    form: "loop",
    framework: "minor",
    harmonicDevices: ["diatonic", "modal-interchange"],
    moodTags: ["hypnotic", "open"],
    styleTags: ["modal", "pedal-harmony"],
  },
  "borrowed-chord": {
    compatibleScales: ["major"],
    difficulty: "intermediate",
    form: "sequence",
    framework: "major",
    harmonicDevices: ["diatonic", "borrowed"],
    moodTags: ["bittersweet", "surprising"],
    styleTags: ["modal-interchange", "songwriting"],
  },
  "secondary-dominant": {
    compatibleScales: ["major"],
    difficulty: "intermediate",
    form: "sequence",
    framework: "major",
    harmonicDevices: ["diatonic", "secondary-dominant"],
    moodTags: ["propulsive", "bright"],
    styleTags: ["tonicization", "functional-harmony"],
  },
  "chromatic-mediant": {
    compatibleScales: ["major"],
    difficulty: "advanced",
    form: "sequence",
    framework: "major",
    harmonicDevices: ["diatonic", "chromatic"],
    moodTags: ["uncanny", "expansive"],
    styleTags: ["chromatic-mediant", "color-harmony"],
  },
  "gospel-rnb": {
    compatibleScales: ["major"],
    difficulty: "intermediate",
    form: "sequence",
    framework: "major",
    harmonicDevices: ["diatonic", "borrowed"],
    moodTags: ["warm", "uplifting"],
    styleTags: ["gospel", "rnb"],
  },
  cinematic: {
    compatibleScales: ["minor"],
    difficulty: "intermediate",
    form: "sequence",
    framework: "minor",
    harmonicDevices: ["diatonic", "chromatic"],
    moodTags: ["cinematic", "dramatic"],
    styleTags: ["score", "storytelling"],
  },
};

const openMusicTheoryReferenceCategories = new Set<ProgressionCategory>([
  "major-diatonic",
  "pop-rock-loop",
  "modal",
  "borrowed-chord",
  "secondary-dominant",
]);

const categorySeedGroups: Record<ProgressionCategory, readonly CatalogSeed[]> =
  {
    "major-diatonic": [
      {
        slug: "axis-four",
        title: "Axis Four",
        explanation:
          "A descending bass impression balances strong tonic and dominant poles.",
        pattern: [major(1), major(5), minor(6), major(4)],
        reference: true,
      },
      {
        slug: "fifties-cycle",
        title: "Fifties Cycle",
        explanation:
          "Tonic moves through the relative minor before the predominant and dominant return.",
        pattern: [major(1), minor(6), major(4), major(5)],
        reference: true,
      },
      {
        slug: "plagal-homecoming",
        title: "Plagal Homecoming",
        explanation:
          "The subdominant settles directly into tonic for an unhurried close.",
        pattern: [major(1), major(4), major(1)],
        form: "sequence",
        reference: true,
      },
      {
        slug: "compact-two-five-one",
        title: "Compact Two Five One",
        explanation:
          "Predominant and dominant functions create the clearest short route home.",
        pattern: [minor(2), dominant7(5), major(1)],
        form: "sequence",
      },
      {
        slug: "mediant-lift",
        title: "Mediant Lift",
        explanation:
          "The mediant softens tonic before IV and V restore forward motion.",
        pattern: [major(1), minor(3), major(4), major(5)],
      },
      {
        slug: "predominant-pair",
        title: "Predominant Pair",
        explanation:
          "IV and ii share predominant color before the dominant resets the loop.",
        pattern: [major(1), major(4), minor(2), major(5)],
      },
      {
        slug: "ascending-release",
        title: "Ascending Release",
        explanation:
          "IV and V rise brightly before iii slips into the relative minor.",
        pattern: [major(4), major(5), minor(3), minor(6)],
        form: "sequence",
      },
      {
        slug: "tonic-fifth-supertonic",
        title: "Tonic Fifth Supertonic",
        explanation:
          "A direct dominant move opens into ii before IV restores breadth.",
        pattern: [major(1), major(5), minor(2), major(4)],
      },
      {
        slug: "two-five-with-relative-tail",
        title: "Two Five with Relative Tail",
        explanation:
          "A complete cadence lands briefly, then vi leaves the phrase open.",
        pattern: [minor(2), dominant7(5), major(1), minor(6)],
        form: "sequence",
      },
      {
        slug: "leading-tone-bridge",
        title: "Leading-Tone Bridge",
        explanation:
          "The diminished leading-tone chord pulls into iii and then vi.",
        pattern: [major(1), diminished(7), minor(3), minor(6)],
        form: "sequence",
      },
      {
        slug: "relative-circle-return",
        title: "Relative Circle Return",
        explanation:
          "vi begins a compact descending-fifths chain through ii and V to I.",
        pattern: [minor(6), minor(2), dominant7(5), major(1)],
        form: "sequence",
      },
      {
        slug: "five-chord-diatonic-arc",
        title: "Five-Chord Diatonic Arc",
        explanation:
          "Tonic passes through dominant, supertonic, relative minor, and subdominant.",
        pattern: [major(1), major(5), minor(2), minor(6), major(4)],
        form: "sequence",
      },
      {
        slug: "full-diatonic-circle",
        title: "Full Diatonic Circle",
        explanation:
          "The mediant starts a five-chord circle that resolves cleanly to tonic.",
        pattern: [minor(3), minor(6), minor(2), dominant7(5), major(1)],
        form: "sequence",
      },
      {
        slug: "mediant-relative-climb",
        title: "Mediant Relative Climb",
        explanation:
          "iii and vi delay the arrival of IV and V without leaving the key.",
        pattern: [major(1), minor(3), minor(6), major(4), major(5)],
        form: "sequence",
      },
      {
        slug: "double-tonic-frame",
        title: "Double Tonic Frame",
        explanation:
          "Repeated tonic arrivals frame IV and V as clear contrasting regions.",
        pattern: [major(1), major(4), major(1), major(5), major(1)],
        form: "sequence",
        beats: [4, 2, 2, 4, 4],
      },
    ],
    "natural-minor": [
      {
        slug: "aeolian-descent",
        title: "Aeolian Descent",
        explanation:
          "The tonic falls through flat VI and flat III before flat VII turns the loop.",
        pattern: [minor(1), major(6, -1), major(3, -1), major(7, -1)],
        reference: true,
      },
      {
        slug: "minor-backstep",
        title: "Minor Backstep",
        explanation:
          "Flat VII and flat VI create a weighty stepwise descent around tonic.",
        pattern: [minor(1), major(7, -1), major(6, -1), major(7, -1)],
        reference: true,
      },
      {
        slug: "natural-minor-cadence",
        title: "Natural Minor Cadence",
        explanation:
          "Minor iv and minor v preserve the unraised seventh before tonic returns.",
        pattern: [minor(1), minor(4), minor(5), minor(1)],
        form: "sequence",
        reference: true,
      },
      {
        slug: "minor-third-window",
        title: "Minor Third Window",
        explanation:
          "Flat III brightens the loop while flat VII and iv keep its minor center.",
        pattern: [minor(1), major(3, -1), major(7, -1), minor(4)],
      },
      {
        slug: "minor-fifth-shadow",
        title: "Minor Fifth Shadow",
        explanation:
          "The natural-minor dominant moves into flat VI before iv folds back inward.",
        pattern: [minor(1), minor(5), major(6, -1), minor(4)],
      },
      {
        slug: "aeolian-rise-home",
        title: "Aeolian Rise Home",
        explanation: "Flat VI and flat VII rise stepwise into the minor tonic.",
        pattern: [major(6, -1), major(7, -1), minor(1)],
        form: "sequence",
      },
      {
        slug: "minor-leading-detour",
        title: "Minor Leading Detour",
        explanation:
          "The diminished supertonic intensifies a fully natural-minor cadence.",
        pattern: [minor(1), diminished(2), minor(5), minor(1)],
        form: "sequence",
      },
      {
        slug: "minor-plagal-to-relative",
        title: "Minor Plagal to Relative",
        explanation: "iv moves through flat VII to the relative-major region.",
        pattern: [minor(1), minor(4), major(7, -1), major(3, -1)],
        form: "sequence",
      },
      {
        slug: "relative-major-fall",
        title: "Relative Major Fall",
        explanation:
          "Flat III falls through flat VII and tonic, then iv deepens the route to flat VI.",
        pattern: [major(3, -1), major(7, -1), minor(1), minor(4), major(6, -1)],
      },
      {
        slug: "minor-subdominant-frame",
        title: "Minor Subdominant Frame",
        explanation:
          "Flat VI widens a phrase framed by tonic, iv, and the minor dominant.",
        pattern: [minor(1), major(6, -1), minor(4), minor(5)],
        form: "sequence",
      },
      {
        slug: "minor-dominant-relative",
        title: "Minor Dominant Relative",
        explanation:
          "The minor dominant opens into flat III and flat VII without raising scale degree seven.",
        pattern: [minor(1), minor(5), major(3, -1), major(7, -1)],
      },
      {
        slug: "plagal-minor-arch",
        title: "Plagal Minor Arch",
        explanation:
          "iv touches tonic, then flat VII and flat III broaden the cadence.",
        pattern: [minor(4), minor(1), major(7, -1), major(3, -1)],
        form: "sequence",
      },
      {
        slug: "minor-four-color-loop",
        title: "Minor Four-Color Loop",
        explanation:
          "Flat III, iv, and flat VI supply three shades around a stable tonic.",
        pattern: [minor(1), major(3, -1), minor(4), major(6, -1)],
      },
      {
        slug: "aeolian-five-step",
        title: "Aeolian Five-Step",
        explanation:
          "A stepwise functional tour moves from tonic through ii diminished to minor v.",
        pattern: [minor(1), diminished(2), major(3, -1), minor(4), minor(5)],
        form: "sequence",
      },
      {
        slug: "minor-deep-return",
        title: "Minor Deep Return",
        explanation:
          "Flat VI and iv deepen the return from tonic to the natural-minor dominant.",
        pattern: [major(6, -1), minor(4), minor(1), minor(5)],
        form: "sequence",
      },
    ],
    "harmonic-minor": [
      {
        slug: "harmonic-minor-authentic",
        title: "Harmonic-Minor Authentic",
        explanation:
          "Minor iv and dominant seven spotlight the raised leading tone before tonic.",
        pattern: [minor(1), minor(4), dominant7(5), minor(1)],
        reference: true,
      },
      {
        slug: "flat-six-dominant",
        title: "Flat Six Dominant",
        explanation:
          "Flat VI expands the color before the dominant contracts into tonic.",
        pattern: [minor(1), major(6, -1), dominant7(5), minor(1)],
        reference: true,
      },
      {
        slug: "diminished-predominant",
        title: "Diminished Predominant",
        explanation:
          "ii diminished feeds the dominant and makes the tonic arrival especially focused.",
        pattern: [minor(1), diminished(2), dominant7(5), minor(1)],
        reference: true,
      },
      {
        slug: "augmented-mediant-pivot",
        title: "Augmented Mediant Pivot",
        explanation:
          "The augmented flat III adds heat between tonic and the iv–V cadence.",
        pattern: [minor(1), augmented(3, -1), minor(4), dominant7(5)],
      },
      {
        slug: "leading-tone-snap",
        title: "Leading-Tone Snap",
        explanation:
          "A compact vii diminished chord snaps directly back to tonic.",
        pattern: [minor(1), diminished(7), minor(1)],
        form: "sequence",
      },
      {
        slug: "harmonic-minor-plagal-rise",
        title: "Harmonic-Minor Plagal Rise",
        explanation:
          "iv rises through V to tonic before flat VI extends the phrase.",
        pattern: [minor(4), dominant7(5), minor(1), major(6, -1)],
        form: "sequence",
      },
      {
        slug: "flat-six-predominant-chain",
        title: "Flat Six Predominant Chain",
        explanation: "Flat VI moves into ii diminished and then the dominant.",
        pattern: [minor(1), major(6, -1), diminished(2), dominant7(5)],
      },
      {
        slug: "augmented-minor-circle",
        title: "Augmented Minor Circle",
        explanation:
          "Augmented flat III begins a colorful chain through flat VI, ii diminished, and V.",
        pattern: [
          augmented(3, -1),
          major(6, -1),
          diminished(2),
          dominant7(5),
          minor(1),
        ],
        form: "sequence",
      },
      {
        slug: "dominant-flat-six-wave",
        title: "Dominant Flat-Six Wave",
        explanation:
          "V briefly yields to flat VI before iv rebuilds the final cadence.",
        pattern: [
          minor(1),
          dominant7(5),
          major(6, -1),
          minor(4),
          dominant7(5),
          minor(1),
        ],
        form: "sequence",
      },
      {
        slug: "minor-two-five",
        title: "Minor Two Five",
        explanation:
          "Half-step tension between ii diminished and V resolves immediately to minor tonic.",
        pattern: [diminished(2), dominant7(5), minor(1)],
        form: "sequence",
      },
      {
        slug: "minor-predominant-stack",
        title: "Minor Predominant Stack",
        explanation:
          "iv and ii diminished stack two predominant colors before V.",
        pattern: [minor(1), minor(4), diminished(2), dominant7(5)],
        form: "sequence",
      },
      {
        slug: "flat-six-short-cadence",
        title: "Flat Six Short Cadence",
        explanation:
          "Flat VI drops to V and then resolves with maximum economy.",
        pattern: [major(6, -1), dominant7(5), minor(1)],
        form: "sequence",
      },
      {
        slug: "augmented-flat-six-cadence",
        title: "Augmented Flat-Six Cadence",
        explanation:
          "Augmented flat III and flat VI amplify the approach to dominant.",
        pattern: [minor(1), augmented(3, -1), major(6, -1), dominant7(5)],
        form: "sequence",
      },
      {
        slug: "plagal-dominant-answer",
        title: "Plagal Dominant Answer",
        explanation:
          "A plagal return is answered by a stronger dominant-tonic close.",
        pattern: [minor(4), minor(1), dominant7(5), minor(1)],
        form: "sequence",
      },
      {
        slug: "complete-harmonic-minor-arc",
        title: "Complete Harmonic-Minor Arc",
        explanation:
          "Leading-tone and augmented colors frame a full six-event minor cadence.",
        pattern: [
          minor(1),
          diminished(7),
          augmented(3, -1),
          minor(4),
          dominant7(5),
          minor(1),
        ],
        form: "sequence",
      },
    ],
    "phrygian-dominant": [
      {
        slug: "phrygian-neighbor",
        title: "Phrygian Neighbor",
        explanation:
          "Flat II presses against the major tonic to define the mode immediately.",
        pattern: [major(1), major(2, -1), major(1)],
        reference: true,
      },
      {
        slug: "phrygian-wide-turn",
        title: "Phrygian Wide Turn",
        explanation:
          "Flat II and minor flat VII stretch the tonic pedal in opposite directions.",
        pattern: [major(1), major(2, -1), minor(7, -1), major(1)],
        reference: true,
      },
      {
        slug: "phrygian-minor-plagal",
        title: "Phrygian Minor Plagal",
        explanation:
          "Minor iv darkens the characteristic flat-II return to major tonic.",
        pattern: [major(1), minor(4), major(2, -1), major(1)],
        reference: true,
      },
      {
        slug: "phrygian-augmented-six",
        title: "Phrygian Augmented Six",
        explanation:
          "The augmented flat VI heightens the modal pull between tonic and flat II.",
        pattern: [major(1), augmented(6, -1), major(2, -1), major(1)],
      },
      {
        slug: "phrygian-diminished-fifth",
        title: "Phrygian Diminished Fifth",
        explanation:
          "A diminished v interrupts the flat-II neighbor before tonic returns.",
        pattern: [major(2, -1), major(1), diminished(5), major(1)],
        form: "sequence",
      },
      {
        slug: "phrygian-inner-motion",
        title: "Phrygian Inner Motion",
        explanation:
          "Diminished iii and minor iv create motion inside the modal tonic field.",
        pattern: [major(1), diminished(3), minor(4), major(2, -1)],
      },
      {
        slug: "flat-seven-phrygian-turn",
        title: "Flat-Seven Phrygian Turn",
        explanation:
          "Minor flat VII leans into flat II before the major tonic clears the tension.",
        pattern: [major(1), minor(7, -1), major(2, -1), major(1)],
      },
      {
        slug: "phrygian-augmented-gate",
        title: "Phrygian Augmented Gate",
        explanation:
          "Flat II opens toward augmented flat VI and then drops to tonic.",
        pattern: [major(2, -1), augmented(6, -1), major(1)],
        form: "sequence",
      },
      {
        slug: "phrygian-dominant-pulse",
        title: "Phrygian-Dominant Pulse",
        explanation:
          "The diminished fifth-degree chord creates a clipped pulse around flat II.",
        pattern: [major(1), diminished(5), major(2, -1), major(1)],
      },
      {
        slug: "phrygian-plagal-cadence",
        title: "Phrygian Plagal Cadence",
        explanation: "Minor iv falls through flat II into the tonic.",
        pattern: [minor(4), major(2, -1), major(1)],
        form: "sequence",
      },
      {
        slug: "phrygian-four-chord-ostinato",
        title: "Phrygian Four-Chord Ostinato",
        explanation:
          "Flat II, iv, and minor flat VII orbit a stable major tonic.",
        pattern: [major(1), major(2, -1), minor(4), minor(7, -1)],
      },
      {
        slug: "phrygian-diminished-climb",
        title: "Phrygian Diminished Climb",
        explanation:
          "Diminished iii climbs through iv and flat II before resolving.",
        pattern: [diminished(3), minor(4), major(2, -1), major(1)],
        form: "sequence",
      },
      {
        slug: "phrygian-augmented-fall",
        title: "Phrygian Augmented Fall",
        explanation: "Augmented flat VI falls through diminished v into tonic.",
        pattern: [major(1), augmented(6, -1), diminished(5), major(1)],
        form: "sequence",
      },
      {
        slug: "phrygian-flat-seven-cadence",
        title: "Phrygian Flat-Seven Cadence",
        explanation:
          "Minor flat VII and flat II make a two-stage modal cadence.",
        pattern: [minor(7, -1), major(2, -1), major(1)],
        form: "sequence",
      },
      {
        slug: "phrygian-pedal-arc",
        title: "Phrygian Pedal Arc",
        explanation:
          "Repeated tonic placements frame flat II and minor flat VII as vivid neighbors.",
        pattern: [major(1), major(2, -1), major(1), minor(7, -1), major(1)],
        form: "sequence",
      },
    ],
    blues: [
      {
        slug: "compact-twelve-bar-map",
        title: "Compact Twelve-Bar Map",
        explanation:
          "Long tonic space, a subdominant visit, and a dominant turnaround outline the blues form.",
        pattern: [dominant7(1), dominant7(4), dominant7(1), dominant7(5)],
        beats: [16, 8, 8, 8],
        reference: true,
      },
      {
        slug: "quick-change-blues",
        title: "Quick-Change Blues",
        explanation:
          "An early IV chord announces the form before V and IV answer each other.",
        pattern: [dominant7(1), dominant7(4), dominant7(5), dominant7(4)],
        beats: [4, 4, 4, 4],
        reference: true,
      },
      {
        slug: "five-four-one-blues",
        title: "Five Four One Blues",
        explanation:
          "Dominant and subdominant tension descend directly into the tonic blues chord.",
        pattern: [dominant7(5), dominant7(4), dominant7(1)],
        form: "sequence",
        reference: true,
      },
      {
        slug: "major-to-dominant-blues",
        title: "Major-to-Dominant Blues",
        explanation:
          "A plain tonic triad leaves room for dominant color on IV, I, and V.",
        pattern: [major(1), dominant7(4), dominant7(1), dominant7(5)],
        form: "sequence",
      },
      {
        slug: "five-event-blues-frame",
        title: "Five-Event Blues Frame",
        explanation: "Two subdominant visits frame the final dominant arrival.",
        pattern: [
          dominant7(1),
          dominant7(4),
          dominant7(1),
          dominant7(4),
          dominant7(5),
        ],
        form: "sequence",
      },
      {
        slug: "quick-change-resolution",
        title: "Quick-Change Resolution",
        explanation:
          "I–IV opens quickly, while V–I gives the phrase a decisive close.",
        pattern: [dominant7(1), dominant7(4), dominant7(5), dominant7(1)],
        form: "sequence",
      },
      {
        slug: "blues-backcycle",
        title: "Blues Backcycle",
        explanation:
          "The final IV chord delays the return after a dominant turnaround.",
        pattern: [
          dominant7(1),
          dominant7(4),
          dominant7(1),
          dominant7(5),
          dominant7(4),
        ],
        form: "sequence",
      },
      {
        slug: "blues-double-home",
        title: "Blues Double Home",
        explanation:
          "Two tonic arrivals separate IV and V into clear call-and-response blocks.",
        pattern: [
          dominant7(1),
          dominant7(4),
          dominant7(1),
          dominant7(5),
          dominant7(1),
        ],
        form: "sequence",
        beats: [8, 4, 8, 4, 8],
      },
      {
        slug: "suspended-blues-opening",
        title: "Suspended Blues Opening",
        explanation:
          "A suspended tonic releases into I before the standard IV–V motion.",
        pattern: [dominant7Sus4(1), dominant7(1), dominant7(4), dominant7(5)],
        form: "sequence",
      },
      {
        slug: "sixth-blues-color",
        title: "Sixth Blues Color",
        explanation:
          "A tonic sixth adds sweetness before dominant-seventh IV and V.",
        pattern: [major6(1), dominant7(4), dominant7(5), dominant7(1)],
        form: "sequence",
      },
      {
        slug: "suspended-four-release",
        title: "Suspended Four Release",
        explanation: "Suspended IV resolves before V pushes the phrase home.",
        pattern: [dominant7(1), dominant7Sus4(4), dominant7(4), dominant7(5)],
        form: "sequence",
      },
      {
        slug: "suspended-five-turnaround",
        title: "Suspended Five Turnaround",
        explanation:
          "The dominant suspension creates a final hesitation before the turnaround resolves.",
        pattern: [
          dominant7(1),
          dominant7(4),
          dominant7(1),
          dominant7Sus4(5),
          dominant7(5),
        ],
        form: "sequence",
      },
      {
        slug: "extended-quick-change",
        title: "Extended Quick Change",
        explanation:
          "A second IV visit expands the quick-change plan into a six-event phrase.",
        pattern: [
          dominant7(1),
          dominant7(4),
          dominant7(1),
          dominant7(4),
          dominant7(5),
          dominant7(1),
        ],
        form: "sequence",
      },
      {
        slug: "blues-tonic-pedal",
        title: "Blues Tonic Pedal",
        explanation:
          "Repeated tonic returns make IV and V feel like brief departures.",
        pattern: [
          dominant7(1),
          dominant7(5),
          dominant7(1),
          dominant7(4),
          dominant7(1),
          dominant7(5),
          dominant7(1),
        ],
        form: "sequence",
      },
      {
        slug: "slow-change-blues",
        title: "Slow-Change Blues",
        explanation:
          "Unequal durations create a patient tonic field and a compact turnaround.",
        pattern: [
          dominant7(1),
          dominant7(4),
          dominant7(1),
          dominant7(5),
          dominant7(4),
          dominant7(1),
        ],
        form: "sequence",
        beats: [16, 8, 8, 4, 4, 8],
      },
    ],
    "pop-rock-loop": [
      {
        slug: "open-axis-pop",
        title: "Open Axis Pop",
        explanation:
          "An added-nine tonic opens the familiar dominant–relative-minor–subdominant loop.",
        pattern: [add9(1), major(5), minor(6), major(4)],
        reference: true,
      },
      {
        slug: "relative-first-anthem",
        title: "Relative-First Anthem",
        explanation:
          "Starting on vi makes the later tonic arrival feel earned without changing the key center.",
        pattern: [minorAdd9(6), major(4), major(1), major(5)],
        reference: true,
      },
      {
        slug: "suspended-rock-pendulum",
        title: "Suspended Rock Pendulum",
        explanation:
          "Suspended tonic and dominant shapes keep a simple I–V–IV–V loop ringing.",
        pattern: [sus2(1), sus4(5), major(4), major(5)],
        reference: true,
      },
      {
        slug: "pop-bass-walk",
        title: "Pop Bass Walk",
        explanation:
          "First-inversion tonic and dominant create a smooth upper-register bass walk.",
        pattern: [
          withBass(major(1), 3),
          major(5),
          minor(6),
          withBass(major(4), 6),
        ],
      },
      {
        slug: "add-nine-relative-loop",
        title: "Add-Nine Relative Loop",
        explanation:
          "Added ninths on I and vi soften the edges of a compact pop cycle.",
        pattern: [add9(1), minorAdd9(6), major(4), major(5)],
      },
      {
        slug: "sixth-chord-sunrise",
        title: "Sixth-Chord Sunrise",
        explanation:
          "A tonic sixth brightens the opening before vi and IV add contrast.",
        pattern: [major6(1), major(5), minor(6), major(4)],
      },
      {
        slug: "rock-four-one-five",
        title: "Rock Four One Five",
        explanation:
          "IV begins the phrase, tonic stabilizes it, and a suspended V turns it around.",
        pattern: [major(4), add9(1), sus4(5), major(5)],
      },
      {
        slug: "mediant-pop-glide",
        title: "Mediant Pop Glide",
        explanation:
          "iii connects tonic to vi with minimal motion before IV and V widen the loop.",
        pattern: [add9(1), minor7(3), minor7(6), major(4), major(5)],
      },
      {
        slug: "wide-pop-chorus",
        title: "Wide Pop Chorus",
        explanation:
          "Longer IV and I durations give a five-chord chorus room to breathe.",
        pattern: [major(1), major(5), minor(6), minor(2), major(4)],
        beats: [4, 4, 4, 2, 6],
      },
      {
        slug: "dominant-sus-release-loop",
        title: "Dominant-Sus Release Loop",
        explanation:
          "V suspended resolves inside the loop before vi diverts the expected tonic return.",
        pattern: [major(1), dominant7Sus4(5), major(5), minor(6), major(4)],
      },
      {
        slug: "inverted-pop-frame",
        title: "Inverted Pop Frame",
        explanation:
          "Chord-tone basses on I, V, and vi create a connected low line.",
        pattern: [
          withBass(major(1), 3),
          withBass(major(5), 7),
          withBass(minor(6), 1),
          major(4),
        ],
      },
      {
        slug: "rock-supertonic-drive",
        title: "Rock Supertonic Drive",
        explanation:
          "ii adds a brief lift between IV and the dominant in a guitar-friendly loop.",
        pattern: [major(1), major(4), minor7(2), dominant7(5)],
      },
      {
        slug: "relative-sixth-pop",
        title: "Relative Sixth Pop",
        explanation:
          "Minor-six color on vi adds warmth before IV, I, and V reset the cycle.",
        pattern: [minor6(6), major(4), add9(1), major(5)],
      },
      {
        slug: "double-suspension-chorus",
        title: "Double Suspension Chorus",
        explanation:
          "Suspensions on I and IV preserve open strings while the harmony remains direct.",
        pattern: [sus2(1), major(5), minor(6), sus2(4)],
      },
      {
        slug: "pop-plagal-tail",
        title: "Pop Plagal Tail",
        explanation:
          "A standard I–V–vi motion gains a longer IV–I plagal tail.",
        pattern: [add9(1), major(5), minor(6), major(4), major(1)],
        form: "sequence",
        beats: [4, 4, 4, 8, 4],
      },
    ],
    cadence: [
      {
        slug: "perfect-authentic-cadence",
        title: "Perfect Authentic Cadence",
        explanation:
          "Dominant seventh resolves to tonic with the strongest functional closure.",
        pattern: [dominant7(5), major(1)],
        reference: true,
      },
      {
        slug: "plain-plagal-cadence",
        title: "Plain Plagal Cadence",
        explanation:
          "Subdominant falls to tonic for a softer, hymn-like ending.",
        pattern: [major(4), major(1)],
        reference: true,
      },
      {
        slug: "deceptive-cadence",
        title: "Deceptive Cadence",
        explanation:
          "The dominant points home but lands on vi, keeping the phrase alive.",
        pattern: [dominant7(5), minor(6)],
        reference: true,
      },
      {
        slug: "predominant-authentic-cadence",
        title: "Predominant Authentic Cadence",
        explanation:
          "A fuller ii7 establishes predominant function before V7 closes on I.",
        pattern: [minor7(2), dominant7(5), major(1)],
      },
      {
        slug: "four-five-one-cadence",
        title: "Four Five One Cadence",
        explanation:
          "IV broadens the approach before dominant and tonic narrow the focus.",
        pattern: [major(4), dominant7(5), major(1)],
      },
      {
        slug: "leading-tone-cadence",
        title: "Leading-Tone Cadence",
        explanation:
          "The diminished leading-tone triad resolves directly into tonic.",
        pattern: [diminished(7), major(1)],
      },
      {
        slug: "cadential-six-four",
        title: "Cadential Six-Four",
        explanation:
          "A tonic chord over scale degree five intensifies the dominant arrival.",
        pattern: [withBass(major(1), 5), dominant7(5), major(1)],
      },
      {
        slug: "half-cadence",
        title: "Half Cadence",
        explanation:
          "Predominant motion stops on V, leaving the phrase deliberately unfinished.",
        pattern: [major(1), minor(2), dominant7(5)],
      },
      {
        slug: "plagal-authentic-combination",
        title: "Plagal-Authentic Combination",
        explanation: "A plagal touch precedes the stronger V7–I conclusion.",
        pattern: [major(4), major(1), dominant7(5), major(1)],
      },
      {
        slug: "minor-authentic-cadence",
        title: "Minor Authentic Cadence",
        explanation:
          "Harmonic-minor iv and V7 resolve with a clear raised leading tone.",
        pattern: [minor(4), dominant7(5), minor(1)],
        framework: "harmonic-minor",
        compatibleScales: ["harmonic-minor"],
      },
      {
        slug: "minor-plagal-cadence",
        title: "Minor Plagal Cadence",
        explanation: "Minor iv returns to i without dominant pressure.",
        pattern: [minor(4), minor(1)],
        framework: "minor",
        compatibleScales: ["minor"],
      },
      {
        slug: "phrygian-half-step-cadence",
        title: "Phrygian Half-Step Cadence",
        explanation:
          "Flat II descends by semitone into the Phrygian-dominant tonic.",
        pattern: [major(2, -1), major(1)],
        framework: "phrygian-dominant",
        compatibleScales: ["phrygian-dominant"],
      },
      {
        slug: "evaded-authentic-cadence",
        title: "Evaded Authentic Cadence",
        explanation:
          "V7 diverts to iii, postponing the expected tonic resolution.",
        pattern: [minor(2), dominant7(5), minor(3)],
      },
      {
        slug: "double-predominant-cadence",
        title: "Double Predominant Cadence",
        explanation: "IV and ii stack before the dominant-tonic close.",
        pattern: [major(4), minor(2), dominant7(5), major(1)],
      },
      {
        slug: "expanded-authentic-cadence",
        title: "Expanded Authentic Cadence",
        explanation: "Tonic launches a complete I–IV–ii–V7–I cadence.",
        pattern: [major(1), major(4), minor(2), dominant7(5), major(1)],
      },
    ],
    "circle-progression": [
      {
        slug: "circle-six-two-five-one",
        title: "Circle Six Two Five One",
        explanation: "Descending fifths carry vi through ii and V into tonic.",
        pattern: [minor7(6), minor7(2), dominant7(5), major7(1)],
        reference: true,
      },
      {
        slug: "circle-three-six-two-five-one",
        title: "Circle Three Six Two Five One",
        explanation:
          "Adding iii lengthens the descending-fifths chain without changing its destination.",
        pattern: [minor7(3), minor7(6), minor7(2), dominant7(5), major7(1)],
        reference: true,
      },
      {
        slug: "complete-diatonic-circle",
        title: "Complete Diatonic Circle",
        explanation:
          "Every diatonic root participates in an eight-event circle back to tonic.",
        pattern: [
          major7(1),
          major7(4),
          diminished(7),
          minor7(3),
          minor7(6),
          minor7(2),
          dominant7(5),
          major7(1),
        ],
        reference: true,
      },
      {
        slug: "circle-four-seven-three-six",
        title: "Circle Four Seven Three Six",
        explanation:
          "IV begins a four-link circle that lands on the relative minor.",
        pattern: [major7(4), halfDiminished7(7), minor7(3), minor7(6)],
      },
      {
        slug: "circle-seven-three-six-two",
        title: "Circle Seven Three Six Two",
        explanation:
          "Leading-tone harmony descends by fifths toward ii without closing.",
        pattern: [halfDiminished7(7), minor7(3), minor7(6), minor7(2)],
      },
      {
        slug: "circle-three-six-two-five",
        title: "Circle Three Six Two Five",
        explanation:
          "iii–vi–ii–V forms a complete turnaround that stops just before tonic.",
        pattern: [minor7(3), minor7(6), minor7(2), dominant7(5)],
      },
      {
        slug: "circle-one-four-seven-three",
        title: "Circle One Four Seven Three",
        explanation:
          "I–IV–vii–iii traces the first half of the diatonic circle.",
        pattern: [major7(1), major7(4), halfDiminished7(7), minor7(3)],
      },
      {
        slug: "circle-two-five-one-four",
        title: "Circle Two Five One Four",
        explanation:
          "A ii–V–I cadence continues onward to IV instead of stopping.",
        pattern: [minor7(2), dominant7(5), major7(1), major7(4)],
      },
      {
        slug: "circle-five-one-four-seven",
        title: "Circle Five One Four Seven",
        explanation:
          "Dominant resolution becomes the start of another fifths chain.",
        pattern: [dominant7(5), major7(1), major7(4), halfDiminished7(7)],
      },
      {
        slug: "minor-circle-six-two-five",
        title: "Minor Circle Six Two Five",
        explanation:
          "Flat VI, ii diminished, and V7 form a harmonic-minor circle into i.",
        pattern: [major7(6, -1), halfDiminished7(2), dominant7(5), minor(1)],
        framework: "harmonic-minor",
        compatibleScales: ["harmonic-minor"],
      },
      {
        slug: "circle-four-seven-three-six-two",
        title: "Circle Four Seven Three Six Two",
        explanation:
          "Five descending-fifths links create a long predominant approach.",
        pattern: [
          major7(4),
          halfDiminished7(7),
          minor7(3),
          minor7(6),
          minor7(2),
        ],
      },
      {
        slug: "circle-seven-three-six-two-five",
        title: "Circle Seven Three Six Two Five",
        explanation:
          "The leading-tone chord begins a chain that arrives on dominant.",
        pattern: [
          halfDiminished7(7),
          minor7(3),
          minor7(6),
          minor7(2),
          dominant7(5),
        ],
      },
      {
        slug: "circle-three-six-two-five-one-four",
        title: "Circle Three Six Two Five One Four",
        explanation:
          "A full cadence keeps moving through IV for an extended circular phrase.",
        pattern: [
          minor7(3),
          minor7(6),
          minor7(2),
          dominant7(5),
          major7(1),
          major7(4),
        ],
      },
      {
        slug: "circle-six-two-five-one-four-seven",
        title: "Circle Six Two Five One Four Seven",
        explanation:
          "The familiar turnaround flows onward through IV to vii half-diminished.",
        pattern: [
          minor7(6),
          minor7(2),
          dominant7(5),
          major7(1),
          major7(4),
          halfDiminished7(7),
        ],
      },
      {
        slug: "circle-two-five-one-four-seven-three",
        title: "Circle Two Five One Four Seven Three",
        explanation:
          "Cadential motion continues around the circle until iii becomes the new resting point.",
        pattern: [
          minor7(2),
          dominant7(5),
          major7(1),
          major7(4),
          halfDiminished7(7),
          minor7(3),
        ],
      },
    ],
    "jazz-turnaround": [
      {
        slug: "one-six-two-five-turnaround",
        title: "One Six Two Five Turnaround",
        explanation:
          "V7 of ii turns Imaj7 into a compact chromatic turnaround.",
        pattern: [
          major7(1),
          appliedDominant(2, "lower"),
          minor7(2),
          dominant7(5),
        ],
        reference: true,
      },
      {
        slug: "three-six-two-five-turnaround",
        title: "Three Six Two Five Turnaround",
        explanation:
          "iii7 begins a classic chain through V7 of ii, ii7, and V7.",
        pattern: [
          minor7(3),
          appliedDominant(2, "lower"),
          minor7(2),
          dominant7(5),
        ],
        reference: true,
      },
      {
        slug: "rhythm-chain",
        title: "Rhythm Chain",
        explanation:
          "Successive dominants tonicize vi and ii before the final ii–V–I.",
        pattern: [
          major7(1),
          appliedDominant(6, "lower"),
          minor7(6),
          appliedDominant(2, "lower"),
          minor7(2),
          dominant7(5),
          major7(1),
        ],
        reference: true,
      },
      {
        slug: "one-three-six-two-five",
        title: "One Three Six Two Five",
        explanation:
          "Imaj7 moves through iii7 and a tonicized ii before dominant.",
        pattern: [
          major7(1),
          minor7(3),
          appliedDominant(2, "lower"),
          minor7(2),
          dominant7(5),
        ],
      },
      {
        slug: "secondary-three-six",
        title: "Secondary Three Six",
        explanation:
          "V7 of vi brightens iii–vi motion inside a longer turnaround.",
        pattern: [
          major7(1),
          minor7(3),
          appliedDominant(6, "lower"),
          minor7(6),
          minor7(2),
          dominant7(5),
        ],
      },
      {
        slug: "backcycling-dominants",
        title: "Backcycling Dominants",
        explanation:
          "V7 of iii and V7 of vi create a chain of applied dominant releases.",
        pattern: [
          major7(1),
          appliedDominant(3, "lower"),
          minor7(3),
          appliedDominant(6, "lower"),
          minor7(6),
          minor7(2),
          dominant7(5),
        ],
      },
      {
        slug: "turnaround-to-four",
        title: "Turnaround to Four",
        explanation: "A tonic dominant points to IV before ii–V returns home.",
        pattern: [
          major7(1),
          appliedDominant(4),
          major7(4),
          minor7(2),
          dominant7(5),
          major7(1),
        ],
      },
      {
        slug: "two-five-of-two",
        title: "Two Five of Two",
        explanation:
          "A borrowed dominant targets ii and then joins the home-key ii–V–I.",
        pattern: [
          major7(1),
          appliedDominant(2, "lower"),
          minor7(2),
          dominant7(5),
          major7(1),
        ],
      },
      {
        slug: "dominant-ladder",
        title: "Dominant Ladder",
        explanation:
          "Applied dominants of vi, ii, and V create a three-rung harmonic ladder.",
        pattern: [
          appliedDominant(6, "lower"),
          minor7(6),
          appliedDominant(2, "lower"),
          minor7(2),
          appliedDominant(5),
          dominant7(5),
          major7(1),
        ],
      },
      {
        slug: "short-rhythm-turnaround",
        title: "Short Rhythm Turnaround",
        explanation:
          "Imaj7, V7 of ii, and ii7 compress the turnaround before V7.",
        pattern: [
          major7(1),
          appliedDominant(2, "lower"),
          minor7(2),
          dominant7(5),
          major7(1),
        ],
        beats: [4, 2, 2, 4, 4],
      },
      {
        slug: "major-six-turnaround",
        title: "Major-Six Turnaround",
        explanation:
          "I6 provides a warm tonic surface before the applied-dominant chain.",
        pattern: [
          major6(1),
          appliedDominant(6, "lower"),
          minor7(6),
          appliedDominant(2, "lower"),
          minor7(2),
          dominant7(5),
        ],
      },
      {
        slug: "suspended-dominant-turnaround",
        title: "Suspended-Dominant Turnaround",
        explanation:
          "A suspended applied dominant releases into ii before V7–I.",
        pattern: [
          major7(1),
          appliedDominant(2, "lower", "dominant7sus4"),
          minor7(2),
          dominant7(5),
          major7(1),
        ],
      },
      {
        slug: "three-six-chain-to-one",
        title: "Three-Six Chain to One",
        explanation: "Tonicized iii and vi lengthen the route into ii–V–I.",
        pattern: [
          appliedDominant(3, "lower"),
          minor7(3),
          appliedDominant(6, "lower"),
          minor7(6),
          minor7(2),
          dominant7(5),
          major7(1),
        ],
      },
      {
        slug: "four-backcycle-turnaround",
        title: "Four Backcycle Turnaround",
        explanation:
          "IVmaj7 begins a descending-fifths chain colored by V7 of vi.",
        pattern: [
          major7(4),
          halfDiminished7(7),
          minor7(3),
          appliedDominant(6, "lower"),
          minor7(6),
          minor7(2),
          dominant7(5),
        ],
      },
      {
        slug: "eight-event-jazz-circle",
        title: "Eight-Event Jazz Circle",
        explanation:
          "A complete circle uses two applied dominants to keep every arrival active.",
        pattern: [
          major7(1),
          major7(4),
          appliedDominant(3, "lower"),
          minor7(3),
          appliedDominant(6, "lower"),
          minor7(6),
          minor7(2),
          dominant7(5),
        ],
      },
    ],
    modal: [
      {
        slug: "dorian-one-four",
        title: "Dorian One Four",
        explanation:
          "Major IV against minor i foregrounds the raised sixth of Dorian color.",
        pattern: [minor(1), major(4, 0, "modal-interchange")],
        reference: true,
      },
      {
        slug: "mixolydian-flat-seven",
        title: "Mixolydian Flat Seven",
        explanation:
          "Flat VII and IV orbit a major tonic without leading-tone pressure.",
        pattern: [major(1), major(7, -1, "modal-interchange"), major(4)],
        framework: "major",
        compatibleScales: ["major"],
        reference: true,
      },
      {
        slug: "phrygian-one-flat-two",
        title: "Phrygian One Flat Two",
        explanation:
          "Minor tonic and major flat II create the essential Phrygian semitone.",
        pattern: [minor(1), major(2, -1, "modal-interchange")],
        reference: true,
      },
      {
        slug: "dorian-flat-seven-four",
        title: "Dorian Flat-Seven Four",
        explanation:
          "Flat VII expands a Dorian i–IV vamp into a three-chord loop.",
        pattern: [minor(1), major(7, -1), major(4, 0, "modal-interchange")],
      },
      {
        slug: "mixolydian-four-flat-seven",
        title: "Mixolydian Four Flat Seven",
        explanation:
          "IV and flat VII answer tonic with two broad major sonorities.",
        pattern: [major(1), major(4), major(7, -1, "modal-interchange")],
        framework: "major",
        compatibleScales: ["major"],
      },
      {
        slug: "phrygian-flat-two-flat-seven",
        title: "Phrygian Flat-Two Flat-Seven",
        explanation:
          "Flat II and flat VII pull in opposite directions around minor tonic.",
        pattern: [minor(1), major(2, -1, "modal-interchange"), major(7, -1)],
      },
      {
        slug: "dorian-minor-seven-vamp",
        title: "Dorian Minor-Seven Vamp",
        explanation:
          "Minor-seven tonic and major IV keep the vamp open and spacious.",
        pattern: [minor7(1), major7(4, 0, "modal-interchange")],
      },
      {
        slug: "mixolydian-sus-loop",
        title: "Mixolydian Sus Loop",
        explanation:
          "Suspended tonic and flat VII avoid a strong third-based cadence.",
        pattern: [sus4(1), major(7, -1, "modal-interchange"), major(4)],
        framework: "major",
        compatibleScales: ["major"],
      },
      {
        slug: "phrygian-plagal-vamp",
        title: "Phrygian Plagal Vamp",
        explanation:
          "Minor iv adds an inward plagal gesture to the i–flat-II field.",
        pattern: [minor(1), major(2, -1, "modal-interchange"), minor(4)],
      },
      {
        slug: "dorian-sixth-color",
        title: "Dorian Sixth Color",
        explanation:
          "Minor sixth tonic color and major IV emphasize the mode's characteristic sixth.",
        pattern: [minor6(1), major(4, 0, "modal-interchange"), minor(1)],
      },
      {
        slug: "mixolydian-dominant-tonic",
        title: "Mixolydian Dominant Tonic",
        explanation:
          "A dominant-seventh tonic treats flat VII as stable modal color.",
        pattern: [dominant7(1), major(7, -1, "modal-interchange"), major(4)],
        framework: "major",
        compatibleScales: ["major"],
      },
      {
        slug: "phrygian-suspended-neighbor",
        title: "Phrygian Suspended Neighbor",
        explanation:
          "A suspended minor-center gesture leaves room for flat II to define the mode.",
        pattern: [sus4(1), major(2, -1, "modal-interchange"), minor(1)],
      },
      {
        slug: "dorian-four-flat-three",
        title: "Dorian Four Flat Three",
        explanation:
          "Major IV and flat III frame a modal minor tonic without a dominant.",
        pattern: [minor(1), major(4, 0, "modal-interchange"), major(3, -1)],
      },
      {
        slug: "mixolydian-pedal-arc",
        title: "Mixolydian Pedal Arc",
        explanation:
          "Repeated tonic placements frame IV and flat VII as equal modal neighbors.",
        pattern: [
          major(1),
          major(4),
          major(1),
          major(7, -1, "modal-interchange"),
          major(1),
        ],
        framework: "major",
        compatibleScales: ["major"],
        form: "sequence",
      },
      {
        slug: "phrygian-four-chord-field",
        title: "Phrygian Four-Chord Field",
        explanation:
          "Flat II, flat VII, and iv create a broad field around minor tonic.",
        pattern: [
          minor(1),
          major(2, -1, "modal-interchange"),
          major(7, -1),
          minor(4),
        ],
      },
    ],
    "borrowed-chord": [
      {
        slug: "major-minor-plagal-shade",
        title: "Major-Minor Plagal Shade",
        explanation:
          "Major IV turns minor before tonic, letting one altered scale tone soften the close.",
        pattern: [major(1), major(4), minor(4, 0, "borrowed"), major(1)],
        reference: true,
      },
      {
        slug: "flat-seven-rock-return",
        title: "Flat-Seven Rock Return",
        explanation:
          "Borrowed flat VII opens a broad route through IV back to tonic.",
        pattern: [major(1), major(7, -1, "borrowed"), major(4), major(1)],
        reference: true,
      },
      {
        slug: "flat-six-flat-seven-rise",
        title: "Flat-Six Flat-Seven Rise",
        explanation:
          "Two parallel borrowed majors rise stepwise into a bright tonic arrival.",
        pattern: [
          major(1),
          major(6, -1, "borrowed"),
          major(7, -1, "borrowed"),
          major(1),
        ],
        reference: true,
      },
      {
        slug: "flat-three-subdominant-window",
        title: "Flat-Three Subdominant Window",
        explanation:
          "Flat III briefly darkens the key before IV restores diatonic direction.",
        pattern: [major(1), major(3, -1, "borrowed"), major(4), major(1)],
      },
      {
        slug: "borrowed-four-authentic-close",
        title: "Borrowed Four Authentic Close",
        explanation:
          "Minor iv adds a bittersweet predominant color before the ordinary V-I cadence.",
        pattern: [major(1), minor(4, 0, "borrowed"), dominant7(5), major(1)],
      },
      {
        slug: "flat-six-predominant-sweep",
        title: "Flat-Six Predominant Sweep",
        explanation:
          "Flat VI drops into IV, then V gathers the borrowed color into a clear cadence.",
        pattern: [major(1), major(6, -1, "borrowed"), major(4), dominant7(5)],
      },
      {
        slug: "flat-seven-backdoor-pair",
        title: "Flat-Seven Backdoor Pair",
        explanation:
          "A single borrowed flat-VII chord creates a direct, non-leading-tone return to tonic.",
        pattern: [major(1), major(7, -1, "borrowed"), major(1)],
      },
      {
        slug: "subdominant-minor-fold",
        title: "Subdominant-Minor Fold",
        explanation:
          "IV contracts to iv before resolving, exposing modal mixture in its simplest voice-led form.",
        pattern: [major(4), minor(4, 0, "borrowed"), major(1)],
      },
      {
        slug: "flat-three-seven-four",
        title: "Flat-Three Seven Four",
        explanation:
          "Flat III and flat VII form a borrowed plateau that releases through IV.",
        pattern: [
          major(1),
          major(3, -1, "borrowed"),
          major(7, -1, "borrowed"),
          major(4),
        ],
      },
      {
        slug: "flat-six-third-seven",
        title: "Flat-Six Third Seven",
        explanation:
          "Three borrowed major regions descend by varied intervals without erasing the tonic center.",
        pattern: [
          major(1),
          major(6, -1, "borrowed"),
          major(3, -1, "borrowed"),
          major(7, -1, "borrowed"),
        ],
      },
      {
        slug: "minor-four-backdoor",
        title: "Minor Four Backdoor",
        explanation:
          "Minor iv and flat VII combine two borrowed colors before tonic returns.",
        pattern: [
          major(1),
          minor(4, 0, "borrowed"),
          major(7, -1, "borrowed"),
          major(1),
        ],
      },
      {
        slug: "flat-six-minor-four",
        title: "Flat-Six Minor Four",
        explanation:
          "Flat VI falls to iv, concentrating two modal-mixture colors around tonic.",
        pattern: [
          major(1),
          major(6, -1, "borrowed"),
          minor(4, 0, "borrowed"),
          major(1),
        ],
      },
      {
        slug: "relative-minor-flat-six",
        title: "Relative Minor Flat Six",
        explanation:
          "The relative minor yields to borrowed flat VI before IV and V rebuild major-key motion.",
        pattern: [minor(6), major(6, -1, "borrowed"), major(4), dominant7(5)],
      },
      {
        slug: "flat-seven-minor-four",
        title: "Flat-Seven Minor Four",
        explanation:
          "Flat VII expands outward while minor iv pulls inward, making tonic feel inevitable.",
        pattern: [
          major(1),
          major(7, -1, "borrowed"),
          minor(4, 0, "borrowed"),
          major(1),
        ],
      },
      {
        slug: "borrowed-color-arch",
        title: "Borrowed Color Arch",
        explanation:
          "Flat III, flat VI, and minor iv form a long chromatic-color arch into V and I.",
        pattern: [
          major(1),
          major(3, -1, "borrowed"),
          major(6, -1, "borrowed"),
          minor(4, 0, "borrowed"),
          dominant7(5),
          major(1),
        ],
      },
    ],
    "secondary-dominant": [
      {
        slug: "five-of-five-cadence",
        title: "Five of Five Cadence",
        explanation:
          "V7 of V intensifies the home dominant before both tensions resolve in order.",
        pattern: [major(1), appliedDominant(5), dominant7(5), major(1)],
        reference: true,
      },
      {
        slug: "five-of-two-cadence",
        title: "Five of Two Cadence",
        explanation:
          "An applied dominant spotlights ii before the home dominant completes the cadence.",
        pattern: [
          major(1),
          appliedDominant(2, "lower"),
          minor(2),
          dominant7(5),
          major(1),
        ],
        reference: true,
      },
      {
        slug: "five-of-six-release",
        title: "Five of Six Release",
        explanation:
          "V7 of vi briefly makes the relative minor sound like a destination before IV and V move on.",
        pattern: [
          major(1),
          appliedDominant(6, "lower"),
          minor(6),
          major(4),
          dominant7(5),
        ],
        reference: true,
      },
      {
        slug: "five-of-four-plagal",
        title: "Five of Four Plagal",
        explanation:
          "A tonic-seventh sonority tonicizes IV, which then returns plagal-style to I.",
        pattern: [major(1), appliedDominant(4), major(4), major(1)],
      },
      {
        slug: "mediant-to-six",
        title: "Mediant to Six",
        explanation:
          "iii gives way to V7 of vi, clarifying the relative-minor arrival.",
        pattern: [minor(3), appliedDominant(6, "lower"), minor(6)],
      },
      {
        slug: "five-of-three-chain",
        title: "Five of Three Chain",
        explanation:
          "V7 of iii starts a short tonicization that continues naturally toward vi.",
        pattern: [major(1), appliedDominant(3, "lower"), minor(3), minor(6)],
      },
      {
        slug: "two-five-of-five",
        title: "Two Five of Five",
        explanation:
          "Home-key ii precedes V7 of V, extending predominant pressure into the dominant.",
        pattern: [minor(2), appliedDominant(5), dominant7(5), major(1)],
      },
      {
        slug: "double-applied-cadence",
        title: "Double Applied Cadence",
        explanation:
          "Applied dominants of IV and V articulate two local goals before tonic.",
        pattern: [
          major(1),
          appliedDominant(4),
          major(4),
          appliedDominant(5),
          dominant7(5),
          major(1),
        ],
      },
      {
        slug: "applied-two-five-chain",
        title: "Applied Two-Five Chain",
        explanation:
          "V7 of ii and V7 of V create a linked sequence of temporary attractions.",
        pattern: [
          appliedDominant(2, "lower"),
          minor(2),
          appliedDominant(5),
          dominant7(5),
          major(1),
        ],
      },
      {
        slug: "six-to-two-tonicizations",
        title: "Six to Two Tonicizations",
        explanation:
          "The relative minor and supertonic each receive their own applied dominant.",
        pattern: [
          major(1),
          appliedDominant(6, "lower"),
          minor(6),
          appliedDominant(2, "lower"),
          minor(2),
          dominant7(5),
        ],
      },
      {
        slug: "three-six-tonicization-chain",
        title: "Three-Six Tonicization Chain",
        explanation:
          "Successive applied dominants make iii and vi momentary centers without modulating.",
        pattern: [
          appliedDominant(3, "lower"),
          minor(3),
          appliedDominant(6, "lower"),
          minor(6),
          major(4),
          dominant7(5),
        ],
      },
      {
        slug: "suspended-five-of-five",
        title: "Suspended Five of Five",
        explanation:
          "A suspended applied dominant delays its third before the home dominant arrives.",
        pattern: [
          major(1),
          appliedDominant(5, "upper", "dominant7sus4"),
          dominant7(5),
          major(1),
        ],
      },
      {
        slug: "major-five-of-two",
        title: "Major Five of Two",
        explanation:
          "A triadic V of ii offers a lighter tonicization than its dominant-seventh counterpart.",
        pattern: [
          major(1),
          appliedDominant(2, "lower", "major"),
          minor(2),
          dominant7(5),
        ],
      },
      {
        slug: "five-of-three-five-of-six",
        title: "Five of Three, Five of Six",
        explanation:
          "Two applied dominants illuminate the diatonic iii-vi link in stages.",
        pattern: [
          major(1),
          appliedDominant(3, "lower"),
          minor(3),
          appliedDominant(6, "lower"),
          minor(6),
        ],
      },
      {
        slug: "full-applied-dominant-arc",
        title: "Full Applied-Dominant Arc",
        explanation:
          "Four tonicizations trace a long functional path through iii, vi, ii, and V.",
        pattern: [
          appliedDominant(3, "lower"),
          minor(3),
          appliedDominant(6, "lower"),
          minor(6),
          appliedDominant(2, "lower"),
          minor(2),
          appliedDominant(5),
          dominant7(5),
        ],
      },
    ],
    "chromatic-mediant": [
      {
        slug: "tonic-major-three",
        title: "Tonic to Major Three",
        explanation:
          "A chromatic major III shares one tone with tonic while changing the surrounding color abruptly.",
        pattern: [major(1), major(3, 0, "chromatic"), major(1)],
      },
      {
        slug: "tonic-flat-three",
        title: "Tonic to Flat Three",
        explanation:
          "Flat III creates a cinematic mediant shift before tonic restores the original key.",
        pattern: [major(1), major(3, -1, "chromatic"), major(1)],
      },
      {
        slug: "major-six-subdominant",
        title: "Major Six to Subdominant",
        explanation:
          "Chromatic major VI opens a bright remote region that resolves through IV.",
        pattern: [major(1), major(6, 0, "chromatic"), major(4), major(1)],
      },
      {
        slug: "flat-six-subdominant",
        title: "Flat Six to Subdominant",
        explanation:
          "Flat VI darkens the tonic field and then shares motion into IV.",
        pattern: [major(1), major(6, -1, "chromatic"), major(4), major(1)],
      },
      {
        slug: "major-three-flat-six",
        title: "Major Three Flat Six",
        explanation:
          "Two remote major chords create a symmetrical-feeling color path around tonic.",
        pattern: [
          major(1),
          major(3, 0, "chromatic"),
          major(6, -1, "chromatic"),
          major(1),
        ],
      },
      {
        slug: "flat-three-flat-six",
        title: "Flat Three Flat Six",
        explanation:
          "Flat III and flat VI form a dark parallel-major chain back to I.",
        pattern: [
          major(1),
          major(3, -1, "chromatic"),
          major(6, -1, "chromatic"),
          major(1),
        ],
      },
      {
        slug: "major-six-flat-three-drive",
        title: "Major Six Flat-Three Drive",
        explanation:
          "Major VI leaps to flat III before IV reconnects the phrase to the key.",
        pattern: [
          major(1),
          major(6, 0, "chromatic"),
          major(3, -1, "chromatic"),
          major(4),
        ],
      },
      {
        slug: "major-three-flat-six-subdominant",
        title: "Major Three Flat-Six Subdominant",
        explanation:
          "Major III and flat VI form two chromatic stations on the way to IV.",
        pattern: [
          major(3, 0, "chromatic"),
          major(1),
          major(6, -1, "chromatic"),
          major(4),
        ],
      },
      {
        slug: "flat-six-major-three-return",
        title: "Flat-Six Major-Three Return",
        explanation:
          "Flat VI and major III approach tonic from contrasting chromatic directions.",
        pattern: [
          major(1),
          major(6, -1, "chromatic"),
          major(3, 0, "chromatic"),
          major(1),
        ],
      },
      {
        slug: "major-six-flat-six-slide",
        title: "Major-Six Flat-Six Slide",
        explanation:
          "Parallel major chords on VI and flat VI create a semitone color slide into tonic.",
        pattern: [
          major(1),
          major(6, 0, "chromatic"),
          major(6, -1, "chromatic"),
          major(1),
        ],
      },
      {
        slug: "major-three-major-six-chain",
        title: "Major-Three Major-Six Chain",
        explanation:
          "Major III and major VI extend the tonic by ascending chromatic-mediant relations.",
        pattern: [
          major(1),
          major(3, 0, "chromatic"),
          major(6, 0, "chromatic"),
          major(4),
        ],
      },
      {
        slug: "flat-three-major-six",
        title: "Flat-Three Major Six",
        explanation:
          "Flat III and major VI create a wide chromatic arc before tonic returns.",
        pattern: [
          major(1),
          major(3, -1, "chromatic"),
          major(6, 0, "chromatic"),
          major(1),
        ],
      },
      {
        slug: "major-seven-three-flat-six",
        title: "Major-Seven Three Flat Six",
        explanation:
          "A lush tonic major seventh frames bold major-III and flat-VI regions.",
        pattern: [
          major7(1),
          major(3, 0, "chromatic"),
          major(6, -1, "chromatic"),
          major7(1),
        ],
      },
      {
        slug: "flat-six-major-seven-color",
        title: "Flat-Six Major-Seven Color",
        explanation:
          "Major seventh on flat VI heightens the distance before IV restores familiar ground.",
        pattern: [major(1), major7(6, -1, "chromatic"), major(4), major(1)],
      },
      {
        slug: "extended-mediant-panorama",
        title: "Extended Mediant Panorama",
        explanation:
          "Major III and flat VI recur inside a six-event panorama anchored by tonic and IV.",
        pattern: [
          major(1),
          major(3, 0, "chromatic"),
          major(1),
          major(6, -1, "chromatic"),
          major(4),
          major(1),
        ],
      },
    ],
    "gospel-rnb": [
      {
        slug: "warm-one-six-two-five",
        title: "Warm One Six Two Five",
        explanation:
          "Major-seven tonic and minor sevenths turn a functional turnaround into a smooth harmonic bed.",
        pattern: [major7(1), minor7(6), minor7(2), dominant7(5)],
      },
      {
        slug: "gospel-minor-plagal",
        title: "Gospel Minor Plagal",
        explanation:
          "IV major turns to borrowed iv before a warm tonic resolution.",
        pattern: [major7(4), minor(4, 0, "borrowed"), major7(1)],
      },
      {
        slug: "first-inversion-amen",
        title: "First-Inversion Amen",
        explanation:
          "A rising tonic bass connects I6 to IV before minor iv folds home.",
        pattern: [
          major6(1),
          withBass(major(1), 3),
          major7(4),
          minor(4, 0, "borrowed"),
          major(1),
        ],
      },
      {
        slug: "extended-three-six-two-five",
        title: "Extended Three Six Two Five",
        explanation:
          "iii7 and vi7 lengthen the familiar ii-V approach with gentle descending-fifths motion.",
        pattern: [major7(1), minor7(3), minor7(6), minor7(2), dominant7(5)],
      },
      {
        slug: "add-nine-pop-soul",
        title: "Add-Nine Pop Soul",
        explanation:
          "Added-nine tonic and inverted dominant support a smooth path through vi7 and IVmaj7.",
        pattern: [add9(1), withBass(major(5), 7), minor7(6), major7(4)],
      },
      {
        slug: "backdoor-major-seven",
        title: "Backdoor Major Seven",
        explanation:
          "Borrowed flat VII approaches IVmaj7 before the tonic major seventh settles.",
        pattern: [major7(1), major(7, -1, "borrowed"), major7(4), major7(1)],
      },
      {
        slug: "relative-minor-two-five",
        title: "Relative-Minor Two Five",
        explanation:
          "vi7 begins a descending-fifths chain through ii7 and V7 into Imaj7.",
        pattern: [minor7(6), minor7(2), dominant7(5), major7(1)],
        beats: [2, 2, 4, 8],
      },
      {
        slug: "open-four-two-five",
        title: "Open Four Two Five",
        explanation:
          "IVmaj7 broadens the tonic field before ii7 and V7 restore functional momentum.",
        pattern: [major7(1), major7(4), minor7(2), dominant7(5)],
      },
      {
        slug: "sixth-tone-turnaround",
        title: "Sixth-Tone Turnaround",
        explanation: "I6 lends vintage warmth to the vi7-ii7-V7 cycle.",
        pattern: [major6(1), minor7(6), minor7(2), dominant7(5)],
      },
      {
        slug: "descending-bass-gospel-close",
        title: "Descending-Bass Gospel Close",
        explanation:
          "IVmaj7 moves through first-inversion tonic before ii7-V7-I completes the descent.",
        pattern: [
          major7(4),
          withBass(major(1), 3),
          minor7(2),
          dominant7(5),
          major7(1),
        ],
      },
      {
        slug: "added-nine-minor-plagal",
        title: "Added-Nine Minor Plagal",
        explanation:
          "Iadd9 opens into IV6, then borrowed iv supplies the emotional turn home.",
        pattern: [add9(1), major6(4), minor(4, 0, "borrowed"), major(1)],
      },
      {
        slug: "three-four-minor-four",
        title: "Three Four Minor Four",
        explanation:
          "iii7 passes into IVmaj7 and borrowed iv for a tightly voiced chromatic descent.",
        pattern: [
          major7(1),
          minor7(3),
          major7(4),
          minor(4, 0, "borrowed"),
          major(1),
        ],
      },
      {
        slug: "relative-plagal-bass-line",
        title: "Relative Plagal Bass Line",
        explanation:
          "vi7 and IVmaj7 frame first-inversion tonic before V7 turns the phrase around.",
        pattern: [minor7(6), major7(4), withBass(major(1), 3), dominant7(5)],
      },
      {
        slug: "subdominant-six-gospel",
        title: "Subdominant-Six Gospel",
        explanation:
          "IV6 and ii7 share predominant warmth before V7 and Imaj7 resolve.",
        pattern: [major7(1), major6(4), minor7(2), dominant7(5), major7(1)],
      },
      {
        slug: "long-form-soul-cadence",
        title: "Long-Form Soul Cadence",
        explanation:
          "A seven-event route joins relative-minor motion, plagal color, and a final ii-V-I.",
        pattern: [
          major7(1),
          minor7(6),
          major7(4),
          minor(4, 0, "borrowed"),
          minor7(2),
          dominant7(5),
          major7(1),
        ],
      },
    ],
    cinematic: [
      {
        slug: "minor-epic-descent",
        title: "Minor Epic Descent",
        explanation:
          "Minor tonic descends through flat VI, flat III, and flat VII for a broad unresolved loop.",
        pattern: [minorAdd9(1), major(6, -1), major(3, -1), major(7, -1)],
      },
      {
        slug: "minor-third-six-dominant",
        title: "Minor Third-Six Dominant",
        explanation:
          "Flat III and flat VI widen the scene before a chromatic major V pulls back to minor.",
        pattern: [
          minor(1),
          major(3, -1),
          major(6, -1),
          major(5, 0, "chromatic"),
          minor(1),
        ],
      },
      {
        slug: "descending-threat-cadence",
        title: "Descending Threat Cadence",
        explanation:
          "Flat VII and flat VI descend toward a major dominant that sharpens the final tension.",
        pattern: [
          minor(1),
          major(7, -1),
          major(6, -1),
          major(5, 0, "chromatic"),
          minor(1),
        ],
      },
      {
        slug: "minor-plagal-score-cadence",
        title: "Minor Plagal Score Cadence",
        explanation:
          "Minor iv and flat VI expand into a chromatic dominant for a dramatic close.",
        pattern: [
          minor(1),
          minor(4),
          major(6, -1),
          major(5, 0, "chromatic"),
          minor(1),
        ],
      },
      {
        slug: "flat-six-minor-four-dominant",
        title: "Flat-Six Minor-Four Dominant",
        explanation:
          "Flat VI falls to iv before the major dominant compresses the phrase into tonic.",
        pattern: [
          minor(1),
          major(6, -1),
          minor(4),
          major(5, 0, "chromatic"),
          minor(1),
        ],
      },
      {
        slug: "relative-major-heroic-return",
        title: "Relative-Major Heroic Return",
        explanation:
          "Flat III provides a bright plateau before iv and the chromatic dominant reclaim minor.",
        pattern: [
          minor(1),
          major(3, -1),
          minor(4),
          major(5, 0, "chromatic"),
          minor(1),
        ],
      },
      {
        slug: "neapolitan-shadow",
        title: "Neapolitan Shadow",
        explanation:
          "Flat II presses against the minor tonic and then yields to a major dominant.",
        pattern: [
          minor(1),
          major(2, -1, "chromatic"),
          major(5, 0, "chromatic"),
          minor(1),
        ],
      },
      {
        slug: "flat-six-neapolitan-gate",
        title: "Flat-Six Neapolitan Gate",
        explanation:
          "Flat VI opens onto flat II before the major dominant forces a narrow return.",
        pattern: [
          minor(1),
          major(6, -1),
          major(2, -1, "chromatic"),
          major(5, 0, "chromatic"),
          minor(1),
        ],
      },
      {
        slug: "chromatic-major-mediant-score",
        title: "Chromatic Major-Mediant Score",
        explanation:
          "A chromatic major III interrupts the minor center before flat VI and V restore direction.",
        pattern: [
          minor(1),
          major(3, 0, "chromatic"),
          major(6, -1),
          major(5, 0, "chromatic"),
          minor(1),
        ],
      },
      {
        slug: "minor-major-six-panorama",
        title: "Minor Major-Six Panorama",
        explanation:
          "Chromatic major VI creates a sudden horizon shift before flat VI slides toward the dominant.",
        pattern: [
          minor(1),
          major(6, 0, "chromatic"),
          major(6, -1),
          major(5, 0, "chromatic"),
          minor(1),
        ],
      },
      {
        slug: "suspended-dominant-score",
        title: "Suspended-Dominant Score",
        explanation:
          "A dominant suspension stretches the final arrival after flat III and flat VI.",
        pattern: [
          minorAdd9(1),
          major(3, -1),
          major(6, -1),
          dominant7Sus4(5),
          major(5, 0, "chromatic"),
          minor(1),
        ],
      },
      {
        slug: "minor-sixth-lament",
        title: "Minor-Sixth Lament",
        explanation:
          "Minor-six tonic color leads through iv and flat VI into a stark major dominant.",
        pattern: [
          minor6(1),
          minor(4),
          major(6, -1),
          major(5, 0, "chromatic"),
          minor(1),
        ],
      },
      {
        slug: "cinematic-pedal-arc",
        title: "Cinematic Pedal Arc",
        explanation:
          "Repeated tonic arrivals frame flat II and flat VI as contrasting threats.",
        pattern: [
          minor(1),
          major(2, -1, "chromatic"),
          minor(1),
          major(6, -1),
          minor(1),
          major(5, 0, "chromatic"),
          minor(1),
        ],
      },
      {
        slug: "augmented-tonic-reveal",
        title: "Augmented-Tonic Reveal",
        explanation:
          "An augmented tonic destabilizes the opening before flat VI and V define the minor goal.",
        pattern: [
          augmented(1, 0, "chromatic"),
          minor(1),
          major(6, -1),
          major(5, 0, "chromatic"),
          minor(1),
        ],
      },
      {
        slug: "eight-event-score-journey",
        title: "Eight-Event Score Journey",
        explanation:
          "A full eight-event arc visits relative major, flat VII, flat VI, iv, flat II, and V before returning.",
        pattern: [
          minor(1),
          major(3, -1),
          major(7, -1),
          major(6, -1),
          minor(4),
          major(2, -1, "chromatic"),
          major(5, 0, "chromatic"),
          minor(1),
        ],
      },
    ],
  } as const;

const buildTemplate = (
  category: ProgressionCategory,
  seed: CatalogSeed,
): ProgressionTemplate => {
  const profile = categoryProfiles[category];
  const beats = seed.beats ?? seed.pattern.map(() => 4);

  if (beats.length !== seed.pattern.length) {
    throw new Error(`${seed.slug} has mismatched chord and duration counts`);
  }

  return {
    category,
    compatibleScales: seed.compatibleScales ?? profile.compatibleScales,
    ...((seed.difficulty ?? profile.difficulty)
      ? { difficulty: seed.difficulty ?? profile.difficulty }
      : {}),
    explanation: seed.explanation,
    form: seed.form ?? profile.form,
    harmonicDevices: profile.harmonicDevices,
    id: `progression-${seed.slug}`,
    meter: { beatUnit: 4, beatsPerBar: 4 },
    moodTags: seed.moodTags ?? profile.moodTags,
    reviewStatus: "verified",
    slug: seed.slug,
    sourceReferenceIds:
      seed.reference && openMusicTheoryReferenceCategories.has(category)
        ? [editorialSource, openMusicTheorySource]
        : [editorialSource],
    steps: seed.pattern.map((chordSpec, index) => ({
      chord: chordSpec,
      durationBeats: beats[index],
      id: `${seed.slug}-step-${index + 1}`,
    })),
    styleTags: seed.styleTags ?? profile.styleTags,
    title: seed.title,
    tonalFramework: seed.framework ?? profile.framework,
  };
};

const canonicalSeeds = progressionCategories.flatMap((category) =>
  categorySeedGroups[category].slice(0, 3).map((seed) => ({ category, seed })),
);
const reviewedBatchSeeds = progressionCategories.flatMap((category) =>
  categorySeedGroups[category].slice(3).map((seed) => ({ category, seed })),
);

export const progressionCatalog: readonly ProgressionTemplate[] = [
  ...canonicalSeeds,
  ...reviewedBatchSeeds,
].map(({ category, seed }) => buildTemplate(category, seed));

export const progressionCatalogValidation =
  assertValidProgressionCatalog(progressionCatalog);

export const progressionCatalogCount = progressionCatalog.length;
export const progressionCategoryCounts =
  progressionCatalogValidation.categoryCounts;

const progressionBySlug = new Map(
  progressionCatalog.map((progression) => [progression.slug, progression]),
);

export const getProgressionBySlug = (
  slug: string,
): ProgressionTemplate | undefined => progressionBySlug.get(slug);

const uniqueSorted = <Value extends string | number>(
  values: readonly Value[],
): Value[] => [...new Set(values)].sort();

export const progressionFilterFacets = {
  categories: progressionCategories,
  chordCounts: uniqueSorted(
    progressionCatalog.map(({ steps }) => steps.length),
  ),
  difficulties: uniqueSorted(
    progressionCatalog.flatMap(({ difficulty }) =>
      difficulty ? [difficulty] : [],
    ),
  ),
  harmonicDevices: uniqueSorted(
    progressionCatalog.flatMap(({ harmonicDevices }) => harmonicDevices),
  ),
  moods: uniqueSorted(progressionCatalog.flatMap(({ moodTags }) => moodTags)),
  scales: uniqueSorted(
    progressionCatalog.flatMap(({ compatibleScales }) => compatibleScales),
  ),
  styles: uniqueSorted(
    progressionCatalog.flatMap(({ styleTags }) => styleTags),
  ),
} as const;
