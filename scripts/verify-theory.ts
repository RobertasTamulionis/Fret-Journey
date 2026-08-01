import assert from "node:assert/strict";
import {
  buildScaleShape,
  getAvailableScaleShapeSystems,
  getDefaultTuning,
  getFretPitchClass,
  getPitchClass,
  getScaleChords,
  getScaleShapeSystem,
  getScaleTones,
  scaleDefinitions,
  tonicOptions,
} from "../src/helpers/fretboardHelpers";
import type { GuitarStringCount, ScaleName } from "../src/helpers/typesHelpers";

const scaleNames = Object.keys(scaleDefinitions) as ScaleName[];

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

assert.deepEqual(
  getScaleChords("C", "harmonic-minor").map((chord) => chord.quality),
  ["minor", "diminished", "augmented", "minor", "major", "major", "diminished"],
  "harmonic-minor triad qualities",
);
assert.deepEqual(
  getScaleChords("C", "phrygian-dominant").map((chord) => chord.quality),
  ["major", "major", "diminished", "minor", "diminished", "augmented", "minor"],
  "Phrygian-dominant triad qualities",
);
assert.deepEqual(
  getScaleChords("A", "blues").map((chord) => [chord.root.name, chord.quality]),
  [
    ["A", "dominant7"],
    ["D", "dominant7"],
    ["E", "dominant7"],
  ],
  "minor-blues common I7-IV7-V7 harmony",
);
assert.deepEqual(
  getScaleChords("C#", "harmonic-minor")[2].notes.map((note) => note.name),
  ["E", "G#", "B#"],
  "C-sharp harmonic-minor augmented III spelling",
);

for (const scaleName of scaleNames) {
  const availableSystems = getAvailableScaleShapeSystems(scaleName);

  if (["harmonic-minor", "phrygian-dominant"].includes(scaleName)) {
    assert.ok(!availableSystems.includes("pentatonic"));
  }

  if (scaleName === "blues") {
    assert.ok(!availableSystems.includes("3nps"));
  }

  for (const stringCount of [6, 7, 8] as GuitarStringCount[]) {
    const tuning = getDefaultTuning(stringCount);
    const scalePitchClasses = new Set(
      getScaleTones("C", scaleName).map((tone) => tone.pitchClass),
    );

    for (const system of availableSystems) {
      const shapeOptions = getScaleShapeSystem(system, scaleName).shapes;

      shapeOptions.forEach((_, shapeIndex) => {
        const positions = buildScaleShape(
          system,
          tuning,
          24,
          "C",
          scaleName,
          shapeIndex,
        );
        assert.ok(
          positions.size > 0,
          `${scaleName} ${system} ${shapeIndex + 1} is empty on ${stringCount} strings`,
        );

        if (system === "3nps") {
          assert.equal(
            positions.size,
            stringCount * 3,
            `${scaleName} 3NPS ${shapeIndex + 1} must contain three notes per string`,
          );
        }

        if (system === "pentatonic" && scaleName !== "blues") {
          assert.equal(
            positions.size,
            stringCount * 2,
            `${scaleName} pentatonic ${shapeIndex + 1} must contain two notes per string`,
          );
        }

        positions.forEach((position) => {
          const [stringIndex, fret] = position.split("-").map(Number);
          const pitchClass = getFretPitchClass(tuning[stringIndex], fret);
          assert.ok(
            scalePitchClasses.has(pitchClass),
            `${scaleName} ${system} contains an out-of-scale pitch class`,
          );
        });

        if (system === "pentatonic" && scaleName === "blues") {
          const containsBlueNote = [...positions].some((position) => {
            const [stringIndex, fret] = position.split("-").map(Number);
            return getFretPitchClass(tuning[stringIndex], fret) === 6;
          });
          assert.ok(
            containsBlueNote,
            `C minor-blues box ${shapeIndex + 1} must include the Gb blue note`,
          );
        }
      });
    }
  }
}

console.log(
  `Theory verification passed for ${tonicOptions.length} tonics, ${scaleNames.length} scales, and 6/7/8-string shape systems.`,
);
