import assert from "node:assert/strict";
import {
  practiceRoutines,
  practiceSources,
} from "../src/data/practiceRoutines";
import {
  practiceTabExampleIds,
  practiceTabExamples,
} from "../src/data/practiceTabExamples";
import {
  getProgressionBySlug,
  progressionCatalog,
  progressionCatalogValidation,
} from "../src/data/progressionCatalog";
import {
  getPracticeTabPitchClass,
  practiceTabSlotCount,
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

const routineExampleIds = practiceRoutines.flatMap((routine) => {
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

  return routine.steps.map(({ exampleId }) => exampleId);
});

assert.equal(
  new Set(routineExampleIds).size,
  routineExampleIds.length,
  "Each authored Practice tab must belong to one routine step",
);
assert.deepEqual(
  [...routineExampleIds].sort(),
  [...practiceTabExampleIds].sort(),
  "Routine steps and authored Practice tabs must stay in one-to-one alignment",
);

let verifiedPracticeExampleCount = 0;
for (const exampleId of practiceTabExampleIds) {
  const example = practiceTabExamples[exampleId];
  const slotCount = practiceTabSlotCount[example.subdivision];
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
  `Theory verification passed for ${tonicOptions.length} tonics, ${scaleNames.length} scales, ${verifiedChordCount} scale chords, ${verifiedShapeCount} shape/tuning combinations, ${progressionCatalog.length} progression templates (${verifiedProgressionResolutionCount} resolved chord events), ${verifiedVoicingContextCount} complete chord/tuning voicing contexts (${verifiedGeneratedVoicingCount} generated voicings), and ${verifiedPracticeExampleCount} authored practice tabs.`,
);
