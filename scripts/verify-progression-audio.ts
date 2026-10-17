import assert from "node:assert/strict";
import type {
  PitchedInstrument,
  ScheduledMusicalEvent,
} from "../src/features/audio/types";
import {
  buildProgressionAudioPlan,
  getProgressionStepIndexAtBeat,
  ProgressionPlaybackEngine,
  planProgressionEventsInWindow,
} from "../src/features/progression-audio";
import { registeredTuningPresets } from "../src/features/tunings/registeredTunings";
import type { PlayableVoicing } from "../src/features/voicings";

const voicing = (
  chordName: string,
  pitches: readonly (number | null)[],
  registerStatus: PlayableVoicing["registerStatus"] = "verified",
): PlayableVoicing => ({
  baseFret: 0,
  chordName,
  difficulty: { label: "easy", score: 0 },
  doublings: [],
  fretSpan: 3,
  generatorVersion: "dynamic-chord-v1",
  omissions: [],
  rank: 0,
  registerStatus,
  requiredTones: ["root"],
  signature: `${chordName}:${pitches.join(",")}`,
  stringCount: 6,
  strings: pitches.map((midi, stringIndex) => {
    if (midi === null) {
      return { kind: "muted" as const, openPitchClass: 0, stringIndex };
    }
    const sounding = {
      midi,
      noteName: "C",
      openMidi: midi,
      openPitchClass: 0 as const,
      pitchClass: 0 as const,
      role: stringIndex === 0 ? ("root" as const) : ("fifth" as const),
      stringIndex,
    };
    return midi % 2 === 0
      ? { ...sounding, fret: 0 as const, kind: "open" as const }
      : { ...sounding, fret: 1, kind: "fretted" as const };
  }),
  toneRoles: ["root"],
});

const plan = buildProgressionAudioPlan([
  {
    durationBeats: 4,
    id: "inversion",
    voicing: voicing("C/E", [64, 60, 55, null, null, null]),
  },
  {
    durationBeats: 2,
    id: "power",
    voicing: voicing("D5", [62, 57, 50, null, null, null]),
  },
]);
assert.equal(plan.available, true);
assert.deepEqual(
  plan.events[0].midi,
  [64, 60, 55],
  "exact voicing pitches and inversion must survive",
);
assert.deepEqual(
  plan.events[1].midi,
  [62, 57, 50],
  "power chord must not gain a third",
);
assert.equal(
  plan.totalBeats,
  6,
  "authored step durations must define the timeline",
);
assert.equal(getProgressionStepIndexAtBeat(0, plan, true), 0);
assert.equal(getProgressionStepIndexAtBeat(3.999, plan, true), 0);
assert.equal(getProgressionStepIndexAtBeat(4, plan, true), 1);
assert.equal(
  getProgressionStepIndexAtBeat(6, plan, true),
  0,
  "loop boundary must return to step one",
);
assert.equal(
  getProgressionStepIndexAtBeat(6, plan, false),
  null,
  "sequence must end at its boundary",
);

const scheduled = planProgressionEventsInWindow({
  fromBeat: 0,
  loop: true,
  plan,
  secondsPerBeat: 0.5,
  toBeat: 6.01,
});
assert.deepEqual(
  scheduled.map(({ startBeat }) => startBeat),
  [0, 4, 6],
);
assert.deepEqual(
  scheduled.map(({ duration }) => duration),
  [2, 1, 2],
);
assert.equal(
  scheduled[0].notes.length,
  3,
  "sounding strings must be simultaneous notes",
);

const customPlan = buildProgressionAudioPlan([
  {
    durationBeats: 4,
    id: "custom",
    voicing: voicing("C", [60], "pitch-class-only"),
  },
]);
assert.equal(
  customPlan.available,
  false,
  "custom tunings without octaves must be rejected",
);

for (const tuning of registeredTuningPresets) {
  const exactOpenStrings = buildProgressionAudioPlan([
    {
      durationBeats: 4,
      id: tuning.id,
      voicing: voicing(tuning.label, tuning.midiPitchesHighToLow),
    },
  ]);
  assert.equal(exactOpenStrings.available, true);
  assert.deepEqual(
    exactOpenStrings.events[0].midi,
    tuning.midiPitchesHighToLow,
    `${tuning.label} must retain every registered open-string octave`,
  );
}
assert.equal(
  registeredTuningPresets
    .find(({ id }) => id === "8-drop-e")
    ?.midiPitchesHighToLow.at(-1),
  28,
  "8-string Drop E coverage must include MIDI 28",
);

class FakeInstrument implements PitchedInstrument {
  disposed = false;
  events: ScheduledMusicalEvent[] = [];
  stopCount = 0;
  load(): Promise<void> {
    return Promise.resolve();
  }
  schedule(event: ScheduledMusicalEvent): readonly [] {
    this.events.push(event);
    return [];
  }
  stopAll(): void {
    this.stopCount += 1;
  }
  dispose(): void {
    this.disposed = true;
  }
}

const contexts: Array<{ closed: boolean; context: AudioContext }> = [];
let now = 0;
const instruments: FakeInstrument[] = [];
const timers = new Map<number, () => void>();
let timerId = 0;
const fakeContext = {
  close: async () => {
    contexts[0].closed = true;
  },
  createGain: () => ({
    connect: () => undefined,
    disconnect: () => undefined,
    gain: { setValueAtTime: () => undefined },
  }),
  get currentTime() {
    return now;
  },
  destination: {},
  resume: async () => undefined,
  state: "running",
} as unknown as AudioContext;
contexts.push({ closed: false, context: fakeContext });
const engine = new ProgressionPlaybackEngine(
  { bpm: 120, loop: true, plan, preset: "clean-electric", volume: 70 },
  {
    environment: {
      clearTimeout: (id) => {
        timers.delete(id);
      },
      createAudioContext: () => fakeContext,
      createInstrument: () => {
        const instrument = new FakeInstrument();
        instruments.push(instrument);
        return instrument;
      },
      setTimeout: (callback) => {
        const id = ++timerId;
        timers.set(id, callback);
        return id;
      },
    },
    lookAheadSeconds: 3.01,
    startLeadSeconds: 0,
  },
);
const verifyLifecycle = async () => {
  await engine.start();
  assert.equal(engine.getSnapshot().activeStepIndex, 0);
  assert.deepEqual(
    instruments[0].events.map(({ startTime }) => startTime),
    [0, 2, 3],
  );
  now = 0.75;
  engine.pause();
  assert.equal(engine.getSnapshot().phase, "paused");
  assert.ok(
    instruments[0].stopCount > 0,
    "pause must cancel active and queued voices",
  );
  await engine.resume();
  assert.equal(
    instruments[0].events.find(({ id }) => id.endsWith(":resume"))?.duration,
    1.25,
    "resume must retrigger the remaining portion of the active chord",
  );
  engine.configure({
    bpm: 90,
    loop: true,
    plan,
    preset: "high-gain-electric",
    volume: 40,
  });
  await Promise.resolve();
  assert.equal(
    instruments.length,
    2,
    "preset switching must prepare a distinct cached instrument",
  );
  engine.stop();
  assert.equal(
    engine.getSnapshot().activeStepIndex,
    null,
    "stop must clear playback highlighting",
  );
  await engine.dispose();
  assert.ok(
    instruments.every(({ disposed }) => disposed),
    "disposal must release all instruments",
  );
  assert.equal(
    contexts[0].closed,
    true,
    "disposal must close its AudioContext",
  );
};

verifyLifecycle()
  .then(() =>
    console.log(
      "Progression audio verification passed: voicings, timing, looping, lifecycle, and preset switching.",
    ),
  )
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
