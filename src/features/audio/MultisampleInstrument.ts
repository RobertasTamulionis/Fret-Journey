import type { MultisampleRegion } from "./cleanElectricManifest";
import type { GuitarPresetDefinition } from "./guitarPresets";
import type {
  MusicalArticulation,
  PitchedInstrument,
  ScheduledMusicalEvent,
  ScheduledMusicalNote,
  ScheduledVoice,
} from "./types";

export type MultisampleInstrumentEnvironment = {
  fetchArrayBuffer: (url: string) => Promise<ArrayBuffer>;
};

type ActiveVoice = { nodes: AudioNode[]; source: AudioBufferSourceNode };
type ArticulationPlayback = {
  attackSeconds: number;
  durationScale: number;
  toneFrequency: number | null;
  velocityScale: number;
};

const defaultEnvironment: MultisampleInstrumentEnvironment = {
  fetchArrayBuffer: async (url) => {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Could not load instrument sample (${response.status}).`);
    }
    return response.arrayBuffer();
  },
};

const decodedBufferCache = new WeakMap<
  AudioContext,
  Map<string, Promise<AudioBuffer>>
>();

const loadDecodedBuffer = (
  context: AudioContext,
  url: string,
  environment: MultisampleInstrumentEnvironment,
): Promise<AudioBuffer> => {
  let contextCache = decodedBufferCache.get(context);
  if (!contextCache) {
    contextCache = new Map();
    decodedBufferCache.set(context, contextCache);
  }
  let pending = contextCache.get(url);
  if (!pending) {
    pending = environment
      .fetchArrayBuffer(url)
      .then((encoded) => context.decodeAudioData(encoded.slice(0)));
    contextCache.set(url, pending);
    pending.catch(() => contextCache?.delete(url));
  }
  return pending;
};

export const getArticulationPlayback = (
  articulation: MusicalArticulation,
): ArticulationPlayback => {
  switch (articulation) {
    case "palm-mute-light":
      return {
        attackSeconds: 0.002,
        durationScale: 0.72,
        toneFrequency: 3_400,
        velocityScale: 0.92,
      };
    case "palm-mute-medium":
      return {
        attackSeconds: 0.002,
        durationScale: 0.5,
        toneFrequency: 2_500,
        velocityScale: 0.86,
      };
    case "palm-mute-deep":
      return {
        attackSeconds: 0.002,
        durationScale: 0.3,
        toneFrequency: 1_700,
        velocityScale: 0.78,
      };
    case "hammer":
    case "pull":
      return {
        attackSeconds: 0.018,
        durationScale: 1,
        toneFrequency: 5_500,
        velocityScale: 0.74,
      };
    case "dead-note":
      return {
        attackSeconds: 0.001,
        durationScale: 0.12,
        toneFrequency: 1_900,
        velocityScale: 0.65,
      };
    default:
      return {
        attackSeconds: 0.002,
        durationScale: 1,
        toneFrequency: null,
        velocityScale: 1,
      };
  }
};

const nearestRegion = (
  regions: readonly MultisampleRegion[],
  midi: number,
): MultisampleRegion =>
  regions.reduce((nearest, candidate) =>
    Math.abs(candidate.rootMidi - midi) < Math.abs(nearest.rootMidi - midi)
      ? candidate
      : nearest,
  );

const makeDistortionCurve = (): Float32Array<ArrayBuffer> => {
  const curve = new Float32Array(2_048);
  for (let index = 0; index < curve.length; index += 1) {
    const input = (index * 2) / (curve.length - 1) - 1;
    curve[index] = Math.tanh(input * 6.5) * 0.86;
  }
  return curve;
};

export const getPolyphonyGainScale = (noteCount: number): number =>
  1 / Math.sqrt(Math.max(1, noteCount));

export const getPitchAutomation = (
  note: ScheduledMusicalNote,
  duration: number,
):
  | { cents: number; duration: number; kind: "bend" }
  | { depthCents: number; duration: number; kind: "vibrato" }
  | { duration: number; fromMidi: number; kind: "transition" }
  | null => {
  if (
    note.midi !== null &&
    ["slide-up", "slide-down", "release"].includes(note.articulation) &&
    note.transitionFromMidi !== undefined
  ) {
    return {
      duration: Math.min(0.18, duration * 0.4),
      fromMidi: note.transitionFromMidi,
      kind: "transition",
    };
  }
  if (
    note.articulation === "bend" &&
    note.midi !== null &&
    note.targetMidi !== undefined
  ) {
    return {
      cents: (note.targetMidi - note.midi) * 100,
      duration: duration * 0.65,
      kind: "bend",
    };
  }
  if (note.articulation === "vibrato") {
    return {
      depthCents: 18,
      duration: Math.max(0.02, duration - Math.min(0.08, duration * 0.2)),
      kind: "vibrato",
    };
  }
  return null;
};

export class MultisampleInstrument implements PitchedInstrument {
  private readonly activeVoices = new Set<ActiveVoice>();
  private readonly buffers = new Map<string, AudioBuffer>();
  private readonly outputNodes = new Set<AudioNode>();
  private outputs = new WeakMap<AudioNode, AudioNode>();
  private deadNoteBuffer: AudioBuffer | null = null;
  private disposed = false;
  private loadPromise: Promise<void> | null = null;

  constructor(
    private readonly context: AudioContext,
    private readonly preset: GuitarPresetDefinition,
    private readonly environment: MultisampleInstrumentEnvironment = defaultEnvironment,
  ) {}

  load(): Promise<void> {
    if (this.disposed) {
      return Promise.reject(new Error("The instrument has been disposed."));
    }
    this.loadPromise ??= Promise.all(
      this.preset.manifest.regions.map(async ({ url }) => {
        const buffer = await loadDecodedBuffer(
          this.context,
          url,
          this.environment,
        );
        this.buffers.set(url, buffer);
      }),
    ).then(() => undefined);
    return this.loadPromise;
  }

  schedule(
    event: ScheduledMusicalEvent,
    destination: AudioNode,
  ): readonly ScheduledVoice[] {
    if (this.disposed || this.buffers.size === 0) return [];
    const chordScale = getPolyphonyGainScale(event.notes.length);
    const output = this.getOutput(destination);
    return event.notes.flatMap((note) => {
      if (note.midi === null) {
        return [this.scheduleDeadNote(event, note, output, chordScale)];
      }
      if (
        note.midi < this.preset.manifest.minimumMidi ||
        note.midi > this.preset.manifest.maximumMidi
      ) {
        return [];
      }
      return [
        this.schedulePitchedNote(
          event,
          note as ScheduledMusicalNote & { midi: number },
          output,
          chordScale,
        ),
      ];
    });
  }

  stopAll(atTime = this.context.currentTime): void {
    for (const voice of [...this.activeVoices]) this.stopVoice(voice, atTime);
    this.resetOutputs();
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.stopAll();
    this.buffers.clear();
    this.resetOutputs();
  }

  private createVoice(
    event: ScheduledMusicalEvent,
    note: ScheduledMusicalNote,
    source: AudioBufferSourceNode,
    output: AudioNode,
    chordScale: number,
    soundingDuration: number,
    startSource: () => void,
  ): ScheduledVoice {
    const playback = getArticulationPlayback(note.articulation);
    const gain = this.context.createGain();
    const nodes: AudioNode[] = [source, gain];
    let finalVoiceNode: AudioNode = gain;
    const peak = Math.max(
      0.0001,
      note.velocity * playback.velocityScale * chordScale,
    );
    const release = Math.min(0.06, Math.max(0.018, soundingDuration * 0.1));
    const stopTime = event.startTime + soundingDuration + release;

    gain.gain.setValueAtTime(0.0001, event.startTime);
    gain.gain.exponentialRampToValueAtTime(
      peak,
      event.startTime + Math.min(playback.attackSeconds, soundingDuration / 2),
    );
    gain.gain.setValueAtTime(peak, event.startTime + soundingDuration);
    gain.gain.exponentialRampToValueAtTime(0.0001, stopTime);
    source.connect(gain);
    if (playback.toneFrequency !== null) {
      const tone = this.context.createBiquadFilter();
      tone.type = "lowpass";
      tone.frequency.setValueAtTime(playback.toneFrequency, event.startTime);
      gain.connect(tone);
      finalVoiceNode = tone;
      nodes.push(tone);
    }
    finalVoiceNode.connect(output);

    const voice = { nodes, source };
    source.onended = () => this.releaseVoice(voice);
    this.activeVoices.add(voice);
    startSource();
    source.stop(stopTime + 0.005);
    return {
      stop: (atTime = this.context.currentTime) =>
        this.stopVoice(voice, atTime),
    };
  }

  private schedulePitchedNote(
    event: ScheduledMusicalEvent,
    note: ScheduledMusicalNote & { midi: number },
    output: AudioNode,
    chordScale: number,
  ): ScheduledVoice {
    const region = nearestRegion(this.preset.manifest.regions, note.midi);
    const buffer = this.buffers.get(region.url);
    if (!buffer) return { stop: () => undefined };
    const source = this.context.createBufferSource();
    const playback = getArticulationPlayback(note.articulation);
    const offset = Math.max(0, region.sourceOffset ?? 0);
    const availableDuration = Math.max(0, buffer.duration - offset);
    const sourceDuration = Math.min(
      availableDuration,
      region.maximumDuration ?? availableDuration,
    );
    const soundingDuration = Math.min(
      event.duration * playback.durationScale,
      sourceDuration,
    );
    const targetRate = 2 ** ((note.midi - region.rootMidi) / 12);
    const automation = getPitchAutomation(note, event.duration);

    source.buffer = buffer;
    source.playbackRate.setValueAtTime(targetRate, event.startTime);
    if (automation?.kind === "transition") {
      source.playbackRate.setValueAtTime(
        2 ** ((automation.fromMidi - region.rootMidi) / 12),
        event.startTime,
      );
      source.playbackRate.exponentialRampToValueAtTime(
        targetRate,
        event.startTime + automation.duration,
      );
    } else if (automation?.kind === "bend") {
      source.detune.setValueAtTime(0, event.startTime);
      source.detune.linearRampToValueAtTime(
        automation.cents,
        event.startTime + automation.duration,
      );
    } else if (automation?.kind === "vibrato") {
      const vibratoStart =
        event.startTime + Math.min(0.08, event.duration * 0.2);
      const points = Math.max(8, Math.ceil((event.duration - 0.02) * 44));
      const curve = new Float32Array(points);
      for (let index = 0; index < points; index += 1) {
        curve[index] =
          Math.sin((index / (points - 1)) * Math.PI * 11) *
          automation.depthCents;
      }
      source.detune.setValueCurveAtTime(
        curve,
        vibratoStart,
        automation.duration,
      );
    }

    const voice = this.createVoice(
      event,
      note,
      source,
      output,
      chordScale,
      soundingDuration,
      () => source.start(event.startTime, offset),
    );
    return voice;
  }

  private scheduleDeadNote(
    event: ScheduledMusicalEvent,
    note: ScheduledMusicalNote,
    output: AudioNode,
    chordScale: number,
  ): ScheduledVoice {
    const source = this.context.createBufferSource();
    source.buffer = this.deadNoteBuffer ??= this.createDeadNoteBuffer();
    const duration = Math.min(0.075, Math.max(0.035, event.duration * 0.12));
    const voice = this.createVoice(
      event,
      note,
      source,
      output,
      chordScale,
      duration,
      () => source.start(event.startTime, 0, duration),
    );
    return voice;
  }

  private createDeadNoteBuffer(): AudioBuffer {
    const length = Math.ceil(this.context.sampleRate * 0.08);
    const buffer = this.context.createBuffer(
      1,
      length,
      this.context.sampleRate,
    );
    const channel = buffer.getChannelData(0);
    for (let index = 0; index < length; index += 1) {
      const envelope = (1 - index / length) ** 4;
      channel[index] =
        (((index * 16_807) % 2_147_483_647) / 1_073_741_823.5 - 1) *
        envelope *
        0.55;
    }
    return buffer;
  }

  private getOutput(destination: AudioNode): AudioNode {
    const existing = this.outputs.get(destination);
    if (existing) return existing;
    const input = this.context.createGain();
    const compressor = this.context.createDynamicsCompressor();
    compressor.threshold.value = -9;
    compressor.knee.value = 8;
    compressor.ratio.value = 6;
    compressor.attack.value = 0.003;
    compressor.release.value = 0.09;
    this.outputNodes.add(input);
    this.outputNodes.add(compressor);

    if (this.preset.processing === "high-gain") {
      const highpass = this.context.createBiquadFilter();
      const drive = this.context.createWaveShaper();
      const cabinet = this.context.createBiquadFilter();
      highpass.type = "highpass";
      highpass.frequency.value = 78;
      drive.curve = makeDistortionCurve();
      drive.oversample = "4x";
      cabinet.type = "lowpass";
      cabinet.frequency.value = 5_800;
      cabinet.Q.value = 0.72;
      input.gain.value = 1.55;
      input.connect(highpass);
      highpass.connect(drive);
      drive.connect(cabinet);
      cabinet.connect(compressor);
      this.outputNodes.add(highpass);
      this.outputNodes.add(drive);
      this.outputNodes.add(cabinet);
    } else {
      input.connect(compressor);
    }
    compressor.connect(destination);
    this.outputs.set(destination, input);
    return input;
  }

  private releaseVoice(voice: ActiveVoice): void {
    if (!this.activeVoices.delete(voice)) return;
    for (const node of voice.nodes) node.disconnect();
  }

  private resetOutputs(): void {
    for (const node of this.outputNodes) node.disconnect();
    this.outputNodes.clear();
    this.outputs = new WeakMap();
  }

  private stopVoice(voice: ActiveVoice, atTime: number): void {
    if (!this.activeVoices.delete(voice)) return;
    voice.source.onended = null;
    try {
      voice.source.stop(atTime);
    } catch {
      // An already-ended sample is safe to ignore during transport cleanup.
    }
    for (const node of voice.nodes) node.disconnect();
  }
}
