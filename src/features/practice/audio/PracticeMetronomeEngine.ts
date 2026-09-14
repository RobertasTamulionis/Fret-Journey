import type { PracticeTabSubdivision } from "../tablature";
import {
  clampPracticeTempo,
  getPracticeActiveSlotAtBeat,
  getPracticeAudioTimeAtExerciseBeat,
  getPracticeExerciseBeatAtAudioTime,
  getPracticeSecondsPerBeat,
  getPracticeSlotStartBeat,
  type PracticeTimelineAnchor,
  planPracticeMetronomePulses,
} from "../timing";

export type PracticeAudioTransportPhase =
  | "idle"
  | "counting-in"
  | "playing"
  | "paused";

export type PracticeMetronomeConfig = {
  authoredSubdivision: PracticeTabSubdivision;
  clickSubdivision: PracticeTabSubdivision;
  countInEnabled: boolean;
  metronomeEnabled: boolean;
  tempo: number;
  volume: number;
};

export type PracticeTransportSnapshot = {
  activeSlot: number;
  countInBeatsRemaining: number;
  exerciseBeat: number;
  phase: PracticeAudioTransportPhase;
};

export type PracticeTransportStartOptions = {
  countInBeats: number;
  fromExerciseBeat?: number;
};

export type PracticeMetronomeEnvironment = {
  clearTimeout: (timeoutId: number) => void;
  createAudioContext: () => AudioContext;
  setTimeout: (callback: () => void, delay: number) => number;
};

type PracticeMetronomeEngineOptions = {
  environment?: PracticeMetronomeEnvironment;
  lookAheadSeconds?: number;
  schedulerIntervalMs?: number;
  startLeadSeconds?: number;
};

type ActiveRun = {
  anchor: PracticeTimelineAnchor;
  countInBeats: number;
  countInStartAudioTime: number;
  playbackStartAudioTime: number;
  playbackStartBeat: number;
};

type ScheduledClick = {
  gain: GainNode;
  oscillator: OscillatorNode;
};

const defaultEnvironment: PracticeMetronomeEnvironment = {
  clearTimeout: (timeoutId) => window.clearTimeout(timeoutId),
  createAudioContext: () => {
    const AudioContextConstructor =
      window.AudioContext ??
      (
        window as typeof window & {
          webkitAudioContext?: typeof AudioContext;
        }
      ).webkitAudioContext;

    if (!AudioContextConstructor) {
      throw new Error("Web Audio is not supported in this browser.");
    }

    return new AudioContextConstructor();
  },
  setTimeout: (callback, delay) => window.setTimeout(callback, delay),
};

const defaultSnapshot: PracticeTransportSnapshot = {
  activeSlot: 0,
  countInBeatsRemaining: 0,
  exerciseBeat: 0,
  phase: "idle",
};

const audioTimeEpsilon = 1e-9;

const clampVolume = (volume: number): number =>
  Math.min(100, Math.max(0, volume));

const normalizeConfig = (
  config: PracticeMetronomeConfig,
): PracticeMetronomeConfig => ({
  ...config,
  tempo: clampPracticeTempo(config.tempo),
  volume: clampVolume(config.volume),
});

const volumeToGain = (volume: number): number =>
  (clampVolume(volume) / 100) ** 2;

export class PracticeMetronomeEngine {
  private activationGeneration = 0;
  private activationPromise: Promise<void> | null = null;
  private config: PracticeMetronomeConfig;
  private context: AudioContext | null = null;
  private disposed = false;
  private environment: PracticeMetronomeEnvironment;
  private generation = 0;
  private lookAheadSeconds: number;
  private mode: "idle" | "paused" | "running" = "idle";
  private pausedExerciseBeat = 0;
  private run: ActiveRun | null = null;
  private runGain: GainNode | null = null;
  private scheduledClicks = new Set<ScheduledClick>();
  private scheduledThroughAudioTime = 0;
  private schedulerIntervalMs: number;
  private schedulerTimeoutId: number | null = null;
  private startLeadSeconds: number;

  constructor(
    config: PracticeMetronomeConfig,
    options: PracticeMetronomeEngineOptions = {},
  ) {
    this.config = normalizeConfig(config);
    this.environment = options.environment ?? defaultEnvironment;
    this.lookAheadSeconds = options.lookAheadSeconds ?? 0.12;
    this.schedulerIntervalMs = options.schedulerIntervalMs ?? 25;
    this.startLeadSeconds = options.startLeadSeconds ?? 0.05;
  }

  configure(config: PracticeMetronomeConfig): void {
    const nextConfig = normalizeConfig(config);
    const previousConfig = this.config;
    const tempoChanged = previousConfig.tempo !== nextConfig.tempo;
    const pulsePlanChanged =
      previousConfig.clickSubdivision !== nextConfig.clickSubdivision ||
      previousConfig.metronomeEnabled !== nextConfig.metronomeEnabled;
    const cancelActiveCountIn =
      previousConfig.countInEnabled &&
      !nextConfig.countInEnabled &&
      this.getSnapshot().phase === "counting-in";

    if (tempoChanged && this.mode === "running" && this.context && this.run) {
      this.reanchorRunningTimeline(this.context.currentTime, nextConfig.tempo);
    }

    if (cancelActiveCountIn && this.context && this.run) {
      this.run.countInBeats = 0;
      this.run.countInStartAudioTime = this.context.currentTime;
      this.run.playbackStartAudioTime = this.context.currentTime;
      this.run.anchor = {
        audioTime: this.context.currentTime,
        exerciseBeat: this.run.playbackStartBeat,
        tempo: nextConfig.tempo,
      };
    }

    this.config = nextConfig;

    if (this.runGain && this.context) {
      this.runGain.gain.setValueAtTime(
        volumeToGain(nextConfig.volume),
        this.context.currentTime,
      );
    }

    if (
      this.mode === "running" &&
      this.context &&
      this.run &&
      (tempoChanged || pulsePlanChanged || cancelActiveCountIn)
    ) {
      this.restartScheduler();
    }
  }

  start({
    countInBeats,
    fromExerciseBeat = 0,
  }: PracticeTransportStartOptions): Promise<void> {
    if (this.disposed) {
      throw new Error("The Practice audio engine has been disposed.");
    }

    if (this.mode === "running") {
      return Promise.resolve();
    }

    return this.activateRun(fromExerciseBeat, countInBeats);
  }

  pause(): void {
    this.activationGeneration += 1;
    this.activationPromise = null;

    if (this.mode !== "running") {
      return;
    }

    const snapshot = this.getSnapshot();
    this.pausedExerciseBeat = getPracticeSlotStartBeat(
      snapshot.exerciseBeat,
      this.config.authoredSubdivision,
    );
    this.mode = "paused";
    this.run = null;
    this.cancelScheduledAudio();
  }

  resume({ countInBeats }: PracticeTransportStartOptions): Promise<void> {
    if (this.disposed) {
      throw new Error("The Practice audio engine has been disposed.");
    }

    if (this.mode !== "paused") {
      return Promise.resolve();
    }

    return this.activateRun(this.pausedExerciseBeat, countInBeats);
  }

  stop(): void {
    this.activationGeneration += 1;
    this.activationPromise = null;
    this.mode = "idle";
    this.pausedExerciseBeat = 0;
    this.run = null;
    this.cancelScheduledAudio();
  }

  getSnapshot(): PracticeTransportSnapshot {
    if (this.mode === "idle") {
      return defaultSnapshot;
    }

    if (this.mode === "paused" || !this.context || !this.run) {
      return {
        activeSlot: getPracticeActiveSlotAtBeat(
          this.pausedExerciseBeat,
          this.config.authoredSubdivision,
        ),
        countInBeatsRemaining: 0,
        exerciseBeat: this.pausedExerciseBeat,
        phase: "paused",
      };
    }

    const now = this.context.currentTime;

    if (
      this.run.countInBeats > 0 &&
      now + audioTimeEpsilon < this.run.playbackStartAudioTime
    ) {
      return {
        activeSlot: getPracticeActiveSlotAtBeat(
          this.run.playbackStartBeat,
          this.config.authoredSubdivision,
        ),
        countInBeatsRemaining: Math.max(
          1,
          Math.min(
            this.run.countInBeats,
            Math.ceil(
              (this.run.playbackStartAudioTime - now) /
                getPracticeSecondsPerBeat(this.run.anchor.tempo),
            ),
          ),
        ),
        exerciseBeat: this.run.playbackStartBeat,
        phase: "counting-in",
      };
    }

    const exerciseBeat =
      now + audioTimeEpsilon < this.run.playbackStartAudioTime
        ? this.run.playbackStartBeat
        : getPracticeExerciseBeatAtAudioTime(this.run.anchor, now);

    return {
      activeSlot: getPracticeActiveSlotAtBeat(
        exerciseBeat,
        this.config.authoredSubdivision,
      ),
      countInBeatsRemaining: 0,
      exerciseBeat,
      phase: "playing",
    };
  }

  async dispose(): Promise<void> {
    if (this.disposed) {
      return;
    }

    this.disposed = true;
    this.stop();

    const context = this.context;
    this.context = null;

    if (context && context.state !== "closed") {
      await context.close();
    }
  }

  private async ensureRunningContext(): Promise<AudioContext> {
    this.context ??= this.environment.createAudioContext();

    if (this.context.state === "suspended") {
      await this.context.resume();
    }

    if (this.context.state !== "running") {
      throw new Error(
        "Audio could not start. Use Start or Resume to try again.",
      );
    }

    return this.context;
  }

  private activateRun(
    fromExerciseBeat: number,
    countInBeats: number,
  ): Promise<void> {
    if (this.activationPromise) {
      return this.activationPromise;
    }

    const activationGeneration = ++this.activationGeneration;
    const activationPromise = this.ensureRunningContext().then((context) => {
      if (this.disposed || activationGeneration !== this.activationGeneration) {
        return;
      }

      this.pausedExerciseBeat = fromExerciseBeat;
      this.startRun(context, fromExerciseBeat, countInBeats);
    });

    const pendingActivation = activationPromise.finally(() => {
      if (this.activationPromise === pendingActivation) {
        this.activationPromise = null;
      }
    });
    this.activationPromise = pendingActivation;

    return pendingActivation;
  }

  private startRun(
    context: AudioContext,
    fromExerciseBeat: number,
    requestedCountInBeats: number,
  ): void {
    this.cancelScheduledAudio();

    const countInBeats = this.config.countInEnabled
      ? Math.max(0, requestedCountInBeats)
      : 0;
    const countInStartAudioTime = context.currentTime + this.startLeadSeconds;
    const secondsPerBeat = getPracticeSecondsPerBeat(this.config.tempo);
    const playbackStartAudioTime =
      countInStartAudioTime + countInBeats * secondsPerBeat;

    this.mode = "running";
    this.run = {
      anchor: {
        audioTime: playbackStartAudioTime,
        exerciseBeat: fromExerciseBeat,
        tempo: this.config.tempo,
      },
      countInBeats,
      countInStartAudioTime,
      playbackStartAudioTime,
      playbackStartBeat: fromExerciseBeat,
    };
    this.restartScheduler();
  }

  private reanchorRunningTimeline(now: number, nextTempo: number): void {
    if (!this.run) {
      return;
    }

    const previousSecondsPerBeat = getPracticeSecondsPerBeat(
      this.run.anchor.tempo,
    );
    const nextSecondsPerBeat = getPracticeSecondsPerBeat(nextTempo);

    if (now + audioTimeEpsilon < this.run.playbackStartAudioTime) {
      const elapsedCountInBeats = Math.max(
        0,
        (now - this.run.countInStartAudioTime) / previousSecondsPerBeat,
      );
      const remainingCountInBeats = Math.max(
        0,
        this.run.countInBeats - elapsedCountInBeats,
      );

      this.run.countInStartAudioTime =
        now - elapsedCountInBeats * nextSecondsPerBeat;
      this.run.playbackStartAudioTime =
        now + remainingCountInBeats * nextSecondsPerBeat;
      this.run.anchor = {
        audioTime: this.run.playbackStartAudioTime,
        exerciseBeat: this.run.playbackStartBeat,
        tempo: nextTempo,
      };
      return;
    }

    const exerciseBeat = getPracticeExerciseBeatAtAudioTime(
      this.run.anchor,
      now,
    );
    this.run.anchor = {
      audioTime: now,
      exerciseBeat,
      tempo: nextTempo,
    };
    this.run.playbackStartAudioTime = now;
    this.run.playbackStartBeat = exerciseBeat;
    this.run.countInBeats = 0;
  }

  private restartScheduler(): void {
    if (!this.context || !this.run || this.mode !== "running") {
      return;
    }

    this.cancelScheduledAudio();
    this.runGain = this.context.createGain();
    this.runGain.gain.setValueAtTime(
      volumeToGain(this.config.volume),
      this.context.currentTime,
    );
    this.runGain.connect(this.context.destination);
    this.scheduledThroughAudioTime = this.context.currentTime;

    const generation = this.generation;
    this.scheduleWindow(generation);
  }

  private scheduleWindow(generation: number): void {
    if (
      generation !== this.generation ||
      !this.context ||
      !this.run ||
      !this.runGain ||
      this.mode !== "running"
    ) {
      return;
    }

    if (this.context.state !== "running") {
      this.pause();
      return;
    }

    const now = this.context.currentTime;
    const windowStart = Math.max(now, this.scheduledThroughAudioTime);
    const windowEnd = now + this.lookAheadSeconds;

    if (windowEnd > windowStart) {
      this.scheduleCountInWindow(windowStart, windowEnd);
      this.scheduleExerciseWindow(windowStart, windowEnd);
      this.scheduledThroughAudioTime = windowEnd;
    }

    this.schedulerTimeoutId = this.environment.setTimeout(
      () => this.scheduleWindow(generation),
      this.schedulerIntervalMs,
    );
  }

  private scheduleCountInWindow(windowStart: number, windowEnd: number): void {
    if (!this.context || !this.run || this.run.countInBeats <= 0) {
      return;
    }

    const fromAudioTime = Math.max(windowStart, this.run.countInStartAudioTime);
    const toAudioTime = Math.min(windowEnd, this.run.playbackStartAudioTime);

    if (toAudioTime <= fromAudioTime) {
      return;
    }

    const secondsPerBeat = getPracticeSecondsPerBeat(this.run.anchor.tempo);
    const fromBeat =
      (fromAudioTime - this.run.countInStartAudioTime) / secondsPerBeat;
    const toBeat =
      (toAudioTime - this.run.countInStartAudioTime) / secondsPerBeat;

    for (const pulse of planPracticeMetronomePulses({
      fromBeat,
      subdivision: this.config.clickSubdivision,
      toBeat,
    })) {
      this.scheduleClick(
        pulse,
        this.run.countInStartAudioTime + pulse.beat * secondsPerBeat,
      );
    }
  }

  private scheduleExerciseWindow(windowStart: number, windowEnd: number): void {
    if (!this.context || !this.run || !this.config.metronomeEnabled) {
      return;
    }

    const fromAudioTime = Math.max(
      windowStart,
      this.run.playbackStartAudioTime,
    );

    if (windowEnd <= fromAudioTime) {
      return;
    }

    const fromBeat = getPracticeExerciseBeatAtAudioTime(
      this.run.anchor,
      fromAudioTime,
    );
    const toBeat = getPracticeExerciseBeatAtAudioTime(
      this.run.anchor,
      windowEnd,
    );

    for (const pulse of planPracticeMetronomePulses({
      fromBeat,
      subdivision: this.config.clickSubdivision,
      toBeat,
    })) {
      this.scheduleClick(
        pulse,
        getPracticeAudioTimeAtExerciseBeat(this.run.anchor, pulse.beat),
      );
    }
  }

  private scheduleClick(
    pulse: ReturnType<typeof planPracticeMetronomePulses>[number],
    audioTime: number,
  ): void {
    if (
      !this.context ||
      !this.runGain ||
      audioTime < this.context.currentTime
    ) {
      return;
    }

    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    const duration = pulse.accented ? 0.055 : 0.04;
    const peak = pulse.accented ? 0.42 : pulse.kind === "beat" ? 0.28 : 0.12;
    const frequency = pulse.accented
      ? 1_650
      : pulse.kind === "beat"
        ? 1_050
        : 720;
    const scheduledClick = { gain, oscillator };

    oscillator.frequency.setValueAtTime(frequency, audioTime);
    gain.gain.setValueAtTime(0.0001, audioTime);
    gain.gain.exponentialRampToValueAtTime(peak, audioTime + 0.002);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioTime + duration);
    oscillator.connect(gain);
    gain.connect(this.runGain);
    oscillator.onended = () => {
      oscillator.disconnect();
      gain.disconnect();
      this.scheduledClicks.delete(scheduledClick);
    };
    this.scheduledClicks.add(scheduledClick);
    oscillator.start(audioTime);
    oscillator.stop(audioTime + duration + 0.005);
  }

  private cancelScheduledAudio(): void {
    this.generation += 1;

    if (this.schedulerTimeoutId !== null) {
      this.environment.clearTimeout(this.schedulerTimeoutId);
      this.schedulerTimeoutId = null;
    }

    const now = this.context?.currentTime ?? 0;

    if (this.runGain && this.context) {
      this.runGain.gain.cancelScheduledValues(now);
      this.runGain.gain.setValueAtTime(0, now);
    }

    for (const { gain, oscillator } of this.scheduledClicks) {
      oscillator.onended = null;

      try {
        oscillator.stop(now);
      } catch {
        // A source that already ended is safe to ignore during teardown.
      }

      oscillator.disconnect();
      gain.disconnect();
    }

    this.scheduledClicks.clear();
    this.runGain?.disconnect();
    this.runGain = null;
  }
}
