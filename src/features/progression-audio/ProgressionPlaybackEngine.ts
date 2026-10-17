import { guitarPresets } from "@/features/audio/guitarPresets";
import { MultisampleInstrument } from "@/features/audio/MultisampleInstrument";
import type { GuitarPresetId, PitchedInstrument } from "@/features/audio/types";
import {
  getProgressionStepIndexAtBeat,
  type ProgressionAudioPlan,
  planProgressionEventsInWindow,
} from "./progressionAudio";

export type ProgressionPlaybackPhase = "idle" | "paused" | "playing";
export type ProgressionPlaybackConfig = {
  bpm: number;
  loop: boolean;
  plan: ProgressionAudioPlan;
  preset: GuitarPresetId;
  volume: number;
};
export type ProgressionPlaybackSnapshot = {
  activeStepIndex: number | null;
  beat: number;
  error: string | null;
  instrumentStatus: "error" | "idle" | "loading" | "ready" | "unavailable";
  phase: ProgressionPlaybackPhase;
};
export type ProgressionPlaybackEnvironment = {
  clearTimeout: (id: number) => void;
  createAudioContext: () => AudioContext;
  createInstrument: (
    context: AudioContext,
    preset: GuitarPresetId,
  ) => PitchedInstrument;
  setTimeout: (callback: () => void, delay: number) => number;
};

type Run = { anchorAudioTime: number; anchorBeat: number };
const clampBpm = (bpm: number) => Math.min(240, Math.max(30, Math.round(bpm)));
const clampVolume = (volume: number) => Math.min(100, Math.max(0, volume));
const secondsPerBeat = (bpm: number) => 60 / clampBpm(bpm);
const gainForVolume = (volume: number) => (clampVolume(volume) / 100) ** 2;

const defaultEnvironment: ProgressionPlaybackEnvironment = {
  clearTimeout: (id) => window.clearTimeout(id),
  createAudioContext: () => {
    const Constructor =
      window.AudioContext ??
      (
        window as typeof window & {
          webkitAudioContext?: typeof AudioContext;
        }
      ).webkitAudioContext;
    if (!Constructor)
      throw new Error("Web Audio is not supported in this browser.");
    return new Constructor();
  },
  createInstrument: (context, preset) =>
    new MultisampleInstrument(context, guitarPresets[preset]),
  setTimeout: (callback, delay) => window.setTimeout(callback, delay),
};

export class ProgressionPlaybackEngine {
  private activationGeneration = 0;
  private config: ProgressionPlaybackConfig;
  private context: AudioContext | null = null;
  private disposed = false;
  private environment: ProgressionPlaybackEnvironment;
  private error: string | null = null;
  private gain: GainNode | null = null;
  private generation = 0;
  private instruments = new Map<GuitarPresetId, PitchedInstrument>();
  private loadPromises = new Map<GuitarPresetId, Promise<void>>();
  private statuses = new Map<GuitarPresetId, "error" | "loading" | "ready">();
  private mode: ProgressionPlaybackPhase = "idle";
  private pausedBeat = 0;
  private run: Run | null = null;
  private scheduledThroughTime = 0;
  private timeoutId: number | null = null;

  constructor(
    config: ProgressionPlaybackConfig,
    private readonly options: {
      environment?: ProgressionPlaybackEnvironment;
      lookAheadSeconds?: number;
      schedulerIntervalMs?: number;
      startLeadSeconds?: number;
    } = {},
  ) {
    this.config = this.normalize(config);
    this.environment = options.environment ?? defaultEnvironment;
  }

  configure(config: ProgressionPlaybackConfig): void {
    const next = this.normalize(config);
    const previous = this.config;
    const now = this.context?.currentTime ?? 0;
    const timelineChanged =
      previous.bpm !== next.bpm ||
      previous.loop !== next.loop ||
      previous.plan !== next.plan;
    const presetChanged = previous.preset !== next.preset;

    if (
      this.mode === "playing" &&
      this.run &&
      this.context &&
      previous.bpm !== next.bpm
    ) {
      const beat = this.getBeatAt(now, previous.bpm);
      this.run = { anchorAudioTime: now, anchorBeat: beat };
    }
    this.config = next;
    this.gain?.gain.setValueAtTime(gainForVolume(next.volume), now);
    this.error = next.plan.available ? null : next.plan.reason;

    if (this.mode === "playing" && (timelineChanged || presetChanged)) {
      for (const instrument of this.instruments.values())
        instrument.stopAll(now);
      if (presetChanged && this.context) {
        void this.prepareInstrument(this.context, next.preset).then(() => {
          if (this.mode === "playing") this.restartScheduler();
        });
      } else {
        this.restartScheduler();
      }
    }
  }

  async start(): Promise<void> {
    if (this.disposed)
      throw new Error("The progression audio engine has been disposed.");
    if (this.mode === "playing") return;
    if (!this.config.plan.available) throw new Error(this.config.plan.reason);
    const generation = ++this.activationGeneration;
    const context = await this.ensureContext();
    await this.prepareInstrument(context, this.config.preset);
    if (generation !== this.activationGeneration || this.disposed) return;
    this.startRun(context, 0);
  }

  async resume(): Promise<void> {
    if (this.mode !== "paused") return;
    const generation = ++this.activationGeneration;
    const context = await this.ensureContext();
    await this.prepareInstrument(context, this.config.preset);
    if (generation !== this.activationGeneration || this.disposed) return;
    this.startRun(context, this.pausedBeat);
  }

  pause(): void {
    if (this.mode !== "playing") return;
    this.pausedBeat = this.context
      ? this.getBeatAt(this.context.currentTime)
      : 0;
    this.mode = "paused";
    this.run = null;
    this.cancelScheduledAudio();
  }

  stop(): void {
    this.activationGeneration += 1;
    this.mode = "idle";
    this.pausedBeat = 0;
    this.run = null;
    this.cancelScheduledAudio();
  }

  getSnapshot(): ProgressionPlaybackSnapshot {
    let beat = this.mode === "paused" ? this.pausedBeat : 0;
    if (this.mode === "playing" && this.context && this.run) {
      beat = this.getBeatAt(this.context.currentTime);
      if (
        !this.config.loop &&
        this.config.plan.available &&
        beat >= this.config.plan.totalBeats
      ) {
        this.stop();
        return this.getSnapshot();
      }
    }
    return {
      activeStepIndex:
        this.mode === "idle"
          ? null
          : getProgressionStepIndexAtBeat(
              beat,
              this.config.plan,
              this.config.loop,
            ),
      beat,
      error: this.error,
      instrumentStatus: this.getInstrumentStatus(),
      phase: this.mode,
    };
  }

  async dispose(): Promise<void> {
    if (this.disposed) return;
    this.disposed = true;
    this.stop();
    for (const instrument of this.instruments.values()) instrument.dispose();
    this.instruments.clear();
    const context = this.context;
    this.context = null;
    if (context && context.state !== "closed") await context.close();
  }

  private normalize(
    config: ProgressionPlaybackConfig,
  ): ProgressionPlaybackConfig {
    return {
      ...config,
      bpm: clampBpm(config.bpm),
      volume: clampVolume(config.volume),
    };
  }

  private async ensureContext(): Promise<AudioContext> {
    this.context ??= this.environment.createAudioContext();
    if (this.context.state === "suspended") await this.context.resume();
    if (this.context.state !== "running")
      throw new Error("Audio could not start. Use Play to try again.");
    return this.context;
  }

  private prepareInstrument(
    context: AudioContext,
    preset: GuitarPresetId,
  ): Promise<void> {
    const existing = this.loadPromises.get(preset);
    if (existing) return existing;
    const instrument = this.environment.createInstrument(context, preset);
    this.instruments.set(preset, instrument);
    this.statuses.set(preset, "loading");
    const promise = instrument.load().then(
      () => {
        this.statuses.set(preset, "ready");
        this.error = null;
      },
      (error: unknown) => {
        this.statuses.set(preset, "error");
        this.error =
          error instanceof Error
            ? error.message
            : "Guitar samples could not load.";
        throw error;
      },
    );
    this.loadPromises.set(preset, promise);
    return promise;
  }

  private startRun(context: AudioContext, beat: number): void {
    this.cancelScheduledAudio();
    this.mode = "playing";
    this.run = {
      anchorAudioTime:
        context.currentTime + (this.options.startLeadSeconds ?? 0.05),
      anchorBeat: beat,
    };
    this.restartScheduler();
  }

  private getBeatAt(audioTime: number, bpm = this.config.bpm): number {
    if (!this.run) return this.pausedBeat;
    return (
      this.run.anchorBeat +
      Math.max(0, audioTime - this.run.anchorAudioTime) / secondsPerBeat(bpm)
    );
  }

  private audioTimeAt(beat: number): number {
    if (!this.run) return 0;
    return (
      this.run.anchorAudioTime +
      (beat - this.run.anchorBeat) * secondsPerBeat(this.config.bpm)
    );
  }

  private restartScheduler(): void {
    if (!this.context || !this.run || this.mode !== "playing") return;
    this.cancelScheduledAudio();
    this.gain = this.context.createGain();
    this.gain.gain.setValueAtTime(
      gainForVolume(this.config.volume),
      this.context.currentTime,
    );
    this.gain.connect(this.context.destination);
    this.scheduledThroughTime = this.context.currentTime;
    this.scheduleResumeContinuation();
    this.scheduleWindow(this.generation);
  }

  private scheduleResumeContinuation(): void {
    if (
      !this.context ||
      !this.run ||
      !this.gain ||
      !this.config.plan.available
    ) {
      return;
    }
    const instrument = this.instruments.get(this.config.preset);
    if (!instrument || this.statuses.get(this.config.preset) !== "ready")
      return;
    const totalBeats = this.config.plan.totalBeats;
    const localBeat = this.config.loop
      ? this.run.anchorBeat % totalBeats
      : this.run.anchorBeat;
    const event = this.config.plan.events.find(
      (candidate) =>
        localBeat > candidate.startBeat + 1e-9 &&
        localBeat < candidate.startBeat + candidate.durationBeats,
    );
    if (!event) return;
    const remainingBeats = event.startBeat + event.durationBeats - localBeat;
    instrument.schedule(
      {
        duration: remainingBeats * secondsPerBeat(this.config.bpm),
        id: `${event.id}:resume`,
        notes: event.midi.map((midi) => ({
          articulation: "normal",
          midi,
          velocity: 0.78,
        })),
        startTime: this.run.anchorAudioTime,
      },
      this.gain,
    );
  }

  private scheduleWindow(generation: number): void {
    if (
      generation !== this.generation ||
      !this.context ||
      !this.run ||
      !this.gain ||
      this.mode !== "playing"
    )
      return;
    if (this.context.state !== "running") {
      this.pause();
      return;
    }
    const now = this.context.currentTime;
    const windowStart = Math.max(now, this.scheduledThroughTime);
    const windowEnd = now + (this.options.lookAheadSeconds ?? 0.12);
    const fromBeat = this.getBeatAt(windowStart);
    const rawToBeat = this.getBeatAt(windowEnd);
    const toBeat =
      !this.config.loop && this.config.plan.available
        ? Math.min(rawToBeat, this.config.plan.totalBeats)
        : rawToBeat;
    const instrument = this.instruments.get(this.config.preset);
    if (
      instrument &&
      this.statuses.get(this.config.preset) === "ready" &&
      toBeat > fromBeat
    ) {
      for (const event of planProgressionEventsInWindow({
        fromBeat,
        loop: this.config.loop,
        plan: this.config.plan,
        secondsPerBeat: secondsPerBeat(this.config.bpm),
        toBeat,
      })) {
        instrument.schedule(
          { ...event, startTime: this.audioTimeAt(event.startBeat) },
          this.gain,
        );
      }
    }
    this.scheduledThroughTime = windowEnd;
    this.timeoutId = this.environment.setTimeout(
      () => this.scheduleWindow(generation),
      this.options.schedulerIntervalMs ?? 25,
    );
  }

  private cancelScheduledAudio(): void {
    this.generation += 1;
    if (this.timeoutId !== null) this.environment.clearTimeout(this.timeoutId);
    this.timeoutId = null;
    const now = this.context?.currentTime;
    for (const instrument of this.instruments.values()) instrument.stopAll(now);
    this.gain?.disconnect();
    this.gain = null;
  }

  private getInstrumentStatus(): ProgressionPlaybackSnapshot["instrumentStatus"] {
    if (!this.config.plan.available) return "unavailable";
    return this.statuses.get(this.config.preset) ?? "idle";
  }
}
