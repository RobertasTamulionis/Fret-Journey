import assert from "node:assert/strict";
import { practiceTabExamples } from "../src/data/practiceTabExamples";
import {
  getPracticeContextCompatibility,
  getPracticeContextSignature,
  resolvePracticeTab,
} from "../src/features/practice/resolvePracticeTab";
import {
  resolveProgressionStep,
  resolveRelativeChord,
} from "../src/features/progressions";
import {
  buildRegisteredTuningState,
  defaultRegisteredTuningIds,
  getRegisteredFretMidi,
  getRegisteredTuningPreset,
  getTuningPitchClasses,
  registeredTuningPresets,
} from "../src/features/tunings";
import {
  enumerateVoiceLeadingCandidates,
  generateVoiceLeadingPathways,
} from "../src/features/voice-leading";
import {
  buildResolvedChordVoicingRequest,
  generateChordVoicings,
} from "../src/features/voicings";
import { normalizePitchClass } from "../src/helpers/musicTheory";
import fretboardReducer, {
  setKey,
  setRegisteredTuningPreset,
  setScale,
  setStringCount,
  setTuningNote,
} from "../src/lib/redux/slices/fretboardSlice";

const expectedPresets = [
  ["6-standard-e", 6, [64, 59, 55, 50, 45, 40], "preset-default"],
  ["6-standard-eb", 6, [63, 58, 54, 49, 44, 39], "preset-alternate"],
  ["6-standard-d", 6, [62, 57, 53, 48, 43, 38], "preset-alternate"],
  ["6-drop-d", 6, [64, 59, 55, 50, 45, 38], "preset-alternate"],
  ["6-drop-c", 6, [62, 57, 53, 48, 43, 36], "preset-alternate"],
  ["7-standard-b", 7, [64, 59, 55, 50, 45, 40, 35], "preset-default"],
  ["7-drop-a", 7, [64, 59, 55, 50, 45, 40, 33], "preset-alternate"],
  ["8-standard-f-sharp", 8, [64, 59, 55, 50, 45, 40, 35, 30], "preset-default"],
  ["8-drop-e", 8, [64, 59, 55, 50, 45, 40, 35, 28], "preset-alternate"],
] as const;

assert.equal(registeredTuningPresets.length, 9);
assert.deepEqual(
  registeredTuningPresets.map(
    ({ id, midiPitchesHighToLow, source, stringCount }) => [
      id,
      stringCount,
      midiPitchesHighToLow,
      source,
    ],
  ),
  expectedPresets,
  "The registered catalog must preserve the approved high-to-low MIDI values",
);

for (const preset of registeredTuningPresets) {
  assert.equal(preset.midiPitchesHighToLow.length, preset.stringCount);
  assert.ok(
    preset.midiPitchesHighToLow.every(
      (midi, index, pitches) => index === 0 || midi < pitches[index - 1],
    ),
    `${preset.label} strings must descend from high string to low string`,
  );
  assert.deepEqual(
    getTuningPitchClasses(preset),
    preset.midiPitchesHighToLow.map(normalizePitchClass),
  );
  const registered = buildRegisteredTuningState(preset);
  assert.equal(registered.status, "verified");
  assert.equal(registered.id, preset.id);
  assert.equal(registered.source, preset.source);
}

assert.deepEqual(defaultRegisteredTuningIds, {
  6: "6-standard-e",
  7: "7-standard-b",
  8: "8-standard-f-sharp",
});
assert.equal(getRegisteredFretMidi(38, 0), 38);
assert.equal(getRegisteredFretMidi(38, 1), 39);
assert.equal(getRegisteredFretMidi(38, 12), 50);
assert.equal(getRegisteredFretMidi(38, 24), 62);

let state = fretboardReducer(undefined, { type: "initial" });
state = fretboardReducer(state, setKey("C"));
state = fretboardReducer(state, setScale("minor"));
const retainedContext = {
  currentKey: state.currentKey,
  currentScale: state.currentScale,
  fretCount: state.fretCount,
};
state = fretboardReducer(state, setRegisteredTuningPreset("6-drop-d"));
assert.equal(state.registeredTuning.status, "verified");
assert.deepEqual(state.tuning, [4, 11, 7, 2, 9, 2]);
assert.deepEqual(state.registeredTuning.midiPitches, [64, 59, 55, 50, 45, 38]);
assert.deepEqual(
  {
    currentKey: state.currentKey,
    currentScale: state.currentScale,
    fretCount: state.fretCount,
  },
  retainedContext,
  "Preset selection must not change tonal or fret context",
);

state = fretboardReducer(
  state,
  setTuningNote({ pitchClass: 4, tuningNoteIndex: 5 }),
);
assert.deepEqual(state.registeredTuning, {
  midiPitches: null,
  reason: "pitch-class-only-custom",
  status: "unregistered",
  version: 1,
});
state = fretboardReducer(
  state,
  setTuningNote({ pitchClass: 2, tuningNoteIndex: 5 }),
);
assert.equal(
  state.registeredTuning.status,
  "unregistered",
  "Manual edits must not re-register a matching preset",
);

state = fretboardReducer(state, setStringCount(7));
assert.equal(state.registeredTuning.status, "verified");
assert.equal(
  state.registeredTuning.status === "verified" && state.registeredTuning.id,
  "7-standard-b",
);
assert.equal(state.currentKey, "C");
assert.equal(state.currentScale, "minor");

const cMajor = resolveRelativeChord(
  { formulaId: "major", root: { alteration: 0, degree: 1 } },
  "C",
);
const dropCPreset = getRegisteredTuningPreset("6-drop-c");
const dropCRegistered = buildRegisteredTuningState(dropCPreset);
const dropCVoicings = generateChordVoicings(
  buildResolvedChordVoicingRequest(cMajor, {
    registeredTuning: dropCRegistered,
    stringCount: 6,
    tuning: getTuningPitchClasses(dropCPreset),
  }),
);
assert.ok(
  dropCVoicings.length > 0,
  "Drop C must produce complete C-major grips",
);
for (const voicing of dropCVoicings) {
  for (const string of voicing.strings) {
    if (string.kind === "muted") continue;
    assert.notEqual(string.openMidi, undefined);
    if (string.openMidi === undefined) {
      throw new Error("Registered voicing string must expose open MIDI");
    }
    assert.equal(string.midi, string.openMidi + string.fret);
    assert.ok(cMajor.pitchClasses.includes(string.pitchClass));
  }
}

const voiceLeadingSteps = [
  ["minor", 1, 0],
  ["major", 6, -1],
  ["major", 7, -1],
  ["minor", 1, 0],
].map(([formulaId, degree, alteration], index) =>
  resolveProgressionStep(
    {
      chord: {
        formulaId: formulaId as "major" | "minor",
        root: {
          alteration: alteration as -1 | 0,
          degree: degree as 1 | 6 | 7,
        },
      },
      durationBeats: 4,
      id: `alternate-tuning-step-${index}`,
    },
    "E",
  ),
);

for (const presetId of ["6-drop-d", "7-drop-a", "8-drop-e"] as const) {
  const preset = getRegisteredTuningPreset(presetId);
  const registeredTuning = buildRegisteredTuningState(preset);
  if (registeredTuning.status !== "verified") {
    throw new Error(`${preset.label} must build a verified tuning state`);
  }
  const result = generateVoiceLeadingPathways({
    fretCount: 24,
    registeredTuning,
    steps: voiceLeadingSteps,
    stringCount: preset.stringCount,
  });
  assert.equal(result.available, true, `${preset.label} must unlock pathways`);
  if (!result.available) continue;
  for (const pathway of Object.values(result.pathways)) {
    assert.equal(pathway.available, true);
    if (!pathway.available) continue;
    for (const target of pathway.targets) {
      assert.equal(
        registeredTuning.midiPitches[target.stringIndex] + target.fret,
        target.midi,
      );
    }
  }
}

const dropD = getRegisteredTuningPreset("6-drop-d");
const dropDOpenCandidates = enumerateVoiceLeadingCandidates(
  resolveProgressionStep(
    {
      chord: { formulaId: "major", root: { alteration: -1, degree: 7 } },
      durationBeats: 4,
      id: "drop-d-open",
    },
    "E",
  ),
  dropD.midiPitchesHighToLow,
  24,
);
assert.ok(
  dropDOpenCandidates.some(
    ({ fret, midi, stringIndex }) =>
      fret === 0 && midi === 38 && stringIndex === 5,
  ),
  "Drop D must expose the exact low open D target",
);

for (const preset of registeredTuningPresets) {
  const context = {
    currentKey: "A" as const,
    currentScale: "minor" as const,
    registeredTuning: buildRegisteredTuningState(preset),
    stringCount: preset.stringCount,
    tuning: getTuningPitchClasses(preset),
  };
  assert.doesNotThrow(() => resolvePracticeTab("daily-reset", context));
  for (const exampleId of Object.keys(practiceTabExamples) as Array<
    keyof typeof practiceTabExamples
  >) {
    const compatibility = getPracticeContextCompatibility(exampleId, context);

    if (compatibility.compatible) {
      assert.doesNotThrow(
        () => resolvePracticeTab(exampleId, context),
        `${exampleId} must resolve in every context it declares compatible`,
      );
    } else {
      assert.throws(
        () => resolvePracticeTab(exampleId, context),
        `${exampleId} must reject an incompatible registered preset`,
      );
    }
  }
}

const defaultSix = getRegisteredTuningPreset("6-standard-e");
const dropDSix = getRegisteredTuningPreset("6-drop-d");
const defaultPracticeContext = {
  currentKey: "E" as const,
  currentScale: "minor" as const,
  registeredTuning: buildRegisteredTuningState(defaultSix),
  stringCount: 6 as const,
  tuning: getTuningPitchClasses(defaultSix),
};
const alternatePracticeContext = {
  ...defaultPracticeContext,
  registeredTuning: buildRegisteredTuningState(dropDSix),
  tuning: getTuningPitchClasses(dropDSix),
};
assert.equal(
  getPracticeContextCompatibility("daily-play", defaultPracticeContext)
    .compatible,
  true,
);
const alternateCompatibility = getPracticeContextCompatibility(
  "daily-play",
  alternatePracticeContext,
);
assert.equal(alternateCompatibility.compatible, false);
assert.equal(
  alternateCompatibility.reason,
  "Open Road Hook requires the default tuning for this instrument.",
);
assert.notEqual(
  getPracticeContextSignature(defaultPracticeContext),
  getPracticeContextSignature(alternatePracticeContext),
  "Registered preset changes must reset the Practice transport context",
);
assert.equal(practiceTabExamples["daily-play"].tuningId, "standard-6");

export const verifiedRegisteredTuningAssertions = 17;
