import assert from "node:assert/strict";
import {
  type PracticeMetronomeConfig,
  PracticeMetronomeEngine,
  type PracticeMetronomeEnvironment,
} from "../src/features/practice/audio/PracticeMetronomeEngine";
import {
  getPracticeActiveSlotAtBeat,
  getPracticeAudioTimeAtExerciseBeat,
  getPracticeExerciseBeatAtAudioTime,
  getPracticeSecondsPerBeat,
  getPracticeSecondsPerSlot,
  getPracticeSlotStartBeat,
  planPracticeMetronomePulses,
} from "../src/features/practice/timing";

assert.equal(getPracticeSecondsPerBeat(120), 0.5);
assert.equal(getPracticeSecondsPerBeat(1), 2);
assert.equal(getPracticeSecondsPerBeat(400), 0.25);
assert.equal(getPracticeSecondsPerSlot(120, "sixteenths"), 0.125);
assert.equal(getPracticeSecondsPerSlot(60, "triplets"), 1 / 3);

const anchor = { audioTime: 10, exerciseBeat: 2, tempo: 120 };
assert.equal(getPracticeExerciseBeatAtAudioTime(anchor, 11), 4);
assert.equal(getPracticeAudioTimeAtExerciseBeat(anchor, 4), 11);

assert.equal(getPracticeActiveSlotAtBeat(0, "eighths"), 0);
assert.equal(getPracticeActiveSlotAtBeat(0.5, "eighths"), 1);
assert.equal(getPracticeActiveSlotAtBeat(3.999, "sixteenths"), 15);
assert.equal(getPracticeActiveSlotAtBeat(4, "sixteenths"), 0);
assert.equal(getPracticeActiveSlotAtBeat(8.5, "eighths"), 1);
assert.equal(getPracticeSlotStartBeat(2.74, "eighths"), 2.5);
assert.equal(getPracticeSlotStartBeat(2.74, "sixteenths"), 2.5);

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
assert.deepEqual(
  eighthPulses.map(({ beat }) => getPracticeActiveSlotAtBeat(beat, "eighths")),
  [0, 1],
  "Matching visual slots and audible subdivisions must use the same beat axis",
);

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

class FakeAudioContext {
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

  createOscillator() {
    const oscillator = new FakeOscillatorNode();
    this.oscillators.push(oscillator);
    return oscillator;
  }

  async resume() {
    this.state = "running";
  }
}

const createFakeEnvironment = () => {
  const context = new FakeAudioContext();
  const callbacks = new Map<number, () => void>();
  let nextTimeoutId = 1;

  const environment: PracticeMetronomeEnvironment = {
    clearTimeout: (timeoutId) => callbacks.delete(timeoutId),
    createAudioContext: () => context as unknown as AudioContext,
    setTimeout: (callback) => {
      const timeoutId = nextTimeoutId;
      nextTimeoutId += 1;
      callbacks.set(timeoutId, callback);
      return timeoutId;
    },
  };

  return { callbacks, context, environment };
};

const baseConfig: PracticeMetronomeConfig = {
  authoredSubdivision: "eighths",
  clickSubdivision: "quarters",
  countInEnabled: true,
  metronomeEnabled: false,
  tempo: 120,
  volume: 70,
};

const verifyPracticeMetronomeEngine = async () => {
  const countInHarness = createFakeEnvironment();
  const countInEngine = new PracticeMetronomeEngine(baseConfig, {
    environment: countInHarness.environment,
  });

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
  assert.equal(countInHarness.context.oscillators.length, 1);
  assert.equal(countInHarness.context.oscillators[0].startTime, 0.05);
  assert.equal(countInHarness.callbacks.size, 1);

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
  countInEngine.pause();
  assert.equal(countInEngine.getSnapshot().phase, "paused");
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
  countInEngine.stop();
  assert.equal(countInEngine.getSnapshot().phase, "idle");
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
  tempoEngine.configure({
    ...baseConfig,
    countInEnabled: false,
    metronomeEnabled: true,
    tempo: 60,
  });
  assert.equal(tempoEngine.getSnapshot().exerciseBeat, beatBeforeTempoChange);
  assert.ok(
    oldTempoClicks.every(({ stopTimes }) => stopTimes.at(-1) === 0.2),
    "A tempo change must cancel every click queued under the old tempo",
  );
  assert.equal(tempoHarness.callbacks.size, 1);

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
