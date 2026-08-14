import assert from "node:assert/strict";
import {
  buildCagedChordShape,
  buildFretPositions,
  buildScaleShape,
  getAvailableScaleShapeSystems,
  getChordToneIntervalName,
  getDefaultTuning,
  getFretPitchClass,
  getPitchClass,
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
  `Theory verification passed for ${tonicOptions.length} tonics, ${scaleNames.length} scales, ${verifiedChordCount} scale chords, and ${verifiedShapeCount} shape/tuning combinations.`,
);
