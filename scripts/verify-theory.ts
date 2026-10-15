import assert from "node:assert/strict";
import {
  practiceDifficulties,
  practiceExerciseMetadata,
  practiceGenres,
  practiceTechniques,
} from "../src/data/practiceExerciseMetadata";
import {
  getJourneyRecommendedExerciseId,
  practiceJourneys,
} from "../src/data/practiceJourneys";
import {
  practiceRoutines,
  practiceSources,
} from "../src/data/practiceRoutines";
import {
  type PracticeTabExampleId,
  practiceTabExampleIds,
  practiceTabExamples,
} from "../src/data/practiceTabExamples";
import {
  getProgressionBySlug,
  progressionCatalog,
  progressionCatalogValidation,
} from "../src/data/progressionCatalog";
import {
  practiceExerciseAliases,
  resolvePracticeExerciseId,
} from "../src/features/practice/exerciseAliases";
import { resolvePracticeJourneyLocation } from "../src/features/practice/journeyNavigation";
import {
  completeJourneyExercise,
  emptyPracticeJourneyProgress,
  getCompletedJourneyExerciseIds,
  isJourneyAttemptQualified,
  parsePracticeJourneyProgress,
} from "../src/features/practice/journeyProgress";
import { practiceExerciseRecipes } from "../src/features/practice/recipes";
import {
  getPracticeContextCompatibility,
  resolvePracticeTab,
} from "../src/features/practice/resolvePracticeTab";
import {
  getPracticeExampleTuning,
  getPracticeScoreSlotCount,
  getPracticeTabPitchClass,
  practiceTabTunings,
} from "../src/features/practice/tablature";
import {
  minimumProgressionCatalogCount,
  parseProgressionUrlContext,
  resolveProgression,
  resolveProgressionTonalContext,
  resolveRelativeChord,
} from "../src/features/progressions";
import type {
  ChordVoicingRequest,
  PlayableVoicing,
  VoicingStringState,
} from "../src/features/voicings";
import {
  buildResolvedChordVoicingRequest,
  buildScaleChordVoicingRequest,
  chordVoicingMaximumFret,
  chordVoicingMaximumFretSpan,
  chordVoicingPreferredMaximumFretSpan,
  generateChordVoicings,
  getVoicingLocation,
  groupVoicingsByNeckRegion,
} from "../src/features/voicings";
import {
  buildCagedChordShape,
  buildFretPositions,
  buildScaleShape,
  getAvailableScaleShapeSystems,
  getChordToneIntervalName,
  getDefaultRegisteredTuning,
  getDefaultTuning,
  getFretPitchClass,
  getPitchClass,
  getRegisteredTuningState,
  getScaleChords,
  getScaleShapeSystem,
  getScaleTones,
  hasCagedTuning,
  scaleDefinitions,
  standardTuning,
  tonicOptions,
} from "../src/helpers/fretboardHelpers";
import type {
  GuitarStringCount,
  PitchClass,
  ScaleChordSize,
  ScaleName,
} from "../src/helpers/typesHelpers";
import fretboardReducer, {
  setActiveProgressionChord,
  setActiveShape,
  setChordSize,
  setFretNoteCount,
  setKey,
  setScale,
  setSelectedChordDegree,
  setStringCount,
  setTuningNote,
  toggleShapeSystem,
} from "../src/lib/redux/slices/fretboardSlice";
import progressionLabReducer, {
  resetProgressionDetail,
  setProgressionActiveStep,
  setSelectedVoicingSignature,
} from "../src/lib/redux/slices/progressionLabSlice";
import { verifiedMusicalContextAssertions } from "./verify-musical-context";
import { verifiedVoiceLeadingAssertions } from "./verify-voice-leading";

const scaleNames = Object.keys(scaleDefinitions) as ScaleName[];

const axisFour = getProgressionBySlug("axis-four");
assert.ok(axisFour, "The canonical I–V–vi–IV template must be present");

const axisFourInA = resolveProgression(axisFour, {
  currentKey: "A",
  currentScale: "major",
});
const axisFourInC = resolveProgression(axisFour, {
  currentKey: "C",
  currentScale: "major",
});
const axisFourInG = resolveProgression(axisFour, {
  currentKey: "G",
  currentScale: "major",
});
const axisFourInMinorContext = resolveProgression(axisFour, {
  currentKey: "A",
  currentScale: "minor",
});

assert.equal(axisFourInA.formula, "I – V – vi – IV");
assert.deepEqual(axisFourInA.chordNames, ["A", "E", "F♯m", "D"]);
assert.deepEqual(axisFourInC.chordNames, ["C", "G", "Am", "F"]);
assert.deepEqual(axisFourInG.chordNames, ["G", "D", "Em", "C"]);
assert.equal(axisFourInC.formula, axisFourInA.formula);
assert.equal(axisFourInMinorContext.compatible, false);
assert.equal(axisFourInMinorContext.formula, axisFourInA.formula);

const borrowedFourInA = resolveRelativeChord(
  {
    formulaId: "minor",
    harmonicScope: "borrowed",
    root: { alteration: 0, degree: 4 },
  },
  "A",
);
assert.equal(borrowedFourInA.romanNumeral, "iv");
assert.equal(borrowedFourInA.name, "Dm");
assert.deepEqual(
  borrowedFourInA.tones.map(({ name }) => name),
  ["D", "F", "A"],
);

const fiveOfFiveInC = resolveRelativeChord(
  {
    appliedTo: { alteration: 0, degree: 5 },
    formulaId: "dominant7",
    harmonicScope: "secondary-dominant",
    root: { alteration: 0, degree: 2 },
  },
  "C",
);
assert.equal(fiveOfFiveInC.romanNumeral, "V7/V");
assert.equal(fiveOfFiveInC.name, "D7");
assert.deepEqual(
  fiveOfFiveInC.tones.map(({ name }) => name),
  ["D", "F#", "A", "C"],
);

assert.deepEqual(
  parseProgressionUrlContext(
    new URLSearchParams("key=Gb&scale=phrygian-dominant"),
  ),
  { currentKey: "Gb", currentScale: "phrygian-dominant" },
);
assert.deepEqual(
  parseProgressionUrlContext(new URLSearchParams("key=H&scale=dorian")),
  {},
);
assert.deepEqual(
  resolveProgressionTonalContext({
    defaults: { currentKey: "A", currentScale: "major" },
    existing: { currentKey: "G", currentScale: "minor" },
    url: { currentKey: "C" },
  }),
  { currentKey: "C", currentScale: "minor" },
);

assert.equal(progressionCatalogValidation.valid, true);
assert.equal(progressionCatalogValidation.count, progressionCatalog.length);
assert.equal(
  progressionCatalogValidation.uniqueSignatureCount,
  progressionCatalog.length,
);
assert.ok(progressionCatalog.length >= minimumProgressionCatalogCount);
assert.deepEqual(
  [...new Set(progressionCatalog.map(({ slug }) => slug))].length,
  progressionCatalog.length,
);
assert.deepEqual(
  Object.values(progressionCatalogValidation.categoryCounts),
  Array(15).fill(15),
);

let verifiedProgressionResolutionCount = 0;
const resolvedProgressionChords: Array<
  ReturnType<typeof resolveProgression>["steps"][number]["chord"]
> = [];
for (const progression of progressionCatalog) {
  for (const { name: tonic } of tonicOptions) {
    const resolved = resolveProgression(progression, {
      currentKey: tonic,
      currentScale: progression.tonalFramework,
    });
    assert.equal(resolved.steps.length, progression.steps.length);
    assert.equal(resolved.compatible, true);
    verifiedProgressionResolutionCount += resolved.steps.length;
    resolvedProgressionChords.push(...resolved.steps.map(({ chord }) => chord));
  }
}

const assertScaleSpelling = (
  key: Parameters<typeof getScaleTones>[0],
  scale: ScaleName,
  expected: string[],
) => {
  const tones = getScaleTones(key, scale);
  assert.deepEqual(
    tones.map((tone) => tone.name),
    expected,
    `${key} ${scale} spelling`,
  );
  tones.forEach((tone) => {
    assert.equal(
      getPitchClass(tone.name),
      tone.pitchClass,
      `${tone.name} must preserve pitch-class identity`,
    );
  });
};

assertScaleSpelling("C#", "major", ["C#", "D#", "E#", "F#", "G#", "A#", "B#"]);
assertScaleSpelling("Gb", "major", ["Gb", "Ab", "Bb", "Cb", "Db", "Eb", "F"]);
assertScaleSpelling("C#", "harmonic-minor", [
  "C#",
  "D#",
  "E",
  "F#",
  "G#",
  "A",
  "B#",
]);
assertScaleSpelling("Gb", "harmonic-minor", [
  "Gb",
  "Ab",
  "Bbb",
  "Cb",
  "Db",
  "Ebb",
  "F",
]);
assertScaleSpelling("C", "phrygian-dominant", [
  "C",
  "Db",
  "E",
  "F",
  "G",
  "Ab",
  "Bb",
]);
assertScaleSpelling("A", "blues", ["A", "C", "D", "Eb", "E", "G"]);

for (const { name: tonic } of tonicOptions) {
  for (const scaleName of scaleNames) {
    const tones = getScaleTones(tonic, scaleName);
    assert.equal(
      tones.length,
      scaleDefinitions[scaleName].tones.length,
      `${tonic} ${scaleName} tone count`,
    );
    assert.equal(
      new Set(tones.map((tone) => tone.pitchClass)).size,
      tones.length,
      `${tonic} ${scaleName} must not duplicate pitch classes`,
    );

    if (tones.length === 7) {
      assert.equal(
        new Set(tones.map((tone) => tone.letter)).size,
        7,
        `${tonic} ${scaleName} must use every note letter exactly once`,
      );
    }

    tones.forEach((tone) => {
      assert.equal(getPitchClass(tone.name), tone.pitchClass);
      assert.ok(
        Math.abs(tone.accidental) <= 2,
        `${tone.name} exceeds the documented double-accidental limit`,
      );
    });
  }
}

const assertChordLabels = (
  scale: ScaleName,
  size: ScaleChordSize,
  expected: string[],
) => {
  assert.deepEqual(
    getScaleChords("C", scale, size).map(
      ({ root, label }) => `${root.name} ${label}`,
    ),
    expected,
    `C ${scale} ${size} chord labels`,
  );
};

assertChordLabels("major", "triad", [
  "C Maj",
  "D Min",
  "E Min",
  "F Maj",
  "G Maj",
  "A Min",
  "B Dim",
]);
assertChordLabels("major", "seventh", [
  "C Maj7",
  "D Min7",
  "E Min7",
  "F Maj7",
  "G 7",
  "A Min7",
  "B Min7♭5",
]);
assertChordLabels("major", "ninth", [
  "C Maj9",
  "D Min9",
  "E Min7(♭9)",
  "F Maj9",
  "G 9",
  "A Min9",
  "B Min7♭5(♭9)",
]);

assertChordLabels("minor", "triad", [
  "C Min",
  "D Dim",
  "Eb Maj",
  "F Min",
  "G Min",
  "Ab Maj",
  "Bb Maj",
]);
assertChordLabels("minor", "seventh", [
  "C Min7",
  "D Min7♭5",
  "Eb Maj7",
  "F Min7",
  "G Min7",
  "Ab Maj7",
  "Bb 7",
]);
assertChordLabels("minor", "ninth", [
  "C Min9",
  "D Min7♭5(♭9)",
  "Eb Maj9",
  "F Min9",
  "G Min7(♭9)",
  "Ab Maj9",
  "Bb 9",
]);

assertChordLabels("harmonic-minor", "triad", [
  "C Min",
  "D Dim",
  "Eb Aug",
  "F Min",
  "G Maj",
  "Ab Maj",
  "B Dim",
]);
assertChordLabels("harmonic-minor", "seventh", [
  "C Min(Maj7)",
  "D Min7♭5",
  "Eb Maj7(♯5)",
  "F Min7",
  "G 7",
  "Ab Maj7",
  "B Dim7",
]);
assertChordLabels("harmonic-minor", "ninth", [
  "C Min(Maj9)",
  "D Min7♭5(♭9)",
  "Eb Maj9(♯5)",
  "F Min9",
  "G 7(♭9)",
  "Ab Maj7(♯9)",
  "B Dim7(♭9)",
]);

assertChordLabels("phrygian-dominant", "triad", [
  "C Maj",
  "Db Maj",
  "E Dim",
  "F Min",
  "G Dim",
  "Ab Aug",
  "Bb Min",
]);
assertChordLabels("phrygian-dominant", "seventh", [
  "C 7",
  "Db Maj7",
  "E Dim7",
  "F Min(Maj7)",
  "G Min7♭5",
  "Ab Maj7(♯5)",
  "Bb Min7",
]);
assertChordLabels("phrygian-dominant", "ninth", [
  "C 7(♭9)",
  "Db Maj7(♯9)",
  "E Dim7(♭9)",
  "F Min(Maj9)",
  "G Min7♭5(♭9)",
  "Ab Maj9(♯5)",
  "Bb Min9",
]);

assertChordLabels("blues", "triad", ["C Maj", "F Maj", "G Maj"]);
assertChordLabels("blues", "seventh", ["C 7", "F 7", "G 7"]);
assertChordLabels("blues", "ninth", ["C 9", "F 9", "G 9"]);

assert.deepEqual(
  getScaleChords("C", "harmonic-minor", "triad").map((chord) => chord.quality),
  ["minor", "diminished", "augmented", "minor", "major", "major", "diminished"],
  "harmonic-minor triad qualities",
);
assert.deepEqual(
  getScaleChords("C", "phrygian-dominant", "triad").map(
    (chord) => chord.quality,
  ),
  ["major", "major", "diminished", "minor", "diminished", "augmented", "minor"],
  "Phrygian-dominant triad qualities",
);
assert.deepEqual(
  getScaleChords("C#", "harmonic-minor", "triad")[2].notes.map(
    (note) => note.name,
  ),
  ["E", "G#", "B#"],
  "C-sharp harmonic-minor augmented III spelling",
);

const aBluesChordNotes: Record<ScaleChordSize, string[][]> = {
  triad: [
    ["A", "C#", "E"],
    ["D", "F#", "A"],
    ["E", "G#", "B"],
  ],
  seventh: [
    ["A", "C#", "E", "G"],
    ["D", "F#", "A", "C"],
    ["E", "G#", "B", "D"],
  ],
  ninth: [
    ["A", "C#", "E", "G", "B"],
    ["D", "F#", "A", "C", "E"],
    ["E", "G#", "B", "D", "F#"],
  ],
};

for (const [size, expectedNotes] of Object.entries(aBluesChordNotes) as Array<
  [ScaleChordSize, string[][]]
>) {
  assert.deepEqual(
    getScaleChords("A", "blues", size).map(({ notes }) =>
      notes.map(({ name }) => name),
    ),
    expectedNotes,
    `A minor-blues ${size} I-IV-V spelling`,
  );
}

const dropDTuning = [...standardTuning];
dropDTuning[5] = 2;
const downOneSemitoneTuning = standardTuning.map(
  (pitchClass) => ((pitchClass + 11) % 12) as PitchClass,
);
const extendedTuning = getDefaultTuning(8);
extendedTuning[7] = 0;
const twelveFretPositions = buildFretPositions(
  standardTuning,
  12,
  "A",
  "major",
);

const expectedRegisteredTunings = {
  6: [64, 59, 55, 50, 45, 40],
  7: [64, 59, 55, 50, 45, 40, 35],
  8: [64, 59, 55, 50, 45, 40, 35, 30],
} as const;

for (const stringCount of [6, 7, 8] as GuitarStringCount[]) {
  const registeredTuning = getDefaultRegisteredTuning(stringCount);
  assert.equal(registeredTuning.status, "verified");
  assert.deepEqual(
    registeredTuning.midiPitches,
    expectedRegisteredTunings[stringCount],
    `${stringCount}-string registered default`,
  );
  assert.deepEqual(
    registeredTuning.midiPitches?.map((midi) => (midi % 12) as PitchClass),
    getDefaultTuning(stringCount),
    `${stringCount}-string MIDI defaults must match pitch-class tuning`,
  );
  assert.deepEqual(
    getRegisteredTuningState(stringCount, getDefaultTuning(stringCount)),
    registeredTuning,
  );

  const customTuning = getDefaultTuning(stringCount);
  customTuning[0] = ((customTuning[0] + 1) % 12) as PitchClass;
  assert.deepEqual(getRegisteredTuningState(stringCount, customTuning), {
    midiPitches: null,
    reason: "pitch-class-only-custom",
    status: "unregistered",
    version: 1,
  });
}

const standardPracticeTuning = practiceTabTunings["standard-6"];
const registeredSixStringTuning = getDefaultRegisteredTuning(6);
assert.equal(registeredSixStringTuning.status, "verified");
assert.deepEqual(
  standardPracticeTuning.pitchClassesHighToLow,
  standardTuning,
  "Practice tab pitch classes must use the shared high-to-low Standard E order",
);
assert.deepEqual(
  standardPracticeTuning.stringLabelsHighToLow,
  ["e", "B", "G", "D", "A", "E"],
  "Practice tab string labels must run from highest string to lowest string",
);
if (registeredSixStringTuning.status === "verified") {
  assert.deepEqual(
    standardPracticeTuning.midiPitchesHighToLow,
    registeredSixStringTuning.midiPitches,
    "Practice tab registers must match the verified six-string preset",
  );
}

const practiceSourceIds = new Set(practiceSources.map(({ id }) => id));
assert.equal(
  practiceSourceIds.size,
  practiceSources.length,
  "Practice source IDs must be unique",
);

const routineSteps = practiceRoutines.flatMap((routine) => {
  assert.ok(routine.steps.length > 0, `${routine.id} must include a drill`);
  assert.equal(
    new Set(routine.sourceIds).size,
    routine.sourceIds.length,
    `${routine.id} source IDs must be unique`,
  );
  routine.sourceIds.forEach((sourceId) => {
    assert.ok(
      practiceSourceIds.has(sourceId),
      `${routine.id} references missing source ${sourceId}`,
    );
  });

  return routine.steps;
});

const primaryRoutineExampleIds = routineSteps
  .filter(({ isSharedReference }) => !isSharedReference)
  .map(({ exampleId }) => exampleId);
const sharedRoutineExampleIds = routineSteps
  .filter(({ isSharedReference }) => isSharedReference)
  .map(({ exampleId }) => exampleId);

assert.equal(
  new Set(primaryRoutineExampleIds).size,
  primaryRoutineExampleIds.length,
  "Each authored Practice tab must have one primary routine step",
);
assert.deepEqual(
  [...primaryRoutineExampleIds].sort(),
  [...practiceTabExampleIds].sort(),
  "Primary routine steps and authored Practice tabs must stay aligned",
);
sharedRoutineExampleIds.forEach((exampleId) => {
  assert.ok(
    primaryRoutineExampleIds.includes(exampleId),
    `Shared routine reference ${exampleId} needs a primary routine step`,
  );
});
assert.deepEqual(sharedRoutineExampleIds.sort(), [
  "alternate-cross",
  "metal-iron-pulse",
  "metal-tight-chugs",
]);

assert.deepEqual(
  Object.keys(practiceExerciseMetadata).sort(),
  [...practiceTabExampleIds].sort(),
  "Every Practice tab must have exactly one metadata record",
);
assert.equal(practiceTabExampleIds.length, 43);
assert.deepEqual(practiceExerciseAliases, {
  "chugs-grid": "metal-tight-chugs",
  "chugs-riff": "metal-iron-pulse",
  "daily-mechanics": "alternate-cross",
});
assert.equal(resolvePracticeExerciseId("chugs-grid"), "metal-tight-chugs");
assert.equal(resolvePracticeExerciseId("chugs-riff"), "metal-iron-pulse");
assert.equal(resolvePracticeExerciseId("daily-mechanics"), "alternate-cross");
assert.equal(resolvePracticeExerciseId("alternate-burst"), "alternate-burst");
assert.equal(resolvePracticeExerciseId("missing-exercise"), null);
for (const retiredId of Object.keys(practiceExerciseAliases)) {
  assert.equal(
    retiredId in practiceTabExamples,
    false,
    `${retiredId} must not remain independently selectable`,
  );
}

assert.equal(practiceJourneys.length, 1);
assert.equal(
  new Set(practiceJourneys.map(({ id }) => id)).size,
  practiceJourneys.length,
  "Journey IDs must be unique",
);
const rhythmToRiff = practiceJourneys[0];
assert.equal(rhythmToRiff.id, "rhythm-to-riff");
assert.deepEqual(
  rhythmToRiff.steps.map(({ exerciseId }) => exerciseId),
  ["chugs-mute-depth", "metal-tight-chugs", "chugs-gallop", "metal-iron-pulse"],
  "Rhythm to Riff must retain its approved order",
);
assert.equal(
  new Set(rhythmToRiff.steps.map(({ exerciseId }) => exerciseId)).size,
  rhythmToRiff.steps.length,
  "A Journey cannot repeat an exercise without stable step IDs",
);
for (const journey of practiceJourneys) {
  assert.match(journey.id, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
  assert.ok(journey.title.trim());
  assert.ok(journey.description.trim());
  assert.ok(journey.finalOutcome.trim());
  for (const step of journey.steps) {
    assert.ok(practiceTabExampleIds.includes(step.exerciseId));
    assert.ok(step.objective.trim());
    assert.ok(step.transition.trim());
  }
}

const emptyJourneyProgress = emptyPracticeJourneyProgress();
assert.deepEqual(parsePracticeJourneyProgress(null), emptyJourneyProgress);
assert.deepEqual(
  parsePracticeJourneyProgress("not-json"),
  emptyJourneyProgress,
);
assert.deepEqual(
  parsePracticeJourneyProgress(JSON.stringify({ version: 2, journeys: {} })),
  emptyJourneyProgress,
);
assert.deepEqual(
  parsePracticeJourneyProgress(
    JSON.stringify({
      journeys: {
        "missing-journey": { completedExerciseIds: ["daily-reset"] },
        "rhythm-to-riff": {
          completedExerciseIds: ["missing-exercise", "chugs-mute-depth"],
        },
      },
      version: 1,
    }),
  ),
  {
    journeys: {
      "rhythm-to-riff": { completedExerciseIds: ["chugs-mute-depth"] },
    },
    version: 1,
  },
);
const oneCompletedJourneyStep = completeJourneyExercise(
  emptyJourneyProgress,
  "rhythm-to-riff",
  "chugs-mute-depth",
);
assert.deepEqual(
  completeJourneyExercise(
    oneCompletedJourneyStep,
    "rhythm-to-riff",
    "chugs-mute-depth",
  ),
  oneCompletedJourneyStep,
  "Repeated Journey completion must be idempotent",
);
assert.equal(
  getJourneyRecommendedExerciseId(
    rhythmToRiff,
    getCompletedJourneyExerciseIds(oneCompletedJourneyStep, "rhythm-to-riff"),
  ),
  "metal-tight-chugs",
);
const completedRhythmToRiff = rhythmToRiff.steps.reduce(
  (progress, { exerciseId }) =>
    completeJourneyExercise(progress, "rhythm-to-riff", exerciseId),
  emptyJourneyProgress,
);
assert.equal(
  getCompletedJourneyExerciseIds(completedRhythmToRiff, "rhythm-to-riff")
    .length,
  4,
);
assert.equal(
  getJourneyRecommendedExerciseId(
    rhythmToRiff,
    getCompletedJourneyExerciseIds(completedRhythmToRiff, "rhythm-to-riff"),
  ),
  null,
);

assert.deepEqual(
  resolvePracticeJourneyLocation({ journeyId: "rhythm-to-riff" }),
  {
    canonicalPath: "/practice?journey=rhythm-to-riff",
    exerciseId: null,
    journey: rhythmToRiff,
    screen: "journey",
  },
);
assert.equal(
  resolvePracticeJourneyLocation({
    exerciseId: "chugs-riff",
    journeyId: "rhythm-to-riff",
  }).canonicalPath,
  "/practice?journey=rhythm-to-riff&exercise=metal-iron-pulse",
);
assert.equal(
  resolvePracticeJourneyLocation({
    exerciseId: "daily-reset",
    journeyId: "rhythm-to-riff",
  }).canonicalPath,
  "/practice?journey=rhythm-to-riff",
);
assert.equal(
  resolvePracticeJourneyLocation({
    exerciseId: "chugs-mute-depth",
    journeyId: "missing-journey",
  }).canonicalPath,
  "/practice?exercise=chugs-mute-depth",
);
assert.equal(
  resolvePracticeJourneyLocation({ exerciseId: "chugs-mute-depth" }).screen,
  "session",
);

const journeyEligibilityBase = {
  compatible: true,
  journeyExercise: true,
  qualifyingDurationSeconds: 60,
};
assert.equal(
  isJourneyAttemptQualified({
    ...journeyEligibilityBase,
    elapsedExerciseSeconds: 0,
  }),
  false,
  "Count-in must not qualify a Journey attempt",
);
assert.equal(
  isJourneyAttemptQualified({
    ...journeyEligibilityBase,
    elapsedExerciseSeconds: 59,
  }),
  false,
  "Partial or paused elapsed time must not qualify",
);
assert.equal(
  isJourneyAttemptQualified({
    ...journeyEligibilityBase,
    elapsedExerciseSeconds: 60,
  }),
  true,
  "A full elapsed session must qualify",
);
assert.equal(
  isJourneyAttemptQualified({
    ...journeyEligibilityBase,
    elapsedExerciseSeconds: 60,
    qualifyingDurationSeconds: null,
  }),
  false,
  "Abandonment or duration changes must invalidate an attempt",
);
assert.equal(
  isJourneyAttemptQualified({
    ...journeyEligibilityBase,
    compatible: false,
    elapsedExerciseSeconds: 60,
  }),
  false,
  "An incompatible context cannot qualify",
);
assert.equal(
  isJourneyAttemptQualified({
    ...journeyEligibilityBase,
    elapsedExerciseSeconds: 60,
    journeyExercise: false,
  }),
  false,
  "Standalone practice must not qualify Journey progress",
);

const practiceFamilyLevels = new Set<string>();
for (const exampleId of practiceTabExampleIds) {
  const metadata = practiceExerciseMetadata[exampleId];
  assert.ok(practiceDifficulties.includes(metadata.difficulty));
  assert.ok(metadata.genres.length > 0, `${exampleId} needs a genre`);
  assert.ok(metadata.techniques.length > 0, `${exampleId} needs a technique`);
  metadata.genres.forEach((genre) => {
    assert.ok(practiceGenres.includes(genre));
  });
  metadata.techniques.forEach((technique) => {
    assert.ok(practiceTechniques.includes(technique));
  });
  assert.ok(metadata.focus.trim().length > 0, `${exampleId} needs a focus`);
  assert.ok(metadata.familyId.trim().length > 0, `${exampleId} family`);
  assert.ok(Number.isInteger(metadata.familyLevel) && metadata.familyLevel > 0);
  const familyLevel = `${metadata.familyId}:${metadata.familyLevel}`;
  assert.equal(
    practiceFamilyLevels.has(familyLevel),
    false,
    `${exampleId} duplicates family level ${familyLevel}`,
  );
  practiceFamilyLevels.add(familyLevel);
  assert.ok(metadata.tempo.min >= 20 && metadata.tempo.target <= 240);
  assert.ok(metadata.tempo.min <= metadata.tempo.recommended);
  assert.ok(metadata.tempo.recommended <= metadata.tempo.target);
  if (metadata.musicalContext) {
    assert.ok(
      tonicOptions.some(({ name }) => name === metadata.musicalContext?.root),
    );
    assert.ok(scaleNames.includes(metadata.musicalContext.scale));
  }
}

let verifiedPracticeExampleCount = 0;
for (const exampleId of practiceTabExampleIds) {
  const example = practiceTabExamples[exampleId];
  const slotCount = getPracticeScoreSlotCount(example);
  const eventStarts = new Set<number>();
  const noteEventStarts = new Set<number>();
  const restSlots = new Set<number>();

  assert.equal(
    example.id,
    exampleId,
    `${exampleId} must preserve its record key`,
  );
  assert.ok(example.accessibleDescription.trim().length > 0);
  assert.ok(example.bpm >= 20 && example.bpm <= 240, `${exampleId} BPM`);
  assert.ok(
    Number.isInteger(example.repetitions) && example.repetitions > 0,
    `${exampleId} repetitions`,
  );
  assert.ok(example.events.length > 0, `${exampleId} must contain events`);
  assert.ok(
    example.measureCount === undefined ||
      (Number.isInteger(example.measureCount) && example.measureCount > 0),
    `${exampleId} measure count`,
  );
  assert.ok(example.pitchScope.label.trim().length > 0);

  example.markers?.forEach((marker) => {
    assert.ok(
      Number.isInteger(marker.at) && marker.at >= 0 && marker.at < slotCount,
      `${exampleId} marker ${marker.label} must fit the bar`,
    );
    assert.ok(marker.label.trim().length > 0);
  });
  assert.equal(
    new Set(example.markers?.map(({ at }) => at)).size,
    example.markers?.length ?? 0,
    `${exampleId} marker slots must be unique`,
  );

  const noteHistory = new Map<
    number,
    Array<{ articulation?: string; at: number; fret: number }>
  >();

  for (const event of [...example.events].sort(
    (first, second) => first.at - second.at,
  )) {
    assert.ok(
      Number.isInteger(event.at) && event.at >= 0 && event.at < slotCount,
      `${exampleId} event at ${event.at} must fit the bar`,
    );
    assert.ok(
      Number.isInteger(event.duration) && event.duration > 0,
      `${exampleId} event duration at ${event.at}`,
    );
    assert.ok(
      event.at + event.duration <= slotCount,
      `${exampleId} event at ${event.at} must end inside the bar`,
    );
    assert.equal(
      eventStarts.has(event.at),
      false,
      `${exampleId} may show only one grouped event at slot ${event.at}`,
    );
    eventStarts.add(event.at);

    if (event.kind === "rest") {
      for (let slot = event.at; slot < event.at + event.duration; slot += 1) {
        assert.equal(
          restSlots.has(slot),
          false,
          `${exampleId} rest slots must not overlap at ${slot}`,
        );
        restSlots.add(slot);
      }
      continue;
    }

    noteEventStarts.add(event.at);

    assert.ok(event.notes.length > 0, `${exampleId} note event at ${event.at}`);
    assert.equal(
      new Set(event.notes.map(({ string }) => string)).size,
      event.notes.length,
      `${exampleId} grouped event at ${event.at} must use each string once`,
    );

    for (const note of event.notes) {
      assert.ok(note.string >= 1 && note.string <= 6, `${exampleId} string`);

      if (note.fret === "x") {
        assert.equal(
          note.articulation,
          undefined,
          `${exampleId} dead note cannot carry an articulation`,
        );
        assert.equal(
          note.targetFret,
          undefined,
          `${exampleId} dead note cannot carry a target fret`,
        );
        continue;
      }

      assert.ok(
        Number.isInteger(note.fret) && note.fret >= 0 && note.fret <= 24,
        `${exampleId} fret ${note.fret}`,
      );

      const soundedPitch = getPracticeTabPitchClass(
        example.tuningId,
        note.string,
        note.fret,
      );
      if (example.pitchScope.kind === "set") {
        assert.ok(
          example.pitchScope.pitchClasses.includes(soundedPitch),
          `${exampleId} string ${note.string} fret ${note.fret} must belong to ${example.pitchScope.label}`,
        );
      }

      if (note.articulation === "bend") {
        assert.ok(
          note.targetFret !== undefined &&
            Number.isInteger(note.targetFret) &&
            note.targetFret > note.fret &&
            note.targetFret - note.fret <= 2 &&
            note.targetFret <= 24,
          `${exampleId} bend at string ${note.string} fret ${note.fret} needs a one- or two-fret target`,
        );

        if (
          note.targetFret !== undefined &&
          example.pitchScope.kind === "set"
        ) {
          const targetPitch = getPracticeTabPitchClass(
            example.tuningId,
            note.string,
            note.targetFret,
          );
          assert.ok(
            example.pitchScope.pitchClasses.includes(targetPitch),
            `${exampleId} bend target must belong to ${example.pitchScope.label}`,
          );
        }
      } else {
        assert.equal(
          note.targetFret,
          undefined,
          `${exampleId} target fret is reserved for bends`,
        );
      }

      const priorNotes = noteHistory.get(note.string) ?? [];
      const previousNote = priorNotes.at(-1);

      if (
        note.articulation === "hammer" ||
        note.articulation === "pull" ||
        note.articulation === "slide-up" ||
        note.articulation === "slide-down" ||
        note.articulation === "release"
      ) {
        assert.ok(
          previousNote,
          `${exampleId} ${note.articulation} needs a previous note on string ${note.string}`,
        );
      }

      if (previousNote && note.articulation === "hammer") {
        assert.ok(
          note.fret > previousNote.fret,
          `${exampleId} hammer direction`,
        );
      }
      if (previousNote && note.articulation === "pull") {
        assert.ok(note.fret < previousNote.fret, `${exampleId} pull direction`);
      }
      if (previousNote && note.articulation === "slide-up") {
        assert.ok(
          note.fret > previousNote.fret,
          `${exampleId} slide-up direction`,
        );
      }
      if (previousNote && note.articulation === "slide-down") {
        assert.ok(
          note.fret < previousNote.fret,
          `${exampleId} slide-down direction`,
        );
      }
      if (previousNote && note.articulation === "release") {
        assert.equal(
          previousNote.articulation,
          "bend",
          `${exampleId} release must follow a bend on the same string`,
        );
      }

      priorNotes.push({
        articulation: note.articulation,
        at: event.at,
        fret: note.fret,
      });
      noteHistory.set(note.string, priorNotes);
    }
  }

  for (const restSlot of restSlots) {
    assert.equal(
      noteEventStarts.has(restSlot),
      false,
      `${exampleId} rest at ${restSlot} must not overlap another event start`,
    );
  }

  verifiedPracticeExampleCount += 1;
}

const dailyPlayId = "daily-play";
const dailyPlay = practiceTabExamples[dailyPlayId];
const dailyPlayEvents = [...dailyPlay.events].sort(
  (first, second) => first.at - second.at,
);
const dailyPlayNotes = dailyPlayEvents.filter(
  (event) => event.kind === "notes",
);
assert.equal(dailyPlay.measureCount, 2);
assert.equal(dailyPlay.subdivision, "sixteenths");
assert.equal(getPracticeScoreSlotCount(dailyPlay), 32);
assert.equal(dailyPlayEvents.length, 21);
assert.equal(dailyPlayNotes.length, 19);
assert.equal(
  dailyPlayEvents.filter((event) => event.kind === "rest").length,
  2,
);
assert.deepEqual(
  dailyPlayEvents.map(({ at, duration, kind }) => ({ at, duration, kind })),
  [
    [0, 2, "notes"],
    [2, 1, "notes"],
    [3, 1, "notes"],
    [4, 2, "notes"],
    [6, 2, "rest"],
    [8, 2, "notes"],
    [10, 1, "notes"],
    [11, 1, "notes"],
    [12, 2, "notes"],
    [14, 2, "notes"],
    [16, 2, "notes"],
    [18, 1, "notes"],
    [19, 1, "notes"],
    [20, 2, "notes"],
    [22, 2, "notes"],
    [24, 2, "rest"],
    [26, 1, "notes"],
    [27, 1, "notes"],
    [28, 1, "notes"],
    [29, 1, "notes"],
    [30, 2, "notes"],
  ].map(([at, duration, kind]) => ({ at, duration, kind })),
);
assert.deepEqual(
  dailyPlayNotes.map((event) => {
    const note = event.notes[0];
    return [
      event.at,
      event.duration,
      note.string,
      note.fret,
      event.stroke,
      event.accent ?? false,
      note.articulation ?? null,
    ];
  }),
  [
    [0, 2, 4, 2, "down", true, null],
    [2, 1, 3, 0, "up", false, null],
    [3, 1, 3, 2, "down", false, null],
    [4, 2, 2, 0, "up", false, null],
    [8, 2, 3, 2, "down", true, null],
    [10, 1, 3, 0, "up", false, null],
    [11, 1, 4, 2, "down", false, null],
    [12, 2, 2, 3, "up", false, null],
    [14, 2, 2, 0, "down", false, null],
    [16, 2, 4, 2, "down", true, null],
    [18, 1, 3, 0, "up", false, null],
    [19, 1, 3, 2, "down", false, null],
    [20, 2, 2, 3, "up", true, null],
    [22, 2, 1, 0, "down", false, null],
    [26, 1, 2, 3, "down", false, null],
    [27, 1, 2, 0, "up", false, null],
    [28, 1, 3, 2, "down", false, null],
    [29, 1, 3, 0, "up", false, null],
    [30, 2, 4, 2, "down", true, null],
  ],
);
assert.deepEqual(
  dailyPlayNotes.map((event) => {
    const note = event.notes[0];
    if (note.fret === "x") {
      throw new Error("Open Road Hook cannot contain dead notes");
    }
    return getPracticeTabPitchClass(dailyPlay.tuningId, note.string, note.fret);
  }),
  [4, 7, 9, 11, 9, 7, 4, 2, 11, 4, 7, 9, 2, 4, 2, 11, 9, 7, 4],
);
assert.equal(dailyPlay.bpm, 80);
assert.equal(
  dailyPlay.bpm,
  practiceExerciseMetadata[dailyPlayId].tempo.recommended,
);
assert.deepEqual(practiceExerciseMetadata[dailyPlayId].tempo, {
  min: 64,
  recommended: 80,
  target: 112,
});
assert.equal(practiceExerciseMetadata[dailyPlayId].difficulty, "beginner");
assert.equal(
  practiceExerciseMetadata[dailyPlayId].familyId,
  "musical-phrasing",
);
assert.equal(practiceExerciseMetadata[dailyPlayId].familyLevel, 2);
assert.deepEqual(practiceExerciseRecipes[dailyPlayId], {
  contextConstraint: {
    key: "E",
    scale: "minor",
    tuning: "preset-default",
  },
  pitchPolicy: "scale",
  sourceTonic: 4,
  stringRange: "highest-six",
});
for (const stringCount of [6, 7, 8] as const) {
  const context = {
    currentKey: "E" as const,
    currentScale: "minor" as const,
    registeredTuning: getDefaultRegisteredTuning(stringCount),
    stringCount,
    tuning: getDefaultTuning(stringCount),
  };
  assert.deepEqual(getPracticeContextCompatibility(dailyPlayId, context), {
    compatible: true,
  });
  assert.equal(
    JSON.stringify(resolvePracticeTab(dailyPlayId, context).events),
    JSON.stringify(dailyPlay.events),
  );
}
for (const { name: currentKey } of tonicOptions) {
  for (const currentScale of scaleNames) {
    if (currentKey === "E" && currentScale === "minor") {
      continue;
    }

    const context = {
      currentKey,
      currentScale,
      registeredTuning: getDefaultRegisteredTuning(6),
      stringCount: 6 as const,
      tuning: getDefaultTuning(6),
    };
    assert.deepEqual(getPracticeContextCompatibility(dailyPlayId, context), {
      authoredContextLabel: "E Natural Minor",
      compatible: false,
      reason: "Open Road Hook is authored for E Natural Minor.",
      requiredKey: "E",
      requiredScale: "minor",
      resolution: "use-authored-context",
    });
    assert.throws(() => resolvePracticeTab(dailyPlayId, context));
  }
}
assert.deepEqual(
  getPracticeContextCompatibility(dailyPlayId, {
    currentKey: "A",
    currentScale: "major",
    registeredTuning: {
      midiPitches: null,
      reason: "pitch-class-only-custom",
      status: "unregistered",
      version: 1,
    },
    stringCount: 6,
    tuning: [4, 11, 7, 2, 9, 3],
  }),
  {
    authoredContextLabel: "E Natural Minor",
    compatible: false,
    reason: "Open Road Hook is authored for E Natural Minor.",
    requiredKey: "E",
    requiredScale: "minor",
    resolution: "use-authored-context",
  },
);
assert.deepEqual(
  getPracticeContextCompatibility(dailyPlayId, {
    currentKey: "E",
    currentScale: "minor",
    registeredTuning: {
      midiPitches: null,
      reason: "pitch-class-only-custom",
      status: "unregistered",
      version: 1,
    },
    stringCount: 6,
    tuning: [4, 11, 7, 2, 9, 3],
  }),
  {
    authoredContextLabel: "E Natural Minor",
    compatible: false,
    reason: "Open Road Hook requires a preset tuning.",
    resolution: "restore-preset-tuning",
  },
);

const legatoPhraseId = "legato-phrase";
const legatoPhrase = practiceTabExamples[legatoPhraseId];
const legatoPhraseEvents = [...legatoPhrase.events].sort(
  (first, second) => first.at - second.at,
);
const legatoPhraseNotes = legatoPhraseEvents.filter(
  (event) => event.kind === "notes",
);
assert.equal(legatoPhrase.measureCount, 2);
assert.equal(legatoPhrase.subdivision, "sixteenths");
assert.equal(getPracticeScoreSlotCount(legatoPhrase), 32);
assert.equal(legatoPhraseEvents.length, 19);
assert.deepEqual(
  legatoPhraseEvents.map(({ at, duration, kind }) => ({ at, duration, kind })),
  [
    [0, 2, "notes"],
    [2, 1, "notes"],
    [3, 1, "notes"],
    [4, 1, "notes"],
    [5, 1, "notes"],
    [6, 2, "notes"],
    [8, 2, "notes"],
    [10, 2, "notes"],
    [12, 4, "rest"],
    [16, 2, "notes"],
    [18, 1, "notes"],
    [19, 1, "notes"],
    [20, 1, "notes"],
    [21, 1, "notes"],
    [22, 2, "notes"],
    [24, 1, "notes"],
    [25, 1, "notes"],
    [26, 2, "notes"],
    [28, 4, "notes"],
  ].map(([at, duration, kind]) => ({ at, duration, kind })),
);
for (let index = 1; index < legatoPhraseEvents.length; index += 1) {
  const previous = legatoPhraseEvents[index - 1];
  const current = legatoPhraseEvents[index];
  assert.ok(previous.at + previous.duration <= current.at);
}
assert.deepEqual(
  legatoPhraseNotes.map((event) => {
    const note = event.notes[0];
    return [
      event.at,
      event.duration,
      note.string,
      note.fret,
      event.stroke ?? null,
      note.articulation ?? null,
      event.accent ?? false,
    ];
  }),
  [
    [0, 2, 2, 12, "down", null, true],
    [2, 1, 2, 13, null, "hammer", false],
    [3, 1, 2, 15, null, "hammer", false],
    [4, 1, 2, 13, null, "pull", false],
    [5, 1, 2, 12, null, "pull", false],
    [6, 2, 1, 15, "down", null, true],
    [8, 2, 1, 12, null, "pull", false],
    [10, 2, 1, 10, null, "slide-down", false],
    [16, 2, 2, 12, "down", null, true],
    [18, 1, 2, 13, null, "hammer", false],
    [19, 1, 2, 15, null, "hammer", false],
    [20, 1, 2, 13, null, "pull", false],
    [21, 1, 2, 12, null, "pull", false],
    [22, 2, 2, 15, null, "hammer", false],
    [24, 1, 2, 13, null, "pull", false],
    [25, 1, 2, 12, null, "pull", false],
    [26, 2, 2, 10, null, "pull", false],
    [28, 4, 1, 12, "down", "vibrato", true],
  ],
);
assert.deepEqual(
  legatoPhraseNotes.filter(({ stroke }) => stroke).map(({ at }) => at),
  [0, 6, 16, 28],
);
assert.deepEqual(
  legatoPhraseEvents.find(({ at }) => at === 12),
  {
    at: 12,
    duration: 4,
    kind: "rest",
  },
);
assert.equal(
  legatoPhrase.bpm,
  practiceExerciseMetadata[legatoPhraseId].tempo.recommended,
);
assert.deepEqual(practiceExerciseMetadata[legatoPhraseId].tempo, {
  min: 56,
  recommended: 72,
  target: 96,
});
assert.equal(practiceExerciseMetadata[legatoPhraseId].difficulty, "advanced");
assert.equal(practiceExerciseMetadata[legatoPhraseId].familyId, "legato");
assert.equal(practiceExerciseMetadata[legatoPhraseId].familyLevel, 4);
assert.deepEqual(practiceExerciseRecipes[legatoPhraseId], {
  contextConstraint: { scale: "minor", tuning: "preset-default" },
  pitchPolicy: "scale",
  sourceTonic: 4,
  stringRange: "highest-six",
});

const legatoPhraseDegreeIndices = [
  4, 5, 6, 5, 4, 2, 0, 6, 4, 5, 6, 5, 4, 6, 5, 4, 3, 0,
];
for (const { name: currentKey } of tonicOptions) {
  for (const stringCount of [6, 7, 8] as const) {
    const context = {
      currentKey,
      currentScale: "minor" as const,
      registeredTuning: getDefaultRegisteredTuning(stringCount),
      stringCount,
      tuning: getDefaultTuning(stringCount),
    };
    assert.deepEqual(getPracticeContextCompatibility(legatoPhraseId, context), {
      compatible: true,
    });
    const resolved = resolvePracticeTab(legatoPhraseId, context);
    const resolvedNotes = resolved.events.filter(
      (event) => event.kind === "notes",
    );
    const scalePitchClasses = getScaleTones(currentKey, "minor").map(
      ({ pitchClass }) => pitchClass,
    );
    assert.deepEqual(
      resolvedNotes.map((event) => {
        const note = event.notes[0];
        assert.notEqual(note.fret, "x");
        return getPracticeTabPitchClass(
          context.tuning,
          note.string,
          note.fret as number,
        );
      }),
      legatoPhraseDegreeIndices.map((index) => scalePitchClasses[index]),
    );
    const previousFrets = new Map<number, number>();
    resolvedNotes.forEach((event) => {
      const note = event.notes[0];
      assert.equal(typeof note.fret, "number");
      const fret = note.fret as number;
      assert.ok(fret >= 0 && fret <= 24);
      const previousFret = previousFrets.get(note.string);
      if (previousFret !== undefined && note.articulation === "hammer") {
        assert.ok(fret > previousFret && fret - previousFret <= 4);
      }
      if (
        previousFret !== undefined &&
        (note.articulation === "pull" || note.articulation === "slide-down")
      ) {
        assert.ok(previousFret > fret && previousFret - fret <= 5);
      }
      previousFrets.set(note.string, fret);
    });
    const frets = resolvedNotes.map((event) => event.notes[0].fret as number);
    assert.ok(Math.max(...frets) - Math.min(...frets) <= 8);
  }
}

for (const currentScale of scaleNames.filter((scale) => scale !== "minor")) {
  const context = {
    currentKey: "E" as const,
    currentScale,
    registeredTuning: getDefaultRegisteredTuning(6),
    stringCount: 6 as const,
    tuning: getDefaultTuning(6),
  };
  const compatibility = getPracticeContextCompatibility(
    legatoPhraseId,
    context,
  );
  assert.equal(compatibility.compatible, false);
  assert.match(compatibility.reason ?? "", /Natural Minor/);
  assert.throws(() => resolvePracticeTab(legatoPhraseId, context));
}
const customLegatoContext = {
  currentKey: "E" as const,
  currentScale: "minor" as const,
  registeredTuning: {
    midiPitches: null,
    reason: "pitch-class-only-custom" as const,
    status: "unregistered" as const,
    version: 1 as const,
  },
  stringCount: 6 as const,
  tuning: [4, 11, 7, 2, 9, 3] as const,
};
assert.equal(
  getPracticeContextCompatibility(legatoPhraseId, customLegatoContext)
    .compatible,
  false,
);
assert.throws(() => resolvePracticeTab(legatoPhraseId, customLegatoContext));
assert.deepEqual(
  getPracticeContextCompatibility("legato-flow", customLegatoContext),
  { compatible: true },
);

const skippingPhraseId = "skipping-phrase";
const skippingPhrase = practiceTabExamples[skippingPhraseId];
const skippingPhraseEvents = [...skippingPhrase.events].sort(
  (first, second) => first.at - second.at,
);
const skippingPhraseNotes = skippingPhraseEvents.filter(
  (event) => event.kind === "notes",
);
assert.equal(skippingPhrase.measureCount, 2);
assert.equal(skippingPhrase.subdivision, "sixteenths");
assert.equal(getPracticeScoreSlotCount(skippingPhrase), 32);
assert.equal(skippingPhraseEvents.length, 22);
assert.equal(skippingPhraseNotes.length, 21);
assert.deepEqual(
  skippingPhraseEvents.map(({ at, duration, kind }) => ({
    at,
    duration,
    kind,
  })),
  [
    [0, 2, "notes"],
    [2, 1, "notes"],
    [3, 1, "notes"],
    [4, 2, "notes"],
    [6, 1, "notes"],
    [7, 1, "notes"],
    [8, 2, "rest"],
    [10, 1, "notes"],
    [11, 1, "notes"],
    [12, 2, "notes"],
    [14, 2, "notes"],
    [16, 1, "notes"],
    [17, 1, "notes"],
    [18, 1, "notes"],
    [19, 1, "notes"],
    [20, 2, "notes"],
    [22, 2, "notes"],
    [24, 1, "notes"],
    [25, 1, "notes"],
    [26, 2, "notes"],
    [28, 2, "notes"],
    [30, 2, "notes"],
  ].map(([at, duration, kind]) => ({ at, duration, kind })),
);
for (let index = 1; index < skippingPhraseEvents.length; index += 1) {
  const previous = skippingPhraseEvents[index - 1];
  const current = skippingPhraseEvents[index];
  assert.ok(previous.at + previous.duration <= current.at);
}
assert.deepEqual(
  skippingPhraseNotes.map((event) => {
    const note = event.notes[0];
    return [
      event.at,
      event.duration,
      note.string,
      note.fret,
      event.stroke ?? null,
      note.articulation ?? null,
      event.accent ?? false,
    ];
  }),
  [
    [0, 2, 4, 9, "down", null, true],
    [2, 1, 2, 8, "up", null, false],
    [3, 1, 4, 10, "down", null, false],
    [4, 2, 2, 10, "up", null, true],
    [6, 1, 4, 12, "down", null, false],
    [7, 1, 2, 12, "up", null, false],
    [10, 1, 4, 10, "down", null, false],
    [11, 1, 2, 10, "up", null, false],
    [12, 2, 1, 10, "down", null, true],
    [14, 2, 3, 9, "up", null, false],
    [16, 1, 4, 9, "down", null, true],
    [17, 1, 2, 8, "up", null, false],
    [18, 1, 4, 10, "down", null, false],
    [19, 1, 2, 10, "up", null, false],
    [20, 2, 4, 12, "down", null, false],
    [22, 2, 2, 12, "up", null, false],
    [24, 1, 1, 10, "down", null, true],
    [25, 1, 3, 9, "up", null, false],
    [26, 2, 1, 7, "down", null, false],
    [28, 2, 2, 8, "up", null, false],
    [30, 2, 3, 9, "down", "vibrato", true],
  ],
);
assert.deepEqual(
  skippingPhraseEvents.find(({ at }) => at === 8),
  {
    at: 8,
    duration: 2,
    kind: "rest",
  },
);
assert.equal(
  skippingPhrase.bpm,
  practiceExerciseMetadata[skippingPhraseId].tempo.recommended,
);
assert.deepEqual(practiceExerciseMetadata[skippingPhraseId].tempo, {
  min: 58,
  recommended: 72,
  target: 96,
});
assert.equal(practiceExerciseMetadata[skippingPhraseId].difficulty, "advanced");
assert.equal(
  practiceExerciseMetadata[skippingPhraseId].familyId,
  "string-skipping",
);
assert.equal(practiceExerciseMetadata[skippingPhraseId].familyLevel, 4);
assert.deepEqual(practiceExerciseRecipes[skippingPhraseId], {
  contextConstraint: { scale: "minor", tuning: "preset-default" },
  pitchPolicy: "scale",
  sourceTonic: 4,
  stringRange: "highest-six",
});

const skippingPhraseDegreeIndices = [
  4, 2, 5, 3, 6, 4, 5, 3, 6, 0, 4, 2, 5, 3, 6, 4, 6, 0, 4, 2, 0,
];
const skippingPhraseStrings = [
  4, 2, 4, 2, 4, 2, 4, 2, 1, 3, 4, 2, 4, 2, 4, 2, 1, 3, 1, 2, 3,
];
const skippingPhraseStrokes = skippingPhraseNotes.map(({ stroke }) => stroke);
const skippingPhraseRelativeMidi = skippingPhraseNotes.map((event) => {
  const note = event.notes[0];
  assert.notEqual(note.fret, "x");
  return (
    (practiceTabTunings[skippingPhrase.tuningId].midiPitchesHighToLow?.[
      note.string - 1
    ] ?? 0) + (note.fret as number)
  );
});
const sourceMidiRoot = skippingPhraseRelativeMidi[0];
const sourceMidiContour = skippingPhraseRelativeMidi.map(
  (midiPitch) => midiPitch - sourceMidiRoot,
);
for (const { name: currentKey } of tonicOptions) {
  for (const stringCount of [6, 7, 8] as const) {
    const context = {
      currentKey,
      currentScale: "minor" as const,
      registeredTuning: getDefaultRegisteredTuning(stringCount),
      stringCount,
      tuning: getDefaultTuning(stringCount),
    };
    assert.deepEqual(
      getPracticeContextCompatibility(skippingPhraseId, context),
      { compatible: true },
    );
    const resolved = resolvePracticeTab(skippingPhraseId, context);
    const resolvedNotes = resolved.events.filter(
      (event) => event.kind === "notes",
    );
    const scalePitchClasses = getScaleTones(currentKey, "minor").map(
      ({ pitchClass }) => pitchClass,
    );
    assert.deepEqual(
      resolvedNotes.map((event) => {
        const note = event.notes[0];
        assert.notEqual(note.fret, "x");
        return getPracticeTabPitchClass(
          context.tuning,
          note.string,
          note.fret as number,
        );
      }),
      skippingPhraseDegreeIndices.map((index) => scalePitchClasses[index]),
    );
    assert.deepEqual(
      resolvedNotes.map((event) => event.notes[0].string),
      skippingPhraseStrings,
    );
    assert.deepEqual(
      resolvedNotes.map(({ stroke }) => stroke),
      skippingPhraseStrokes,
    );
    assert.deepEqual(
      resolved.events.map(({ at, duration, kind }) => ({ at, duration, kind })),
      skippingPhraseEvents.map(({ at, duration, kind }) => ({
        at,
        duration,
        kind,
      })),
    );
    assert.equal(context.registeredTuning.status, "verified");
    const midiPitches = context.registeredTuning.midiPitches;
    const resolvedMidi = resolvedNotes.map((event) => {
      const note = event.notes[0];
      assert.notEqual(note.fret, "x");
      return midiPitches[note.string - 1] + (note.fret as number);
    });
    const resolvedMidiRoot = resolvedMidi[0];
    assert.deepEqual(
      resolvedMidi.map((midiPitch) => midiPitch - resolvedMidiRoot),
      sourceMidiContour,
    );
    const frets = resolvedNotes.map((event) => event.notes[0].fret as number);
    assert.ok(frets.every((fret) => fret >= 1 && fret <= 17));
    assert.ok(Math.max(...frets) - Math.min(...frets) <= 5);
    assert.ok(
      frets.slice(1).every((fret, index) => Math.abs(fret - frets[index]) <= 2),
    );
    assert.equal(frets.at(-1), frets[0]);
  }
}

for (const currentScale of scaleNames.filter((scale) => scale !== "minor")) {
  const context = {
    currentKey: "E" as const,
    currentScale,
    registeredTuning: getDefaultRegisteredTuning(6),
    stringCount: 6 as const,
    tuning: getDefaultTuning(6),
  };
  const compatibility = getPracticeContextCompatibility(
    skippingPhraseId,
    context,
  );
  assert.equal(compatibility.compatible, false);
  assert.equal(
    compatibility.reason,
    "Across the Wire is authored for Natural Minor.",
  );
  assert.throws(() => resolvePracticeTab(skippingPhraseId, context));
}
assert.equal(
  getPracticeContextCompatibility(skippingPhraseId, customLegatoContext)
    .compatible,
  false,
);
assert.equal(
  getPracticeContextCompatibility(skippingPhraseId, customLegatoContext).reason,
  "Across the Wire requires a preset tuning.",
);
assert.throws(() => resolvePracticeTab(skippingPhraseId, customLegatoContext));

const scalesConnectId = "scales-connect";
const scalesConnect = practiceTabExamples[scalesConnectId];
const scalesConnectEvents = [...scalesConnect.events].sort(
  (first, second) => first.at - second.at,
);
const scalesConnectNotes = scalesConnectEvents.filter(
  (event) => event.kind === "notes",
);
assert.equal(scalesConnect.measureCount, 2);
assert.equal(scalesConnect.subdivision, "sixteenths");
assert.equal(getPracticeScoreSlotCount(scalesConnect), 32);
assert.equal(scalesConnectEvents.length, 20);
assert.ok(scalesConnectEvents.every((event) => event.kind === "notes"));
assert.deepEqual(
  scalesConnectEvents.map(({ at, duration }) => [at, duration]),
  [
    [0, 2],
    [2, 1],
    [3, 1],
    [4, 2],
    [6, 1],
    [7, 1],
    [8, 2],
    [10, 2],
    [12, 2],
    [14, 2],
    [16, 1],
    [17, 1],
    [18, 2],
    [20, 2],
    [22, 1],
    [23, 1],
    [24, 2],
    [26, 2],
    [28, 2],
    [30, 2],
  ],
);
for (let index = 1; index < scalesConnectEvents.length; index += 1) {
  assert.equal(
    scalesConnectEvents[index - 1].at + scalesConnectEvents[index - 1].duration,
    scalesConnectEvents[index].at,
  );
}
assert.deepEqual(
  scalesConnectNotes.map((event) => {
    const note = event.notes[0];
    return [
      event.at,
      event.duration,
      note.string,
      note.fret,
      event.stroke ?? null,
      note.articulation ?? null,
      event.accent ?? false,
    ];
  }),
  [
    [0, 2, 3, 9, "down", null, true],
    [2, 1, 2, 8, "up", null, false],
    [3, 1, 2, 10, "down", null, false],
    [4, 2, 1, 7, "up", null, false],
    [6, 1, 2, 10, "down", null, false],
    [7, 1, 2, 8, "up", null, false],
    [8, 2, 3, 9, "down", null, true],
    [10, 2, 2, 10, "up", null, false],
    [12, 2, 2, 12, "down", null, true],
    [14, 2, 1, 12, "up", null, false],
    [16, 1, 1, 12, "down", null, true],
    [17, 1, 1, 15, "up", null, false],
    [18, 2, 1, 14, "down", null, false],
    [20, 2, 2, 15, "up", null, false],
    [22, 1, 2, 13, "down", null, false],
    [23, 1, 2, 12, "up", null, false],
    [24, 2, 2, 10, "down", null, true],
    [26, 2, 2, 8, "up", null, false],
    [28, 2, 3, 11, "down", null, false],
    [30, 2, 3, 9, "up", "vibrato", true],
  ],
);
assert.equal(
  scalesConnect.bpm,
  practiceExerciseMetadata[scalesConnectId].tempo.recommended,
);
assert.deepEqual(practiceExerciseMetadata[scalesConnectId].tempo, {
  min: 56,
  recommended: 72,
  target: 96,
});
assert.equal(
  practiceExerciseMetadata[scalesConnectId].difficulty,
  "intermediate",
);
assert.equal(
  practiceExerciseMetadata[scalesConnectId].familyId,
  "scale-navigation",
);
assert.equal(practiceExerciseMetadata[scalesConnectId].familyLevel, 3);
assert.deepEqual(practiceExerciseRecipes[scalesConnectId], {
  contextConstraint: { scale: "minor", tuning: "preset-default" },
  pitchPolicy: "scale",
  sourceTonic: 4,
  stringRange: "highest-six",
});

const scalesConnectDegreeIndices = [
  0, 2, 3, 4, 3, 2, 0, 3, 4, 0, 0, 2, 1, 6, 5, 4, 3, 2, 1, 0,
];
const scalesConnectStrings = [
  3, 2, 2, 1, 2, 2, 3, 2, 2, 1, 1, 1, 1, 2, 2, 2, 2, 2, 3, 3,
];
const scalesConnectStrokes = scalesConnectNotes.map(({ stroke }) => stroke);
const scalesConnectMidi = scalesConnectNotes.map((event) => {
  const note = event.notes[0];
  assert.notEqual(note.fret, "x");
  return (
    (practiceTabTunings[scalesConnect.tuningId].midiPitchesHighToLow?.[
      note.string - 1
    ] ?? 0) + (note.fret as number)
  );
});
const scalesConnectMidiRoot = scalesConnectMidi[0];
const scalesConnectContour = scalesConnectMidi.map(
  (midiPitch) => midiPitch - scalesConnectMidiRoot,
);
for (const { name: currentKey } of tonicOptions) {
  for (const stringCount of [6, 7, 8] as const) {
    const context = {
      currentKey,
      currentScale: "minor" as const,
      registeredTuning: getDefaultRegisteredTuning(stringCount),
      stringCount,
      tuning: getDefaultTuning(stringCount),
    };
    assert.deepEqual(
      getPracticeContextCompatibility(scalesConnectId, context),
      { compatible: true },
    );
    const resolved = resolvePracticeTab(scalesConnectId, context);
    const resolvedNotes = resolved.events.filter(
      (event) => event.kind === "notes",
    );
    const scalePitchClasses = getScaleTones(currentKey, "minor").map(
      ({ pitchClass }) => pitchClass,
    );
    assert.deepEqual(
      resolvedNotes.map((event) => {
        const note = event.notes[0];
        assert.notEqual(note.fret, "x");
        return getPracticeTabPitchClass(
          context.tuning,
          note.string,
          note.fret as number,
        );
      }),
      scalesConnectDegreeIndices.map((index) => scalePitchClasses[index]),
    );
    assert.deepEqual(
      resolvedNotes.map((event) => event.notes[0].string),
      scalesConnectStrings,
    );
    assert.deepEqual(
      resolvedNotes.map(({ stroke }) => stroke),
      scalesConnectStrokes,
    );
    assert.deepEqual(
      resolved.events.map(({ at, duration }) => [at, duration]),
      scalesConnectEvents.map(({ at, duration }) => [at, duration]),
    );
    assert.equal(context.registeredTuning.status, "verified");
    const midiPitches = context.registeredTuning.midiPitches;
    const resolvedMidi = resolvedNotes.map((event) => {
      const note = event.notes[0];
      assert.notEqual(note.fret, "x");
      return midiPitches[note.string - 1] + (note.fret as number);
    });
    const resolvedMidiRoot = resolvedMidi[0];
    assert.deepEqual(
      resolvedMidi.map((midiPitch) => midiPitch - resolvedMidiRoot),
      scalesConnectContour,
    );
    const frets = resolvedNotes.map((event) => event.notes[0].fret as number);
    assert.ok(frets.every((fret) => fret >= 1 && fret <= 20));
    assert.equal(Math.max(...frets) - Math.min(...frets), 8);
    assert.ok(
      frets.slice(1).every((fret, index) => Math.abs(fret - frets[index]) <= 3),
    );
    assert.equal(frets[8] - frets[7], 2);
    assert.equal(frets[16] - frets[15], -2);
    assert.ok(
      Math.min(...frets.slice(8, 16)) - Math.max(...frets.slice(0, 8)) >= 2,
    );
    assert.equal(frets.at(-1), frets[0]);
  }
}

for (const currentScale of scaleNames.filter((scale) => scale !== "minor")) {
  const context = {
    currentKey: "E" as const,
    currentScale,
    registeredTuning: getDefaultRegisteredTuning(6),
    stringCount: 6 as const,
    tuning: getDefaultTuning(6),
  };
  const compatibility = getPracticeContextCompatibility(
    scalesConnectId,
    context,
  );
  assert.equal(compatibility.compatible, false);
  assert.equal(
    compatibility.reason,
    "Carry the Motif is authored for Natural Minor.",
  );
  assert.throws(() => resolvePracticeTab(scalesConnectId, context));
}
assert.equal(
  getPracticeContextCompatibility(scalesConnectId, customLegatoContext)
    .compatible,
  false,
);
assert.equal(
  getPracticeContextCompatibility(scalesConnectId, customLegatoContext).reason,
  "Carry the Motif requires a preset tuning.",
);
assert.throws(() => resolvePracticeTab(scalesConnectId, customLegatoContext));

const threeThreeTwoId = "metal-three-three-two-engine";
const threeThreeTwo = practiceTabExamples[threeThreeTwoId];
const threeThreeTwoEvents = [...threeThreeTwo.events].sort(
  (first, second) => first.at - second.at,
);
assert.equal(threeThreeTwo.measureCount, 2);
assert.equal(threeThreeTwo.subdivision, "eighths");
assert.equal(threeThreeTwoEvents.length, 16);
assert.deepEqual(
  threeThreeTwoEvents.map(({ at }) => at),
  Array.from({ length: 16 }, (_, index) => index),
);
assert.ok(
  threeThreeTwoEvents.every(
    (event) => event.kind === "notes" && event.stroke === "down",
  ),
  `${threeThreeTwoId} must use continuous downstrokes`,
);

const expectedThreeThreeTwoChords = new Map<
  number,
  readonly (readonly [number, number])[]
>([
  [
    2,
    [
      [6, 8],
      [5, 10],
    ],
  ],
  [
    5,
    [
      [6, 10],
      [5, 12],
    ],
  ],
  [
    7,
    [
      [6, 8],
      [5, 10],
    ],
  ],
  [
    10,
    [
      [6, 3],
      [5, 5],
    ],
  ],
  [
    13,
    [
      [6, 10],
      [5, 12],
    ],
  ],
  [
    14,
    [
      [6, 8],
      [5, 10],
    ],
  ],
  [
    15,
    [
      [6, 10],
      [5, 12],
    ],
  ],
]);

for (const event of threeThreeTwoEvents) {
  assert.equal(event.kind, "notes");
  if (event.kind !== "notes") continue;

  const expectedChord = expectedThreeThreeTwoChords.get(event.at);
  if (expectedChord) {
    assert.equal(event.accent, true, `Chord at ${event.at} must be accented`);
    assert.equal(event.palmMuteDepth, undefined);
    assert.deepEqual(
      event.notes.map(({ fret, string }) => [string, fret]),
      expectedChord,
    );
  } else {
    assert.equal(event.accent, false);
    assert.equal(event.palmMuteDepth, "medium");
    assert.deepEqual(
      event.notes.map(({ fret, string }) => [string, fret]),
      [[6, 0]],
    );
  }
}

assert.deepEqual(practiceExerciseMetadata[threeThreeTwoId].tempo, {
  min: 70,
  recommended: 90,
  target: 120,
});
assert.deepEqual(practiceExerciseMetadata[threeThreeTwoId].musicalContext, {
  root: "E",
  scale: "minor",
});

const gallopRelayId = "metal-gallop-relay";
const gallopRelay = practiceTabExamples[gallopRelayId];
const gallopRelayEvents = [...gallopRelay.events].sort(
  (first, second) => first.at - second.at,
);
assert.equal(gallopRelay.measureCount, 2);
assert.equal(gallopRelay.subdivision, "sixteenths");
assert.equal(getPracticeScoreSlotCount(gallopRelay), 32);
assert.deepEqual(
  gallopRelayEvents.map(({ at, duration, kind }) => ({ at, duration, kind })),
  [
    { at: 0, duration: 2, kind: "notes" },
    { at: 2, duration: 1, kind: "notes" },
    { at: 3, duration: 1, kind: "notes" },
    { at: 4, duration: 2, kind: "notes" },
    { at: 6, duration: 2, kind: "notes" },
    { at: 8, duration: 2, kind: "notes" },
    { at: 10, duration: 1, kind: "notes" },
    { at: 11, duration: 1, kind: "notes" },
    { at: 12, duration: 4, kind: "rest" },
    { at: 16, duration: 1, kind: "notes" },
    { at: 17, duration: 1, kind: "notes" },
    { at: 18, duration: 2, kind: "notes" },
    { at: 20, duration: 1, kind: "notes" },
    { at: 21, duration: 1, kind: "notes" },
    { at: 22, duration: 2, kind: "notes" },
    { at: 24, duration: 2, kind: "notes" },
    { at: 26, duration: 2, kind: "notes" },
    { at: 28, duration: 2, kind: "rest" },
    { at: 30, duration: 2, kind: "notes" },
  ],
);

const gallopRelayNotes = gallopRelayEvents.filter(
  (event) => event.kind === "notes",
);
assert.deepEqual(
  gallopRelayNotes.map((event) => ({
    accent: event.accent ?? false,
    at: event.at,
    notes: event.notes.map(({ fret, string }) => [string, fret]),
    palmMuteDepth: event.palmMuteDepth,
    stroke: event.stroke,
  })),
  [
    {
      accent: false,
      at: 0,
      notes: [[6, 0]],
      palmMuteDepth: "medium",
      stroke: "down",
    },
    {
      accent: false,
      at: 2,
      notes: [[6, 0]],
      palmMuteDepth: "medium",
      stroke: "down",
    },
    {
      accent: false,
      at: 3,
      notes: [[6, 0]],
      palmMuteDepth: "medium",
      stroke: "up",
    },
    {
      accent: true,
      at: 4,
      notes: [
        [6, 3],
        [5, 5],
      ],
      palmMuteDepth: undefined,
      stroke: "down",
    },
    {
      accent: false,
      at: 6,
      notes: [[6, 0]],
      palmMuteDepth: "medium",
      stroke: "down",
    },
    {
      accent: false,
      at: 8,
      notes: [[5, 2]],
      palmMuteDepth: "medium",
      stroke: "down",
    },
    {
      accent: false,
      at: 10,
      notes: [[5, 2]],
      palmMuteDepth: "medium",
      stroke: "down",
    },
    {
      accent: false,
      at: 11,
      notes: [[5, 2]],
      palmMuteDepth: "medium",
      stroke: "up",
    },
    {
      accent: false,
      at: 16,
      notes: [[5, 2]],
      palmMuteDepth: "medium",
      stroke: "down",
    },
    {
      accent: false,
      at: 17,
      notes: [[5, 2]],
      palmMuteDepth: "medium",
      stroke: "up",
    },
    {
      accent: false,
      at: 18,
      notes: [[5, 2]],
      palmMuteDepth: "medium",
      stroke: "down",
    },
    {
      accent: false,
      at: 20,
      notes: [[6, 0]],
      palmMuteDepth: "medium",
      stroke: "down",
    },
    {
      accent: false,
      at: 21,
      notes: [[6, 0]],
      palmMuteDepth: "medium",
      stroke: "up",
    },
    {
      accent: false,
      at: 22,
      notes: [[6, 0]],
      palmMuteDepth: "medium",
      stroke: "down",
    },
    {
      accent: true,
      at: 24,
      notes: [
        [6, 8],
        [5, 10],
      ],
      palmMuteDepth: undefined,
      stroke: "down",
    },
    {
      accent: true,
      at: 26,
      notes: [
        [6, 10],
        [5, 12],
      ],
      palmMuteDepth: undefined,
      stroke: "down",
    },
    {
      accent: true,
      at: 30,
      notes: [
        [6, 10],
        [5, 12],
      ],
      palmMuteDepth: undefined,
      stroke: "down",
    },
  ],
);
assert.deepEqual(practiceExerciseMetadata[gallopRelayId].tempo, {
  min: 60,
  recommended: 80,
  target: 110,
});
assert.deepEqual(practiceExerciseMetadata[gallopRelayId].musicalContext, {
  root: "E",
  scale: "minor",
});

const burstAndResolveId = "metal-burst-and-resolve";
const burstAndResolve = practiceTabExamples[burstAndResolveId];
const burstAndResolveEvents = [...burstAndResolve.events].sort(
  (first, second) => first.at - second.at,
);
assert.equal(burstAndResolve.measureCount, 2);
assert.equal(burstAndResolve.subdivision, "sixteenths");
assert.equal(getPracticeScoreSlotCount(burstAndResolve), 32);
assert.equal(burstAndResolveEvents.length, 20);
assert.deepEqual(
  burstAndResolveEvents.map(({ at, duration, kind }) => ({
    at,
    duration,
    kind,
  })),
  [
    { at: 0, duration: 2, kind: "notes" },
    { at: 2, duration: 2, kind: "notes" },
    { at: 4, duration: 1, kind: "notes" },
    { at: 5, duration: 1, kind: "notes" },
    { at: 6, duration: 1, kind: "notes" },
    { at: 7, duration: 1, kind: "notes" },
    { at: 8, duration: 1, kind: "notes" },
    { at: 9, duration: 3, kind: "notes" },
    { at: 12, duration: 4, kind: "rest" },
    { at: 16, duration: 2, kind: "notes" },
    { at: 18, duration: 2, kind: "notes" },
    { at: 20, duration: 1, kind: "notes" },
    { at: 21, duration: 1, kind: "notes" },
    { at: 22, duration: 1, kind: "notes" },
    { at: 23, duration: 1, kind: "notes" },
    { at: 24, duration: 1, kind: "notes" },
    { at: 25, duration: 1, kind: "notes" },
    { at: 26, duration: 2, kind: "notes" },
    { at: 28, duration: 2, kind: "rest" },
    { at: 30, duration: 2, kind: "notes" },
  ],
);
const burstAndResolveNotes = burstAndResolveEvents.filter(
  (event) => event.kind === "notes",
);
assert.deepEqual(
  burstAndResolveNotes.map((event) => {
    const note = event.notes[0];
    return [
      event.at,
      event.duration,
      note.string,
      note.fret,
      event.stroke,
      event.accent ?? false,
      event.palmMuteDepth ?? null,
      note.articulation ?? null,
    ];
  }),
  [
    [0, 2, 1, 12, "down", true, null, null],
    [2, 2, 2, 12, "up", false, null, null],
    [4, 1, 1, 12, "down", false, null, null],
    [5, 1, 1, 10, "up", false, null, null],
    [6, 1, 1, 8, "down", false, null, null],
    [7, 1, 1, 7, "up", false, null, null],
    [8, 1, 2, 10, "down", false, null, null],
    [9, 3, 2, 8, "up", true, null, null],
    [16, 2, 2, 8, "down", false, null, null],
    [18, 2, 2, 12, "up", false, null, null],
    [20, 1, 3, 11, "down", false, null, null],
    [21, 1, 2, 10, "up", false, null, null],
    [22, 1, 2, 8, "down", false, null, null],
    [23, 1, 2, 12, "up", false, null, null],
    [24, 1, 1, 8, "down", false, null, null],
    [25, 1, 1, 10, "up", false, null, null],
    [26, 2, 1, 12, "down", true, null, null],
    [30, 2, 1, 10, "up", false, null, null],
  ],
);
assert.deepEqual(
  burstAndResolveNotes
    .filter((event) => event.at >= 4 && event.at <= 9)
    .map((event) => event.at),
  [4, 5, 6, 7, 8, 9],
  "Burst and Resolve must preserve its six-note first burst",
);
assert.deepEqual(
  burstAndResolveNotes
    .filter((event) => event.at >= 20 && event.at <= 26)
    .map((event) => event.at),
  [20, 21, 22, 23, 24, 25, 26],
  "Burst and Resolve must preserve its seven-note second burst",
);
assert.deepEqual(practiceExerciseMetadata[burstAndResolveId].tempo, {
  min: 64,
  recommended: 80,
  target: 108,
});
assert.deepEqual(practiceExerciseMetadata[burstAndResolveId].musicalContext, {
  root: "E",
  scale: "minor",
});

const ironPulseId = "metal-iron-pulse";
const ironPulse = practiceTabExamples[ironPulseId];
const ironPulseEvents = [...ironPulse.events].sort(
  (first, second) => first.at - second.at,
);
assert.equal(ironPulse.measureCount, 2);
assert.equal(ironPulse.subdivision, "sixteenths");
assert.equal(getPracticeScoreSlotCount(ironPulse), 32);
assert.equal(ironPulseEvents.length, 17);
assert.deepEqual(
  ironPulseEvents.map(({ at, duration, kind }) => ({ at, duration, kind })),
  [
    [0, 2],
    [2, 2],
    [4, 2],
    [6, 2],
    [8, 2],
    [10, 2],
    [12, 2],
    [14, 2],
    [16, 2],
    [18, 2],
    [20, 2],
    [22, 2],
    [24, 2],
    [26, 1],
  ]
    .map(([at, duration]) => ({ at, duration, kind: "notes" }))
    .concat({ at: 27, duration: 1, kind: "rest" }, [
      { at: 28, duration: 2, kind: "notes" },
      { at: 30, duration: 2, kind: "notes" },
    ]),
);
const ironPulseNotes = ironPulseEvents.filter(
  (event) => event.kind === "notes",
);
assert.equal(ironPulseNotes.length, 16);
assert.deepEqual(
  ironPulseNotes.map((event) => ({
    accent: event.accent ?? false,
    at: event.at,
    notes: event.notes.map(({ fret, string }) => [string, fret]),
    palmMuteDepth: event.palmMuteDepth ?? null,
    stroke: event.stroke,
  })),
  [
    [0, [[5, 0]], "medium", false],
    [2, [[5, 0]], "medium", false],
    [4, [[5, 0]], "medium", false],
    [
      6,
      [
        [5, 3],
        [4, 5],
      ],
      null,
      true,
    ],
    [8, [[5, 0]], "medium", false],
    [10, [[5, 0]], "medium", false],
    [12, [[5, 0]], "medium", false],
    [
      14,
      [
        [6, 3],
        [5, 5],
      ],
      null,
      true,
    ],
    [16, [[5, 0]], "medium", false],
    [18, [[5, 0]], "medium", false],
    [20, [[5, 0]], "medium", false],
    [
      22,
      [
        [5, 3],
        [4, 5],
      ],
      null,
      true,
    ],
    [24, [[5, 0]], "medium", false],
    [26, [[5, 0]], "medium", false],
    [
      28,
      [
        [5, 5],
        [4, 7],
      ],
      null,
      true,
    ],
    [
      30,
      [
        [6, 3],
        [5, 5],
      ],
      null,
      true,
    ],
  ].map(([at, notes, palmMuteDepth, accent]) => ({
    accent,
    at,
    notes,
    palmMuteDepth,
    stroke: "down",
  })),
);
assert.deepEqual(
  ironPulseNotes.filter((event) => event.accent).map((event) => event.at),
  [6, 14, 22, 28, 30],
);
assert.ok(
  ironPulseNotes.every(
    (event) =>
      event.notes[0].string !== 5 ||
      event.notes[0].fret !== 0 ||
      event.palmMuteDepth === "medium",
  ),
  "Iron Pulse must medium-mute every open-A pedal attack",
);
assert.deepEqual(practiceExerciseMetadata[ironPulseId].tempo, {
  min: 76,
  recommended: 96,
  target: 124,
});
assert.deepEqual(practiceExerciseMetadata[ironPulseId].musicalContext, {
  root: "A",
  scale: "minor",
});

const phrygianGravityId = "metal-phrygian-gravity";
const phrygianGravity = practiceTabExamples[phrygianGravityId];
const phrygianGravityEvents = [...phrygianGravity.events].sort(
  (first, second) => first.at - second.at,
);
assert.equal(phrygianGravity.measureCount, 2);
assert.equal(phrygianGravity.subdivision, "sixteenths");
assert.equal(getPracticeScoreSlotCount(phrygianGravity), 32);
assert.deepEqual(
  phrygianGravityEvents.map(({ at, duration, kind }) => ({
    at,
    duration,
    kind,
  })),
  [
    [0, 1],
    [1, 1],
    [2, 1],
    [3, 1],
    [4, 1],
    [5, 1],
    [6, 2],
    [8, 1],
    [9, 1],
    [10, 1],
    [11, 1],
    [12, 1],
    [13, 1],
  ]
    .map(([at, duration]) => ({ at, duration, kind: "notes" }))
    .concat(
      { at: 14, duration: 2, kind: "rest" },
      [
        [16, 4],
        [20, 1],
        [21, 1],
        [22, 1],
        [23, 1],
        [24, 1],
        [25, 1],
        [26, 2],
        [28, 1],
        [29, 3],
      ].map(([at, duration]) => ({ at, duration, kind: "notes" })),
    ),
);

const phrygianGravityNotes = phrygianGravityEvents.filter(
  (event) => event.kind === "notes",
);
assert.deepEqual(
  phrygianGravityNotes.map((event) => {
    const note = event.notes[0];
    return [
      event.at,
      event.duration,
      note.string,
      note.fret,
      event.stroke,
      event.accent ?? false,
      event.palmMuteDepth ?? null,
    ];
  }),
  [
    [0, 1, 6, 0, "down", false, "medium"],
    [1, 1, 6, 0, "up", false, "medium"],
    [2, 1, 5, 8, "down", true, null],
    [3, 1, 5, 8, "up", false, null],
    [4, 1, 6, 0, "down", false, "medium"],
    [5, 1, 6, 0, "up", false, "medium"],
    [6, 2, 5, 8, "down", true, null],
    [8, 1, 5, 7, "down", false, null],
    [9, 1, 5, 8, "up", false, null],
    [10, 1, 5, 7, "down", false, null],
    [11, 1, 5, 8, "up", false, null],
    [12, 1, 6, 0, "down", false, "medium"],
    [13, 1, 6, 0, "up", false, "medium"],
    [16, 4, 5, 11, "down", true, null],
    [20, 1, 5, 8, "down", false, null],
    [21, 1, 5, 11, "up", false, null],
    [22, 1, 5, 8, "down", false, null],
    [23, 1, 5, 11, "up", true, null],
    [24, 1, 5, 7, "down", false, null],
    [25, 1, 5, 8, "up", false, null],
    [26, 2, 5, 11, "down", true, null],
    [28, 1, 5, 11, "down", false, null],
    [29, 3, 5, 8, "up", true, null],
  ],
);
assert.deepEqual(
  [...new Set(phrygianGravityNotes.map((event) => event.notes[0].fret))],
  [0, 8, 7, 11],
);
assert.ok(
  phrygianGravityNotes.some(
    (event) => event.notes[0].string === 5 && event.notes[0].fret === 8,
  ),
  "Phrygian Gravity must structurally include F in the upper voice",
);
assert.ok(
  phrygianGravityNotes.some(
    (event) => event.notes[0].string === 5 && event.notes[0].fret === 11,
  ),
  "Phrygian Gravity must structurally include G sharp in the upper voice",
);
assert.deepEqual(practiceExerciseMetadata[phrygianGravityId].tempo, {
  min: 55,
  recommended: 72,
  target: 100,
});
assert.deepEqual(practiceExerciseMetadata[phrygianGravityId].musicalContext, {
  root: "E",
  scale: "phrygian-dominant",
});

assert.deepEqual(
  Object.keys(practiceExerciseRecipes).sort(),
  [...practiceTabExampleIds].sort(),
  "Every authored Practice tab must have exactly one resolution recipe",
);

const expectedConstrainedScales = {
  "bends-control": ["minor", "blues"],
  "bends-phrase": ["minor", "blues"],
  "bends-reference": ["minor", "blues"],
  "daily-foundation": ["major", "minor", "harmonic-minor", "phrygian-dominant"],
  "metal-gallop-control": ["major", "minor", "blues"],
  "metal-gallop-relay": ["minor"],
  "metal-iron-pulse": ["minor"],
  "metal-pedal-assault": ["major", "minor"],
  "metal-phrygian-gravity": ["phrygian-dominant"],
  "metal-phrygian-tension": ["phrygian-dominant"],
  "metal-syncopated-stops": ["major", "minor", "blues"],
  "metal-three-three-two-engine": ["minor"],
} as const satisfies Partial<
  Record<PracticeTabExampleId, readonly ScaleName[]>
>;

for (const [exampleId, compatibleScales] of Object.entries(
  expectedConstrainedScales,
) as Array<[PracticeTabExampleId, readonly ScaleName[]]>) {
  for (const currentScale of scaleNames) {
    const compatibility = getPracticeContextCompatibility(exampleId, {
      currentKey: "F#",
      currentScale,
      registeredTuning: getDefaultRegisteredTuning(7),
      stringCount: 7,
      tuning: getDefaultTuning(7),
    });
    assert.equal(
      compatibility.compatible,
      compatibleScales.includes(currentScale),
      `${exampleId} ${currentScale} compatibility`,
    );
  }
}

const phrygianExerciseIds = [
  "metal-phrygian-gravity",
  "metal-phrygian-tension",
] as const;
for (const exampleId of phrygianExerciseIds) {
  for (const { name: currentKey } of tonicOptions) {
    for (const stringCount of [6, 7, 8] as const) {
      const context = {
        currentKey,
        currentScale: "phrygian-dominant" as const,
        registeredTuning: getDefaultRegisteredTuning(stringCount),
        stringCount,
        tuning: getDefaultTuning(stringCount),
      };
      assert.equal(
        getPracticeContextCompatibility(exampleId, context).compatible,
        true,
      );
      const resolved = resolvePracticeTab(exampleId, context);
      const strings = new Set(
        resolved.events.flatMap((event) =>
          event.kind === "notes" ? event.notes.map((note) => note.string) : [],
        ),
      );
      assert.equal(
        strings.size,
        2,
        `${exampleId} preserves its two-string route`,
      );
      assert.ok(
        [...strings].every((string) => stringCount - string <= 1),
        `${exampleId} remains on the lowest two strings`,
      );
    }
  }
}

const powerChordExerciseIds = new Set<PracticeTabExampleId>([
  "metal-gallop-control",
  "metal-gallop-relay",
  "metal-iron-pulse",
  "metal-pedal-assault",
  "metal-syncopated-stops",
  "metal-three-three-two-engine",
]);

let verifiedResolvedPracticeContextCount = 0;
for (const { name: currentKey } of tonicOptions) {
  for (const currentScale of scaleNames) {
    for (const stringCount of [6, 7, 8] as const) {
      const tuning = getDefaultTuning(stringCount);
      const registeredTuning = getDefaultRegisteredTuning(stringCount);

      for (const exampleId of practiceTabExampleIds) {
        const context = {
          currentKey,
          currentScale,
          registeredTuning,
          stringCount,
          tuning,
        };
        const compatibility = getPracticeContextCompatibility(
          exampleId,
          context,
        );

        if (!compatibility.compatible) {
          assert.ok(
            practiceExerciseRecipes[exampleId].contextConstraint,
            `${exampleId} must declare every incompatible context centrally`,
          );
          assert.throws(() => resolvePracticeTab(exampleId, context));
          continue;
        }

        const resolved = resolvePracticeTab(exampleId, {
          ...context,
        });
        const resolvedTuning = getPracticeExampleTuning(resolved);

        if (powerChordExerciseIds.has(exampleId)) {
          for (const event of resolved.events) {
            if (event.kind !== "notes" || event.notes.length < 2) continue;
            const pitches = event.notes.map((note) => {
              assert.notEqual(note.fret, "x");
              return getPracticeTabPitchClass(
                resolvedTuning.pitchClassesHighToLow,
                note.string,
                note.fret as number,
              );
            });
            assert.equal(
              (pitches[1] - pitches[0] + 12) % 12,
              7,
              `${exampleId} must retain every authored power-chord fifth`,
            );
          }
        }

        assert.equal(
          resolved.events.length,
          practiceTabExamples[exampleId].events.length,
        );
        assert.equal(resolvedTuning.pitchClassesHighToLow.length, stringCount);
        assert.equal(resolvedTuning.midiPitchesHighToLow?.length, stringCount);
        assert.equal(resolvedTuning.registerStatus, "verified");
        assert.equal(resolved.resolvedContext?.key, currentKey);
        assert.equal(resolved.resolvedContext?.scale, currentScale);

        const recipe = practiceExerciseRecipes[exampleId];
        if (
          resolved.pitchScope.kind === "set" &&
          (recipe.pitchPolicy === "scale" ||
            recipe.pitchPolicy === "scale-five-tone")
        ) {
          const selectedScale = getScaleTones(currentKey, currentScale).map(
            ({ pitchClass }) => pitchClass,
          );
          resolved.pitchScope.pitchClasses.forEach((pitchClass) => {
            assert.ok(
              selectedScale.includes(pitchClass),
              `${exampleId} must resolve inside ${currentKey} ${currentScale}`,
            );
          });
        }

        const noteHistory = new Map<
          number,
          { articulation?: string; fret: number }
        >();
        for (const event of [...resolved.events].sort(
          (first, second) => first.at - second.at,
        )) {
          if (event.kind === "rest") continue;

          for (const note of event.notes) {
            assert.ok(
              note.string >= 1 && note.string <= stringCount,
              `${exampleId} must fit ${stringCount} strings in ${currentKey} ${currentScale}`,
            );
            if (note.fret === "x") continue;

            assert.ok(note.fret >= 0 && note.fret <= 24);
            const soundedPitch = getPracticeTabPitchClass(
              resolvedTuning.pitchClassesHighToLow,
              note.string,
              note.fret,
            );
            if (resolved.pitchScope.kind === "set") {
              assert.ok(
                resolved.pitchScope.pitchClasses.includes(soundedPitch),
                `${exampleId} resolved pitch must belong to ${resolved.pitchScope.label}`,
              );
            }

            if (note.articulation === "bend") {
              assert.ok(
                note.targetFret !== undefined &&
                  note.targetFret > note.fret &&
                  note.targetFret <= 24,
                `${exampleId} resolved bend target`,
              );
            } else {
              assert.equal(note.targetFret, undefined);
            }

            const previous = noteHistory.get(note.string);
            if (
              previous &&
              (note.articulation === "hammer" ||
                note.articulation === "slide-up")
            ) {
              assert.ok(
                note.fret > previous.fret,
                `${exampleId} resolved upward articulation in ${currentKey} ${currentScale} on ${stringCount} strings: ${previous.fret} -> ${note.fret}`,
              );
            }
            if (
              previous &&
              (note.articulation === "pull" ||
                note.articulation === "slide-down")
            ) {
              assert.ok(
                note.fret < previous.fret,
                `${exampleId} resolved downward articulation in ${currentKey} ${currentScale} on ${stringCount} strings: ${previous.fret} -> ${note.fret}`,
              );
            }
            if (note.articulation === "release") {
              assert.equal(
                previous?.articulation,
                "bend",
                `${exampleId} resolved release`,
              );
            }

            noteHistory.set(note.string, {
              articulation: note.articulation,
              fret: note.fret,
            });
          }
        }

        verifiedResolvedPracticeContextCount += 1;
      }
    }
  }
}

const customPracticeTuning = getDefaultTuning(6);
customPracticeTuning[0] = 3;
const customPracticeExample = resolvePracticeTab("scales-sequence", {
  currentKey: "Db",
  currentScale: "harmonic-minor",
  registeredTuning: getRegisteredTuningState(6, customPracticeTuning),
  stringCount: 6,
  tuning: customPracticeTuning,
});
assert.equal(
  getPracticeExampleTuning(customPracticeExample).registerStatus,
  "unregistered",
);
assert.equal(
  getPracticeExampleTuning(customPracticeExample).midiPitchesHighToLow,
  null,
);
assert.match(
  customPracticeExample.accessibleDescription,
  /octave register is unverified/,
);

type SoundingVoicingStringState = Exclude<
  VoicingStringState,
  { kind: "muted" }
>;

const stringCounts = [6, 7, 8] as const satisfies readonly GuitarStringCount[];
let verifiedVoicingContextCount = 0;
let verifiedGeneratedVoicingCount = 0;

const assertGeneratedVoicing = (
  request: ChordVoicingRequest,
  voicing: PlayableVoicing,
  voicingIndex: number,
  voicings: readonly PlayableVoicing[],
  contextLabel: string,
): void => {
  verifiedGeneratedVoicingCount += 1;
  assert.equal(voicing.chordName, request.chordName);
  assert.equal(voicing.stringCount, request.stringCount);
  assert.equal(voicing.strings.length, request.stringCount);
  assert.equal(voicing.generatorVersion, "dynamic-chord-v1");
  assert.equal(voicing.registerStatus, "verified");
  assert.deepEqual(voicing.omissions, []);
  assert.deepEqual(voicing.doublings, []);
  assert.deepEqual(
    voicing.requiredTones,
    request.tones.filter(({ required }) => required).map(({ role }) => role),
  );
  assert.deepEqual(
    voicing.toneRoles,
    request.tones.map(({ role }) => role),
  );
  assert.ok(voicing.signature.startsWith(`${request.stringCount}:`));
  assert.ok(
    voicing.fretSpan <= chordVoicingPreferredMaximumFretSpan,
    contextLabel,
  );

  if (voicingIndex > 0) {
    assert.ok(voicing.rank >= voicings[voicingIndex - 1].rank, contextLabel);
  }

  const sounded = voicing.strings.filter(
    (state): state is SoundingVoicingStringState => state.kind !== "muted",
  );
  assert.equal(sounded.length, request.tones.length, contextLabel);
  assert.equal(
    new Set(sounded.map(({ stringIndex }) => stringIndex)).size,
    sounded.length,
    contextLabel,
  );
  assert.deepEqual(
    [...new Set(sounded.map(({ pitchClass }) => pitchClass))].sort(
      (first, second) => first - second,
    ),
    [...request.tones.map(({ pitchClass }) => pitchClass)].sort(
      (first, second) => first - second,
    ),
    `${contextLabel} must include every chord pitch class exactly once`,
  );
  assert.deepEqual(
    [...new Set(sounded.map(({ role }) => role))].sort(),
    [...request.tones.map(({ role }) => role)].sort(),
    `${contextLabel} must include every chord-tone role exactly once`,
  );

  sounded.forEach((state) => {
    assert.ok(
      state.fret >= 0 && state.fret <= chordVoicingMaximumFret,
      contextLabel,
    );
    assert.equal(state.kind === "open", state.fret === 0, contextLabel);
    assert.equal(
      state.pitchClass,
      getFretPitchClass(request.tuning[state.stringIndex], state.fret),
      contextLabel,
    );

    if (request.registeredOpenMidi) {
      assert.equal(
        state.midi,
        request.registeredOpenMidi[state.stringIndex] + state.fret,
        contextLabel,
      );
    }
  });

  const frets = sounded.map(({ fret }) => fret);
  assert.equal(voicing.baseFret, Math.min(...frets), contextLabel);
  assert.equal(
    voicing.fretSpan,
    Math.max(...frets) - Math.min(...frets),
    contextLabel,
  );

  if (request.registeredOpenMidi) {
    assert.ok(
      sounded.every(({ midi }) => midi !== undefined),
      `${contextLabel} needs registered sounding pitches`,
    );
    const registeredLowToHigh = [...sounded].sort(
      (first, second) => (first.midi as number) - (second.midi as number),
    );
    assert.ok(voicing.bass, `${contextLabel} needs a calculated bass`);
    assert.equal(voicing.bass.midi, registeredLowToHigh[0].midi, contextLabel);
    assert.equal(
      voicing.bass.pitchClass,
      registeredLowToHigh[0].pitchClass,
      contextLabel,
    );
    assert.equal(voicing.bass.role, registeredLowToHigh[0].role, contextLabel);

    if (request.bassPitchClass !== undefined) {
      assert.equal(
        voicing.bass.pitchClass,
        request.bassPitchClass,
        `${contextLabel} must honor its authored slash bass`,
      );
    }
  }
};

const assertVoicingCoverage = (
  request: ChordVoicingRequest,
  contextLabel: string,
): void => {
  const voicings = generateChordVoicings(request);
  verifiedVoicingContextCount += 1;
  assert.ok(
    voicings.length > 0,
    `${contextLabel} needs at least one complete generated voicing`,
  );
  assert.equal(
    new Set(voicings.map(({ signature }) => signature)).size,
    voicings.length,
    `${contextLabel} signatures must be unique`,
  );
  voicings.forEach((voicing, voicingIndex) => {
    assertGeneratedVoicing(
      request,
      voicing,
      voicingIndex,
      voicings,
      contextLabel,
    );
  });
};

for (const { name: tonic } of tonicOptions) {
  for (const scaleName of scaleNames) {
    for (const size of ["triad", "seventh", "ninth"] as const) {
      for (const chord of getScaleChords(tonic, scaleName, size)) {
        for (const stringCount of stringCounts) {
          const registeredTuning = getDefaultRegisteredTuning(stringCount);
          assertVoicingCoverage(
            buildScaleChordVoicingRequest(chord, {
              registeredTuning,
              stringCount,
              tuning: getDefaultTuning(stringCount),
            }),
            `${tonic} ${scaleName} ${chord.root.name} ${chord.label} on ${stringCount} strings`,
          );
        }
      }
    }
  }
}

for (const chord of resolvedProgressionChords) {
  for (const stringCount of stringCounts) {
    const registeredTuning = getDefaultRegisteredTuning(stringCount);
    assertVoicingCoverage(
      buildResolvedChordVoicingRequest(chord, {
        registeredTuning,
        stringCount,
        tuning: getDefaultTuning(stringCount),
      }),
      `${chord.name} progression chord on ${stringCount} strings`,
    );
  }
}

const addNineRelativeLoop = getProgressionBySlug("add-nine-relative-loop");
assert.ok(addNineRelativeLoop);
const fSharpMinorAddNine = resolveProgression(addNineRelativeLoop, {
  currentKey: "A",
  currentScale: "major",
}).steps[1].chord;
assert.equal(fSharpMinorAddNine.name, "F♯m(add9)");
assert.deepEqual(
  fSharpMinorAddNine.tones.map(({ name }) => name),
  ["F#", "A", "C#", "G#"],
);
const fSharpMinorAddNineRequest = buildResolvedChordVoicingRequest(
  fSharpMinorAddNine,
  {
    registeredTuning: getDefaultRegisteredTuning(6),
    stringCount: 6,
    tuning: getDefaultTuning(6),
  },
);
assert.deepEqual(
  generateChordVoicings(fSharpMinorAddNineRequest),
  generateChordVoicings(fSharpMinorAddNineRequest),
  "Dynamic chord generation must be deterministic",
);
const fSharpMinorAddNineVoicings = generateChordVoicings(
  fSharpMinorAddNineRequest,
);
const groupedAddNineLocations = groupVoicingsByNeckRegion(
  fSharpMinorAddNineVoicings,
);
const groupedAddNineSignatures = groupedAddNineLocations.flatMap(
  ({ locations }) => locations.map(({ signature }) => signature),
);
assert.equal(
  groupedAddNineSignatures.length,
  fSharpMinorAddNineVoicings.length,
  "Neck-region grouping must preserve every generated voicing",
);
assert.equal(
  new Set(groupedAddNineSignatures).size,
  fSharpMinorAddNineVoicings.length,
  "Neck-region grouping must not duplicate a physical voicing signature",
);
fSharpMinorAddNineVoicings.forEach((voicing) => {
  const location = getVoicingLocation(voicing);
  assert.ok(location.label.length > 0);
  assert.ok(location.lastFret <= chordVoicingMaximumFret);
});

const customSixStringTuning = [...getDefaultTuning(6)];
customSixStringTuning[0] = 5;
const customAddNineVoicings = generateChordVoicings(
  buildResolvedChordVoicingRequest(fSharpMinorAddNine, {
    registeredTuning: getRegisteredTuningState(6, customSixStringTuning),
    stringCount: 6,
    tuning: customSixStringTuning,
  }),
);
assert.ok(customAddNineVoicings.length > 0);
assert.ok(
  customAddNineVoicings.every(
    ({ bass, registerStatus }) =>
      bass === undefined && registerStatus === "pitch-class-only",
  ),
);

const uniformCustomTuning = Array.from({ length: 6 }, () => 0 as PitchClass);
const uniformCustomNinthVoicings = generateChordVoicings(
  buildScaleChordVoicingRequest(getScaleChords("C", "major", "ninth")[0], {
    registeredTuning: getRegisteredTuningState(6, uniformCustomTuning),
    stringCount: 6,
    tuning: uniformCustomTuning,
  }),
);
assert.ok(
  uniformCustomNinthVoicings.length > 0,
  "A pitch-class-only custom tuning must still receive a complete diagram",
);
assert.ok(
  uniformCustomNinthVoicings.every(
    ({ bass, fretSpan, registerStatus }) =>
      bass === undefined &&
      fretSpan <= chordVoicingMaximumFretSpan &&
      registerStatus === "pitch-class-only",
  ),
);
assert.ok(
  uniformCustomNinthVoicings.some(
    ({ fretSpan }) => fretSpan > chordVoicingPreferredMaximumFretSpan,
  ),
  "Pathological custom tunings must use the wide fallback instead of failing",
);

const customSlashChord = resolvedProgressionChords.find(({ bass }) => bass);
assert.ok(customSlashChord?.bass);
const customSlashVoicings = generateChordVoicings(
  buildResolvedChordVoicingRequest(customSlashChord, {
    registeredTuning: getRegisteredTuningState(6, uniformCustomTuning),
    stringCount: 6,
    tuning: uniformCustomTuning,
  }),
);
assert.ok(customSlashVoicings.length > 0);
customSlashVoicings.forEach((voicing) => {
  assert.equal(voicing.bass, undefined);
  assert.equal(
    voicing.authoredBassPitchClass,
    customSlashChord.bass?.pitchClass,
  );
  const sounded = voicing.strings.filter(
    (state): state is SoundingVoicingStringState => state.kind !== "muted",
  );
  const authoredBassState = sounded.find(
    ({ pitchClass }) => pitchClass === customSlashChord.bass?.pitchClass,
  );
  assert.equal(
    authoredBassState?.stringIndex,
    Math.max(...sounded.map(({ stringIndex }) => stringIndex)),
  );
});

assert.deepEqual(
  generateChordVoicings({
    chordName: "Invalid duplicate role",
    registeredOpenMidi: expectedRegisteredTunings[6],
    rootPitchClass: 0,
    stringCount: 6,
    tones: [
      { name: "C", pitchClass: 0, required: true, role: "root" },
      { name: "E", pitchClass: 4, required: true, role: "third" },
      { name: "G", pitchClass: 7, required: true, role: "third" },
    ],
    tuning: getDefaultTuning(6),
  }),
  [],
  "Dynamic voicing generation must reject ambiguous chord-tone roles",
);

assert.equal(twelveFretPositions.length, standardTuning.length);
twelveFretPositions.forEach((stringPositions) => {
  assert.equal(stringPositions.length, 12);
  assert.equal(stringPositions[0]?.fret, 1);
  assert.equal(stringPositions.at(-1)?.fret, 12);
});

const chordSizes: ScaleChordSize[] = ["triad", "seventh", "ninth"];
const chordToneCountBySize: Record<ScaleChordSize, number> = {
  triad: 3,
  seventh: 4,
  ninth: 5,
};
const chordToneRoles = ["root", "third", "fifth", "seventh", "ninth"];
let verifiedChordCount = 0;

for (const { name: tonic } of tonicOptions) {
  for (const scaleName of scaleNames) {
    const positionsByString = buildFretPositions(
      standardTuning,
      12,
      tonic,
      scaleName,
    );
    const scalePitchClasses = new Set(
      getScaleTones(tonic, scaleName).map(({ pitchClass }) => pitchClass),
    );

    chordSizes.forEach((size) => {
      const chords = getScaleChords(tonic, scaleName, size);

      assert.equal(
        chords.length,
        scaleName === "blues" ? 3 : 7,
        `${tonic} ${scaleName} ${size} chord count`,
      );

      chords.forEach((chord) => {
        verifiedChordCount += 1;
        assert.equal(chord.size, size);
        assert.ok(chord.label.length > 0);
        assert.equal(chord.notes.length, chordToneCountBySize[size]);
        assert.deepEqual(
          chord.notes.map(({ role }) => role),
          chordToneRoles.slice(0, chordToneCountBySize[size]),
          `${tonic} ${scaleName} ${chord.root.name} ${size} tone roles`,
        );
        assert.equal(
          new Set(chord.notes.map(({ pitchClass }) => pitchClass)).size,
          chord.notes.length,
          `${tonic} ${scaleName} ${chord.root.name} ${size} must not duplicate pitch classes`,
        );

        chord.notes.forEach((chordTone) => {
          assert.equal(getPitchClass(chordTone.name), chordTone.pitchClass);
          assert.equal(
            getChordToneIntervalName(chord, chordTone.pitchClass),
            chordTone.intervalName,
          );

          if (scaleName !== "blues") {
            assert.ok(
              scalePitchClasses.has(chordTone.pitchClass),
              `${tonic} ${scaleName} ${chord.root.name} ${size} must remain diatonic`,
            );
          }

          positionsByString.forEach((stringPositions) => {
            assert.ok(
              stringPositions.some(
                ({ pitchClass }) => pitchClass === chordTone.pitchClass,
              ),
              `${tonic} ${scaleName} ${chord.root.name} ${size} tone ${chordTone.name} must appear on every string in the 12-fret view`,
            );
          });
        });
      });
    });
  }
}

assert.equal(hasCagedTuning(standardTuning), true);
assert.equal(hasCagedTuning(getDefaultTuning(7)), true);
assert.equal(hasCagedTuning(getDefaultTuning(8)), true);
assert.equal(hasCagedTuning(downOneSemitoneTuning), true);
assert.equal(hasCagedTuning(extendedTuning), true);
assert.equal(hasCagedTuning(dropDTuning), false);
assert.deepEqual(
  getAvailableScaleShapeSystems("major", standardTuning, "A", 24),
  ["3nps", "caged", "pentatonic"],
);
assert.deepEqual(
  getAvailableScaleShapeSystems("minor", standardTuning, "A", 24),
  ["3nps", "caged", "pentatonic"],
);
assert.deepEqual(getAvailableScaleShapeSystems("major", dropDTuning, "A", 24), [
  "3nps",
  "pentatonic",
]);
assert.deepEqual(
  getAvailableScaleShapeSystems("major", standardTuning, "A", 12),
  ["3nps", "caged", "pentatonic"],
  "The 12-fret octave view must retain CAGED",
);
assert.deepEqual(
  getAvailableScaleShapeSystems("minor", standardTuning, "A", 12),
  ["3nps", "caged", "pentatonic"],
);
assert.deepEqual(getAvailableScaleShapeSystems("major", dropDTuning, "A", 12), [
  "3nps",
  "pentatonic",
]);
assert.deepEqual(
  getAvailableScaleShapeSystems("harmonic-minor", standardTuning, "A", 24),
  ["3nps"],
);
assert.deepEqual(
  getAvailableScaleShapeSystems("phrygian-dominant", standardTuning, "A", 24),
  ["3nps"],
);
assert.deepEqual(
  getAvailableScaleShapeSystems("blues", standardTuning, "A", 24),
  ["pentatonic"],
);
assert.deepEqual(
  getScaleShapeSystem("caged", "major").shapes.map(
    ({ shortLabel }) => shortLabel,
  ),
  ["C", "A", "G", "E", "D"],
);
assert.equal(
  buildScaleShape("caged", standardTuning, 24, "A", "harmonic-minor", 0).size,
  0,
);
assert.equal(
  buildScaleShape("caged", dropDTuning, 24, "A", "major", 0).size,
  0,
);

let chordState = fretboardReducer(undefined, { type: "theory/init" });
assert.equal(chordState.chordSize, "triad");
assert.equal(chordState.displayMode, "notes");
chordState = fretboardReducer(chordState, setChordSize("seventh"));
assert.equal(chordState.chordSize, "seventh");
assert.equal(chordState.displayMode, "chord-tones");

let progressionLabState = progressionLabReducer(undefined, {
  type: "theory/init",
});
progressionLabState = progressionLabReducer(
  progressionLabState,
  setSelectedVoicingSignature({
    signature: "first-step-voicing",
    stepId: "axis-four-step-1",
  }),
);
progressionLabState = progressionLabReducer(
  progressionLabState,
  setProgressionActiveStep(1),
);
progressionLabState = progressionLabReducer(
  progressionLabState,
  setSelectedVoicingSignature({
    signature: "second-step-voicing",
    stepId: "axis-four-step-2",
  }),
);
assert.deepEqual(progressionLabState.selectedVoicingSignaturesByStepId, {
  "axis-four-step-1": "first-step-voicing",
  "axis-four-step-2": "second-step-voicing",
});
progressionLabState = progressionLabReducer(
  progressionLabState,
  setSelectedVoicingSignature({
    signature: null,
    stepId: "axis-four-step-1",
  }),
);
assert.deepEqual(progressionLabState.selectedVoicingSignaturesByStepId, {
  "axis-four-step-2": "second-step-voicing",
});
progressionLabState = progressionLabReducer(
  progressionLabState,
  resetProgressionDetail(),
);
assert.equal(progressionLabState.activeStepIndex, 0);
assert.deepEqual(progressionLabState.selectedVoicingSignaturesByStepId, {});

let sharedContextState = fretboardReducer(undefined, { type: "theory/init" });
sharedContextState = fretboardReducer(sharedContextState, setStringCount(7));
assert.deepEqual(sharedContextState.tuning, getDefaultTuning(7));
assert.deepEqual(
  sharedContextState.registeredTuning,
  getDefaultRegisteredTuning(7),
);
sharedContextState = fretboardReducer(
  sharedContextState,
  setTuningNote({ pitchClass: 1, tuningNoteIndex: 0 }),
);
assert.equal(sharedContextState.registeredTuning.status, "unregistered");
sharedContextState = fretboardReducer(
  sharedContextState,
  setActiveProgressionChord({
    progressionSlug: "axis-four",
    stepId: "axis-four-step-3",
  }),
);
sharedContextState = fretboardReducer(sharedContextState, setKey("G"));
sharedContextState = fretboardReducer(sharedContextState, setScale("major"));
assert.equal(sharedContextState.currentKey, "G");
assert.equal(sharedContextState.currentScale, "major");
assert.equal(sharedContextState.stringCount, 7);
assert.equal(sharedContextState.tuning[0], 1);
assert.deepEqual(sharedContextState.activeProgressionChord, {
  progressionSlug: "axis-four",
  stepId: "axis-four-step-3",
});
sharedContextState = fretboardReducer(
  sharedContextState,
  setTuningNote({ pitchClass: getDefaultTuning(7)[0], tuningNoteIndex: 0 }),
);
assert.deepEqual(
  sharedContextState.registeredTuning,
  getDefaultRegisteredTuning(7),
);
sharedContextState = fretboardReducer(
  sharedContextState,
  setSelectedChordDegree(2),
);
assert.equal(sharedContextState.activeProgressionChord, null);
chordState = fretboardReducer(chordState, setSelectedChordDegree(5));
chordState = fretboardReducer(chordState, setChordSize("ninth"));
assert.equal(chordState.selectedChordDegree, 5);
assert.equal(chordState.chordSize, "ninth");
chordState = fretboardReducer(chordState, setScale("minor"));
assert.equal(chordState.selectedChordDegree, 1);
assert.equal(chordState.chordSize, "ninth");
assert.equal(chordState.displayMode, "chord-tones");

let shapeState = fretboardReducer(undefined, { type: "theory/init" });
shapeState = fretboardReducer(shapeState, toggleShapeSystem("caged"));
shapeState = fretboardReducer(shapeState, setActiveShape(1));
assert.equal(shapeState.shapeSystem, "caged");
assert.equal(shapeState.activeShape, 1);
assert.equal(shapeState.showShapes, true);
shapeState = fretboardReducer(shapeState, setFretNoteCount(12));
assert.equal(shapeState.fretCount, 12);
assert.equal(shapeState.shapeSystem, "caged");
assert.equal(shapeState.activeShape, 1);
assert.equal(shapeState.showShapes, true);
shapeState = fretboardReducer(shapeState, setFretNoteCount(24));
assert.equal(shapeState.fretCount, 24);
assert.equal(shapeState.shapeSystem, "caged");
assert.equal(shapeState.activeShape, 1);
assert.equal(shapeState.showShapes, true);
shapeState = fretboardReducer(shapeState, setStringCount(8));
shapeState = fretboardReducer(
  shapeState,
  setTuningNote({ pitchClass: 0, tuningNoteIndex: 7 }),
);
assert.equal(shapeState.shapeSystem, "caged");
assert.equal(shapeState.activeShape, 1);
assert.equal(shapeState.showShapes, true);
shapeState = fretboardReducer(
  shapeState,
  setTuningNote({ pitchClass: 2, tuningNoteIndex: 5 }),
);
assert.equal(shapeState.shapeSystem, "3nps");
assert.equal(shapeState.activeShape, 0);
assert.equal(shapeState.showShapes, false);

let wrappedKeyShapeState = fretboardReducer(undefined, {
  type: "theory/init",
});
wrappedKeyShapeState = fretboardReducer(
  wrappedKeyShapeState,
  toggleShapeSystem("caged"),
);
wrappedKeyShapeState = fretboardReducer(
  wrappedKeyShapeState,
  setActiveShape(4),
);
wrappedKeyShapeState = fretboardReducer(
  wrappedKeyShapeState,
  setFretNoteCount(12),
);
wrappedKeyShapeState = fretboardReducer(wrappedKeyShapeState, setKey("C#"));
assert.equal(wrappedKeyShapeState.shapeSystem, "caged");
assert.equal(wrappedKeyShapeState.activeShape, 4);
assert.equal(wrappedKeyShapeState.showShapes, true);

let keyShapeState = fretboardReducer(undefined, { type: "theory/init" });
keyShapeState = fretboardReducer(keyShapeState, setKey("C#"));
keyShapeState = fretboardReducer(keyShapeState, setFretNoteCount(14));
keyShapeState = fretboardReducer(keyShapeState, toggleShapeSystem("caged"));
keyShapeState = fretboardReducer(keyShapeState, setActiveShape(3));
assert.equal(keyShapeState.shapeSystem, "caged");
assert.equal(keyShapeState.showShapes, true);
keyShapeState = fretboardReducer(keyShapeState, setKey("A"));
assert.equal(keyShapeState.shapeSystem, "3nps");
assert.equal(keyShapeState.activeShape, 0);
assert.equal(keyShapeState.showShapes, false);

const wrapPositionsToTwelve = (positions: Set<string>): Set<string> =>
  new Set(
    [...positions].map((position) => {
      const [stringIndex, fret] = position.split("-").map(Number);
      return `${stringIndex}-${((fret - 1) % 12) + 1}`;
    }),
  );

const expandPositionsToTwentyFour = (positions: Set<string>): Set<string> =>
  new Set(
    [...positions].flatMap((position) => {
      const [stringIndex, fret] = position.split("-").map(Number);
      return [`${stringIndex}-${fret}`, `${stringIndex}-${fret + 12}`];
    }),
  );

let verifiedShapeCount = 0;

for (const scaleName of scaleNames) {
  const standardSystems = getAvailableScaleShapeSystems(
    scaleName,
    standardTuning,
    "A",
    24,
  );

  if (["harmonic-minor", "phrygian-dominant"].includes(scaleName)) {
    assert.ok(!standardSystems.includes("pentatonic"));
  }

  if (scaleName === "blues") {
    assert.ok(!standardSystems.includes("3nps"));
  }

  for (const { name: tonic } of tonicOptions) {
    const scaleTones = getScaleTones(tonic, scaleName);
    const scalePitchClasses = new Set(
      scaleTones.map((tone) => tone.pitchClass),
    );
    const blueNotePitchClass = scaleTones.find(
      (tone) => tone.degreeLabel === "b5",
    )?.pitchClass;

    for (const stringCount of [6, 7, 8] as GuitarStringCount[]) {
      const tuning = getDefaultTuning(stringCount);
      const availableSystems = getAvailableScaleShapeSystems(
        scaleName,
        tuning,
        tonic,
        24,
      );

      for (const system of availableSystems) {
        const shapeOptions = getScaleShapeSystem(system, scaleName).shapes;
        const shapeSignatures = new Set<string>();
        const wrappedShapeSignatures = new Set<string>();

        if (system === "caged") {
          assert.ok(
            getAvailableScaleShapeSystems(
              scaleName,
              tuning,
              tonic,
              12,
            ).includes("caged"),
            `${tonic} ${scaleName} CAGED must remain available at 12 frets`,
          );
        }

        shapeOptions.forEach((_, shapeIndex) => {
          const positions = buildScaleShape(
            system,
            tuning,
            24,
            tonic,
            scaleName,
            shapeIndex,
          );
          verifiedShapeCount += 1;
          assert.ok(
            positions.size > 0,
            `${tonic} ${scaleName} ${system} ${shapeIndex + 1} is empty on ${stringCount} strings`,
          );
          shapeSignatures.add([...positions].sort().join("|"));
          const wrappedPositions = buildScaleShape(
            system,
            tuning,
            12,
            tonic,
            scaleName,
            shapeIndex,
          );
          verifiedShapeCount += 1;
          wrappedShapeSignatures.add([...wrappedPositions].sort().join("|"));
          assert.deepEqual(
            [...wrappedPositions].sort(),
            [...wrapPositionsToTwelve(positions)].sort(),
            `${tonic} ${scaleName} ${system} ${shapeIndex + 1} 12-fret wrap`,
          );
          assert.deepEqual(
            [...positions].sort(),
            [...expandPositionsToTwentyFour(wrappedPositions)].sort(),
            `${tonic} ${scaleName} ${system} ${shapeIndex + 1} must have two octave-equivalent 24-fret placements`,
          );

          if (system === "3nps") {
            assert.equal(
              positions.size,
              stringCount * 6,
              `${tonic} ${scaleName} 3NPS ${shapeIndex + 1} must contain two three-note-per-string placements`,
            );
            assert.equal(wrappedPositions.size, stringCount * 3);
          }

          if (system === "pentatonic" && scaleName !== "blues") {
            assert.equal(
              positions.size,
              stringCount * 4,
              `${tonic} ${scaleName} pentatonic ${shapeIndex + 1} must contain two two-note-per-string placements`,
            );
            assert.equal(wrappedPositions.size, stringCount * 2);
          }

          if (system === "caged") {
            assert.equal(
              positions.size,
              34,
              `${tonic} ${scaleName} CAGED ${shapeIndex + 1} must contain two 17-note placements`,
            );
            const anchors = buildCagedChordShape(
              tuning,
              24,
              tonic,
              scaleName,
              shapeIndex,
            );
            const expectedAnchorCounts = [5, 5, 6, 6, 4];
            assert.equal(
              anchors.size,
              expectedAnchorCounts[shapeIndex] * 2,
              `${tonic} ${scaleName} CAGED ${shapeIndex + 1} two-placement anchor count`,
            );

            const wrappedAnchors = buildCagedChordShape(
              tuning,
              12,
              tonic,
              scaleName,
              shapeIndex,
            );
            assert.deepEqual(
              [...wrappedAnchors].sort(),
              [...wrapPositionsToTwelve(anchors)].sort(),
              `${tonic} ${scaleName} CAGED ${shapeIndex + 1} 12-fret chord wrap`,
            );
            assert.deepEqual(
              [...anchors].sort(),
              [...expandPositionsToTwentyFour(wrappedAnchors)].sort(),
              `${tonic} ${scaleName} CAGED ${shapeIndex + 1} must have two octave-equivalent chord anchors`,
            );
            assert.equal(wrappedPositions.size, 17);
            assert.equal(wrappedAnchors.size, expectedAnchorCounts[shapeIndex]);

            const wrappedAnchorIntervals = new Set<number>();
            wrappedAnchors.forEach((position) => {
              assert.ok(wrappedPositions.has(position));
              const [stringIndex, fret] = position.split("-").map(Number);
              assert.ok(stringIndex >= 0 && stringIndex < 6);
              assert.ok(fret >= 1 && fret <= 12);
              const pitchClass = getFretPitchClass(tuning[stringIndex], fret);
              wrappedAnchorIntervals.add(
                (pitchClass - getPitchClass(tonic) + 12) % 12,
              );
            });
            assert.deepEqual(
              [...wrappedAnchorIntervals].sort(
                (first, second) => first - second,
              ),
              scaleName === "major" ? [0, 4, 7] : [0, 3, 7],
              `${tonic} ${scaleName} CAGED ${shapeIndex + 1} wrapped chord tones`,
            );

            const anchorIntervals = new Set<number>();
            anchors.forEach((position) => {
              assert.ok(
                positions.has(position),
                `${tonic} ${scaleName} CAGED anchor must belong to its scale shape`,
              );
              const [stringIndex, fret] = position.split("-").map(Number);
              const pitchClass = getFretPitchClass(tuning[stringIndex], fret);
              anchorIntervals.add(
                (pitchClass - getPitchClass(tonic) + 12) % 12,
              );
            });
            assert.deepEqual(
              [...anchorIntervals].sort((first, second) => first - second),
              scaleName === "major" ? [0, 4, 7] : [0, 3, 7],
              `${tonic} ${scaleName} CAGED ${shapeIndex + 1} chord tones`,
            );

            for (let stringIndex = 0; stringIndex < 6; stringIndex++) {
              const notesOnString = [...wrappedPositions].filter((position) =>
                position.startsWith(`${stringIndex}-`),
              ).length;
              assert.ok(
                notesOnString >= 2 && notesOnString <= 3,
                `${tonic} ${scaleName} CAGED ${shapeIndex + 1} wrapped string ${stringIndex + 1} note count`,
              );
            }

            if (stringCount > 6) {
              assert.deepEqual(
                [...positions].sort(),
                [
                  ...buildScaleShape(
                    "caged",
                    getDefaultTuning(6),
                    24,
                    tonic,
                    scaleName,
                    shapeIndex,
                  ),
                ].sort(),
                `${tonic} ${scaleName} CAGED must retain its six-string core`,
              );
              assert.deepEqual(
                [...wrappedPositions].sort(),
                [
                  ...buildScaleShape(
                    "caged",
                    getDefaultTuning(6),
                    12,
                    tonic,
                    scaleName,
                    shapeIndex,
                  ),
                ].sort(),
                `${tonic} ${scaleName} wrapped CAGED must retain its six-string core`,
              );
              assert.deepEqual(
                [...wrappedAnchors].sort(),
                [
                  ...buildCagedChordShape(
                    getDefaultTuning(6),
                    12,
                    tonic,
                    scaleName,
                    shapeIndex,
                  ),
                ].sort(),
                `${tonic} ${scaleName} wrapped CAGED anchors must retain their six-string core`,
              );
            }
          }

          positions.forEach((position) => {
            const [stringIndex, fret] = position.split("-").map(Number);
            assert.ok(stringIndex >= 0 && stringIndex < tuning.length);
            assert.ok(fret >= 1 && fret <= 24);

            if (system === "caged") {
              assert.ok(stringIndex < 6);
            }

            const pitchClass = getFretPitchClass(tuning[stringIndex], fret);
            assert.ok(
              scalePitchClasses.has(pitchClass),
              `${tonic} ${scaleName} ${system} contains an out-of-scale pitch class`,
            );
          });

          wrappedPositions.forEach((position) => {
            const [stringIndex, fret] = position.split("-").map(Number);
            assert.ok(stringIndex >= 0 && stringIndex < tuning.length);
            assert.ok(fret >= 1 && fret <= 12);

            if (system === "caged") {
              assert.ok(stringIndex < 6);
            }

            const pitchClass = getFretPitchClass(tuning[stringIndex], fret);
            assert.ok(
              scalePitchClasses.has(pitchClass),
              `${tonic} ${scaleName} wrapped ${system} contains an out-of-scale pitch class`,
            );
          });

          if (system === "pentatonic" && scaleName === "blues") {
            assert.notEqual(blueNotePitchClass, undefined);
            const containsBlueNote = [...positions].some((position) => {
              const [stringIndex, fret] = position.split("-").map(Number);
              return (
                getFretPitchClass(tuning[stringIndex], fret) ===
                blueNotePitchClass
              );
            });
            assert.ok(
              containsBlueNote,
              `${tonic} minor-blues box ${shapeIndex + 1} must include its b5 blue note`,
            );
            const wrappedContainsBlueNote = [...wrappedPositions].some(
              (position) => {
                const [stringIndex, fret] = position.split("-").map(Number);
                return (
                  getFretPitchClass(tuning[stringIndex], fret) ===
                  blueNotePitchClass
                );
              },
            );
            assert.ok(
              wrappedContainsBlueNote,
              `${tonic} wrapped minor-blues box ${shapeIndex + 1} must include its b5 blue note`,
            );
          }
        });

        assert.equal(
          shapeSignatures.size,
          shapeOptions.length,
          `${tonic} ${scaleName} ${system} shapes must be distinct`,
        );
        assert.equal(
          wrappedShapeSignatures.size,
          shapeOptions.length,
          `${tonic} ${scaleName} wrapped ${system} shapes must be distinct`,
        );
      }
    }
  }
}

const aMajorAFormTwelve = buildScaleShape(
  "caged",
  standardTuning,
  12,
  "A",
  "major",
  1,
);
assert.deepEqual(
  [...aMajorAFormTwelve].sort(),
  [
    "0-12",
    "0-2",
    "1-12",
    "1-2",
    "1-3",
    "2-1",
    "2-11",
    "2-2",
    "3-11",
    "3-12",
    "3-2",
    "4-11",
    "4-12",
    "4-2",
    "5-10",
    "5-12",
    "5-2",
  ],
  "A major A form must continue from frets 10-12 to frets 1-3",
);
assert.deepEqual(
  [...buildScaleShape("caged", standardTuning, 24, "A", "major", 1)].sort(),
  [...expandPositionsToTwentyFour(aMajorAFormTwelve)].sort(),
  "A major A form must appear in both 24-fret octave placements and wrap at fret 24",
);

const aMajorAFormAnchorsTwelve = buildCagedChordShape(
  standardTuning,
  12,
  "A",
  "major",
  1,
);
assert.deepEqual(
  [...aMajorAFormAnchorsTwelve].sort(),
  ["0-12", "1-2", "2-2", "3-2", "4-12"],
  "A major A-form chord anchors must wrap with the scale shape",
);
assert.deepEqual(
  [...buildCagedChordShape(standardTuning, 24, "A", "major", 1)].sort(),
  [...expandPositionsToTwentyFour(aMajorAFormAnchorsTwelve)].sort(),
  "A major A-form chord anchors must follow both 24-fret placements",
);
assert.deepEqual(
  [...buildCagedChordShape(standardTuning, 24, "A", "major", 3)].sort(),
  [
    "0-17",
    "0-5",
    "1-17",
    "1-5",
    "2-18",
    "2-6",
    "3-19",
    "3-7",
    "4-19",
    "4-7",
    "5-17",
    "5-5",
  ],
  "A major E-shape chord anchors must appear one octave apart",
);
assert.deepEqual(
  [...buildCagedChordShape(standardTuning, 24, "A", "minor", 0)].sort(),
  [
    "0-12",
    "0-24",
    "1-10",
    "1-22",
    "2-21",
    "2-9",
    "3-10",
    "3-22",
    "4-12",
    "4-24",
  ],
  "A natural-minor C-shape chord anchors must appear one octave apart",
);

const aMajorEFourteen = buildScaleShape(
  "caged",
  standardTuning,
  14,
  "A",
  "major",
  3,
);
assert.equal(
  aMajorEFourteen.size,
  17,
  "non-standard fret counts must retain a single CAGED placement",
);
assert.ok(
  [...aMajorEFourteen].every(
    (position) => Number(position.split("-")[1]) <= 14,
  ),
  "non-standard fret counts must not use 24-fret wrapping",
);

assert.deepEqual(
  [...buildScaleShape("3nps", standardTuning, 24, "C", "major", 0)]
    .filter((position) => position.startsWith("0-"))
    .sort(),
  ["0-1", "0-10", "0-12", "0-13", "0-22", "0-24"],
  "C major 3NPS position 1 must wrap its second high-E-string placement past fret 24",
);
assert.deepEqual(
  [...buildScaleShape("pentatonic", standardTuning, 24, "C", "major", 1)]
    .filter((position) => position.startsWith("1-"))
    .sort(),
  ["1-1", "1-10", "1-13", "1-22"],
  "C major pentatonic box 2 must wrap its second B-string placement past fret 24",
);

console.log(
  `Theory verification passed for ${tonicOptions.length} tonics, ${scaleNames.length} scales, ${verifiedChordCount} scale chords, ${verifiedShapeCount} shape/tuning combinations, ${progressionCatalog.length} progression templates (${verifiedProgressionResolutionCount} resolved chord events), ${verifiedVoicingContextCount} complete chord/tuning voicing contexts (${verifiedGeneratedVoicingCount} generated voicings), ${verifiedPracticeExampleCount} authored practice tabs, ${verifiedResolvedPracticeContextCount} resolved practice contexts, ${verifiedMusicalContextAssertions} musical-context assertion groups, and ${verifiedVoiceLeadingAssertions} voice-leading assertion groups.`,
);
