export type MusicalArticulation =
  | "normal"
  | "palm-mute-light"
  | "palm-mute-medium"
  | "palm-mute-deep"
  | "dead-note"
  | "hammer"
  | "pull"
  | "slide-up"
  | "slide-down"
  | "bend"
  | "release"
  | "vibrato";

export type ScheduledMusicalNote = {
  articulation: MusicalArticulation;
  midi: number | null;
  targetMidi?: number;
  transitionFromMidi?: number;
  velocity: number;
};

export type GuitarPresetId =
  | "clean-electric"
  | "high-gain-electric"
  | "acoustic-guitar";

export type ScheduledMusicalEvent = {
  duration: number;
  id: string;
  notes: readonly ScheduledMusicalNote[];
  startTime: number;
};

export type ScheduledVoice = {
  stop: (atTime?: number) => void;
};

export interface PitchedInstrument {
  dispose(): void;
  load(): Promise<void>;
  schedule(
    event: ScheduledMusicalEvent,
    destination: AudioNode,
  ): readonly ScheduledVoice[];
  stopAll(atTime?: number): void;
}
