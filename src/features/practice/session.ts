import type {
  PracticeTabExample,
  PracticeTabMarker,
  PracticeTabSubdivision,
} from "./tablature";
import { getPracticeSequenceEvents } from "./tablature";

export type {
  PracticeAudioTransportPhase as PracticeTransportStatus,
  PracticeTransportSnapshot,
} from "./audio/PracticeMetronomeEngine";
export { clampPracticeTempo } from "./timing";

export type PracticeExperienceScreen = "library" | "session" | "complete";
export type PracticeInstrument = "clean-guitar" | "piano" | "simple-tone";

export const practiceDefaultCountInBeats = 4;
export const practiceDurationMinimumMinutes = 1;
export const practiceDurationMaximumMinutes = 120;

export type PracticePositionSnapshot = {
  direction: string | null;
  fret: string | null;
  pattern: string;
};

const durationPattern = /^(\d+)\s*min$/i;

export const getPracticeDurationSeconds = (duration: string): number => {
  const match = duration.trim().match(durationPattern);

  if (!match) {
    return practiceDurationMinimumMinutes * 60;
  }

  return clampPracticeDurationMinutes(Number.parseInt(match[1], 10)) * 60;
};

export const clampPracticeDurationMinutes = (minutes: number): number =>
  Math.min(
    practiceDurationMaximumMinutes,
    Math.max(practiceDurationMinimumMinutes, Math.round(minutes)),
  );

export const formatPracticeTime = (seconds: number): string => {
  const safeSeconds = Math.max(0, Math.ceil(seconds));
  const minutes = Math.floor(safeSeconds / 60);
  const remainingSeconds = safeSeconds % 60;

  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
};

export const getPracticeRemainingSeconds = (
  durationSeconds: number,
  elapsedSeconds: number,
): number => Math.max(0, Math.ceil(durationSeconds - elapsedSeconds));

export const getPracticePositionSnapshot = (
  example: PracticeTabExample,
  activeEventIndex: number,
): PracticePositionSnapshot => {
  const sequenceEvents = getPracticeSequenceEvents(example);
  const activeEvent = sequenceEvents[activeEventIndex % sequenceEvents.length];
  const activeSlot = activeEvent?.at ?? 0;
  let marker: PracticeTabMarker | undefined;

  for (const candidate of example.markers ?? []) {
    if (candidate.at <= activeSlot && (!marker || candidate.at > marker.at)) {
      marker = candidate;
    }
  }

  if (!activeEvent || activeEvent.kind === "rest") {
    return {
      direction: null,
      fret: null,
      pattern: marker?.label ?? example.pitchScope.label,
    };
  }

  const frets = [
    ...new Set(
      activeEvent.notes.map(({ fret }) => (fret === "x" ? "Muted" : fret)),
    ),
  ];

  return {
    direction:
      activeEvent.stroke === "down"
        ? "Downstroke"
        : activeEvent.stroke === "up"
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
