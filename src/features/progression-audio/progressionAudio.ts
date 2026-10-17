import type { ScheduledMusicalEvent } from "@/features/audio/types";
import type { ResolvedProgression } from "@/features/progressions";
import type { PlayableVoicing } from "@/features/voicings";

export type ProgressionAudioStep = {
  readonly durationBeats: number;
  readonly id: string;
  readonly voicing: PlayableVoicing;
};

export type ProgressionAudioPlan =
  | {
      readonly available: true;
      readonly events: readonly ProgressionBeatEvent[];
      readonly totalBeats: number;
    }
  | {
      readonly available: false;
      readonly events: readonly [];
      readonly reason: string;
      readonly totalBeats: 0;
    };

export type ProgressionBeatEvent = {
  readonly durationBeats: number;
  readonly id: string;
  readonly midi: readonly number[];
  readonly startBeat: number;
};

export const buildProgressionAudioPlan = (
  steps: readonly ProgressionAudioStep[],
): ProgressionAudioPlan => {
  if (steps.length === 0) {
    return {
      available: false,
      events: [],
      reason: "Add at least one chord before starting playback.",
      totalBeats: 0,
    };
  }

  let startBeat = 0;
  const events: ProgressionBeatEvent[] = [];

  for (const step of steps) {
    if (step.voicing.registerStatus !== "verified") {
      return {
        available: false,
        events: [],
        reason:
          "Pitched playback requires a registered tuning with verified octave pitches.",
        totalBeats: 0,
      };
    }

    const midi = step.voicing.strings.flatMap((string) =>
      string.kind === "muted" || string.midi === undefined ? [] : [string.midi],
    );
    if (midi.length === 0) {
      return {
        available: false,
        events: [],
        reason: `The selected voicing for ${step.voicing.chordName} has no verified sounding strings.`,
        totalBeats: 0,
      };
    }

    events.push({
      durationBeats: step.durationBeats,
      id: step.id,
      midi,
      startBeat,
    });
    startBeat += step.durationBeats;
  }

  return { available: true, events, totalBeats: startBeat };
};

export const getProgressionStepIndexAtBeat = (
  beat: number,
  plan: ProgressionAudioPlan,
  loop: boolean,
): number | null => {
  if (!plan.available || plan.totalBeats <= 0 || beat < 0) return null;
  if (!loop && beat >= plan.totalBeats) return null;
  const localBeat = loop ? beat % plan.totalBeats : beat;
  const index = plan.events.findIndex(
    (event) =>
      localBeat >= event.startBeat &&
      localBeat < event.startBeat + event.durationBeats,
  );
  return index < 0 ? null : index;
};

export const planProgressionEventsInWindow = ({
  fromBeat,
  loop,
  plan,
  secondsPerBeat,
  toBeat,
}: {
  fromBeat: number;
  loop: boolean;
  plan: ProgressionAudioPlan;
  secondsPerBeat: number;
  toBeat: number;
}): readonly (Omit<ScheduledMusicalEvent, "startTime"> & {
  readonly startBeat: number;
})[] => {
  if (!plan.available || toBeat <= fromBeat) return [];
  const firstCycle = loop
    ? Math.max(0, Math.floor(fromBeat / plan.totalBeats))
    : 0;
  const lastCycle = loop
    ? Math.max(
        firstCycle,
        Math.floor((toBeat - Number.EPSILON) / plan.totalBeats),
      )
    : 0;
  const scheduled = [];

  for (let cycle = firstCycle; cycle <= lastCycle; cycle += 1) {
    const cycleBeat = cycle * plan.totalBeats;
    for (const event of plan.events) {
      const startBeat = cycleBeat + event.startBeat;
      if (startBeat < fromBeat || startBeat >= toBeat) continue;
      scheduled.push({
        duration: event.durationBeats * secondsPerBeat,
        id: `${event.id}:${cycle}`,
        notes: event.midi.map((midi) => ({
          articulation: "normal" as const,
          midi,
          velocity: 0.78,
        })),
        startBeat,
      });
    }
  }

  return scheduled;
};

export const getSelectedProgressionVoicings = (
  progression: Pick<ResolvedProgression, "steps">,
  voicingsByStep: readonly (readonly PlayableVoicing[])[],
  selectedSignatures: Readonly<Record<string, string>>,
): readonly ProgressionAudioStep[] =>
  progression.steps.map((step, index) => {
    const choices = voicingsByStep[index];
    const voicing =
      choices.find(
        ({ signature }) => signature === selectedSignatures[step.id],
      ) ?? choices[0];
    if (!voicing) {
      throw new Error(
        `No playable voicing is available for ${step.chord.name}.`,
      );
    }
    return { durationBeats: step.durationBeats, id: step.id, voicing };
  });
