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
import {
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
assert.equal(
  getPracticeActiveEventIndexAtBeat(3, practiceTabExamples["legato-phrase"]),
  12,
  "A later explicit rest must supersede an earlier sustain at its authored start",
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
  authoredScore: practiceTabExamples["daily-reset"],
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
