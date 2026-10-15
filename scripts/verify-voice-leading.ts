import assert from "node:assert/strict";
import {
  type ChordFormulaId,
  type HarmonicScope,
  type ResolvedProgressionStep,
  resolveProgressionStep,
} from "../src/features/progressions";
import {
  enumerateVoiceLeadingCandidates,
  generateVoiceLeadingPathways,
  type VoiceLeadingPathway,
} from "../src/features/voice-leading";
import {
  getDefaultRegisteredTuning,
  getPitchClass,
} from "../src/helpers/fretboardHelpers";
import type { TonicName } from "../src/helpers/typesHelpers";

type ChordSpec = readonly [
  ChordFormulaId,
  1 | 2 | 3 | 4 | 5 | 6 | 7,
  -2 | -1 | 0 | 1 | 2,
  HarmonicScope?,
];

const progression = (
  tonic: TonicName,
  specs: readonly ChordSpec[],
): readonly ResolvedProgressionStep[] =>
  specs.map(([formulaId, degree, alteration, harmonicScope], index) =>
    resolveProgressionStep(
      {
        chord: {
          formulaId,
          root: { alteration, degree },
          ...(harmonicScope ? { harmonicScope } : {}),
        },
        durationBeats: 4,
        id: `step-${index + 1}`,
      },
      tonic,
    ),
  );

const requirePath = (pathway: VoiceLeadingPathway) => {
  assert.equal(pathway.available, true, `${pathway.policy} must be available`);
  if (!pathway.available) {
    throw new Error("Expected an available voice-leading pathway");
  }
  return pathway;
};

const registeredSix = getDefaultRegisteredTuning(6);
if (registeredSix.status !== "verified") {
  throw new Error(
    "Default six-string tuning must have registered MIDI pitches",
  );
}
const eMinorSteps = progression("E", [
  ["minor", 1, 0],
  ["major", 6, -1],
  ["major", 7, -1],
  ["minor", 1, 0],
]);
const eMinorResult = generateVoiceLeadingPathways({
  fretCount: 24,
  registeredTuning: registeredSix,
  steps: eMinorSteps,
  stringCount: 6,
});
assert.equal(eMinorResult.available, true);
if (!eMinorResult.available) {
  throw new Error("E-minor pathways must be available");
}

const smoothE = requirePath(eMinorResult.pathways.smooth);
const ascendingE = requirePath(eMinorResult.pathways.ascending);
const descendingE = requirePath(eMinorResult.pathways.descending);

assert.deepEqual(
  smoothE.targets.map(({ chordTone, intervalLabel }) => [
    chordTone.name,
    intervalLabel,
  ]),
  [
    ["G", "m3"],
    ["G", "P5"],
    ["F#", "M3"],
    ["G", "m3"],
  ],
  "Smooth Em-C-D-Em must retain G before moving by semitone",
);
assert.deepEqual(
  ascendingE.targets.map(({ chordTone, intervalLabel }) => [
    chordTone.name,
    intervalLabel,
  ]),
  [
    ["E", "R"],
    ["E", "M3"],
    ["F#", "M3"],
    ["G", "m3"],
  ],
  "Ascending Em-C-D-Em must retain E and preserve chord-relative roles",
);
assert.deepEqual(
  descendingE.targets.map(({ chordTone, intervalLabel }) => [
    chordTone.name,
    intervalLabel,
  ]),
  [
    ["G", "m3"],
    ["G", "P5"],
    ["F#", "M3"],
    ["E", "R"],
  ],
  "Descending Em-C-D-Em must retain G and preserve chord-relative roles",
);

for (const pathway of [smoothE, ascendingE, descendingE]) {
  assert.equal(pathway.targets.length, eMinorSteps.length);
  pathway.targets.forEach((target, index) => {
    assert.ok(
      eMinorSteps[index].chord.tones.some(
        ({ pitchClass }) => pitchClass === target.pitchClass,
      ),
      `${target.chordName} target must belong to its resolved chord`,
    );
    assert.equal(
      registeredSix.midiPitches[target.stringIndex] + target.fret,
      target.midi,
      "Every physical position must produce the exact selected MIDI pitch",
    );
  });
}

assert.equal(
  smoothE.targets.some(
    (target, index) =>
      index > 0 && target.midi === smoothE.targets[index - 1].midi,
  ),
  true,
  "The smooth Em-C transition must be able to retain an exact common note",
);
assert.ok(
  ascendingE.targets
    .slice(1)
    .every(
      (target, index) => target.midi - ascendingE.targets[index].midi >= 0,
    ),
  "Ascending MIDI deltas must never be negative",
);
assert.ok(
  descendingE.targets
    .slice(1)
    .every(
      (target, index) => target.midi - descendingE.targets[index].midi <= 0,
    ),
  "Descending MIDI deltas must never be positive",
);

const aMinorSteps = progression("A", [
  ["minor", 1, 0],
  ["major", 6, -1],
  ["major", 7, -1],
  ["minor", 1, 0],
]);
const aMinorResult = generateVoiceLeadingPathways({
  fretCount: 24,
  registeredTuning: registeredSix,
  steps: aMinorSteps,
  stringCount: 6,
});
assert.equal(aMinorResult.available, true);
if (!aMinorResult.available) {
  throw new Error("A-minor pathways must be available");
}
const ascendingA = requirePath(aMinorResult.pathways.ascending);
assert.deepEqual(
  ascendingA.targets.map(({ chordTone }) => chordTone.role),
  ascendingE.targets.map(({ chordTone }) => chordTone.role),
  "Equivalent minor-key progressions must preserve selected chord roles",
);
assert.deepEqual(
  ascendingA.targets
    .slice(1)
    .map((target, index) => target.midi - ascendingA.targets[index].midi),
  ascendingE.targets
    .slice(1)
    .map((target, index) => target.midi - ascendingE.targets[index].midi),
  "Equivalent minor-key progressions must preserve melodic movement",
);

const borrowedSteps = progression("C", [
  ["major", 1, 0],
  ["major", 4, 0],
  ["minor", 4, 0, "borrowed"],
  ["major", 1, 0],
]);
const borrowedCandidates = enumerateVoiceLeadingCandidates(
  borrowedSteps[2],
  registeredSix.midiPitches,
  24,
);
assert.ok(
  borrowedCandidates.some(
    ({ chordTone, pitchClass }) =>
      chordTone.name === "Ab" && pitchClass === getPitchClass("Ab"),
  ),
  "Borrowed F minor must retain A-flat candidates outside C major",
);

const twelveFretCandidates = enumerateVoiceLeadingCandidates(
  eMinorSteps[0],
  registeredSix.midiPitches,
  12,
);
const twentyFourFretCandidates = enumerateVoiceLeadingCandidates(
  eMinorSteps[0],
  registeredSix.midiPitches,
  24,
);
assert.ok(twelveFretCandidates.every(({ fret }) => fret <= 12));
assert.ok(twentyFourFretCandidates.every(({ fret }) => fret <= 24));
assert.ok(twentyFourFretCandidates.length > twelveFretCandidates.length);
assert.ok(
  twentyFourFretCandidates.some(({ fret }) => fret === 0),
  "Open strings must remain eligible",
);
assert.ok(
  twentyFourFretCandidates.some((candidate, index, candidates) =>
    candidates.some(
      (other, otherIndex) =>
        otherIndex !== index &&
        other.midi === candidate.midi &&
        other.stringIndex !== candidate.stringIndex,
    ),
  ),
  "Duplicate MIDI pitches on different strings must remain distinct",
);

for (const stringCount of [6, 7, 8] as const) {
  const tuning = getDefaultRegisteredTuning(stringCount);
  const result = generateVoiceLeadingPathways({
    fretCount: 12,
    registeredTuning: tuning,
    steps: eMinorSteps,
    stringCount,
  });
  assert.equal(result.available, true, `${stringCount}-string must resolve`);
  if (result.available) {
    assert.ok(
      result.candidateCount <= eMinorSteps.length * stringCount * (12 + 1),
      "Candidate search must remain within its explicit position bound",
    );
  }
}

assert.deepEqual(
  generateVoiceLeadingPathways({
    fretCount: 24,
    registeredTuning: registeredSix,
    steps: eMinorSteps,
    stringCount: 6,
  }),
  eMinorResult,
  "Identical inputs must produce deterministic output",
);
assert.deepEqual(
  generateVoiceLeadingPathways({
    fretCount: 24,
    registeredTuning: {
      midiPitches: null,
      reason: "pitch-class-only-custom",
      status: "unregistered",
      version: 1,
    },
    steps: eMinorSteps,
    stringCount: 6,
  }),
  { available: false, reason: "unregistered-tuning" },
  "Custom pitch-class-only tunings must never borrow registered octaves",
);

const twelveFretResult = generateVoiceLeadingPathways({
  fretCount: 12,
  registeredTuning: registeredSix,
  steps: eMinorSteps,
  stringCount: 6,
});
assert.notDeepEqual(
  twelveFretResult,
  eMinorResult,
  "Changing the fret boundary must derive a fresh pathway result",
);
assert.notDeepEqual(
  aMinorResult,
  eMinorResult,
  "Changing key must derive fresh registered targets rather than stale positions",
);

export const verifiedVoiceLeadingAssertions = 22;
