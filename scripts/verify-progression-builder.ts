import assert from "node:assert/strict";
import { buildImprovisationGuidance } from "../src/features/improvisation";
import { analyzeProgressionContext } from "../src/features/musical-context";
import {
  type AuthoredProgression,
  appendAuthoredChord,
  authoredProgressionSchemaVersion,
  deleteAuthoredProgression,
  isAuthoredProgression,
  moveAuthoredChord,
  type ProgressionStorage,
  parseAuthoredProgressionStore,
  readAuthoredProgressionStore,
  removeAuthoredChord,
  replaceAuthoredChord,
  resolveAuthoredChord,
  resolveAuthoredProgression,
  upsertAuthoredProgression,
  validateDraftForSave,
  writeAuthoredProgressionStore,
} from "../src/features/progression-builder";
import {
  getRegisteredTuningPreset,
  getTuningPitchClasses,
} from "../src/features/tunings";
import { generateVoiceLeadingPathways } from "../src/features/voice-leading";
import {
  buildResolvedChordVoicingRequest,
  generateChordVoicings,
} from "../src/features/voicings";
import type { RegisteredTuningState } from "../src/helpers/typesHelpers";

const progression: AuthoredProgression = {
  context: { scale: "major", tonic: "C" },
  createdAt: "2026-10-16T00:00:00.000Z",
  form: "loop",
  id: "builder-verification",
  name: "Exact colors",
  steps: [
    { chord: { formulaId: "major", root: "C" }, id: "one" },
    { chord: { formulaId: "minor", root: "A" }, id: "two" },
    { chord: { formulaId: "dominant7", root: "D" }, id: "three" },
    { chord: { bass: "B", formulaId: "major7", root: "G" }, id: "four" },
  ],
  updatedAt: "2026-10-16T00:00:00.000Z",
  version: authoredProgressionSchemaVersion,
};

const resolved = resolveAuthoredProgression(progression);
const authoredContext = { currentKey: "C", currentScale: "major" } as const;
assert.deepEqual(resolved.chordNames, ["C", "Am", "D7", "Gmaj7/B"]);
assert.deepEqual(
  resolved.steps.map(({ chord }) => chord.tones.map(({ name }) => name)),
  [
    ["C", "E", "G"],
    ["A", "C", "E"],
    ["D", "F#", "A", "C"],
    ["G", "B", "D", "F#"],
  ],
);
assert.equal(
  resolveAuthoredChord({ formulaId: "power5", root: "E" }, authoredContext)
    .name,
  "E5",
);
assert.throws(() =>
  resolveAuthoredChord(
    { bass: "F", formulaId: "major", root: "C" },
    authoredContext,
  ),
);

const recontextualized = resolveAuthoredProgression(progression, {
  currentKey: "E",
  currentScale: "minor",
});
assert.deepEqual(recontextualized.chordNames, resolved.chordNames);
assert.deepEqual(
  recontextualized.steps.map(({ chord }) => chord.pitchClasses),
  resolved.steps.map(({ chord }) => chord.pitchClasses),
  "Changing analysis context must not transpose authored chords",
);
assert.equal(
  buildImprovisationGuidance(resolved, 0).activeStep.chord.name,
  "C",
);

const scenario = (
  id: string,
  tonic: AuthoredProgression["context"]["tonic"],
  scale: AuthoredProgression["context"]["scale"],
  chords: ReadonlyArray<AuthoredProgression["steps"][number]["chord"]>,
) =>
  resolveAuthoredProgression({
    ...progression,
    context: { scale, tonic },
    id,
    steps: chords.map((chord, index) => ({ chord, id: `${id}-${index}` })),
  });

const scenarioA = scenario("scenario-a", "E", "minor", [
  { formulaId: "minor", root: "E" },
  { formulaId: "major", root: "C" },
  { formulaId: "major", root: "G" },
  { formulaId: "major", root: "D" },
]);
assert.deepEqual(scenarioA.chordNames, ["Em", "C", "G", "D"]);
assert.equal(scenarioA.compatible, true);
assert.equal(buildImprovisationGuidance(scenarioA, 3).isLoopClosure, true);

const scenarioB = scenario("scenario-b", "E", "minor", [
  { formulaId: "minor", root: "E" },
  { formulaId: "major", root: "C" },
  { formulaId: "minor", root: "A" },
  { formulaId: "dominant7", root: "B" },
]);
assert.deepEqual(
  scenarioB.steps[3].chord.tones.map(({ name }) => name),
  ["B", "D#", "F#", "A"],
);
assert.equal(scenarioB.steps[3].chord.harmonicScope, "chromatic");

const scenarioC = scenario("scenario-c", "C", "major", [
  { formulaId: "major", root: "C" },
  { formulaId: "major", root: "F" },
  { formulaId: "minor", root: "F" },
  { formulaId: "major", root: "C" },
]);
const fToFm = analyzeProgressionContext(scenarioC).steps[1].nextTransition;
assert.deepEqual(
  fToFm?.commonTones.map(({ toneInFromChord }) => toneInFromChord.name),
  ["F", "C"],
);
assert.deepEqual(
  fToFm?.leavingTones.map(({ name }) => name),
  ["A"],
);
assert.deepEqual(
  fToFm?.enteringTones.map(({ name }) => name),
  ["Ab"],
);

const powerProgression = scenario("scenario-power", "E", "minor", [
  { formulaId: "power5", root: "E" },
  { formulaId: "power5", root: "A" },
]);
assert.deepEqual(
  powerProgression.steps[0].chord.tones.map(({ role }) => role),
  ["root", "fifth"],
);
assert.equal(
  buildImprovisationGuidance(powerProgression, 0).activeThird,
  undefined,
);

for (const tuningId of ["6-drop-d", "6-drop-c"] as const) {
  const preset = getRegisteredTuningPreset(tuningId);
  const registeredTuning: RegisteredTuningState = {
    id: preset.id,
    midiPitches: [...preset.midiPitchesHighToLow],
    source: preset.source,
    status: "verified",
    version: 1,
  };
  assert.ok(
    generateChordVoicings(
      buildResolvedChordVoicingRequest(scenarioA.steps[0].chord, {
        registeredTuning,
        stringCount: 6,
        tuning: getTuningPitchClasses(preset),
      }),
    ).length > 0,
  );
  assert.equal(
    generateVoiceLeadingPathways({
      fretCount: 24,
      registeredTuning,
      steps: scenarioA.steps,
      stringCount: 6,
    }).available,
    true,
  );
}
assert.equal(
  generateVoiceLeadingPathways({
    fretCount: 24,
    registeredTuning: {
      midiPitches: null,
      reason: "pitch-class-only-custom",
      status: "unregistered",
      version: 1,
    },
    steps: scenarioA.steps,
    stringCount: 6,
  }).available,
  false,
);

let edited = progression.steps;
edited = appendAuthoredChord(
  edited,
  { formulaId: "power5", root: "E" },
  "five",
);
edited = replaceAuthoredChord(edited, 1, { formulaId: "major", root: "F" });
edited = moveAuthoredChord(edited, 4, -1);
edited = removeAuthoredChord(edited, 0);
assert.deepEqual(
  edited.map(({ id }) => id),
  ["two", "three", "five", "four"],
);
assert.equal(validateDraftForSave({ name: "", steps: edited }).length, 0);
assert.equal(validateDraftForSave({ name: "Valid", steps: edited }).length, 0);
assert.equal(isAuthoredProgression(progression), true);
assert.equal(
  isAuthoredProgression({
    ...progression,
    steps: [{ chord: { formulaId: "major", root: "C" }, id: "only" }],
  }),
  false,
);
assert.equal(
  validateDraftForSave({
    name: "Valid",
    steps: Array.from({ length: 9 }, (_, index) => ({
      chord: { formulaId: "major" as const, root: "C" as const },
      id: `over-${index}`,
    })),
  }).length,
  1,
);
assert.equal(isAuthoredProgression({ ...progression, form: "bridge" }), false);
assert.equal(isAuthoredProgression({ ...progression, version: 2 }), false);
assert.equal(
  isAuthoredProgression({
    ...progression,
    steps: [
      { chord: { formulaId: "major", root: "C" }, id: "duplicate" },
      { chord: { formulaId: "major", root: "C" }, id: "duplicate" },
    ],
  }),
  false,
);
assert.equal(
  isAuthoredProgression({
    ...progression,
    steps: [
      { chord: { formulaId: "major", root: "C" }, id: "duplicate-a" },
      { chord: { formulaId: "major", root: "C" }, id: "duplicate-b" },
    ],
  }),
  true,
);
assert.equal(
  isAuthoredProgression({
    ...progression,
    steps: [
      { chord: { formulaId: "major", root: "H" }, id: "bad-root" },
      { chord: { formulaId: "major", root: "C" }, id: "valid" },
    ],
  }),
  false,
);
assert.equal(
  isAuthoredProgression({
    ...progression,
    steps: [
      { chord: { formulaId: "quartal", root: "C" }, id: "bad-formula" },
      { chord: { formulaId: "major", root: "C" }, id: "valid" },
    ],
  }),
  false,
);
assert.equal(
  isAuthoredProgression({
    ...progression,
    steps: [
      { chord: { bass: "F", formulaId: "major", root: "C" }, id: "bad-bass" },
      { chord: { formulaId: "major", root: "C" }, id: "valid" },
    ],
  }),
  false,
);

class MemoryStorage implements ProgressionStorage {
  value: string | null = null;
  getItem() {
    return this.value;
  }
  setItem(_key: string, value: string) {
    this.value = value;
  }
}
const storage = new MemoryStorage();
let store = upsertAuthoredProgression(
  readAuthoredProgressionStore(storage),
  progression,
);
assert.equal(writeAuthoredProgressionStore(storage, store).ok, true);
assert.deepEqual(readAuthoredProgressionStore(storage), store);
store = upsertAuthoredProgression(store, { ...progression, name: "Updated" });
assert.equal(store.progressions.length, 1, "upsert must reject duplicate IDs");
store = deleteAuthoredProgression(store, progression.id);
assert.equal(store.progressions.length, 0);
assert.deepEqual(parseAuthoredProgressionStore("not-json").progressions, []);
assert.equal(
  writeAuthoredProgressionStore(
    {
      getItem: () => null,
      setItem: () => {
        throw new Error("quota");
      },
    },
    store,
  ).ok,
  false,
);

export const verifiedProgressionBuilderAssertions = 35;
