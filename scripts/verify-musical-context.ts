import assert from "node:assert/strict";
import { getProgressionBySlug } from "../src/data/progressionCatalog";
import {
  analyzeChordTone,
  analyzeChordTransition,
  analyzeNoteInContext,
  analyzeProgressionContext,
  analyzeScaleDegree,
  buildPitchClassContextMap,
  findNearestChordToneTargetsByPitchClass,
  getScaleColorDegrees,
} from "../src/features/musical-context";
import {
  type ChordFormulaId,
  type RelativeChordSpec,
  resolveProgression,
  resolveRelativeChord,
} from "../src/features/progressions";
import { getPitchClass, getScaleTones } from "../src/helpers/musicTheory";
import type { PitchClass, TonicName } from "../src/helpers/typesHelpers";

const chord = (
  tonic: TonicName,
  formulaId: ChordFormulaId,
  degree: RelativeChordSpec["root"]["degree"],
  alteration = 0,
) =>
  resolveRelativeChord(
    {
      formulaId,
      root: {
        alteration: alteration as RelativeChordSpec["root"]["alteration"],
        degree,
      },
    },
    tonic,
  );

const pitchClass = (note: string): PitchClass => getPitchClass(note);
const scaleDegreeLabel = (
  tonic: TonicName,
  scale: Parameters<typeof analyzeScaleDegree>[0]["currentScale"],
  note: string,
) =>
  analyzeScaleDegree(
    { currentKey: tonic, currentScale: scale },
    pitchClass(note),
  ).tone?.degreeLabel;

assert.deepEqual(
  ["A", "B", "C", "D", "E", "F", "G"].map((note) =>
    scaleDegreeLabel("A", "minor", note),
  ),
  ["1", "2", "b3", "4", "5", "b6", "b7"],
  "A natural minor must expose its canonical scale degrees",
);

const aeolianDescent = getProgressionBySlug("aeolian-descent");
assert.ok(
  aeolianDescent,
  "The reference i-bVI-bIII-bVII progression must exist",
);
const aMinorProgression = resolveProgression(aeolianDescent, {
  currentKey: "A",
  currentScale: "minor",
});
assert.deepEqual(aMinorProgression.chordNames, ["Am", "F", "C", "G"]);

const [aMinor, fMajor] = aMinorProgression.steps.map(({ chord }) => chord);
assert.ok(aMinor && fMajor);
const aMinorContext = { currentKey: "A", currentScale: "minor" } as const;

const expectedAMinorRoles = [
  ["A", "1", "root"],
  ["C", "b3", "third"],
  ["E", "5", "fifth"],
] as const;
for (const [note, degreeLabel, role] of expectedAMinorRoles) {
  const analysis = analyzeNoteInContext(
    { currentKey: "A", currentScale: "minor" },
    pitchClass(note),
    aMinor,
  );
  assert.equal(analysis.scale.tone?.degreeLabel, degreeLabel);
  assert.equal(analysis.chord.tone?.role, role);
}

const expectedFMajorRoles = [
  ["F", "b6", "root"],
  ["A", "1", "third"],
  ["C", "b3", "fifth"],
] as const;
for (const [note, degreeLabel, role] of expectedFMajorRoles) {
  const analysis = analyzeNoteInContext(
    { currentKey: "A", currentScale: "minor" },
    pitchClass(note),
    fMajor,
  );
  assert.equal(analysis.scale.tone?.degreeLabel, degreeLabel);
  assert.equal(analysis.chord.tone?.role, role);
}

const aMinorToF = analyzeChordTransition(aMinor, fMajor);
assert.deepEqual(
  aMinorToF.commonTones.map(({ pitchClass: value }) => value),
  [pitchClass("A"), pitchClass("C")],
);
assert.deepEqual(
  aMinorToF.leavingTones.map(({ name }) => name),
  ["E"],
);
assert.deepEqual(
  aMinorToF.enteringTones.map(({ name }) => name),
  ["F"],
);
const eToF = findNearestChordToneTargetsByPitchClass(pitchClass("E"), fMajor);
assert.equal(eToF[0]?.targetTone.name, "F");
assert.equal(eToF[0]?.ascendingDistanceSemitones, 1);
assert.equal(eToF[0]?.minimumDistanceSemitones, 1);

const progressionAnalysis = analyzeProgressionContext(aMinorProgression);
assert.equal(progressionAnalysis.steps[1]?.step.chord.name, "F");
assert.deepEqual(
  progressionAnalysis.steps[1]?.chordToneContexts.map((analysis) => [
    analysis.scale.tone?.degreeLabel,
    analysis.chord.tone?.role,
  ]),
  [
    ["b6", "root"],
    ["1", "third"],
    ["b3", "fifth"],
  ],
);
assert.deepEqual(
  progressionAnalysis.steps[1]?.previousTransition?.commonTones.map(
    ({ pitchClass: value }) => value,
  ),
  [pitchClass("A"), pitchClass("C")],
);

const aMinorPitchClassContexts = buildPitchClassContextMap(
  aMinorContext,
  aMinor,
);
const fMajorPitchClassContexts = buildPitchClassContextMap(
  aMinorContext,
  fMajor,
);
assert.equal(aMinorPitchClassContexts.size, 12);
assert.deepEqual(
  ["A", "C", "E"].map((note) => {
    const context = aMinorPitchClassContexts.get(pitchClass(note));
    return [
      context?.scale.tone?.degreeLabel,
      context?.chord.tone?.role,
      context?.isScaleTonic,
      context?.isChordRoot,
    ];
  }),
  [
    ["1", "root", true, true],
    ["b3", "third", false, false],
    ["5", "fifth", false, false],
  ],
);
assert.deepEqual(
  ["F", "A", "C"].map((note) => {
    const context = fMajorPitchClassContexts.get(pitchClass(note));
    return [
      context?.scale.tone?.degreeLabel,
      context?.chord.tone?.role,
      context?.isScaleTonic,
      context?.isChordRoot,
    ];
  }),
  [
    ["b6", "root", false, true],
    ["1", "third", true, false],
    ["b3", "fifth", false, false],
  ],
);
assert.equal(
  aMinorPitchClassContexts.get(pitchClass("A"))?.scale.tone?.degreeLabel,
  fMajorPitchClassContexts.get(pitchClass("A"))?.scale.tone?.degreeLabel,
);
assert.notEqual(
  aMinorPitchClassContexts.get(pitchClass("A"))?.chord.tone?.role,
  fMajorPitchClassContexts.get(pitchClass("A"))?.chord.tone?.role,
);
assert.equal(
  fMajorPitchClassContexts.get(pitchClass("F"))?.isScaleColorDegree,
  true,
);

assert.deepEqual(
  getScaleTones("E", "phrygian-dominant").map(({ name, degreeLabel }) => [
    name,
    degreeLabel,
  ]),
  [
    ["E", "1"],
    ["F", "b2"],
    ["G#", "3"],
    ["A", "4"],
    ["B", "5"],
    ["C", "b6"],
    ["D", "b7"],
  ],
);
assert.deepEqual(
  getScaleColorDegrees("phrygian-dominant").map(
    ({ degreeLabel }) => degreeLabel,
  ),
  ["b2", "3"],
);
assert.deepEqual(
  getScaleColorDegrees("minor").map(({ degreeLabel }) => degreeLabel),
  ["b6"],
);
assert.deepEqual(
  getScaleColorDegrees("blues").map(({ degreeLabel }) => degreeLabel),
  ["b5"],
);
assert.deepEqual(
  getScaleColorDegrees("harmonic-minor").map(({ degreeLabel }) => degreeLabel),
  ["7"],
);
assert.deepEqual(getScaleColorDegrees("major"), []);

const cMajor = chord("C", "major", 1);
const fInC = chord("C", "major", 4);
assert.equal(scaleDegreeLabel("C", "major", "B"), "7");
assert.deepEqual(
  analyzeChordTransition(cMajor, fInC).commonTones.map(
    ({ toneInFromChord, toneInToChord }) => [
      toneInFromChord.name,
      toneInFromChord.role,
      toneInToChord.role,
    ],
  ),
  [["C", "root", "fifth"]],
);
assert.equal(
  findNearestChordToneTargetsByPitchClass(pitchClass("B"), cMajor)[0]
    ?.minimumDistanceSemitones,
  1,
);

for (const formulaId of ["sus2", "sus4"] as const) {
  const suspended = chord("C", formulaId, 1);
  assert.equal(
    suspended.tones.some(({ role }) => role === "third"),
    false,
  );
  assert.equal(analyzeChordTone(suspended, pitchClass("E")).isChordTone, false);
  assert.equal(
    buildPitchClassContextMap(
      { currentKey: "C", currentScale: "major" },
      suspended,
    ).get(pitchClass(formulaId === "sus2" ? "D" : "F"))?.chord.tone?.role,
    formulaId === "sus2" ? "second" : "fourth",
  );
}

for (const [formulaId, seventh] of [
  ["major7", "B"],
  ["minor7", "Bb"],
  ["dominant7", "Bb"],
] as const) {
  assert.equal(
    analyzeChordTone(chord("C", formulaId, 1), pitchClass(seventh)).tone?.role,
    "seventh",
  );
}

const borrowedBFlat = chord("C", "major", 7, -1);
const chromaticContext = analyzeNoteInContext(
  { currentKey: "C", currentScale: "major" },
  pitchClass("Bb"),
  borrowedBFlat,
);
assert.equal(chromaticContext.scale.inScale, false);
assert.equal(chromaticContext.chord.tone?.role, "root");
assert.equal(
  buildPitchClassContextMap(
    { currentKey: "C", currentScale: "major" },
    borrowedBFlat,
  ).get(pitchClass("Bb"))?.chord.isChordTone,
  true,
);

assert.deepEqual(
  getScaleTones("Db", "major").map(({ name }) => name),
  ["Db", "Eb", "F", "Gb", "Ab", "Bb", "C"],
  "Scale context must preserve diatonic flat-key spelling",
);
assert.equal(
  buildPitchClassContextMap(
    { currentKey: "Db", currentScale: "major" },
    chord("Db", "major", 1),
  ).get(pitchClass("Gb"))?.scale.tone?.name,
  "Gb",
);

export const verifiedMusicalContextAssertions = 23;
