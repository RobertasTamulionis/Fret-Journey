import type {
  PracticeTabExample,
  PracticeTabMarker,
  PracticeTabNoteEvent,
  PracticeTabSubdivision,
} from "./tablature";

export type {
  PracticeAudioTransportPhase as PracticeTransportStatus,
  PracticeTransportSnapshot,
} from "./audio/PracticeMetronomeEngine";
export {
  clampPracticeTempo,
  getPracticeSlotDurationMs,
} from "./timing";

export type PracticeExperienceScreen = "library" | "session" | "complete";
export type PracticeInstrument = "clean-guitar" | "piano" | "simple-tone";

export const practiceDefaultCountInBeats = 4;

export type PracticePositionSnapshot = {
  direction: string | null;
  fret: string | null;
  pattern: string;
};

const durationPattern = /^(\d+)\s*min$/i;

export const formatPracticeDurationAsClock = (duration: string): string => {
  const match = duration.trim().match(durationPattern);

  if (!match) {
    return duration;
  }

  return `${match[1]}:00`;
};

export const getPracticePositionSnapshot = (
  example: PracticeTabExample,
  activeSlot: number,
): PracticePositionSnapshot => {
  let noteEvent: PracticeTabNoteEvent | undefined;
  let marker: PracticeTabMarker | undefined;

  for (const event of example.events) {
    if (
      event.kind === "notes" &&
      event.at <= activeSlot &&
      (!noteEvent || event.at > noteEvent.at)
    ) {
      noteEvent = event;
    }
  }

  for (const candidate of example.markers ?? []) {
    if (candidate.at <= activeSlot && (!marker || candidate.at > marker.at)) {
      marker = candidate;
    }
  }

  if (!noteEvent) {
    return {
      direction: null,
      fret: null,
      pattern: marker?.label ?? example.pitchScope.label,
    };
  }

  const frets = [
    ...new Set(
      noteEvent.notes.map(({ fret }) => (fret === "x" ? "Muted" : fret)),
    ),
  ];

  return {
    direction:
      noteEvent.stroke === "down"
        ? "Downstroke"
        : noteEvent.stroke === "up"
          ? "Upstroke"
          : null,
    fret:
      frets.length === 1
        ? frets[0] === "Muted"
          ? "Muted strings"
          : `Fret ${frets[0]}`
        : `Frets ${frets.join(", ")}`,
    pattern: marker?.label ?? example.pitchScope.label,
  };
};

export const practiceSubdivisionOptions: ReadonlyArray<{
  label: string;
  value: PracticeTabSubdivision;
}> = [
  { label: "Quarter notes", value: "quarters" },
  { label: "Eighth notes", value: "eighths" },
  { label: "Triplets", value: "triplets" },
  { label: "Sixteenth notes", value: "sixteenths" },
];

export const practiceInstrumentOptions: ReadonlyArray<{
  label: string;
  value: PracticeInstrument;
}> = [
  { label: "Clean guitar", value: "clean-guitar" },
  { label: "Piano", value: "piano" },
  { label: "Simple tone", value: "simple-tone" },
];
