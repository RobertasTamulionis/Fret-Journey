import assert from "node:assert/strict";
import { existsSync, statSync } from "node:fs";
import { join } from "node:path";
import { practiceTabExamples } from "../src/data/practiceTabExamples";
import {
  acousticGuitarAssetSource,
  acousticGuitarManifest,
} from "../src/features/audio/acousticGuitarManifest";
import {
  cleanElectricAssetSources,
  cleanElectricManifest,
} from "../src/features/audio/cleanElectricManifest";
import { guitarPresets } from "../src/features/audio/guitarPresets";
import {
  getArticulationPlayback,
  getPitchAutomation,
  getPolyphonyGainScale,
  MultisampleInstrument,
} from "../src/features/audio/MultisampleInstrument";
import type {
  GuitarPresetId,
  PitchedInstrument,
  ScheduledMusicalEvent,
} from "../src/features/audio/types";
import {
  buildPracticeAudioEvents,
  planPracticeAudioEvents,
} from "../src/features/practice/audio/buildPracticeAudioEvents";
import {
  type PracticeMetronomeConfig,
  PracticeMetronomeEngine,
  type PracticeMetronomeEnvironment,
} from "../src/features/practice/audio/PracticeMetronomeEngine";
import { resolvePracticeTab } from "../src/features/practice/resolvePracticeTab";
import {
  clampPracticeDurationMinutes,
  formatPracticeTime,
  getPracticeDurationSeconds,
  getPracticeRemainingSeconds,
} from "../src/features/practice/session";
import {
  createPracticePlaybackTimeline,
  getPracticeSequenceEvents,
  type PracticeTabExample,
} from "../src/features/practice/tablature";
import {
  getPracticeActiveEventIndexAtBeat,
  getPracticeAudioTimeAtExerciseBeat,
  getPracticeAuthoredSlotAtBeat,
  getPracticeExerciseBeatAtAudioTime,
  getPracticeScoreLengthBeats,
  getPracticeSecondsPerBeat,
  getPracticePlaybackSpeedMultiplier,
  getPracticeSecondsPerEvent,
  planPracticeMetronomePulses,
} from "../src/features/practice/timing";
import {
  buildRegisteredTuningState,
  getRegisteredTuningPreset,
  getTuningPitchClasses,
} from "../src/features/tunings";

assert.equal(getPracticeSecondsPerBeat(120), 0.5);
assert.equal(getPracticeSecondsPerBeat(1), 2);
assert.equal(getPracticeSecondsPerBeat(400), 0.25);

const dailyFoundation = practiceTabExamples["daily-foundation"];
assert.deepEqual(
  dailyFoundation.events.map((event) => event.at),
  [0, 1, 2, 3, 4, 5, 6, 7],
  "Daily foundation is authored as eight eighth-note events, not four quarter notes",
);
for (const [subdivision, notesPerBeat, expectedLength] of [
  ["quarters", 1, 8],
  ["eighths", 2, 4],
  ["triplets", 3, 8 / 3],
  ["sixteenths", 4, 2],
] as const) {
  const playback = createPracticePlaybackTimeline(dailyFoundation, subdivision);
  assert.deepEqual(
    playback.events.map((event) => event.at),
    [0, 1, 2, 3, 4, 5, 6, 7],
    `${subdivision} playback must keep eight sequential events in order`,
  );
  assert.equal(
    playback.playbackScoreLengthBeats,
    expectedLength,
    `${subdivision} playback must place eight notes at ${notesPerBeat} per beat`,
  );
}
assert.deepEqual(
  [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5].map((beat) =>
    getPracticeActiveEventIndexAtBeat(beat, dailyFoundation),
  ),
  [0, 1, 2, 3, 4, 5, 6, 7],
  "Daily foundation must activate each authored eighth-note event once",
);
assert.equal(getPracticePlaybackSpeedMultiplier("quarters"), 1);
assert.equal(getPracticePlaybackSpeedMultiplier("eighths"), 2);
assert.equal(getPracticePlaybackSpeedMultiplier("sixteenths"), 4);
assert.equal(
  getPracticeSecondsPerBeat(120) /
    getPracticePlaybackSpeedMultiplier("eighths"),
  0.25,
);
assert.equal(
  getPracticeSecondsPerBeat(120) /
    getPracticePlaybackSpeedMultiplier("sixteenths"),
  0.125,
);
assert.equal(getPracticeSecondsPerEvent(120, "sixteenths"), 0.125);
assert.equal(getPracticeSecondsPerEvent(60, "triplets"), 1 / 3);
assert.equal(getPracticeDurationSeconds("7 min"), 420);
assert.equal(getPracticeDurationSeconds("invalid"), 60);
assert.equal(clampPracticeDurationMinutes(0), 1);
assert.equal(clampPracticeDurationMinutes(121), 120);
assert.equal(formatPracticeTime(0), "0:00");
assert.equal(formatPracticeTime(65), "1:05");
assert.equal(getPracticeRemainingSeconds(60, 0), 60);
assert.equal(getPracticeRemainingSeconds(60, 1.1), 59);
assert.equal(getPracticeRemainingSeconds(60, 60.1), 0);

const dailyAudioPlan = buildPracticeAudioEvents(
  practiceTabExamples["daily-reset"],
);
assert.equal(dailyAudioPlan.available, true);
if (dailyAudioPlan.available) {
  assert.equal(dailyAudioPlan.events[0].notes[0].midi, 40);
  assert.equal(dailyAudioPlan.events[0].startBeat, 0);
  assert.equal(dailyAudioPlan.events[0].durationBeats, 0.5);
  assert.deepEqual(
    planPracticeAudioEvents({
      events: dailyAudioPlan.events,
      fromBeat: 3.9,
      scoreLengthBeats: dailyAudioPlan.scoreLengthBeats,
      toBeat: 4.1,
    }).map(({ startBeat }) => startBeat),
    [4],
    "Instrument events must restart on the exact score loop boundary",
  );
}

const chordAudioPlan = buildPracticeAudioEvents(
  practiceTabExamples["funk-pocket-stabs"],
);
assert.equal(chordAudioPlan.available, true);
if (chordAudioPlan.available) {
  assert.ok(
    chordAudioPlan.events.some(({ notes }) => notes.length === 3),
    "Grouped TAB notes must remain simultaneous audio notes",
  );
  assert.ok(
    chordAudioPlan.events.every(({ notes }) =>
      notes.every(({ midi }) => midi === null || Number.isInteger(midi)),
    ),
    "Dead notes must remain explicitly unpitched",
  );
}

const allPracticeAudioNotes = Object.values(practiceTabExamples).flatMap(
  (example) => {
    const plan = buildPracticeAudioEvents(example);
    return plan.available ? plan.events.flatMap(({ notes }) => notes) : [];
  },
);
for (const articulation of [
  "palm-mute-light",
  "palm-mute-medium",
  "palm-mute-deep",
  "dead-note",
  "hammer",
  "pull",
  "slide-up",
  "slide-down",
  "bend",
  "release",
  "vibrato",
] as const) {
  assert.ok(
    allPracticeAudioNotes.some((note) => note.articulation === articulation),
    `${articulation} metadata must reach the musical event contract`,
  );
}
assert.ok(
  allPracticeAudioNotes.some(
    ({ articulation, targetMidi }) =>
      articulation === "bend" && targetMidi !== undefined,
  ),
  "Authored bend targets must resolve to exact MIDI pitches",
);
assert.ok(
  allPracticeAudioNotes.some(
    ({ articulation, transitionFromMidi }) =>
      articulation === "slide-up" && transitionFromMidi !== undefined,
  ),
  "Slides must retain their preceding same-string pitch",
);
assert.ok(
  getArticulationPlayback("palm-mute-light").durationScale >
    getArticulationPlayback("palm-mute-medium").durationScale,
);
assert.ok(
  getArticulationPlayback("palm-mute-medium").durationScale >
    getArticulationPlayback("palm-mute-deep").durationScale,
);
assert.ok(
  getArticulationPlayback("hammer").attackSeconds >
    getArticulationPlayback("normal").attackSeconds,
);
assert.equal(getPolyphonyGainScale(1), 1);
assert.ok(getPolyphonyGainScale(6) < 0.5, "Chords must receive headroom");
assert.deepEqual(
  getPitchAutomation(
    { articulation: "slide-up", midi: 64, transitionFromMidi: 62, velocity: 1 },
    0.5,
  ),
  { duration: 0.18, fromMidi: 62, kind: "transition" },
);
assert.deepEqual(
  getPitchAutomation(
    { articulation: "bend", midi: 64, targetMidi: 66, velocity: 1 },
    0.5,
  ),
  { cents: 200, duration: 0.325, kind: "bend" },
);
assert.deepEqual(
  getPitchAutomation({ articulation: "vibrato", midi: 64, velocity: 1 }, 0.5),
  { depthCents: 18, duration: 0.42, kind: "vibrato" },
);

const customTuningPlan = buildPracticeAudioEvents({
  ...practiceTabExamples["daily-reset"],
  tuning: {
    label: "Custom tuning",
    midiPitchesHighToLow: null,
    pitchClassesHighToLow: [4, 11, 7, 2, 9, 4],
    registerStatus: "unregistered",
    stringLabelsHighToLow: ["E", "B", "G", "D", "A", "E"],
  },
});
assert.equal(customTuningPlan.available, false);

for (const tuningId of [
  "6-standard-eb",
  "6-standard-d",
  "6-drop-d",
  "6-drop-c",
  "7-standard-b",
  "7-drop-a",
  "8-standard-f-sharp",
  "8-drop-e",
] as const) {
  const preset = getRegisteredTuningPreset(tuningId);
  const resolved = resolvePracticeTab("daily-reset", {
    currentKey: "C",
    currentScale: "major",
    registeredTuning: buildRegisteredTuningState(preset),
    stringCount: preset.stringCount,
    tuning: getTuningPitchClasses(preset),
  });
  const plan = buildPracticeAudioEvents(resolved);
  assert.equal(plan.available, true, `${preset.label} must support audio`);
  if (plan.available) {
    assert.ok(
      plan.events.every(({ notes }) =>
        notes.every(
          ({ midi }) =>
            midi === null ||
            (midi >= cleanElectricManifest.minimumMidi &&
              midi <= cleanElectricManifest.maximumMidi),
        ),
      ),
      `${preset.label} must remain inside the verified sample manifest`,
    );
  }
}

assert.equal(cleanElectricAssetSources.shinyguitar.license, "CC0-1.0");
assert.equal(cleanElectricAssetSources.lowEightString.license, "CC0-1.0");
assert.equal(cleanElectricManifest.minimumMidi, 28);
assert.equal(cleanElectricManifest.maximumMidi, 91);
for (const { url } of cleanElectricManifest.regions) {
  const path = join(process.cwd(), "public", url.replace(/^\//, ""));
  assert.ok(existsSync(path), `Missing Clean Electric asset: ${url}`);
  assert.ok(statSync(path).size > 10_000, `Empty Clean Electric asset: ${url}`);
}
assert.ok(
  existsSync(join(process.cwd(), "public/audio/clean-electric/NOTICE.md")),
  "Clean Electric assets must retain a license and source record",
);
assert.deepEqual(Object.keys(guitarPresets).sort(), [
  "acoustic-guitar",
  "clean-electric",
  "high-gain-electric",
]);
assert.equal(guitarPresets["clean-electric"].processing, "clean");
assert.equal(guitarPresets["high-gain-electric"].processing, "high-gain");
assert.equal(guitarPresets["acoustic-guitar"].processing, "acoustic");
assert.equal(acousticGuitarAssetSource.license, "CC0-1.0");
assert.equal(acousticGuitarAssetSource.nativeMinimumMidi, 40);
assert.equal(acousticGuitarAssetSource.nativeMaximumMidi, 84);
assert.equal(acousticGuitarManifest.minimumMidi, 28);
assert.equal(acousticGuitarManifest.maximumMidi, 88);
for (const { url } of acousticGuitarManifest.regions) {
  const path = join(process.cwd(), "public", url.replace(/^\//, ""));
  assert.ok(existsSync(path), `Missing Acoustic Guitar asset: ${url}`);
  assert.ok(
    statSync(path).size > 10_000,
    `Empty Acoustic Guitar asset: ${url}`,
  );
}
assert.ok(
  existsSync(join(process.cwd(), "public/audio/acoustic/NOTICE.md")),
  "Acoustic Guitar assets must retain a license and source record",
);

const anchor = { audioTime: 10, exerciseBeat: 2, tempo: 120 };
assert.equal(getPracticeExerciseBeatAtAudioTime(anchor, 11), 4);
assert.equal(getPracticeAudioTimeAtExerciseBeat(anchor, 4), 11);

const dailyResetSequence = getPracticeSequenceEvents(
  practiceTabExamples["daily-reset"],
);
assert.deepEqual(
  dailyResetSequence.map(({ at }) => at),
  [0, 1, 2, 3, 4, 5, 6, 7],
  "Follow Along must use musical slot order rather than source-array order",
);
assert.deepEqual(
  Array.from({ length: 8 }, (_, index) =>
    getPracticeActiveEventIndexAtBeat(
      index / 2,
      practiceTabExamples["daily-reset"],
    ),
  ),
  [0, 1, 2, 3, 4, 5, 6, 7],
  "Even eighths must advance evenly from authored slots",
);

const openRoadHook = practiceTabExamples["daily-play"];
assert.equal(getPracticeScoreLengthBeats(openRoadHook), 8);
assert.deepEqual(
  Array.from({ length: 32 }, (_, slot) =>
    getPracticeActiveEventIndexAtBeat(slot / 4, openRoadHook),
  ),
  [
    0, 0, 1, 2, 3, 3, 4, 4, 5, 5, 6, 7, 8, 8, 9, 9, 10, 10, 11, 12, 13, 13, 14,
    14, 15, 15, 16, 17, 18, 19, 20, 20,
  ],
  "Open Road Hook must preserve every attack, sustain, and rest slot",
);
assert.equal(getPracticeAuthoredSlotAtBeat(7.999, openRoadHook), 31);
assert.equal(getPracticeActiveEventIndexAtBeat(7.999, openRoadHook), 20);
assert.equal(getPracticeActiveEventIndexAtBeat(8, openRoadHook), 0);
assert.deepEqual(
  (["quarters", "eighths", "triplets", "sixteenths"] as const).map(
    (clickSubdivision) => ({
      activeEventIndex: getPracticeActiveEventIndexAtBeat(6.5, openRoadHook),
      clickCount: planPracticeMetronomePulses({
        fromBeat: 6,
        subdivision: clickSubdivision,
        toBeat: 7,
      }).length,
    }),
  ),
  [
    { activeEventIndex: 16, clickCount: 1 },
    { activeEventIndex: 16, clickCount: 2 },
    { activeEventIndex: 16, clickCount: 3 },
    { activeEventIndex: 16, clickCount: 4 },
  ],
  "Metronome click subdivision must not requantize Open Road Hook",
);

const threeThreeTwoEngine = practiceTabExamples["metal-three-three-two-engine"];
assert.equal(getPracticeScoreLengthBeats(threeThreeTwoEngine), 8);
assert.deepEqual(
  Array.from({ length: 16 }, (_, index) =>
    getPracticeActiveEventIndexAtBeat(index / 2, threeThreeTwoEngine),
  ),
  Array.from({ length: 16 }, (_, index) => index),
  "Three-Three-Two Engine must advance through all 16 even eighth-note attacks",
);
assert.equal(
  getPracticeActiveEventIndexAtBeat(7.999, threeThreeTwoEngine),
  15,
  "Three-Three-Two Engine must retain its final D5 until the score ends",
);
assert.equal(
  getPracticeActiveEventIndexAtBeat(8, threeThreeTwoEngine),
  0,
  "Three-Three-Two Engine must loop only after both bars",
);

const gallopRelay = practiceTabExamples["metal-gallop-relay"];
assert.equal(getPracticeScoreLengthBeats(gallopRelay), 8);
assert.deepEqual(
  Array.from({ length: 32 }, (_, slot) =>
    getPracticeActiveEventIndexAtBeat(slot / 4, gallopRelay),
  ),
  [
    0, 0, 1, 2, 3, 3, 4, 4, 5, 5, 6, 7, 8, 8, 8, 8, 9, 10, 11, 11, 12, 13, 14,
    14, 15, 15, 16, 16, 17, 17, 18, 18,
  ],
  "Gallop Relay must preserve every authored attack, sustain, and rest slot",
);
assert.equal(
  getPracticeActiveEventIndexAtBeat(7.999, gallopRelay),
  18,
  "Gallop Relay must retain the final D5 through the end of bar two",
);
assert.equal(
  getPracticeActiveEventIndexAtBeat(8, gallopRelay),
  0,
  "Gallop Relay must loop directly from D5 to the opening E",
);

const burstAndResolve = practiceTabExamples["metal-burst-and-resolve"];
assert.equal(getPracticeScoreLengthBeats(burstAndResolve), 8);
assert.deepEqual(
  Array.from({ length: 32 }, (_, slot) =>
    getPracticeActiveEventIndexAtBeat(slot / 4, burstAndResolve),
  ),
  [
    0, 0, 1, 1, 2, 3, 4, 5, 6, 7, 7, 7, 8, 8, 8, 8, 9, 9, 10, 10, 11, 12, 13,
    14, 15, 16, 17, 17, 18, 18, 19, 19,
  ],
  "Burst and Resolve must preserve every authored attack, hold, and rest slot",
);
assert.equal(
  getPracticeActiveEventIndexAtBeat(7.999, burstAndResolve),
  19,
  "Burst and Resolve must retain the final D pickup through slot 31",
);
assert.equal(
  getPracticeActiveEventIndexAtBeat(8, burstAndResolve),
  0,
  "Burst and Resolve must loop directly from the D pickup to the opening E",
);
assert.deepEqual(
  (["quarters", "eighths", "triplets", "sixteenths"] as const).map(
    (clickSubdivision) => ({
      activeEventIndex: getPracticeActiveEventIndexAtBeat(6.5, burstAndResolve),
      clickCount: planPracticeMetronomePulses({
        fromBeat: 6,
        subdivision: clickSubdivision,
        toBeat: 7,
      }).length,
    }),
  ),
  [
    { activeEventIndex: 17, clickCount: 1 },
    { activeEventIndex: 17, clickCount: 2 },
    { activeEventIndex: 17, clickCount: 3 },
    { activeEventIndex: 17, clickCount: 4 },
  ],
  "Metronome click subdivision must not requantize Burst and Resolve",
);

const legatoPhrase = practiceTabExamples["legato-phrase"];
assert.equal(getPracticeScoreLengthBeats(legatoPhrase), 8);
assert.deepEqual(
  Array.from({ length: 32 }, (_, slot) =>
    getPracticeActiveEventIndexAtBeat(slot / 4, legatoPhrase),
  ),
  [
    0, 0, 1, 2, 3, 4, 5, 5, 6, 6, 7, 7, 8, 8, 8, 8, 9, 9, 10, 11, 12, 13, 14,
    14, 15, 16, 17, 17, 18, 18, 18, 18,
  ],
  "Answer the Climb must preserve every attack, sustain, and rest slot",
);
assert.equal(getPracticeActiveEventIndexAtBeat(7.999, legatoPhrase), 18);
assert.equal(getPracticeActiveEventIndexAtBeat(8, legatoPhrase), 0);
assert.deepEqual(
  (["quarters", "eighths", "triplets", "sixteenths"] as const).map(
    (clickSubdivision) => ({
      activeEventIndex: getPracticeActiveEventIndexAtBeat(6.5, legatoPhrase),
      clickCount: planPracticeMetronomePulses({
        fromBeat: 6,
        subdivision: clickSubdivision,
        toBeat: 7,
      }).length,
    }),
  ),
  [
    { activeEventIndex: 17, clickCount: 1 },
    { activeEventIndex: 17, clickCount: 2 },
    { activeEventIndex: 17, clickCount: 3 },
    { activeEventIndex: 17, clickCount: 4 },
  ],
  "Metronome click subdivision must not requantize Answer the Climb",
);

const skippingPhrase = practiceTabExamples["skipping-phrase"];
assert.equal(getPracticeScoreLengthBeats(skippingPhrase), 8);
assert.deepEqual(
  Array.from({ length: 32 }, (_, slot) =>
    getPracticeActiveEventIndexAtBeat(slot / 4, skippingPhrase),
  ),
  [
    0, 0, 1, 2, 3, 3, 4, 5, 6, 6, 7, 8, 9, 9, 10, 10, 11, 12, 13, 14, 15, 15,
    16, 16, 17, 18, 19, 19, 20, 20, 21, 21,
  ],
  "Across the Wire must preserve every attack, sustain, and rest slot",
);
assert.equal(getPracticeActiveEventIndexAtBeat(7.999, skippingPhrase), 21);
assert.equal(getPracticeActiveEventIndexAtBeat(8, skippingPhrase), 0);
assert.deepEqual(
  (["quarters", "eighths", "triplets", "sixteenths"] as const).map(
    (clickSubdivision) => ({
      activeEventIndex: getPracticeActiveEventIndexAtBeat(6.5, skippingPhrase),
      clickCount: planPracticeMetronomePulses({
        fromBeat: 6,
        subdivision: clickSubdivision,
        toBeat: 7,
      }).length,
    }),
  ),
  [
    { activeEventIndex: 19, clickCount: 1 },
    { activeEventIndex: 19, clickCount: 2 },
    { activeEventIndex: 19, clickCount: 3 },
    { activeEventIndex: 19, clickCount: 4 },
  ],
  "Metronome click subdivision must not requantize Across the Wire",
);

const scalesConnect = practiceTabExamples["scales-connect"];
assert.equal(getPracticeScoreLengthBeats(scalesConnect), 8);
assert.deepEqual(
  Array.from({ length: 32 }, (_, slot) =>
    getPracticeActiveEventIndexAtBeat(slot / 4, scalesConnect),
  ),
  [
    0, 0, 1, 2, 3, 3, 4, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 11, 12, 12, 13, 13, 14,
    15, 16, 16, 17, 17, 18, 18, 19, 19,
  ],
  "Carry the Motif must preserve every attack and sustain slot",
);
assert.equal(getPracticeActiveEventIndexAtBeat(7.999, scalesConnect), 19);
assert.equal(getPracticeActiveEventIndexAtBeat(8, scalesConnect), 0);
assert.deepEqual(
  (["quarters", "eighths", "triplets", "sixteenths"] as const).map(
    (clickSubdivision) => ({
      activeEventIndex: getPracticeActiveEventIndexAtBeat(6.5, scalesConnect),
      clickCount: planPracticeMetronomePulses({
        fromBeat: 6,
        subdivision: clickSubdivision,
        toBeat: 7,
      }).length,
    }),
  ),
  [
    { activeEventIndex: 17, clickCount: 1 },
    { activeEventIndex: 17, clickCount: 2 },
    { activeEventIndex: 17, clickCount: 3 },
    { activeEventIndex: 17, clickCount: 4 },
  ],
  "Metronome click subdivision must not requantize Carry the Motif",
);

const ironPulse = practiceTabExamples["metal-iron-pulse"];
assert.equal(getPracticeScoreLengthBeats(ironPulse), 8);
assert.deepEqual(
  Array.from({ length: 32 }, (_, slot) =>
    getPracticeActiveEventIndexAtBeat(slot / 4, ironPulse),
  ),
  [
    0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11,
    12, 12, 13, 14, 15, 15, 16, 16,
  ],
  "Iron Pulse must preserve every authored attack, cutoff, rest, and chord slot",
);
assert.equal(
  getPracticeActiveEventIndexAtBeat(7.999, ironPulse),
  16,
  "Iron Pulse must retain its final G5 through slot 31",
);
assert.equal(
  getPracticeActiveEventIndexAtBeat(8, ironPulse),
  0,
  "Iron Pulse must loop directly from G5 to the opening A pedal",
);
assert.deepEqual(
  (["quarters", "eighths", "triplets", "sixteenths"] as const).map(
    (clickSubdivision) => ({
      activeEventIndex: getPracticeActiveEventIndexAtBeat(6.75, ironPulse),
      clickCount: planPracticeMetronomePulses({
        fromBeat: 6,
        subdivision: clickSubdivision,
        toBeat: 7,
      }).length,
    }),
  ),
  [
    { activeEventIndex: 14, clickCount: 1 },
    { activeEventIndex: 14, clickCount: 2 },
    { activeEventIndex: 14, clickCount: 3 },
    { activeEventIndex: 14, clickCount: 4 },
  ],
  "Metronome click subdivision must not requantize Iron Pulse",
);

const phrygianGravity = practiceTabExamples["metal-phrygian-gravity"];
assert.equal(getPracticeScoreLengthBeats(phrygianGravity), 8);
const phrygianGravitySlotProjection = Array.from({ length: 32 }, (_, slot) =>
  getPracticeActiveEventIndexAtBeat(slot / 4, phrygianGravity),
);
assert.deepEqual(
  phrygianGravitySlotProjection,
  [
    0, 1, 2, 3, 4, 5, 6, 6, 7, 8, 9, 10, 11, 12, 13, 13, 14, 14, 14, 14, 15, 16,
    17, 18, 19, 20, 21, 21, 22, 23, 23, 23,
  ],
  "Phrygian Gravity must preserve every authored attack, hold, and rest slot",
);
assert.equal(
  getPracticeActiveEventIndexAtBeat(7.999, phrygianGravity),
  23,
  "Phrygian Gravity must hold its final F through slot 31",
);
assert.equal(
  getPracticeActiveEventIndexAtBeat(8, phrygianGravity),
  0,
  "Phrygian Gravity must loop directly from F to the opening low E",
);
assert.deepEqual(
  (["quarters", "eighths", "triplets", "sixteenths"] as const).map(
    (clickSubdivision) => ({
      activeEventIndex: getPracticeActiveEventIndexAtBeat(6.5, phrygianGravity),
      clickCount: planPracticeMetronomePulses({
        fromBeat: 6,
        subdivision: clickSubdivision,
        toBeat: 7,
      }).length,
    }),
  ),
  [
    { activeEventIndex: 21, clickCount: 1 },
    { activeEventIndex: 21, clickCount: 2 },
    { activeEventIndex: 21, clickCount: 3 },
    { activeEventIndex: 21, clickCount: 4 },
  ],
  "Metronome click subdivision must not requantize Phrygian Gravity",
);

const gallopSequence = getPracticeSequenceEvents(
  practiceTabExamples["metal-gallop-control"],
);
assert.deepEqual(
  gallopSequence.map(({ at, kind }) => ({ at, kind })),
  [
    { at: 0, kind: "notes" },
    { at: 2, kind: "notes" },
    { at: 3, kind: "notes" },
    { at: 4, kind: "rest" },
    { at: 5, kind: "rest" },
    { at: 6, kind: "notes" },
    { at: 8, kind: "notes" },
    { at: 9, kind: "notes" },
    { at: 10, kind: "rest" },
    { at: 12, kind: "notes" },
  ],
  "Gallops must preserve attack, silence, and chord-punch order",
);
assert.deepEqual(
  [0, 0.25, 0.5, 0.75, 1].map((beat) =>
    getPracticeActiveEventIndexAtBeat(
      beat,
      practiceTabExamples["metal-gallop-control"],
    ),
  ),
  [0, 0, 1, 2, 3],
  "Gallop attacks and rests must follow authored slots",
);

assert.deepEqual(
  [3, 3.25, 3.5, 3.75].map((beat) =>
    getPracticeActiveEventIndexAtBeat(
      beat,
      practiceTabExamples["chugs-gallop"],
    ),
  ),
  [7, null, 8, 9],
  "Reverse-gallop spacing must remain uneven",
);

assert.deepEqual(
  [0, 0.25, 0.5, 1, 1.5, 2, 2.25, 2.5, 2.75].map((beat) =>
    getPracticeActiveEventIndexAtBeat(
      beat,
      practiceTabExamples["alternate-burst"],
    ),
  ),
  [0, null, 1, 2, 3, 4, 5, 6, 7],
  "A speed burst must retain its slow attacks, gaps, and fast attacks",
);

assert.deepEqual(
  [2, 2.25, 2.5, 2.75].map((beat) =>
    getPracticeActiveEventIndexAtBeat(
      beat,
      practiceTabExamples["chugs-gallop"],
    ),
  ),
  [6, 6, 6, 6],
  "A four-slot rest must remain current for all four slots",
);

assert.deepEqual(
  [0, 1, 2, 2.99].map((beat) =>
    getPracticeActiveEventIndexAtBeat(
      beat,
      practiceTabExamples["bends-control"],
    ),
  ),
  [0, 0, 0, 0],
  "A held note must remain current for its authored duration",
);
assert.deepEqual(
  [1, 1.5, 2, 2.5].map((beat) =>
    getPracticeActiveEventIndexAtBeat(
      beat,
      practiceTabExamples["metal-syncopated-stops"],
    ),
  ),
  [2, 3, 4, 5],
  "Stop/start Follow Along must preserve the authored dead note, rest, and re-entry",
);

const twoMeasureScore = {
  events: [
    { at: 0, duration: 1, kind: "rest" },
    { at: 8, duration: 1, kind: "rest" },
    { at: 15, duration: 1, kind: "rest" },
  ],
  measureCount: 2,
  subdivision: "eighths",
} as const satisfies Pick<
  PracticeTabExample,
  "events" | "measureCount" | "subdivision"
>;
assert.equal(getPracticeScoreLengthBeats(twoMeasureScore), 8);
assert.equal(getPracticeAuthoredSlotAtBeat(4, twoMeasureScore), 8);
assert.equal(getPracticeActiveEventIndexAtBeat(4, twoMeasureScore), 1);
assert.equal(getPracticeActiveEventIndexAtBeat(7.5, twoMeasureScore), 2);
assert.equal(getPracticeActiveEventIndexAtBeat(8, twoMeasureScore), 0);

const quarterPulses = planPracticeMetronomePulses({
  fromBeat: 0,
  subdivision: "quarters",
  toBeat: 8,
});
assert.deepEqual(
  quarterPulses.map(({ accented, beat, kind }) => ({ accented, beat, kind })),
  [
    { accented: true, beat: 0, kind: "beat" },
    { accented: false, beat: 1, kind: "beat" },
    { accented: false, beat: 2, kind: "beat" },
    { accented: false, beat: 3, kind: "beat" },
    { accented: true, beat: 4, kind: "beat" },
    { accented: false, beat: 5, kind: "beat" },
    { accented: false, beat: 6, kind: "beat" },
    { accented: false, beat: 7, kind: "beat" },
  ],
);

const eighthPulses = planPracticeMetronomePulses({
  fromBeat: 0,
  subdivision: "eighths",
  toBeat: 1,
});
assert.deepEqual(
  eighthPulses.map(({ beat, kind }) => ({ beat, kind })),
  [
    { beat: 0, kind: "beat" },
    { beat: 0.5, kind: "subdivision" },
  ],
);
for (const tempo of [60, 120, 180]) {
  const performanceAnchor = { audioTime: 0, exerciseBeat: 0, tempo };
  const exerciseBeat = getPracticeExerciseBeatAtAudioTime(
    performanceAnchor,
    getPracticeSecondsPerBeat(tempo) * 1.6,
  );
  assert.equal(
    getPracticeActiveEventIndexAtBeat(
      exerciseBeat,
      practiceTabExamples["daily-reset"],
    ),
    3,
    `${tempo} BPM must project authored timing from Web Audio time`,
  );
}

assert.deepEqual(
  planPracticeMetronomePulses({
    fromBeat: 0,
    subdivision: "triplets",
    toBeat: 1,
  }).map(({ beat }) => beat),
  [0, 1 / 3, 2 / 3],
);
assert.deepEqual(
  planPracticeMetronomePulses({
    fromBeat: 0,
    subdivision: "sixteenths",
    toBeat: 1,
  }).map(({ beat }) => beat),
  [0, 0.25, 0.5, 0.75],
);

const countInPulses = planPracticeMetronomePulses({
  fromBeat: 0,
  subdivision: "quarters",
  toBeat: 3,
});
assert.equal(countInPulses.length, 3);
assert.equal(countInPulses[0].accented, true);

const windowedPulses = planPracticeMetronomePulses({
  fromBeat: 0.51,
  subdivision: "eighths",
  toBeat: 1.51,
});
assert.deepEqual(
  windowedPulses.map(({ beat }) => beat),
  [1, 1.5],
);

class FakeAudioParam {
  value = 0;

  cancelScheduledValues() {}

  exponentialRampToValueAtTime(value: number) {
    this.value = value;
  }

  setValueAtTime(value: number) {
    this.value = value;
  }
}

class FakeAudioNode {
  disconnected = false;

  connect() {
    return this;
  }

  disconnect() {
    this.disconnected = true;
  }
}

class FakeGainNode extends FakeAudioNode {
  gain = new FakeAudioParam();
}

class FakeOscillatorNode extends FakeAudioNode {
  frequency = new FakeAudioParam();
  onended: (() => void) | null = null;
  startTime: number | null = null;
  stopTimes: number[] = [];

  start(audioTime: number) {
    this.startTime = audioTime;
  }

  stop(audioTime: number) {
    this.stopTimes.push(audioTime);
  }
}

class FakeBufferSourceNode extends FakeAudioNode {
  buffer: AudioBuffer | null = null;
  detune = new FakeAudioParam();
  onended: (() => void) | null = null;
  playbackRate = new FakeAudioParam();
  started = false;
  stopped = false;

  start() {
    this.started = true;
  }

  stop() {
    assert.equal(
      this.started,
      true,
      "AudioBufferSourceNode.start must run before stop",
    );
    this.stopped = true;
  }
}

class FakeCompressorNode extends FakeAudioNode {
  attack = new FakeAudioParam();
  knee = new FakeAudioParam();
  ratio = new FakeAudioParam();
  release = new FakeAudioParam();
  threshold = new FakeAudioParam();
}

class FakeAudioContext {
  bufferSources: FakeBufferSourceNode[] = [];
  currentTime = 0;
  destination = new FakeAudioNode();
  gains: FakeGainNode[] = [];
  oscillators: FakeOscillatorNode[] = [];
  state: AudioContextState = "running";

  async close() {
    this.state = "closed";
  }

  createGain() {
    const gain = new FakeGainNode();
    this.gains.push(gain);
    return gain;
  }

  createBufferSource() {
    const source = new FakeBufferSourceNode();
    this.bufferSources.push(source);
    return source;
  }

  createDynamicsCompressor() {
    return new FakeCompressorNode();
  }

  async decodeAudioData() {
    return { duration: 2 } as AudioBuffer;
  }

  createOscillator() {
    const oscillator = new FakeOscillatorNode();
    this.oscillators.push(oscillator);
    return oscillator;
  }

  async resume() {
    this.state = "running";
  }
}

class FakeInstrument implements PitchedInstrument {
  disposed = false;
  loadCount = 0;
  scheduled: ScheduledMusicalEvent[] = [];
  stopCount = 0;

  constructor(private readonly loadError: Error | null = null) {}

  dispose() {
    this.disposed = true;
  }

  async load() {
    this.loadCount += 1;
    if (this.loadError) throw this.loadError;
  }

  schedule(event: ScheduledMusicalEvent) {
    this.scheduled.push(event);
    return [];
  }

  stopAll() {
    this.stopCount += 1;
  }
}

const createFakeEnvironment = (instrumentLoadError: Error | null = null) => {
  const context = new FakeAudioContext();
  const instruments = new Map<GuitarPresetId, FakeInstrument>();
  const getInstrument = (preset: GuitarPresetId) => {
    let instrument = instruments.get(preset);
    if (!instrument) {
      instrument = new FakeInstrument(instrumentLoadError);
      instruments.set(preset, instrument);
    }
    return instrument;
  };
  const instrument = getInstrument("clean-electric");
  const callbacks = new Map<number, () => void>();
  let nextTimeoutId = 1;

  const environment: PracticeMetronomeEnvironment = {
    clearTimeout: (timeoutId) => callbacks.delete(timeoutId),
    createAudioContext: () => context as unknown as AudioContext,
    createInstrument: (_context, preset) => getInstrument(preset),
    setTimeout: (callback) => {
      const timeoutId = nextTimeoutId;
      nextTimeoutId += 1;
      callbacks.set(timeoutId, callback);
      return timeoutId;
    },
  };

  return { callbacks, context, environment, instrument, instruments };
};

const baseConfig: PracticeMetronomeConfig = {
  authoredScore: practiceTabExamples["daily-reset"],
  clickSubdivision: "quarters",
  countInEnabled: true,
  instrumentEnabled: false,
  instrumentPlan: dailyAudioPlan,
  instrumentPreset: "clean-electric",
  instrumentVolume: 70,
  metronomeEnabled: false,
  tempo: 120,
  volume: 70,
};

const verifyMultisampleSourceOrdering = async () => {
  const context = new FakeAudioContext();
  const instrument = new MultisampleInstrument(
    context as unknown as AudioContext,
    guitarPresets["clean-electric"],
    { fetchArrayBuffer: async () => new ArrayBuffer(8) },
  );
  await instrument.load();
  const voices = instrument.schedule(
    {
      duration: 0.5,
      id: "source-order",
      notes: [{ articulation: "normal", midi: 40, velocity: 0.8 }],
      startTime: 0.05,
    },
    context.destination as unknown as AudioNode,
  );
  assert.equal(voices.length, 1);
  assert.equal(context.bufferSources[0].started, true);
  assert.equal(context.bufferSources[0].stopped, true);
  instrument.dispose();
};

const verifyPracticeMetronomeEngine = async () => {
  await verifyMultisampleSourceOrdering();
  const diagnosticPlan = {
    available: true as const,
    events: [0, 1, 2, 3].map((startBeat) => ({
      durationBeats: 1,
      id: `diagnostic:${startBeat}`,
      notes: [{ articulation: "normal" as const, midi: 40, velocity: 0.8 }],
      startBeat,
    })),
    scoreLengthBeats: 4,
  };
  for (const [multiplier, expectedSpacing] of [
    [1, 1],
    [2, 0.5],
    [4, 0.25],
  ] as const) {
    const diagnosticHarness = createFakeEnvironment();
    const diagnosticEngine = new PracticeMetronomeEngine(
      {
        ...baseConfig,
        countInEnabled: false,
        instrumentEnabled: true,
        instrumentPlan: diagnosticPlan,
        playbackSpeedMultiplier: multiplier,
        tempo: 60,
      },
      { environment: diagnosticHarness.environment, lookAheadSeconds: 4.1 },
    );
    await diagnosticEngine.start({ countInBeats: 0 });
    const scheduled = diagnosticHarness.instrument.scheduled.slice(0, 4);
    assert.equal(scheduled.length, 4);
    assert.deepEqual(
      scheduled.map((event) =>
        Number((event.startTime - scheduled[0].startTime).toFixed(6)),
      ),
      [0, expectedSpacing, expectedSpacing * 2, expectedSpacing * 3],
      `Diagnostic guitar onsets must use the ${multiplier}x playback timeline`,
    );
    assert.equal(
      Number((scheduled[0].duration - expectedSpacing).toFixed(6)),
      0,
    );
    await diagnosticEngine.dispose();
  }
  const countInHarness = createFakeEnvironment();
  const countInEngine = new PracticeMetronomeEngine(baseConfig, {
    environment: countInHarness.environment,
  });
  countInEngine.configure({
    ...baseConfig,
    clickSubdivision: "sixteenths",
  });
  assert.equal(countInEngine.getSnapshot().phase, "idle");
  assert.equal(countInEngine.getSnapshot().activeEventIndex, 0);
  countInEngine.configure(baseConfig);

  const firstStart = countInEngine.start({ countInBeats: 2 });
  const duplicateStart = countInEngine.start({ countInBeats: 2 });
  assert.equal(
    firstStart,
    duplicateStart,
    "Concurrent Start commands must share one context activation",
  );
  await firstStart;
  assert.equal(countInEngine.getSnapshot().phase, "counting-in");
  assert.equal(countInEngine.getSnapshot().countInBeatsRemaining, 2);
  assert.equal(countInEngine.getSnapshot().elapsedExerciseSeconds, 0);
  assert.equal(countInHarness.context.oscillators.length, 1);
  assert.equal(countInHarness.context.oscillators[0].startTime, 0.05);
  assert.equal(countInHarness.callbacks.size, 1);

  const quarterCountInClicks = [...countInHarness.context.oscillators];
  countInEngine.configure({ ...baseConfig, clickSubdivision: "eighths" });
  assert.equal(countInEngine.getSnapshot().phase, "counting-in");
  assert.equal(countInEngine.getSnapshot().activeEventIndex, 0);
  assert.ok(
    quarterCountInClicks.every(({ stopTimes }) => stopTimes.at(-1) === 0),
    "A count-in subdivision change must cancel queued old-subdivision clicks",
  );

  const queuedCountInClicks = [...countInHarness.context.oscillators];
  countInEngine.configure({ ...baseConfig, countInEnabled: false });
  assert.equal(countInEngine.getSnapshot().phase, "playing");
  assert.ok(
    queuedCountInClicks.every(({ stopTimes }) => stopTimes.at(-1) === 0),
    "Disabling an active count-in must cancel its queued clicks",
  );

  await countInEngine.start({ countInBeats: 2 });
  assert.equal(
    countInHarness.callbacks.size,
    1,
    "Starting an active engine must not create a second scheduler",
  );

  countInHarness.context.currentTime = 1.05;
  assert.equal(countInEngine.getSnapshot().phase, "playing");
  assert.equal(countInEngine.getSnapshot().elapsedExerciseSeconds, 1.05);
  countInEngine.pause();
  assert.equal(countInEngine.getSnapshot().phase, "paused");
  assert.equal(countInEngine.getSnapshot().elapsedExerciseSeconds, 1.05);
  const pausedExerciseBeat = countInEngine.getSnapshot().exerciseBeat;
  countInEngine.configure({
    ...baseConfig,
    clickSubdivision: "sixteenths",
  });
  assert.equal(countInEngine.getSnapshot().exerciseBeat, pausedExerciseBeat);
  assert.equal(
    countInEngine.getSnapshot().activeEventIndex,
    getPracticeActiveEventIndexAtBeat(
      pausedExerciseBeat,
      baseConfig.authoredScore,
    ),
    "A paused click-subdivision change must not alter authored timing",
  );
  assert.equal(countInHarness.callbacks.size, 0);
  assert.ok(
    countInHarness.context.oscillators.every(
      ({ disconnected }) => disconnected,
    ),
    "Pause must disconnect every queued click",
  );

  countInEngine.configure(baseConfig);
  await countInEngine.resume({ countInBeats: 3 });
  assert.equal(countInEngine.getSnapshot().phase, "counting-in");
  assert.equal(countInEngine.getSnapshot().countInBeatsRemaining, 3);
  assert.equal(countInEngine.getSnapshot().elapsedExerciseSeconds, 1.05);
  countInEngine.stop();
  assert.equal(countInEngine.getSnapshot().phase, "idle");
  assert.equal(countInEngine.getSnapshot().activeEventIndex, 0);
  assert.equal(countInEngine.getSnapshot().elapsedExerciseSeconds, 0);
  assert.equal(countInHarness.callbacks.size, 0);

  const silentHarness = createFakeEnvironment();
  const silentEngine = new PracticeMetronomeEngine(
    { ...baseConfig, countInEnabled: false },
    { environment: silentHarness.environment },
  );
  await silentEngine.start({ countInBeats: 4 });
  assert.equal(silentEngine.getSnapshot().phase, "playing");
  assert.equal(
    silentHarness.context.oscillators.length,
    0,
    "Count-in and exercise metronome enablement must remain independent",
  );

  const instrumentHarness = createFakeEnvironment();
  const instrumentEngine = new PracticeMetronomeEngine(
    {
      ...baseConfig,
      countInEnabled: false,
      instrumentEnabled: true,
      metronomeEnabled: true,
    },
    { environment: instrumentHarness.environment, lookAheadSeconds: 1.2 },
  );
  await instrumentEngine.start({ countInBeats: 0 });
  assert.equal(instrumentHarness.instrument.loadCount, 1);
  assert.equal(instrumentEngine.getSnapshot().instrumentStatus, "ready");
  assert.ok(instrumentHarness.instrument.scheduled.length > 0);
  assert.equal(
    instrumentHarness.instrument.scheduled[0].startTime,
    instrumentHarness.context.oscillators[0].startTime,
    "Instrument and metronome must share the same audio-time anchor",
  );

  instrumentEngine.configure({
    ...baseConfig,
    countInEnabled: false,
    instrumentEnabled: true,
    instrumentVolume: 25,
    metronomeEnabled: true,
  });
  assert.ok(
    instrumentHarness.context.gains.some(
      ({ gain }) => gain.value === 0.25 ** 2,
    ),
    "Instrument volume must update its own gain bus",
  );

  const clicksBeforeMute = instrumentHarness.context.oscillators.length;
  instrumentEngine.configure({
    ...baseConfig,
    countInEnabled: false,
    instrumentEnabled: false,
    metronomeEnabled: true,
  });
  assert.ok(instrumentHarness.instrument.stopCount > 0);
  assert.ok(
    instrumentHarness.context.oscillators.length > clicksBeforeMute,
    "Muting the instrument must leave the metronome scheduler active",
  );
  assert.equal(instrumentEngine.getSnapshot().instrumentStatus, "idle");
  instrumentEngine.stop();
  assert.equal(instrumentHarness.callbacks.size, 0);
  await instrumentEngine.dispose();
  assert.equal(instrumentHarness.instrument.disposed, true);

  const switchHarness = createFakeEnvironment();
  const switchEngine = new PracticeMetronomeEngine(
    {
      ...baseConfig,
      countInEnabled: false,
      instrumentEnabled: true,
    },
    { environment: switchHarness.environment, lookAheadSeconds: 1.2 },
  );
  await switchEngine.start({ countInBeats: 0 });
  const cleanInstrument = switchHarness.instruments.get("clean-electric");
  assert.ok(cleanInstrument);
  switchEngine.configure({
    ...baseConfig,
    countInEnabled: false,
    instrumentEnabled: true,
    instrumentPreset: "acoustic-guitar",
  });
  await Promise.resolve();
  await Promise.resolve();
  const acousticInstrument = switchHarness.instruments.get("acoustic-guitar");
  assert.ok(acousticInstrument);
  assert.equal(acousticInstrument.loadCount, 1);
  assert.ok(
    cleanInstrument.stopCount > 0,
    "Preset switching must stop stale voices",
  );
  assert.equal(switchEngine.getSnapshot().phase, "playing");
  assert.equal(switchEngine.getSnapshot().instrumentStatus, "ready");
  await switchEngine.dispose();

  const failedInstrumentHarness = createFakeEnvironment(
    new Error("Sample request failed"),
  );
  const failedInstrumentEngine = new PracticeMetronomeEngine(
    {
      ...baseConfig,
      countInEnabled: false,
      instrumentEnabled: true,
      metronomeEnabled: true,
    },
    {
      environment: failedInstrumentHarness.environment,
      lookAheadSeconds: 1.2,
    },
  );
  await failedInstrumentEngine.start({ countInBeats: 0 });
  assert.equal(failedInstrumentEngine.getSnapshot().phase, "playing");
  assert.equal(failedInstrumentEngine.getSnapshot().instrumentStatus, "error");
  assert.equal(
    failedInstrumentEngine.getSnapshot().instrumentError,
    "Sample request failed",
  );
  assert.ok(
    failedInstrumentHarness.context.oscillators.length > 0,
    "A sample load failure must not prevent metronome playback",
  );
  await failedInstrumentEngine.dispose();

  const tempoHarness = createFakeEnvironment();
  const tempoEngine = new PracticeMetronomeEngine(
    {
      ...baseConfig,
      countInEnabled: false,
      metronomeEnabled: true,
    },
    { environment: tempoHarness.environment, lookAheadSeconds: 1.2 },
  );
  await tempoEngine.start({ countInBeats: 0 });
  const oldTempoClicks = [...tempoHarness.context.oscillators];
  assert.ok(oldTempoClicks.length >= 2);

  tempoHarness.context.currentTime = 0.2;
  const beatBeforeTempoChange = tempoEngine.getSnapshot().exerciseBeat;
  const elapsedBeforeTempoChange =
    tempoEngine.getSnapshot().elapsedExerciseSeconds;
  tempoEngine.configure({
    ...baseConfig,
    countInEnabled: false,
    metronomeEnabled: true,
    tempo: 60,
  });
  assert.equal(tempoEngine.getSnapshot().exerciseBeat, beatBeforeTempoChange);
  assert.equal(
    tempoEngine.getSnapshot().elapsedExerciseSeconds,
    elapsedBeforeTempoChange,
    "A tempo change must not alter elapsed practice time",
  );
  assert.ok(
    oldTempoClicks.every(({ stopTimes }) => stopTimes.at(-1) === 0.2),
    "A tempo change must cancel every click queued under the old tempo",
  );
  assert.equal(tempoHarness.callbacks.size, 1);

  const subdivisionHarness = createFakeEnvironment();
  const subdivisionEngine = new PracticeMetronomeEngine(
    {
      ...baseConfig,
      countInEnabled: false,
      clickSubdivision: "quarters",
      metronomeEnabled: true,
    },
    { environment: subdivisionHarness.environment, lookAheadSeconds: 1.2 },
  );
  await subdivisionEngine.start({ countInBeats: 0 });
  subdivisionHarness.context.currentTime = 0.8;

  const exerciseBeatBeforeSubdivisionChanges =
    subdivisionEngine.getSnapshot().exerciseBeat;
  for (const subdivision of [
    "eighths",
    "triplets",
    "sixteenths",
    "quarters",
  ] as const) {
    const clicksScheduledUnderPreviousSubdivision = [
      ...subdivisionHarness.context.oscillators,
    ];

    subdivisionEngine.configure({
      ...baseConfig,
      countInEnabled: false,
      clickSubdivision: subdivision,
      metronomeEnabled: true,
    });

    assert.equal(
      subdivisionEngine.getSnapshot().exerciseBeat,
      exerciseBeatBeforeSubdivisionChanges,
      `${subdivision} must not move the exercise beat`,
    );
    assert.equal(
      subdivisionEngine.getSnapshot().activeEventIndex,
      getPracticeActiveEventIndexAtBeat(
        exerciseBeatBeforeSubdivisionChanges,
        baseConfig.authoredScore,
      ),
      `${subdivision} click rate must leave the authored Follow Along event unchanged`,
    );
    assert.ok(
      clicksScheduledUnderPreviousSubdivision.every(
        ({ stopTimes }) => stopTimes.at(-1) === 0.8,
      ),
      `${subdivision} must replace queued pulses from the previous subdivision`,
    );
    assert.ok(
      subdivisionHarness.context.oscillators.length >
        clicksScheduledUnderPreviousSubdivision.length,
      `${subdivision} must schedule a new audible pulse plan`,
    );
  }

  await subdivisionEngine.dispose();

  await tempoEngine.dispose();
  assert.equal(tempoHarness.callbacks.size, 0);
  assert.equal(tempoHarness.context.state, "closed");
  await tempoEngine.dispose();
};

verifyPracticeMetronomeEngine()
  .then(() => console.log("Practice audio and timing verification passed."))
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  });
