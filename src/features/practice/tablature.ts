import type { PitchClass } from "@/helpers/typesHelpers";

export const practiceTabTunings = {
  "standard-6": {
    id: "standard-6",
    label: "6-string · Standard E",
    midiPitchesHighToLow: [64, 59, 55, 50, 45, 40],
    pitchClassesHighToLow: [4, 11, 7, 2, 9, 4] as readonly PitchClass[],
    stringLabelsHighToLow: ["e", "B", "G", "D", "A", "E"],
  },
} as const;

export type PracticeTabTuningId = keyof typeof practiceTabTunings;
export type PracticeTabStringNumber = 1 | 2 | 3 | 4 | 5 | 6;
export type PracticeTabStroke = "down" | "up";
export type PracticeTabSubdivision =
  | "quarters"
  | "eighths"
  | "triplets"
  | "sixteenths";
export type PracticeTabArticulation =
  | "bend"
  | "hammer"
  | "pull"
  | "release"
  | "slide-down"
  | "slide-up"
  | "vibrato";

export type PracticeTabNote = {
  articulation?: PracticeTabArticulation;
  fret: number | "x";
  string: PracticeTabStringNumber;
  targetFret?: number;
};

export type PracticeTabNoteEvent = {
  accent?: boolean;
  at: number;
  duration: number;
  kind: "notes";
  notes: readonly [PracticeTabNote, ...PracticeTabNote[]];
  palmMuteDepth?: "deep" | "light" | "medium";
  stroke?: PracticeTabStroke;
};

export type PracticeTabRestEvent = {
  at: number;
  duration: number;
  kind: "rest";
};

export type PracticeTabEvent = PracticeTabNoteEvent | PracticeTabRestEvent;

export type PracticeTabMarker = {
  at: number;
  label: string;
};

export type PracticeTabPitchScope =
  | {
      kind: "chromatic";
      label: string;
    }
  | {
      kind: "set";
      label: string;
      pitchClasses: readonly PitchClass[];
    };

export type PracticeTabExample = {
  accessibleDescription: string;
  bpm: number;
  events: readonly PracticeTabEvent[];
  id: string;
  markers?: readonly PracticeTabMarker[];
  pitchScope: PracticeTabPitchScope;
  repetitions: number;
  subdivision: PracticeTabSubdivision;
  tuningId: PracticeTabTuningId;
};

export const practiceTabSlotCount: Record<PracticeTabSubdivision, number> = {
  quarters: 4,
  eighths: 8,
  triplets: 12,
  sixteenths: 16,
};

const countCycles: Record<PracticeTabSubdivision, readonly string[]> = {
  quarters: ["1", "2", "3", "4"],
  eighths: ["1", "&", "2", "&", "3", "&", "4", "&"],
  triplets: [
    "1",
    "trip",
    "let",
    "2",
    "trip",
    "let",
    "3",
    "trip",
    "let",
    "4",
    "trip",
    "let",
  ],
  sixteenths: [
    "1",
    "e",
    "&",
    "a",
    "2",
    "e",
    "&",
    "a",
    "3",
    "e",
    "&",
    "a",
    "4",
    "e",
    "&",
    "a",
  ],
};

export const getPracticeTabCountLabels = (
  subdivision: PracticeTabSubdivision,
): readonly string[] => countCycles[subdivision];

export const getPracticeTabBeatSize = (
  subdivision: PracticeTabSubdivision,
): number => practiceTabSlotCount[subdivision] / 4;

export const getPracticeTabPitchClass = (
  tuningId: PracticeTabTuningId,
  stringNumber: PracticeTabStringNumber,
  fret: number,
): PitchClass => {
  const openPitchClass =
    practiceTabTunings[tuningId].pitchClassesHighToLow[stringNumber - 1];

  return ((openPitchClass + fret) % 12) as PitchClass;
};

export const formatPracticeTabNote = (
  note: PracticeTabNote,
  duration: number,
): string => {
  if (note.fret === "x") {
    return "x";
  }

  const sustain = duration > 1 ? "~".repeat(Math.min(duration - 1, 3)) : "";

  switch (note.articulation) {
    case "hammer":
      return `h${note.fret}${sustain}`;
    case "pull":
      return `p${note.fret}${sustain}`;
    case "slide-up":
      return `/${note.fret}${sustain}`;
    case "slide-down":
      return `\\${note.fret}${sustain}`;
    case "bend":
      return `${note.fret}b${note.targetFret ?? "?"}${sustain}`;
    case "release":
      return `r${note.fret}${sustain}`;
    case "vibrato":
      return `${note.fret}~${sustain}`;
    default:
      return `${note.fret}${sustain}`;
  }
};

export type PracticeTabLegendItem = {
  label: string;
  symbol: string;
};

export const getPracticeTabLegend = (
  example: PracticeTabExample,
): PracticeTabLegendItem[] => {
  const articulations = new Set<PracticeTabArticulation>();
  let hasAccent = false;
  let hasDeadNote = false;
  let hasPalmMute = false;
  let hasPicking = false;

  example.events.forEach((event) => {
    if (event.kind === "rest") {
      return;
    }

    hasAccent ||= event.accent === true;
    hasPalmMute ||= event.palmMuteDepth !== undefined;
    hasPicking ||= event.stroke !== undefined;

    event.notes.forEach((note) => {
      hasDeadNote ||= note.fret === "x";

      if (note.articulation) {
        articulations.add(note.articulation);
      }
    });
  });

  const items: PracticeTabLegendItem[] = [];

  if (hasPicking) {
    items.push({ label: "pick direction", symbol: "↓ ↑" });
  }

  if (hasPalmMute) {
    items.push({ label: "palm mute", symbol: "PM" });
  }

  if (hasAccent) {
    items.push({ label: "accent", symbol: ">" });
  }

  if (hasDeadNote) {
    items.push({ label: "dead note", symbol: "x" });
  }

  const articulationLegend: Record<
    PracticeTabArticulation,
    PracticeTabLegendItem
  > = {
    bend: { label: "bend to target fret", symbol: "b" },
    hammer: { label: "hammer-on", symbol: "h" },
    pull: { label: "pull-off", symbol: "p" },
    release: { label: "bend release", symbol: "r" },
    "slide-down": { label: "slide down", symbol: "\\" },
    "slide-up": { label: "slide up", symbol: "/" },
    vibrato: { label: "vibrato", symbol: "~" },
  };

  articulations.forEach((articulation) => {
    items.push(articulationLegend[articulation]);
  });

  if (example.events.some((event) => event.kind === "rest")) {
    items.push({ label: "rest", symbol: "REST" });
  }

  return items;
};
