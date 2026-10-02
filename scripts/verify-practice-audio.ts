import assert from "node:assert/strict";
import { practiceTabExamples } from "../src/data/practiceTabExamples";
import {
  type PracticeMetronomeConfig,
  PracticeMetronomeEngine,
  type PracticeMetronomeEnvironment,
} from "../src/features/practice/audio/PracticeMetronomeEngine";
import {
  clampPracticeDurationMinutes,
  formatPracticeTime,
  getPracticeDurationSeconds,
  getPracticeRemainingSeconds,
} from "../src/features/practice/session";
import { getPracticeSequenceEvents } from "../src/features/practice/tablature";
import {
  getPracticeActiveEventIndexAtBeat,
  getPracticeAudioTimeAtExerciseBeat,
  getPracticeEventStartBeat,
  getPracticeExerciseBeatAtAudioTime,
  getPracticeSecondsPerBeat,
  getPracticeSecondsPerEvent,
  planPracticeMetronomePulses,
} from "../src/features/practice/timing";

assert.equal(getPracticeSecondsPerBeat(120), 0.5);
assert.equal(getPracticeSecondsPerBeat(1), 2);
assert.equal(getPracticeSecondsPerBeat(400), 0.25);
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

const anchor = { audioTime: 10, exerciseBeat: 2, tempo: 120 };
assert.equal(getPracticeExerciseBeatAtAudioTime(anchor, 11), 4);
assert.equal(getPracticeAudioTimeAtExerciseBeat(anchor, 4), 11);

assert.equal(getPracticeActiveEventIndexAtBeat(0, "eighths", 8), 0);
assert.equal(getPracticeActiveEventIndexAtBeat(0.5, "eighths", 8), 1);
assert.equal(getPracticeActiveEventIndexAtBeat(3.999, "sixteenths", 8), 7);
assert.equal(getPracticeActiveEventIndexAtBeat(4, "sixteenths", 8), 0);
assert.equal(getPracticeActiveEventIndexAtBeat(8.5, "eighths", 8), 1);
assert.equal(getPracticeEventStartBeat(2.74, "eighths"), 2.5);
assert.equal(getPracticeEventStartBeat(2.74, "sixteenths"), 2.5);

const dailyResetSequence = getPracticeSequenceEvents(
  practiceTabExamples["daily-reset"],
);
assert.deepEqual(
  dailyResetSequence.map(({ at }) => at),
  [0, 1, 2, 3, 4, 5, 6, 7],
  "Follow Along must use musical slot order rather than source-array order",
);

const chugsRiffSequence = getPracticeSequenceEvents(
  practiceTabExamples["chugs-riff"],
);
assert.equal(chugsRiffSequence[3].kind, "rest");
assert.equal(chugsRiffSequence[4].kind, "notes");
if (chugsRiffSequence[4].kind === "notes") {
  assert.equal(
    chugsRiffSequence[4].notes.length,
    2,
    "A simultaneous chord must remain one Follow Along event",
  );
}

const gallopSequence = getPracticeSequenceEvents(
  practiceTabExamples["metal-gallop-control"],
);
assert.deepEqual(
  gallopSequence.map(({ at, kind }) => ({ at, kind })),
  [
    { at: 0, kind: "notes" },
    { at: 1, kind: "rest" },
    { at: 2, kind: "notes" },
    { at: 3, kind: "notes" },
    { at: 4, kind: "notes" },
    { at: 5, kind: "rest" },
    { at: 6, kind: "notes" },
    { at: 7, kind: "notes" },
    { at: 8, kind: "rest" },
    { at: 12, kind: "notes" },
  ],
  "Gallops must preserve attack, silence, and chord-punch order",
);
assert.equal(
  getPracticeActiveEventIndexAtBeat(2.5, "sixteenths", gallopSequence.length),
  0,
  "The gallop sequence must loop from its final event to its first event",
);

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
  eighthPulses.map(({ beat }) =>
    getPracticeActiveEventIndexAtBeat(beat, "eighths", 8),
  ),
  [0, 1],
  "Eighth-note clicks and Follow Along events must share one beat projection",
);

for (const tempo of [60, 120, 180]) {
  for (const subdivision of ["eighths", "triplets", "sixteenths"] as const) {
    const performanceAnchor = { audioTime: 0, exerciseBeat: 0, tempo };
    const secondsPerEvent = getPracticeSecondsPerEvent(tempo, subdivision);

    for (let event = 0; event < 16; event += 1) {
      const exerciseBeat = getPracticeExerciseBeatAtAudioTime(
        performanceAnchor,
        event * secondsPerEvent + secondsPerEvent * 0.1,
      );
      assert.equal(
        getPracticeActiveEventIndexAtBeat(exerciseBeat, subdivision, 8),
        event % 8,
        `${tempo} BPM ${subdivision} event ${event} must project from Web Audio time`,
      );
    }
  }
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
  countInEnabled: true,
  eventCount: 8,
  metronomeEnabled: false,
  subdivision: "quarters",
  tempo: 120,
  volume: 70,
};

const verifyPracticeMetronomeEngine = async () => {
  const countInHarness = createFakeEnvironment();
  const countInEngine = new PracticeMetronomeEngine(baseConfig, {
    environment: countInHarness.environment,
  });
  countInEngine.configure({ ...baseConfig, subdivision: "sixteenths" });
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
  countInEngine.configure({ ...baseConfig, subdivision: "eighths" });
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
  countInEngine.configure({ ...baseConfig, subdivision: "sixteenths" });
  assert.equal(countInEngine.getSnapshot().exerciseBeat, pausedExerciseBeat);
  assert.equal(
    countInEngine.getSnapshot().activeEventIndex,
    getPracticeActiveEventIndexAtBeat(
      pausedExerciseBeat,
      "sixteenths",
      baseConfig.eventCount,
    ),
    "A paused subdivision change must reproject the event without moving time",
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
      metronomeEnabled: true,
      subdivision: "quarters",
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
      metronomeEnabled: true,
      subdivision,
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
        subdivision,
        baseConfig.eventCount,
      ),
      `${subdivision} must recalculate the Follow Along event from the same exercise beat`,
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
