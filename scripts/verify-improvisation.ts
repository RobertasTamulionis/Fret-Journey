import assert from "node:assert/strict";
import {
  buildImprovisationGuidance,
  getImprovisationObjectiveAvailability,
} from "../src/features/improvisation";
import {
  type ProgressionTemplate,
  parseProgressionDetailMode,
  type RelativeChordSpec,
  type ResolvedProgression,
  resolveProgression,
  resolveRelativeChord,
} from "../src/features/progressions";
import {
  getRegisteredTuningPreset,
  getTuningPitchClasses,
} from "../src/features/tunings";
import { getPitchClass } from "../src/helpers/musicTheory";

const chord = (
  degree: 1 | 2 | 3 | 4 | 5 | 6 | 7,
  formulaId: RelativeChordSpec["formulaId"],
  alteration: RelativeChordSpec["root"]["alteration"] = 0,
  harmonicScope?: RelativeChordSpec["harmonicScope"],
): RelativeChordSpec => ({
  formulaId,
  harmonicScope,
  root: { alteration, degree },
});

const template = (
  id: string,
  form: ProgressionTemplate["form"],
  chords: readonly RelativeChordSpec[],
): ProgressionTemplate => ({
  category: "pop-rock-loop",
  compatibleScales: ["major", "minor"],
  explanation: "Improvisation verification fixture.",
  form,
  harmonicDevices: ["diatonic", "borrowed"],
  id,
  moodTags: ["verification"],
  reviewStatus: "verified",
  slug: id,
  sourceReferenceIds: ["fret-journey-editorial-2026-08"],
  steps: chords.map((stepChord, index) => ({
    chord: stepChord,
    durationBeats: 4,
    id: `${id}-${index + 1}`,
  })),
  styleTags: ["rock"],
  title: id,
  tonalFramework: "minor",
});

const noteNames = (progression: ResolvedProgression): string[][] =>
  progression.steps.map(({ chord: resolvedChord }) =>
    resolvedChord.tones.map(({ name }) => name),
  );

const emLoop = resolveProgression(
  template("verify-em-loop", "loop", [
    chord(1, "minor"),
    chord(6, "major", -1),
    chord(3, "major", -1),
    chord(7, "major", -1),
  ]),
  { currentKey: "E", currentScale: "minor" },
);

assert.deepEqual(noteNames(emLoop), [
  ["E", "G", "B"],
  ["C", "E", "G"],
  ["G", "B", "D"],
  ["D", "F#", "A"],
]);
assert.deepEqual(
  emLoop.steps.map(
    (_, index) => buildImprovisationGuidance(emLoop, index).activeThird?.name,
  ),
  ["G", "E", "B", "F#"],
);

const emFirst = buildImprovisationGuidance(emLoop, 0);
assert.deepEqual(
  emFirst.transition?.commonTones.map(
    ({ toneInFromChord }) => toneInFromChord.name,
  ),
  ["E", "G"],
);
assert.ok(
  emFirst.pitchContexts
    .get(getPitchClass("B"))
    ?.approaches.some(
      ({ direction, distanceSemitones, targetTone }) =>
        direction === "ascending" &&
        distanceSemitones === 1 &&
        targetTone.name === "C",
    ),
);
const emLast = buildImprovisationGuidance(emLoop, 3);
assert.equal(emLast.isLoopClosure, true);
assert.equal(emLast.nextStep?.chord.name, "Em");

const borrowedLoop = resolveProgression(
  template("verify-borrowed-loop", "loop", [
    chord(1, "major"),
    chord(4, "major"),
    chord(4, "minor", 0, "borrowed"),
    chord(1, "major"),
  ]),
  { currentKey: "C", currentScale: "major" },
);
const fToFm = buildImprovisationGuidance(borrowedLoop, 1);
assert.deepEqual(
  fToFm.transition?.commonTones.map(
    ({ toneInFromChord }) => toneInFromChord.name,
  ),
  ["F", "C"],
);
assert.deepEqual(
  fToFm.transition?.leavingTones.map(({ name }) => name),
  ["A"],
);
assert.deepEqual(
  fToFm.transition?.enteringTones.map(({ name }) => name),
  ["Ab"],
);
const fmGuidance = buildImprovisationGuidance(borrowedLoop, 2);
const aFlat = fmGuidance.pitchContexts.get(getPitchClass("Ab"));
assert.equal(fmGuidance.activeThird?.name, "Ab");
assert.equal(aFlat?.chord.isChordTone, true);
assert.equal(aFlat?.scale.inScale, false);

const powerSource = resolveRelativeChord(chord(1, "major"), "E");
const powerDestination = resolveRelativeChord(chord(4, "major"), "E");
const asPowerChord = (resolvedChord: typeof powerSource) => ({
  ...resolvedChord,
  name: `${resolvedChord.root.name}5`,
  pitchClasses: resolvedChord.pitchClasses.filter((_, index) => index !== 1),
  tones: resolvedChord.tones.filter(({ role }) => role !== "third"),
});
const powerProgression: ResolvedProgression = {
  chordNames: ["E5", "A5"],
  compatible: true,
  formula: "I5–IV5",
  selectedScale: "minor",
  steps: [powerSource, powerDestination].map((resolvedChord, index) => ({
    chord: asPowerChord(resolvedChord),
    durationBeats: 4,
    id: `power-${index + 1}`,
  })),
  template: template("verify-power", "loop", [
    chord(1, "major"),
    chord(4, "major"),
  ]),
  tonic: "E",
};
const powerGuidance = buildImprovisationGuidance(powerProgression, 0);
assert.equal(powerGuidance.activeThird, undefined);
assert.deepEqual(
  getImprovisationObjectiveAvailability(powerGuidance, "target-third"),
  { available: false, reason: "missing-third" },
);
assert.deepEqual(
  powerGuidance.activeStep.chord.tones.map(({ role }) => role),
  ["root", "fifth"],
);
assert.ok(powerGuidance.transition);

const sequence = resolveProgression(
  template("verify-sequence", "sequence", [
    chord(1, "major"),
    chord(5, "major"),
  ]),
  { currentKey: "C", currentScale: "major" },
);
const sequenceEnding = buildImprovisationGuidance(sequence, 1);
assert.equal(sequenceEnding.nextStep, undefined);
assert.equal(sequenceEnding.transition, undefined);
assert.equal(sequenceEnding.isLoopClosure, false);

const stableFirst = buildImprovisationGuidance(emLoop, 0);
assert.deepEqual(stableFirst.suggestedApproaches, emFirst.suggestedApproaches);
assert.equal(
  parseProgressionDetailMode(new URLSearchParams("mode=improv")),
  "improv",
);
assert.equal(
  parseProgressionDetailMode(new URLSearchParams("mode=unknown")),
  "standard",
);

for (const presetId of ["6-drop-d", "6-drop-c"] as const) {
  const preset = getRegisteredTuningPreset(presetId);
  const lowStringPitchClass = getTuningPitchClasses(preset).at(-1);
  const lowStringMidi = preset.midiPitchesHighToLow.at(-1);
  assert.ok(lowStringPitchClass !== undefined);
  assert.ok(lowStringMidi !== undefined);
  assert.ok(emFirst.pitchContexts.has(lowStringPitchClass));
  assert.equal(lowStringMidi % 12, lowStringPitchClass);
}

assert.equal(
  emFirst.pitchContexts.get(getPitchClass("E"))?.chord.isChordTone,
  true,
);
assert.throws(() => buildImprovisationGuidance(emLoop, 99));

export const verifiedImprovisationAssertions = 17;
