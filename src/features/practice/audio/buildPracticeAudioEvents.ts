import type { MusicalArticulation } from "@/features/audio/types";
import {
  getPracticeExampleTuning,
  getPracticeSequenceEvents,
  getPracticeTabBeatSize,
  type PracticeTabArticulation,
  type PracticeTabExample,
} from "../tablature";
import { getPracticeScoreLengthBeats } from "../timing";

export type PracticeAudioNote = {
  articulation: MusicalArticulation;
  midi: number | null;
  targetMidi?: number;
  transitionFromMidi?: number;
  velocity: number;
};

export type PracticeAudioBeatEvent = {
  durationBeats: number;
  id: string;
  notes: readonly PracticeAudioNote[];
  startBeat: number;
};

export type PracticeAudioEventPlan =
  | {
      available: false;
      events: readonly [];
      reason: string;
      scoreLengthBeats: number;
    }
  | {
      available: true;
      events: readonly PracticeAudioBeatEvent[];
      scoreLengthBeats: number;
    };

const mapArticulation = (
  articulation: PracticeTabArticulation | undefined,
  palmMuteDepth: "deep" | "light" | "medium" | undefined,
): MusicalArticulation => {
  if (palmMuteDepth) return `palm-mute-${palmMuteDepth}`;
  return articulation ?? "normal";
};

export const buildPracticeAudioEvents = (
  example: PracticeTabExample,
): PracticeAudioEventPlan => {
  const tuning = getPracticeExampleTuning(example);
  const scoreLengthBeats = getPracticeScoreLengthBeats(example);

  if (!tuning.midiPitchesHighToLow) {
    return {
      available: false,
      events: [],
      reason:
        "Instrument playback is unavailable for custom tuning because its octave register is not verified.",
      scoreLengthBeats,
    };
  }

  const unitsPerBeat = getPracticeTabBeatSize(example.subdivision);
  const previousMidiByString = new Map<number, number>();
  const bentTargetByString = new Map<number, number>();
  const events = getPracticeSequenceEvents(example).flatMap(
    (event, eventIndex): PracticeAudioBeatEvent[] => {
      if (event.kind === "rest") return [];

      const notes = event.notes.flatMap((note): PracticeAudioNote[] => {
        if (note.fret === "x") {
          return [
            {
              articulation: "dead-note",
              midi: null,
              velocity: event.accent ? 0.92 : 0.72,
            },
          ];
        }
        const openMidi = tuning.midiPitchesHighToLow?.[note.string - 1];
        if (openMidi === undefined) return [];

        const midi = openMidi + note.fret;
        const previousMidi = previousMidiByString.get(note.string);
        const articulation = mapArticulation(
          note.articulation,
          event.palmMuteDepth,
        );
        const targetMidi =
          note.targetFret === undefined
            ? undefined
            : openMidi + note.targetFret;
        const transitionFromMidi =
          articulation === "release"
            ? (bentTargetByString.get(note.string) ?? previousMidi)
            : previousMidi;
        previousMidiByString.set(note.string, midi);
        if (articulation === "bend" && targetMidi !== undefined) {
          bentTargetByString.set(note.string, targetMidi);
        } else if (articulation !== "vibrato") {
          bentTargetByString.delete(note.string);
        }

        return [
          {
            articulation,
            midi,
            targetMidi,
            transitionFromMidi,
            velocity: event.accent ? 0.92 : 0.72,
          },
        ];
      });

      return notes.length === 0
        ? []
        : [
            {
              durationBeats: event.duration / unitsPerBeat,
              id: `${example.id}:${eventIndex}`,
              notes,
              startBeat: event.at / unitsPerBeat,
            },
          ];
    },
  );

  return { available: true, events, scoreLengthBeats };
};

export const planPracticeAudioEvents = ({
  events,
  fromBeat,
  scoreLengthBeats,
  toBeat,
}: {
  events: readonly PracticeAudioBeatEvent[];
  fromBeat: number;
  scoreLengthBeats: number;
  toBeat: number;
}): PracticeAudioBeatEvent[] => {
  if (toBeat <= fromBeat || scoreLengthBeats <= 0) return [];

  const firstCycle = Math.floor(fromBeat / scoreLengthBeats);
  const finalCycle = Math.floor((toBeat - 1e-9) / scoreLengthBeats);
  const planned: PracticeAudioBeatEvent[] = [];

  for (let cycle = firstCycle; cycle <= finalCycle; cycle += 1) {
    const cycleStart = cycle * scoreLengthBeats;
    for (const event of events) {
      const startBeat = cycleStart + event.startBeat;
      if (startBeat + 1e-9 < fromBeat || startBeat >= toBeat - 1e-9) continue;
      planned.push({
        ...event,
        id: `${event.id}:${cycle}`,
        startBeat,
      });
    }
  }

  return planned;
};
