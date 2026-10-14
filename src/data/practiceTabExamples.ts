import type {
  PracticeTabArticulation,
  PracticeTabExample,
  PracticeTabNote,
  PracticeTabNoteEvent,
  PracticeTabPitchScope,
  PracticeTabRestEvent,
  PracticeTabStringNumber,
  PracticeTabStroke,
} from "@/features/practice/tablature";
import type { PitchClass } from "@/helpers/typesHelpers";

type StrokePattern = "alternate-down" | "alternate-up" | "down" | "up";

type TabCell =
  | "x"
  | null
  | number
  | {
      accent?: boolean;
      articulation?: PracticeTabArticulation;
      duration?: number;
      fret: "x" | number;
      palmMuteDepth?: "deep" | "light" | "medium";
      stroke?: PracticeTabStroke;
      targetFret?: number;
    };

type TabLineOptions = {
  accentSlots?: readonly number[];
  palmMuteDepth?: "deep" | "light" | "medium";
  strokePattern?: StrokePattern;
};

const getPatternStroke = (
  pattern: StrokePattern | undefined,
  at: number,
): PracticeTabStroke | undefined => {
  if (pattern === "down" || pattern === "up") {
    return pattern;
  }

  if (pattern === "alternate-down") {
    return at % 2 === 0 ? "down" : "up";
  }

  if (pattern === "alternate-up") {
    return at % 2 === 0 ? "up" : "down";
  }

  return undefined;
};

const tabLine = (
  string: PracticeTabStringNumber,
  cells: readonly TabCell[],
  options: TabLineOptions = {},
): PracticeTabNoteEvent[] =>
  cells.flatMap((cell, at) => {
    if (cell === null) {
      return [];
    }

    const authoredCell =
      typeof cell === "object" ? cell : { fret: cell as "x" | number };
    const note: PracticeTabNote = {
      articulation: authoredCell.articulation,
      fret: authoredCell.fret,
      string,
      targetFret: authoredCell.targetFret,
    };

    return [
      {
        accent:
          authoredCell.accent ?? options.accentSlots?.includes(at) ?? false,
        at,
        duration: authoredCell.duration ?? 1,
        kind: "notes" as const,
        notes: [note] as const,
        palmMuteDepth: authoredCell.palmMuteDepth ?? options.palmMuteDepth,
        stroke:
          authoredCell.stroke ?? getPatternStroke(options.strokePattern, at),
      },
    ];
  });

const tabChord = (
  at: number,
  notes: readonly [PracticeTabNote, ...PracticeTabNote[]],
  options: Omit<PracticeTabNoteEvent, "at" | "kind" | "notes"> = {
    duration: 1,
  },
): PracticeTabNoteEvent => ({
  ...options,
  at,
  kind: "notes",
  notes,
});

const tabRest = (at: number, duration = 1): PracticeTabRestEvent => ({
  at,
  duration,
  kind: "rest",
});

const pitchSet = (
  label: string,
  pitchClasses: readonly PitchClass[],
): PracticeTabPitchScope => ({ kind: "set", label, pitchClasses });

const chromatic = (label: string): PracticeTabPitchScope => ({
  kind: "chromatic",
  label,
});

const authoredTab = (
  example: Omit<PracticeTabExample, "tuningId">,
): PracticeTabExample => ({ ...example, tuningId: "standard-6" });

const A_MINOR_PENTATONIC = [9, 0, 2, 4, 7] as readonly PitchClass[];
const A_NATURAL_MINOR = [9, 11, 0, 2, 4, 5, 7] as readonly PitchClass[];
const C_MAJOR = [0, 2, 4, 5, 7, 9, 11] as readonly PitchClass[];
const E_MINOR = [4, 6, 7, 9, 11, 0, 2] as readonly PitchClass[];
const E_PHRYGIAN_DOMINANT = [4, 5, 8, 9, 11, 0, 2] as readonly PitchClass[];
const A_MINOR_TRIAD = [9, 0, 4] as readonly PitchClass[];
const C_MAJOR_TRIAD = [0, 4, 7] as readonly PitchClass[];
const E_PEDAL = [4] as readonly PitchClass[];

export const practiceTabExamples = {
  "daily-reset": authoredTab({
    accessibleDescription:
      "Gently ascend the open strings from low E to high E, then descend, using one relaxed pick stroke per beat.",
    bpm: 60,
    events: [
      ...tabLine(6, [0, null, null, null, null, null, null, 0], {
        strokePattern: "down",
      }),
      ...tabLine(5, [null, 0, null, null, null, null, 0, null], {
        strokePattern: "down",
      }),
      ...tabLine(4, [null, null, 0, null, null, 0, null, null], {
        strokePattern: "down",
      }),
      ...tabLine(3, [null, null, null, 0, 0, null, null, null], {
        strokePattern: "down",
      }),
    ],
    id: "daily-reset",
    markers: [
      { at: 0, label: "easy" },
      { at: 4, label: "release" },
    ],
    pitchScope: chromatic("Open-string reset"),
    repetitions: 4,
    subdivision: "eighths",
  }),
  "daily-foundation": authoredTab({
    accessibleDescription:
      "Play one octave of A natural minor from low E string fret 5 through D string fret 7 with strict alternate picking.",
    bpm: 70,
    events: [
      ...tabLine(6, [5, 7, 8], { strokePattern: "alternate-down" }),
      ...tabLine(5, [null, null, null, 5, 7, 8], {
        strokePattern: "alternate-down",
      }),
      ...tabLine(4, [null, null, null, null, null, null, 5, 7], {
        strokePattern: "alternate-down",
      }),
    ],
    id: "daily-foundation",
    pitchScope: pitchSet("A natural minor", A_NATURAL_MINOR),
    repetitions: 6,
    subdivision: "eighths",
  }),
  "daily-ear": authoredTab({
    accessibleDescription:
      "Play E, G, A as a call, rest, then answer with C, A, G, E in A minor pentatonic.",
    bpm: 66,
    events: [
      ...tabLine(2, [5, 8, null, null, null, null, 8, 5]),
      ...tabLine(1, [null, null, 5, null, 8, 5]),
      tabRest(3),
    ],
    id: "daily-ear",
    markers: [
      { at: 0, label: "call" },
      { at: 4, label: "answer" },
    ],
    pitchScope: pitchSet("A minor pentatonic", A_MINOR_PENTATONIC),
    repetitions: 4,
    subdivision: "eighths",
  }),
  "daily-play": authoredTab({
    accessibleDescription:
      "Play Open Road Hook, a two-bar E natural minor melody with two exact rests, an open-string climb in bar two, and a descending resolution to sustained E.",
    bpm: 80,
    events: [
      tabChord(0, [{ fret: 2, string: 4 }], {
        accent: true,
        duration: 2,
        stroke: "down",
      }),
      tabChord(2, [{ fret: 0, string: 3 }], {
        duration: 1,
        stroke: "up",
      }),
      tabChord(3, [{ fret: 2, string: 3 }], {
        duration: 1,
        stroke: "down",
      }),
      tabChord(4, [{ fret: 0, string: 2 }], {
        duration: 2,
        stroke: "up",
      }),
      tabRest(6, 2),
      tabChord(8, [{ fret: 2, string: 3 }], {
        accent: true,
        duration: 2,
        stroke: "down",
      }),
      tabChord(10, [{ fret: 0, string: 3 }], {
        duration: 1,
        stroke: "up",
      }),
      tabChord(11, [{ fret: 2, string: 4 }], {
        duration: 1,
        stroke: "down",
      }),
      tabChord(12, [{ fret: 3, string: 2 }], {
        duration: 2,
        stroke: "up",
      }),
      tabChord(14, [{ fret: 0, string: 2 }], {
        duration: 2,
        stroke: "down",
      }),
      tabChord(16, [{ fret: 2, string: 4 }], {
        accent: true,
        duration: 2,
        stroke: "down",
      }),
      tabChord(18, [{ fret: 0, string: 3 }], {
        duration: 1,
        stroke: "up",
      }),
      tabChord(19, [{ fret: 2, string: 3 }], {
        duration: 1,
        stroke: "down",
      }),
      tabChord(20, [{ fret: 3, string: 2 }], {
        accent: true,
        duration: 2,
        stroke: "up",
      }),
      tabChord(22, [{ fret: 0, string: 1 }], {
        duration: 2,
        stroke: "down",
      }),
      tabRest(24, 2),
      tabChord(26, [{ fret: 3, string: 2 }], {
        duration: 1,
        stroke: "down",
      }),
      tabChord(27, [{ fret: 0, string: 2 }], {
        duration: 1,
        stroke: "up",
      }),
      tabChord(28, [{ fret: 2, string: 3 }], {
        duration: 1,
        stroke: "down",
      }),
      tabChord(29, [{ fret: 0, string: 3 }], {
        duration: 1,
        stroke: "up",
      }),
      tabChord(30, [{ fret: 2, string: 4 }], {
        accent: true,
        duration: 2,
        stroke: "down",
      }),
    ],
    id: "daily-play",
    measureCount: 2,
    pitchScope: pitchSet("E natural minor · Open Road Hook", E_MINOR),
    repetitions: 8,
    subdivision: "sixteenths",
  }),

  "scales-center": authoredTab({
    accessibleDescription:
      "On the high E string play A, C, E, high A, G, E, C, A to establish A minor as the tonal center.",
    bpm: 60,
    events: [
      ...tabLine(1, [5, 8, 12, 17, 15, 12, 8, 5], {
        strokePattern: "alternate-down",
      }),
    ],
    id: "scales-center",
    markers: [
      { at: 0, label: "home" },
      { at: 3, label: "octave" },
    ],
    pitchScope: pitchSet("A minor pentatonic", A_MINOR_PENTATONIC),
    repetitions: 4,
    subdivision: "eighths",
  }),
  "scales-sequence": authoredTab({
    accessibleDescription:
      "Play diatonic thirds A to C, B to D, C to E, and D to F on the high E string.",
    bpm: 68,
    events: [
      ...tabLine(1, [5, 8, 7, 10, 8, 12, 10, 13], {
        accentSlots: [0, 2, 4, 6],
        strokePattern: "alternate-down",
      }),
    ],
    id: "scales-sequence",
    pitchScope: pitchSet("A natural minor · diatonic thirds", A_NATURAL_MINOR),
    repetitions: 6,
    subdivision: "eighths",
  }),
  "scales-connect": authoredTab({
    accessibleDescription:
      "Play Carry the Motif, a two-bar E natural minor phrase that moves an E-G-A-B idea from frets 7-10 into frets 12-15, develops it there, and returns through A, G, F-sharp, and E.",
    bpm: 72,
    events: [
      {
        accent: true,
        at: 0,
        duration: 2,
        kind: "notes",
        notes: [{ fret: 9, string: 3 }],
        stroke: "down",
      },
      {
        at: 2,
        duration: 1,
        kind: "notes",
        notes: [{ fret: 8, string: 2 }],
        stroke: "up",
      },
      {
        at: 3,
        duration: 1,
        kind: "notes",
        notes: [{ fret: 10, string: 2 }],
        stroke: "down",
      },
      {
        at: 4,
        duration: 2,
        kind: "notes",
        notes: [{ fret: 7, string: 1 }],
        stroke: "up",
      },
      {
        at: 6,
        duration: 1,
        kind: "notes",
        notes: [{ fret: 10, string: 2 }],
        stroke: "down",
      },
      {
        at: 7,
        duration: 1,
        kind: "notes",
        notes: [{ fret: 8, string: 2 }],
        stroke: "up",
      },
      {
        accent: true,
        at: 8,
        duration: 2,
        kind: "notes",
        notes: [{ fret: 9, string: 3 }],
        stroke: "down",
      },
      {
        at: 10,
        duration: 2,
        kind: "notes",
        notes: [{ fret: 10, string: 2 }],
        stroke: "up",
      },
      {
        accent: true,
        at: 12,
        duration: 2,
        kind: "notes",
        notes: [{ fret: 12, string: 2 }],
        stroke: "down",
      },
      {
        at: 14,
        duration: 2,
        kind: "notes",
        notes: [{ fret: 12, string: 1 }],
        stroke: "up",
      },
      {
        accent: true,
        at: 16,
        duration: 1,
        kind: "notes",
        notes: [{ fret: 12, string: 1 }],
        stroke: "down",
      },
      {
        at: 17,
        duration: 1,
        kind: "notes",
        notes: [{ fret: 15, string: 1 }],
        stroke: "up",
      },
      {
        at: 18,
        duration: 2,
        kind: "notes",
        notes: [{ fret: 14, string: 1 }],
        stroke: "down",
      },
      {
        at: 20,
        duration: 2,
        kind: "notes",
        notes: [{ fret: 15, string: 2 }],
        stroke: "up",
      },
      {
        at: 22,
        duration: 1,
        kind: "notes",
        notes: [{ fret: 13, string: 2 }],
        stroke: "down",
      },
      {
        at: 23,
        duration: 1,
        kind: "notes",
        notes: [{ fret: 12, string: 2 }],
        stroke: "up",
      },
      {
        accent: true,
        at: 24,
        duration: 2,
        kind: "notes",
        notes: [{ fret: 10, string: 2 }],
        stroke: "down",
      },
      {
        at: 26,
        duration: 2,
        kind: "notes",
        notes: [{ fret: 8, string: 2 }],
        stroke: "up",
      },
      {
        at: 28,
        duration: 2,
        kind: "notes",
        notes: [{ fret: 11, string: 3 }],
        stroke: "down",
      },
      {
        accent: true,
        at: 30,
        duration: 2,
        kind: "notes",
        notes: [{ articulation: "vibrato", fret: 9, string: 3 }],
        stroke: "up",
      },
    ],
    id: "scales-connect",
    markers: [
      { at: 0, label: "motif" },
      { at: 12, label: "shift out" },
      { at: 16, label: "develop" },
      { at: 24, label: "shift back" },
      { at: 30, label: "resolve" },
    ],
    measureCount: 2,
    pitchScope: pitchSet("E natural minor · Carry the Motif", E_MINOR),
    repetitions: 4,
    subdivision: "sixteenths",
  }),
  "scales-phrase": authoredTab({
    accessibleDescription:
      "Play A, C, G, rest, then answer C, A, E and hold A using A minor pentatonic notes.",
    bpm: 64,
    events: [
      ...tabLine(1, [
        5,
        8,
        null,
        null,
        8,
        5,
        null,
        { fret: 5, articulation: "vibrato", duration: 1 },
      ]),
      ...tabLine(2, [null, null, 8, null, null, null, 5]),
      tabRest(3),
    ],
    id: "scales-phrase",
    markers: [
      { at: 0, label: "question" },
      { at: 4, label: "answer" },
    ],
    pitchScope: pitchSet("A minor pentatonic phrase", A_MINOR_PENTATONIC),
    repetitions: 4,
    subdivision: "eighths",
  }),

  "skipping-landing": authoredTab({
    accessibleDescription:
      "Pick muted strings in skip pairs six to four, five to three, four to two, and three to one with alternating strokes.",
    bpm: 60,
    events: [
      ...tabLine(6, ["x"]),
      ...tabLine(4, [null, "x", null, null, "x"]),
      ...tabLine(5, [null, null, "x"]),
      ...tabLine(3, [null, null, null, "x", null, null, "x"]),
      ...tabLine(2, [null, null, null, null, null, "x"]),
      ...tabLine(1, [null, null, null, null, null, null, null, "x"]),
    ].map((event) => ({
      ...event,
      stroke: event.at % 2 === 0 ? "down" : "up",
    })),
    id: "skipping-landing",
    pitchScope: chromatic("Muted landing drill"),
    repetitions: 8,
    subdivision: "eighths",
  }),
  "skipping-pentatonic": authoredTab({
    accessibleDescription:
      "Play A and C on low E, skip to C and D on D, then play D and E on A and C and D on G.",
    bpm: 68,
    events: [
      ...tabLine(6, [5, 8], { strokePattern: "alternate-down" }),
      ...tabLine(4, [null, null, 5, 7], {
        strokePattern: "alternate-down",
      }),
      ...tabLine(5, [null, null, null, null, 5, 7], {
        strokePattern: "alternate-down",
      }),
      ...tabLine(3, [null, null, null, null, null, null, 5, 7], {
        strokePattern: "alternate-down",
      }),
    ],
    id: "skipping-pentatonic",
    pitchScope: pitchSet(
      "A minor pentatonic · string skips",
      A_MINOR_PENTATONIC,
    ),
    repetitions: 6,
    subdivision: "eighths",
  }),
  "skipping-arpeggio": authoredTab({
    accessibleDescription:
      "Outline an A minor triad across non-adjacent strings, repeat the shape from its fifth, then leave space before landing on A.",
    bpm: 58,
    events: [
      ...tabLine(6, [5, null, null, null, null, 5], {
        strokePattern: "alternate-down",
      }),
      ...tabLine(4, [null, 10, null, 10], {
        strokePattern: "alternate-down",
      }),
      ...tabLine(2, [null, null, 5, null, 5], {
        strokePattern: "alternate-down",
      }),
      ...tabLine(
        1,
        [null, null, null, null, null, null, null, { fret: 5, duration: 1 }],
        {
          accentSlots: [7],
          strokePattern: "alternate-down",
        },
      ),
      tabRest(6),
    ],
    id: "skipping-arpeggio",
    markers: [
      { at: 0, label: "rise" },
      { at: 3, label: "variation" },
      { at: 7, label: "home" },
    ],
    pitchScope: pitchSet("A minor triad", A_MINOR_TRIAD),
    repetitions: 6,
    subdivision: "eighths",
  }),
  "skipping-phrase": authoredTab({
    accessibleDescription:
      "Play Across the Wire, a two-bar E natural minor phrase that alternates across the D and B strings, breathes after the opening motif, crosses the high E and G strings, and resolves through B, G, and E.",
    bpm: 72,
    events: [
      {
        accent: true,
        at: 0,
        duration: 2,
        kind: "notes",
        notes: [{ fret: 9, string: 4 }],
        stroke: "down",
      },
      {
        at: 2,
        duration: 1,
        kind: "notes",
        notes: [{ fret: 8, string: 2 }],
        stroke: "up",
      },
      {
        at: 3,
        duration: 1,
        kind: "notes",
        notes: [{ fret: 10, string: 4 }],
        stroke: "down",
      },
      {
        accent: true,
        at: 4,
        duration: 2,
        kind: "notes",
        notes: [{ fret: 10, string: 2 }],
        stroke: "up",
      },
      {
        at: 6,
        duration: 1,
        kind: "notes",
        notes: [{ fret: 12, string: 4 }],
        stroke: "down",
      },
      {
        at: 7,
        duration: 1,
        kind: "notes",
        notes: [{ fret: 12, string: 2 }],
        stroke: "up",
      },
      tabRest(8, 2),
      {
        at: 10,
        duration: 1,
        kind: "notes",
        notes: [{ fret: 10, string: 4 }],
        stroke: "down",
      },
      {
        at: 11,
        duration: 1,
        kind: "notes",
        notes: [{ fret: 10, string: 2 }],
        stroke: "up",
      },
      {
        accent: true,
        at: 12,
        duration: 2,
        kind: "notes",
        notes: [{ fret: 10, string: 1 }],
        stroke: "down",
      },
      {
        at: 14,
        duration: 2,
        kind: "notes",
        notes: [{ fret: 9, string: 3 }],
        stroke: "up",
      },
      {
        accent: true,
        at: 16,
        duration: 1,
        kind: "notes",
        notes: [{ fret: 9, string: 4 }],
        stroke: "down",
      },
      {
        at: 17,
        duration: 1,
        kind: "notes",
        notes: [{ fret: 8, string: 2 }],
        stroke: "up",
      },
      {
        at: 18,
        duration: 1,
        kind: "notes",
        notes: [{ fret: 10, string: 4 }],
        stroke: "down",
      },
      {
        at: 19,
        duration: 1,
        kind: "notes",
        notes: [{ fret: 10, string: 2 }],
        stroke: "up",
      },
      {
        at: 20,
        duration: 2,
        kind: "notes",
        notes: [{ fret: 12, string: 4 }],
        stroke: "down",
      },
      {
        at: 22,
        duration: 2,
        kind: "notes",
        notes: [{ fret: 12, string: 2 }],
        stroke: "up",
      },
      {
        accent: true,
        at: 24,
        duration: 1,
        kind: "notes",
        notes: [{ fret: 10, string: 1 }],
        stroke: "down",
      },
      {
        at: 25,
        duration: 1,
        kind: "notes",
        notes: [{ fret: 9, string: 3 }],
        stroke: "up",
      },
      {
        at: 26,
        duration: 2,
        kind: "notes",
        notes: [{ fret: 7, string: 1 }],
        stroke: "down",
      },
      {
        at: 28,
        duration: 2,
        kind: "notes",
        notes: [{ fret: 8, string: 2 }],
        stroke: "up",
      },
      {
        accent: true,
        at: 30,
        duration: 2,
        kind: "notes",
        notes: [{ articulation: "vibrato", fret: 9, string: 3 }],
        stroke: "down",
      },
    ],
    id: "skipping-phrase",
    markers: [
      { at: 0, label: "motif" },
      { at: 8, label: "breathe" },
      { at: 16, label: "develop" },
      { at: 26, label: "resolve" },
    ],
    measureCount: 2,
    pitchScope: pitchSet("E natural minor · Across the Wire", E_MINOR),
    repetitions: 4,
    subdivision: "sixteenths",
  }),

  "chugs-mute-depth": authoredTab({
    accessibleDescription:
      "Play four low E pedal notes: open, lightly palm muted, medium palm muted, then deeply palm muted.",
    bpm: 70,
    events: [
      ...tabLine(6, [
        { fret: 0, stroke: "down" },
        { fret: 0, palmMuteDepth: "light", stroke: "down" },
        { fret: 0, palmMuteDepth: "medium", stroke: "down" },
        { fret: 0, palmMuteDepth: "deep", stroke: "down" },
      ]),
    ],
    id: "chugs-mute-depth",
    markers: [
      { at: 0, label: "open" },
      { at: 1, label: "light" },
      { at: 2, label: "medium" },
      { at: 3, label: "deep" },
    ],
    pitchScope: pitchSet("Low E pedal", E_PEDAL),
    repetitions: 8,
    subdivision: "quarters",
  }),
  "chugs-gallop": authoredTab({
    accessibleDescription:
      "Play a forward gallop on beat one, a reverse gallop on beat two, rest for beat three, and re-enter with a forward gallop on beat four.",
    bpm: 66,
    events: [
      ...tabLine(
        6,
        [0, null, 0, 0, 0, 0, 0, null, null, null, null, null, 0, null, 0, 0],
        {
          palmMuteDepth: "medium",
          strokePattern: "alternate-down",
        },
      ),
      tabRest(8, 4),
    ],
    id: "chugs-gallop",
    markers: [
      { at: 0, label: "forward" },
      { at: 4, label: "reverse" },
      { at: 8, label: "rest" },
      { at: 12, label: "re-enter" },
    ],
    pitchScope: pitchSet("Low E gallops", E_PEDAL),
    repetitions: 8,
    subdivision: "sixteenths",
  }),

  "alternate-balance": authoredTab({
    accessibleDescription:
      "Strict alternate pick A, B, C, B, A, B, C, D on the high E string, beginning with a downstroke.",
    bpm: 76,
    events: [
      ...tabLine(1, [5, 7, 8, 7, 5, 7, 8, 10], {
        strokePattern: "alternate-down",
      }),
    ],
    id: "alternate-balance",
    markers: [
      { at: 0, label: "start ↓" },
      { at: 4, label: "stay loose" },
    ],
    pitchScope: pitchSet("A natural minor", A_NATURAL_MINOR),
    repetitions: 8,
    subdivision: "eighths",
  }),
  "alternate-cross": authoredTab({
    accessibleDescription:
      "Alternate pick C and D on G, E and F on B, then reverse F, E, D, C across the same two strings.",
    bpm: 72,
    events: [
      ...tabLine(3, [5, 7, null, null, null, null, 7, 5], {
        strokePattern: "alternate-down",
      }),
      ...tabLine(2, [null, null, 5, 6, 6, 5], {
        strokePattern: "alternate-down",
      }),
    ],
    id: "alternate-cross",
    pitchScope: pitchSet("A natural minor · string change", A_NATURAL_MINOR),
    repetitions: 10,
    subdivision: "eighths",
  }),
  "alternate-burst": authoredTab({
    accessibleDescription:
      "Play A, B, C, D as eighth notes for two beats, then E, D, C, B as a sixteenth-note burst and rest for beat four.",
    bpm: 68,
    events: [
      ...tabLine(1, [5, null, 7, null, 8, null, 10, null, 12, 10, 8, 7], {
        strokePattern: "alternate-down",
      }),
    ],
    id: "alternate-burst",
    markers: [
      { at: 0, label: "steady" },
      { at: 8, label: "burst" },
      { at: 12, label: "release" },
    ],
    pitchScope: pitchSet("A natural minor · speed burst", A_NATURAL_MINOR),
    repetitions: 6,
    subdivision: "sixteenths",
  }),
  "alternate-phrase": authoredTab({
    accessibleDescription:
      "Strict alternate pick a syncopated A minor pentatonic motif, repeat it one string higher, then descend to a final A.",
    bpm: 74,
    events: [
      ...tabLine(3, [5, 7, 5, null, null, null, null, null, null, null, 7], {
        accentSlots: [0],
        strokePattern: "alternate-down",
      }),
      ...tabLine(2, [null, null, null, null, 5, 8, 5, null, null, 5], {
        accentSlots: [4],
        strokePattern: "alternate-down",
      }),
      ...tabLine(
        1,
        [
          null,
          null,
          null,
          null,
          null,
          null,
          null,
          null,
          5,
          null,
          null,
          8,
          5,
          null,
          null,
          { fret: 5, duration: 1 },
        ],
        {
          accentSlots: [15],
          strokePattern: "alternate-down",
        },
      ),
      tabRest(3),
      tabRest(7),
      tabRest(13, 2),
    ],
    id: "alternate-phrase",
    markers: [
      { at: 0, label: "motif" },
      { at: 4, label: "answer" },
      { at: 8, label: "resolve" },
    ],
    pitchScope: pitchSet("A minor pentatonic phrase", A_MINOR_PENTATONIC),
    repetitions: 6,
    subdivision: "sixteenths",
  }),

  "legato-pairs": authoredTab({
    accessibleDescription:
      "On high E, pick fret 5, hammer to 6 and pull to 5, then repeat from fret 5 to frets 7 and 8.",
    bpm: 60,
    events: [
      ...tabLine(1, [
        { fret: 5, stroke: "down" },
        { articulation: "hammer", fret: 6 },
        { articulation: "pull", fret: 5 },
        { articulation: "hammer", fret: 7 },
        { articulation: "pull", fret: 5 },
        { articulation: "hammer", fret: 8 },
        { articulation: "pull", fret: 5 },
      ]),
      tabRest(7),
    ],
    id: "legato-pairs",
    pitchScope: chromatic("Finger-pair mechanics · frets 5–8"),
    repetitions: 8,
    subdivision: "eighths",
  }),
  "legato-flow": authoredTab({
    accessibleDescription:
      "Pick high E fret 5, hammer to 7 and 8, pull back to 7 and 5, then pick B fret 8 and pull to 6 and 5.",
    bpm: 66,
    events: [
      ...tabLine(1, [
        { fret: 5, stroke: "down" },
        { articulation: "hammer", fret: 7 },
        { articulation: "hammer", fret: 8 },
        { articulation: "pull", fret: 7 },
        { articulation: "pull", fret: 5 },
      ]),
      ...tabLine(2, [
        null,
        null,
        null,
        null,
        null,
        { fret: 8, stroke: "up" },
        { articulation: "pull", fret: 6 },
        { articulation: "pull", fret: 5 },
      ]),
    ],
    id: "legato-flow",
    pitchScope: pitchSet(
      "A natural minor · one pick per string",
      A_NATURAL_MINOR,
    ),
    repetitions: 8,
    subdivision: "eighths",
  }),
  "legato-connect": authoredTab({
    accessibleDescription:
      "Pick B fret 5, hammer to 6 and 8, cross to high E fret 5, hammer to 7 and 8, then slide to fret 12 and hold.",
    bpm: 64,
    events: [
      ...tabLine(2, [
        { fret: 5, stroke: "down" },
        { articulation: "hammer", fret: 6 },
        { articulation: "hammer", fret: 8 },
      ]),
      ...tabLine(1, [
        null,
        null,
        null,
        { fret: 5, stroke: "down" },
        { articulation: "hammer", fret: 7 },
        { articulation: "hammer", fret: 8 },
        { articulation: "slide-up", duration: 2, fret: 12 },
      ]),
    ],
    id: "legato-connect",
    markers: [{ at: 6, label: "hold" }],
    pitchScope: pitchSet("A natural minor · position shift", A_NATURAL_MINOR),
    repetitions: 6,
    subdivision: "eighths",
  }),
  "legato-phrase": authoredTab({
    accessibleDescription:
      "Play Answer the Climb, a two-bar E natural minor phrase: shape B-C-D-C-B with legato, answer on high E, slide down to D, breathe for one beat, develop the motif, and resolve to E with vibrato.",
    bpm: 72,
    events: [
      tabChord(0, [{ fret: 12, string: 2 }], {
        accent: true,
        duration: 2,
        stroke: "down",
      }),
      tabChord(2, [{ articulation: "hammer", fret: 13, string: 2 }]),
      tabChord(3, [{ articulation: "hammer", fret: 15, string: 2 }]),
      tabChord(4, [{ articulation: "pull", fret: 13, string: 2 }]),
      tabChord(5, [{ articulation: "pull", fret: 12, string: 2 }]),
      tabChord(6, [{ fret: 15, string: 1 }], {
        accent: true,
        duration: 2,
        stroke: "down",
      }),
      tabChord(8, [{ articulation: "pull", fret: 12, string: 1 }], {
        duration: 2,
      }),
      tabChord(10, [{ articulation: "slide-down", fret: 10, string: 1 }], {
        duration: 2,
      }),
      tabRest(12, 4),
      tabChord(16, [{ fret: 12, string: 2 }], {
        accent: true,
        duration: 2,
        stroke: "down",
      }),
      tabChord(18, [{ articulation: "hammer", fret: 13, string: 2 }]),
      tabChord(19, [{ articulation: "hammer", fret: 15, string: 2 }]),
      tabChord(20, [{ articulation: "pull", fret: 13, string: 2 }]),
      tabChord(21, [{ articulation: "pull", fret: 12, string: 2 }]),
      tabChord(22, [{ articulation: "hammer", fret: 15, string: 2 }], {
        duration: 2,
      }),
      tabChord(24, [{ articulation: "pull", fret: 13, string: 2 }]),
      tabChord(25, [{ articulation: "pull", fret: 12, string: 2 }]),
      tabChord(26, [{ articulation: "pull", fret: 10, string: 2 }], {
        duration: 2,
      }),
      tabChord(28, [{ articulation: "vibrato", fret: 12, string: 1 }], {
        accent: true,
        duration: 4,
        stroke: "down",
      }),
    ],
    id: "legato-phrase",
    markers: [
      { at: 0, label: "motif" },
      { at: 6, label: "answer" },
      { at: 12, label: "breathe" },
      { at: 16, label: "develop" },
      { at: 28, label: "resolve" },
    ],
    measureCount: 2,
    pitchScope: pitchSet("E natural minor", E_MINOR),
    repetitions: 4,
    subdivision: "sixteenths",
  }),

  "sweep-rake": authoredTab({
    accessibleDescription:
      "Rake muted G, B, and high E strings with one down path, rest, then return high E, B, and G with one up path.",
    bpm: 50,
    events: [
      ...tabLine(3, ["x", null, null, null, null, null, "x"]),
      ...tabLine(2, [null, "x", null, null, null, "x"]),
      ...tabLine(1, [null, null, "x", null, "x"]),
      tabRest(3),
    ].map((event) =>
      event.kind === "rest"
        ? event
        : {
            ...event,
            stroke: event.at < 3 ? ("down" as const) : ("up" as const),
          },
    ),
    id: "sweep-rake",
    pitchScope: chromatic("Muted sweep path"),
    repetitions: 10,
    subdivision: "eighths",
  }),
  "sweep-triad": authoredTab({
    accessibleDescription:
      "Sweep A minor root position from G string fret 14 to B fret 13 to high E fret 12, rest, then return upward.",
    bpm: 54,
    events: [
      ...tabLine(3, [14, null, null, null, null, null, 14]),
      ...tabLine(2, [null, 13, null, null, null, 13]),
      ...tabLine(1, [null, null, 12, null, 12]),
      tabRest(3),
    ].map((event) =>
      event.kind === "rest"
        ? event
        : {
            ...event,
            stroke: event.at < 3 ? ("down" as const) : ("up" as const),
          },
    ),
    id: "sweep-triad",
    pitchScope: pitchSet("A minor triad · A C E", A_MINOR_TRIAD),
    repetitions: 8,
    subdivision: "eighths",
  }),
  "sweep-turn": authoredTab({
    accessibleDescription:
      "Sweep an A minor triad upward, turn through the octave with hammer-on and pull-off, descend, then rest before a final A.",
    bpm: 52,
    events: [
      ...tabLine(3, [14, null, null, null, null, null, 14, null, null, 14]),
      ...tabLine(2, [null, 13, null, null, null, 13]),
      ...tabLine(1, [
        null,
        null,
        12,
        { articulation: "hammer", fret: 17 },
        { articulation: "pull", fret: 12 },
      ]),
      tabRest(7),
      tabRest(8),
    ].map((event) => {
      if (event.kind === "rest" || event.at === 3 || event.at === 4) {
        return event;
      }

      return {
        ...event,
        stroke: event.at < 3 ? ("down" as const) : ("up" as const),
      };
    }),
    id: "sweep-turn",
    markers: [
      { at: 0, label: "sweep" },
      { at: 3, label: "turn" },
      { at: 9, label: "land" },
    ],
    pitchScope: pitchSet("A minor triad turnaround", A_MINOR_TRIAD),
    repetitions: 8,
    subdivision: "sixteenths",
  }),
  "sweep-progression": authoredTab({
    accessibleDescription:
      "Sweep A minor on G 14, B 13, high E 12; F major on G 10, B 10, high E 8; G major on G 12, B 12, high E 10; then hold high E fret 12.",
    bpm: 58,
    events: [
      ...tabLine(3, [14, null, null, null, 10, null, null, null, 12]),
      ...tabLine(2, [null, 13, null, null, null, 10, null, null, null, 12]),
      ...tabLine(1, [
        null,
        null,
        12,
        null,
        null,
        null,
        8,
        null,
        null,
        null,
        10,
        null,
        { articulation: "vibrato", duration: 4, fret: 12 },
      ]),
      tabRest(3),
      tabRest(7),
      tabRest(11),
    ].map((event) =>
      event.kind === "rest" ? event : { ...event, stroke: "down" as const },
    ),
    id: "sweep-progression",
    markers: [
      { at: 0, label: "Am" },
      { at: 4, label: "F" },
      { at: 8, label: "G" },
      { at: 12, label: "exit" },
    ],
    pitchScope: pitchSet("Am · F · G in A natural minor", A_NATURAL_MINOR),
    repetitions: 4,
    subdivision: "sixteenths",
  }),

  "bends-reference": authoredTab({
    accessibleDescription:
      "Play A at B-string fret 10, rest for two beats, then bend G at fret 8 up one whole step to A and hold.",
    bpm: 56,
    events: [
      ...tabLine(2, [
        { articulation: "vibrato", duration: 1, fret: 10 },
        null,
        null,
        { articulation: "bend", duration: 1, fret: 8, targetFret: 10 },
      ]),
      tabRest(1, 2),
    ],
    id: "bends-reference",
    markers: [
      { at: 0, label: "reference" },
      { at: 3, label: "match it" },
    ],
    pitchScope: pitchSet(
      "A minor pentatonic · G to A bend",
      A_MINOR_PENTATONIC,
    ),
    repetitions: 8,
    subdivision: "quarters",
  }),
  "bends-control": authoredTab({
    accessibleDescription:
      "Bend B-string fret 8 to the pitch of fret 10, sustain the target through beat three, then release to fret 8 on beat four.",
    bpm: 52,
    events: [
      ...tabLine(2, [
        { articulation: "bend", duration: 3, fret: 8, targetFret: 10 },
        null,
        null,
        { articulation: "release", fret: 8 },
      ]),
    ],
    id: "bends-control",
    markers: [
      { at: 0, label: "arrive" },
      { at: 1, label: "hold" },
      { at: 3, label: "release" },
    ],
    pitchScope: pitchSet(
      "A minor pentatonic · whole-step bend",
      A_MINOR_PENTATONIC,
    ),
    repetitions: 8,
    subdivision: "quarters",
  }),
  "vibrato-pulse": authoredTab({
    accessibleDescription:
      "Hold A at B-string fret 10 with vibrato for two beats, then attack and hold the same note with vibrato for two more beats; the player chooses each hold's width.",
    bpm: 60,
    events: [
      ...tabLine(2, [
        { articulation: "vibrato", duration: 2, fret: 10 },
        null,
        { articulation: "vibrato", duration: 2, fret: 10 },
      ]),
    ],
    id: "vibrato-pulse",
    markers: [
      { at: 0, label: "first hold" },
      { at: 2, label: "second hold" },
    ],
    pitchScope: pitchSet("A note · controlled vibrato", [9]),
    repetitions: 8,
    subdivision: "quarters",
  }),
  "bends-phrase": authoredTab({
    accessibleDescription:
      "Play C and D on G, E on B, bend G at B fret 8 to A, rest, then finish on A at high E fret 5 with vibrato.",
    bpm: 62,
    events: [
      ...tabLine(3, [5, 7]),
      ...tabLine(2, [
        null,
        null,
        5,
        { articulation: "bend", fret: 8, targetFret: 10 },
      ]),
      ...tabLine(1, [
        null,
        null,
        null,
        null,
        null,
        { articulation: "vibrato", duration: 3, fret: 5 },
      ]),
      tabRest(4),
    ],
    id: "bends-phrase",
    pitchScope: pitchSet("A minor pentatonic phrase", A_MINOR_PENTATONIC),
    repetitions: 4,
    subdivision: "eighths",
  }),
  "metal-tight-chugs": authoredTab({
    accessibleDescription:
      "Downpick a steady bar of palm-muted low E eighth notes with accents on beats one and three.",
    bpm: 88,
    events: tabLine(6, [0, 0, 0, 0, 0, 0, 0, 0], {
      accentSlots: [0, 4],
      palmMuteDepth: "medium",
      strokePattern: "down",
    }),
    id: "metal-tight-chugs",
    markers: [
      { at: 0, label: "anchor" },
      { at: 4, label: "anchor" },
    ],
    pitchScope: pitchSet("E pedal", E_PEDAL),
    repetitions: 8,
    subdivision: "eighths",
  }),
  "metal-accent-shift": authoredTab({
    accessibleDescription:
      "Downpick palm-muted low E sixteenth notes while the accent moves through four different subdivisions.",
    bpm: 74,
    events: tabLine(6, Array(16).fill(0), {
      accentSlots: [0, 5, 10, 15],
      palmMuteDepth: "medium",
      strokePattern: "down",
    }),
    id: "metal-accent-shift",
    markers: [
      { at: 0, label: "1" },
      { at: 5, label: "e" },
      { at: 10, label: "&" },
      { at: 15, label: "a" },
    ],
    pitchScope: pitchSet("E pedal", E_PEDAL),
    repetitions: 6,
    subdivision: "sixteenths",
  }),
  "metal-pedal-assault": authoredTab({
    accessibleDescription:
      "Drive a palm-muted low E pedal around G5 and A5 punches, leave a syncopated gap, then land on C5.",
    bpm: 96,
    events: [
      ...tabLine(6, [0, null, null, 0, null, 0, 0, null], {
        palmMuteDepth: "deep",
        strokePattern: "down",
      }),
      tabChord(
        2,
        [
          { fret: 3, string: 6 },
          { fret: 5, string: 5 },
        ],
        {
          accent: true,
          duration: 1,
          stroke: "down",
        },
      ),
      tabChord(
        4,
        [
          { fret: 5, string: 6 },
          { fret: 7, string: 5 },
        ],
        {
          accent: true,
          duration: 1,
          stroke: "down",
        },
      ),
      tabChord(
        7,
        [
          { fret: 3, string: 5 },
          { fret: 5, string: 4 },
        ],
        {
          accent: true,
          duration: 1,
          stroke: "down",
        },
      ),
      tabRest(1),
    ],
    id: "metal-pedal-assault",
    markers: [
      { at: 0, label: "pedal" },
      { at: 2, label: "punch" },
      { at: 4, label: "variation" },
      { at: 7, label: "land" },
    ],
    pitchScope: pitchSet("E minor pedal riff", E_MINOR),
    repetitions: 8,
    subdivision: "eighths",
  }),
  "metal-three-three-two-engine": authoredTab({
    accessibleDescription:
      "Play two bars of even downpicked eighth notes grouped three plus three plus two. Palm mute each low E pedal and accent each unmuted C5, D5, or G5 power chord.",
    bpm: 90,
    events: [
      ...tabLine(6, [0, 0, null, 0, 0, null, 0, null, 0, 0, null, 0, 0], {
        palmMuteDepth: "medium",
        strokePattern: "down",
      }),
      tabChord(
        2,
        [
          { fret: 8, string: 6 },
          { fret: 10, string: 5 },
        ],
        { accent: true, duration: 1, stroke: "down" },
      ),
      tabChord(
        5,
        [
          { fret: 10, string: 6 },
          { fret: 12, string: 5 },
        ],
        { accent: true, duration: 1, stroke: "down" },
      ),
      tabChord(
        7,
        [
          { fret: 8, string: 6 },
          { fret: 10, string: 5 },
        ],
        { accent: true, duration: 1, stroke: "down" },
      ),
      tabChord(
        10,
        [
          { fret: 3, string: 6 },
          { fret: 5, string: 5 },
        ],
        { accent: true, duration: 1, stroke: "down" },
      ),
      tabChord(
        13,
        [
          { fret: 10, string: 6 },
          { fret: 12, string: 5 },
        ],
        { accent: true, duration: 1, stroke: "down" },
      ),
      tabChord(
        14,
        [
          { fret: 8, string: 6 },
          { fret: 10, string: 5 },
        ],
        { accent: true, duration: 1, stroke: "down" },
      ),
      tabChord(
        15,
        [
          { fret: 10, string: 6 },
          { fret: 12, string: 5 },
        ],
        { accent: true, duration: 1, stroke: "down" },
      ),
    ],
    id: "metal-three-three-two-engine",
    markers: [
      { at: 0, label: "bar 1 · 3 + 3 + 2" },
      { at: 8, label: "bar 2 · 3 + 3 + 2" },
    ],
    measureCount: 2,
    pitchScope: pitchSet("E natural minor", E_MINOR),
    repetitions: 6,
    subdivision: "eighths",
  }),
  "metal-gallop-relay": authoredTab({
    accessibleDescription:
      "Play forward gallops on low E and B, stop for beat four, re-enter with reverse gallops on B and E, then finish with accented C5 and D5 power chords before looping to E.",
    bpm: 80,
    events: [
      tabChord(0, [{ fret: 0, string: 6 }], {
        duration: 2,
        palmMuteDepth: "medium",
        stroke: "down",
      }),
      tabChord(2, [{ fret: 0, string: 6 }], {
        duration: 1,
        palmMuteDepth: "medium",
        stroke: "down",
      }),
      tabChord(3, [{ fret: 0, string: 6 }], {
        duration: 1,
        palmMuteDepth: "medium",
        stroke: "up",
      }),
      tabChord(
        4,
        [
          { fret: 3, string: 6 },
          { fret: 5, string: 5 },
        ],
        { accent: true, duration: 2, stroke: "down" },
      ),
      tabChord(6, [{ fret: 0, string: 6 }], {
        duration: 2,
        palmMuteDepth: "medium",
        stroke: "down",
      }),
      tabChord(8, [{ fret: 2, string: 5 }], {
        duration: 2,
        palmMuteDepth: "medium",
        stroke: "down",
      }),
      tabChord(10, [{ fret: 2, string: 5 }], {
        duration: 1,
        palmMuteDepth: "medium",
        stroke: "down",
      }),
      tabChord(11, [{ fret: 2, string: 5 }], {
        duration: 1,
        palmMuteDepth: "medium",
        stroke: "up",
      }),
      tabRest(12, 4),
      tabChord(16, [{ fret: 2, string: 5 }], {
        duration: 1,
        palmMuteDepth: "medium",
        stroke: "down",
      }),
      tabChord(17, [{ fret: 2, string: 5 }], {
        duration: 1,
        palmMuteDepth: "medium",
        stroke: "up",
      }),
      tabChord(18, [{ fret: 2, string: 5 }], {
        duration: 2,
        palmMuteDepth: "medium",
        stroke: "down",
      }),
      tabChord(20, [{ fret: 0, string: 6 }], {
        duration: 1,
        palmMuteDepth: "medium",
        stroke: "down",
      }),
      tabChord(21, [{ fret: 0, string: 6 }], {
        duration: 1,
        palmMuteDepth: "medium",
        stroke: "up",
      }),
      tabChord(22, [{ fret: 0, string: 6 }], {
        duration: 2,
        palmMuteDepth: "medium",
        stroke: "down",
      }),
      tabChord(
        24,
        [
          { fret: 8, string: 6 },
          { fret: 10, string: 5 },
        ],
        { accent: true, duration: 2, stroke: "down" },
      ),
      tabChord(
        26,
        [
          { fret: 10, string: 6 },
          { fret: 12, string: 5 },
        ],
        { accent: true, duration: 2, stroke: "down" },
      ),
      tabRest(28, 2),
      tabChord(
        30,
        [
          { fret: 10, string: 6 },
          { fret: 12, string: 5 },
        ],
        { accent: true, duration: 2, stroke: "down" },
      ),
    ],
    id: "metal-gallop-relay",
    markers: [
      { at: 0, label: "forward" },
      { at: 8, label: "string move" },
      { at: 12, label: "stop" },
      { at: 16, label: "reverse" },
      { at: 24, label: "turnaround" },
      { at: 30, label: "pickup" },
    ],
    measureCount: 2,
    pitchScope: pitchSet("E natural minor", E_MINOR),
    repetitions: 6,
    subdivision: "sixteenths",
  }),
  "metal-gallop-control": authoredTab({
    accessibleDescription:
      "Play a long-short-short E gallop, repeat it with a displaced start, leave silence, then answer with a G5 power chord.",
    bpm: 82,
    events: [
      ...tabLine(
        6,
        [
          { duration: 2, fret: 0 },
          null,
          0,
          0,
          null,
          null,
          { duration: 2, fret: 0 },
          null,
          0,
          0,
        ],
        {
          accentSlots: [0, 6],
          palmMuteDepth: "medium",
          strokePattern: "alternate-down",
        },
      ),
      tabRest(4),
      tabRest(5),
      tabRest(10, 2),
      tabChord(
        12,
        [
          { fret: 3, string: 6 },
          { fret: 5, string: 5 },
        ],
        {
          accent: true,
          duration: 4,
          stroke: "down",
        },
      ),
    ],
    id: "metal-gallop-control",
    markers: [
      { at: 0, label: "gallop" },
      { at: 4, label: "space" },
      { at: 6, label: "variation" },
      { at: 10, label: "space" },
      { at: 12, label: "punch" },
    ],
    pitchScope: pitchSet("E minor gallop", E_MINOR),
    repetitions: 6,
    subdivision: "sixteenths",
  }),
  "metal-burst-and-resolve": authoredTab({
    accessibleDescription:
      "Alternate pick an E minor lead phrase with a descending six-note burst landing on G, rest, then a varied seven-note burst landing on E before D turns the loop back to E.",
    bpm: 80,
    events: [
      tabChord(0, [{ fret: 12, string: 1 }], {
        accent: true,
        duration: 2,
        stroke: "down",
      }),
      tabChord(2, [{ fret: 12, string: 2 }], {
        duration: 2,
        stroke: "up",
      }),
      tabChord(4, [{ fret: 12, string: 1 }], {
        duration: 1,
        stroke: "down",
      }),
      tabChord(5, [{ fret: 10, string: 1 }], {
        duration: 1,
        stroke: "up",
      }),
      tabChord(6, [{ fret: 8, string: 1 }], {
        duration: 1,
        stroke: "down",
      }),
      tabChord(7, [{ fret: 7, string: 1 }], {
        duration: 1,
        stroke: "up",
      }),
      tabChord(8, [{ fret: 10, string: 2 }], {
        duration: 1,
        stroke: "down",
      }),
      tabChord(9, [{ fret: 8, string: 2 }], {
        accent: true,
        duration: 3,
        stroke: "up",
      }),
      tabRest(12, 4),
      tabChord(16, [{ fret: 8, string: 2 }], {
        duration: 2,
        stroke: "down",
      }),
      tabChord(18, [{ fret: 12, string: 2 }], {
        duration: 2,
        stroke: "up",
      }),
      tabChord(20, [{ fret: 11, string: 3 }], {
        duration: 1,
        stroke: "down",
      }),
      tabChord(21, [{ fret: 10, string: 2 }], {
        duration: 1,
        stroke: "up",
      }),
      tabChord(22, [{ fret: 8, string: 2 }], {
        duration: 1,
        stroke: "down",
      }),
      tabChord(23, [{ fret: 12, string: 2 }], {
        duration: 1,
        stroke: "up",
      }),
      tabChord(24, [{ fret: 8, string: 1 }], {
        duration: 1,
        stroke: "down",
      }),
      tabChord(25, [{ fret: 10, string: 1 }], {
        duration: 1,
        stroke: "up",
      }),
      tabChord(26, [{ fret: 12, string: 1 }], {
        accent: true,
        duration: 2,
        stroke: "down",
      }),
      tabRest(28, 2),
      tabChord(30, [{ fret: 10, string: 1 }], {
        duration: 2,
        stroke: "up",
      }),
    ],
    id: "metal-burst-and-resolve",
    markers: [
      { at: 0, label: "E → B" },
      { at: 4, label: "burst → b3" },
      { at: 12, label: "release" },
      { at: 16, label: "G → B" },
      { at: 20, label: "burst → 1" },
      { at: 30, label: "b7 pickup" },
    ],
    measureCount: 2,
    pitchScope: pitchSet("E natural minor", E_MINOR),
    repetitions: 6,
    subdivision: "sixteenths",
  }),
  "metal-iron-pulse": authoredTab({
    accessibleDescription:
      "Downpick two bars of medium-muted open A pedal notes and unmuted C5, G5, and D5 power-chord accents, using a sixteenth-note cutoff before the D5-to-G5 turnaround.",
    bpm: 96,
    events: [
      tabChord(0, [{ fret: 0, string: 5 }], {
        duration: 2,
        palmMuteDepth: "medium",
        stroke: "down",
      }),
      tabChord(2, [{ fret: 0, string: 5 }], {
        duration: 2,
        palmMuteDepth: "medium",
        stroke: "down",
      }),
      tabChord(4, [{ fret: 0, string: 5 }], {
        duration: 2,
        palmMuteDepth: "medium",
        stroke: "down",
      }),
      tabChord(
        6,
        [
          { fret: 3, string: 5 },
          { fret: 5, string: 4 },
        ],
        { accent: true, duration: 2, stroke: "down" },
      ),
      tabChord(8, [{ fret: 0, string: 5 }], {
        duration: 2,
        palmMuteDepth: "medium",
        stroke: "down",
      }),
      tabChord(10, [{ fret: 0, string: 5 }], {
        duration: 2,
        palmMuteDepth: "medium",
        stroke: "down",
      }),
      tabChord(12, [{ fret: 0, string: 5 }], {
        duration: 2,
        palmMuteDepth: "medium",
        stroke: "down",
      }),
      tabChord(
        14,
        [
          { fret: 3, string: 6 },
          { fret: 5, string: 5 },
        ],
        { accent: true, duration: 2, stroke: "down" },
      ),
      tabChord(16, [{ fret: 0, string: 5 }], {
        duration: 2,
        palmMuteDepth: "medium",
        stroke: "down",
      }),
      tabChord(18, [{ fret: 0, string: 5 }], {
        duration: 2,
        palmMuteDepth: "medium",
        stroke: "down",
      }),
      tabChord(20, [{ fret: 0, string: 5 }], {
        duration: 2,
        palmMuteDepth: "medium",
        stroke: "down",
      }),
      tabChord(
        22,
        [
          { fret: 3, string: 5 },
          { fret: 5, string: 4 },
        ],
        { accent: true, duration: 2, stroke: "down" },
      ),
      tabChord(24, [{ fret: 0, string: 5 }], {
        duration: 2,
        palmMuteDepth: "medium",
        stroke: "down",
      }),
      tabChord(26, [{ fret: 0, string: 5 }], {
        duration: 1,
        palmMuteDepth: "medium",
        stroke: "down",
      }),
      tabRest(27, 1),
      tabChord(
        28,
        [
          { fret: 5, string: 5 },
          { fret: 7, string: 4 },
        ],
        { accent: true, duration: 2, stroke: "down" },
      ),
      tabChord(
        30,
        [
          { fret: 3, string: 6 },
          { fret: 5, string: 5 },
        ],
        { accent: true, duration: 2, stroke: "down" },
      ),
    ],
    id: "metal-iron-pulse",
    markers: [
      { at: 0, label: "A pedal" },
      { at: 6, label: "C5" },
      { at: 14, label: "G5" },
      { at: 16, label: "develop" },
      { at: 26, label: "cutoff" },
      { at: 28, label: "D5 → G5" },
    ],
    measureCount: 2,
    pitchScope: pitchSet("A natural minor", A_NATURAL_MINOR),
    repetitions: 6,
    subdivision: "sixteenths",
  }),
  "metal-phrygian-gravity": authoredTab({
    accessibleDescription:
      "Alternate a palm-muted low E pedal with an unmuted upper voice that emphasizes F and G sharp, holds the major third, then sustains F into the loop back to E.",
    bpm: 72,
    events: [
      tabChord(0, [{ fret: 0, string: 6 }], {
        duration: 1,
        palmMuteDepth: "medium",
        stroke: "down",
      }),
      tabChord(1, [{ fret: 0, string: 6 }], {
        duration: 1,
        palmMuteDepth: "medium",
        stroke: "up",
      }),
      tabChord(2, [{ fret: 8, string: 5 }], {
        accent: true,
        duration: 1,
        stroke: "down",
      }),
      tabChord(3, [{ fret: 8, string: 5 }], {
        duration: 1,
        stroke: "up",
      }),
      tabChord(4, [{ fret: 0, string: 6 }], {
        duration: 1,
        palmMuteDepth: "medium",
        stroke: "down",
      }),
      tabChord(5, [{ fret: 0, string: 6 }], {
        duration: 1,
        palmMuteDepth: "medium",
        stroke: "up",
      }),
      tabChord(6, [{ fret: 8, string: 5 }], {
        accent: true,
        duration: 2,
        stroke: "down",
      }),
      tabChord(8, [{ fret: 7, string: 5 }], {
        duration: 1,
        stroke: "down",
      }),
      tabChord(9, [{ fret: 8, string: 5 }], {
        duration: 1,
        stroke: "up",
      }),
      tabChord(10, [{ fret: 7, string: 5 }], {
        duration: 1,
        stroke: "down",
      }),
      tabChord(11, [{ fret: 8, string: 5 }], {
        duration: 1,
        stroke: "up",
      }),
      tabChord(12, [{ fret: 0, string: 6 }], {
        duration: 1,
        palmMuteDepth: "medium",
        stroke: "down",
      }),
      tabChord(13, [{ fret: 0, string: 6 }], {
        duration: 1,
        palmMuteDepth: "medium",
        stroke: "up",
      }),
      tabRest(14, 2),
      tabChord(16, [{ fret: 11, string: 5 }], {
        accent: true,
        duration: 4,
        stroke: "down",
      }),
      tabChord(20, [{ fret: 8, string: 5 }], {
        duration: 1,
        stroke: "down",
      }),
      tabChord(21, [{ fret: 11, string: 5 }], {
        duration: 1,
        stroke: "up",
      }),
      tabChord(22, [{ fret: 8, string: 5 }], {
        duration: 1,
        stroke: "down",
      }),
      tabChord(23, [{ fret: 11, string: 5 }], {
        accent: true,
        duration: 1,
        stroke: "up",
      }),
      tabChord(24, [{ fret: 7, string: 5 }], {
        duration: 1,
        stroke: "down",
      }),
      tabChord(25, [{ fret: 8, string: 5 }], {
        duration: 1,
        stroke: "up",
      }),
      tabChord(26, [{ fret: 11, string: 5 }], {
        accent: true,
        duration: 2,
        stroke: "down",
      }),
      tabChord(28, [{ fret: 11, string: 5 }], {
        duration: 1,
        stroke: "down",
      }),
      tabChord(29, [{ fret: 8, string: 5 }], {
        accent: true,
        duration: 3,
        stroke: "up",
      }),
    ],
    id: "metal-phrygian-gravity",
    markers: [
      { at: 0, label: "E / F tension" },
      { at: 14, label: "space" },
      { at: 16, label: "G♯ reveal" },
      { at: 20, label: "F / G♯" },
      { at: 29, label: "b2 → 1" },
    ],
    measureCount: 2,
    pitchScope: pitchSet("E Phrygian Dominant", E_PHRYGIAN_DOMINANT),
    repetitions: 6,
    subdivision: "sixteenths",
  }),
  "metal-phrygian-tension": authoredTab({
    accessibleDescription:
      "Repeat an E-to-F Phrygian Dominant pedal motif, vary it with G sharp, then break the pulse and resolve to E.",
    bpm: 92,
    events: [
      ...tabLine(
        6,
        [
          0,
          null,
          0,
          0,
          null,
          0,
          null,
          0,
          0,
          null,
          null,
          0,
          null,
          null,
          null,
          { fret: 0, duration: 1 },
        ],
        {
          palmMuteDepth: "light",
          strokePattern: "alternate-down",
        },
      ),
      ...tabLine(
        5,
        [null, 8, null, null, 8, null, 11, null, null, 8, null, null, 5],
        {
          accentSlots: [1, 4, 6, 9, 12],
          strokePattern: "alternate-down",
        },
      ),
      tabRest(10),
      tabRest(13, 2),
    ],
    id: "metal-phrygian-tension",
    markers: [
      { at: 0, label: "motif" },
      { at: 4, label: "repeat" },
      { at: 8, label: "variation" },
      { at: 12, label: "resolve" },
    ],
    pitchScope: pitchSet("E Phrygian Dominant colors", [4, 5, 8, 2]),
    repetitions: 8,
    subdivision: "sixteenths",
  }),
  "metal-tremolo-horizon": authoredTab({
    accessibleDescription:
      "Tremolo pick a four-note E minor motif, repeat its contour higher, then descend through a rest to E.",
    bpm: 80,
    events: [
      ...tabLine(
        2,
        [5, 5, 8, 8, 5, 5, null, null, null, null, null, null, 8, 8],
        {
          strokePattern: "alternate-down",
        },
      ),
      ...tabLine(
        1,
        [
          null,
          null,
          null,
          null,
          null,
          null,
          7,
          7,
          10,
          10,
          8,
          8,
          null,
          null,
          null,
          { fret: 12, duration: 1 },
        ],
        {
          accentSlots: [6, 15],
          strokePattern: "alternate-down",
        },
      ),
      tabRest(14),
    ],
    id: "metal-tremolo-horizon",
    markers: [
      { at: 0, label: "lower string" },
      { at: 6, label: "variation" },
      { at: 12, label: "descent" },
      { at: 15, label: "home" },
    ],
    pitchScope: pitchSet("E natural minor", E_MINOR),
    repetitions: 8,
    subdivision: "sixteenths",
  }),
  "metal-syncopated-stops": authoredTab({
    accessibleDescription:
      "Play muted low E attacks, dead-note stops, rests, and an offbeat G5 chord in a syncopated metal rhythm.",
    bpm: 86,
    events: [
      ...tabLine(6, [0, 0, "x", null, 0, null, "x", null], {
        palmMuteDepth: "medium",
        strokePattern: "down",
      }),
      tabRest(3),
      tabChord(
        5,
        [
          { fret: 3, string: 6 },
          { fret: 5, string: 5 },
        ],
        {
          accent: true,
          duration: 1,
          stroke: "down",
        },
      ),
      tabRest(7),
    ],
    id: "metal-syncopated-stops",
    pitchScope: pitchSet("E minor stop-start riff", E_MINOR),
    repetitions: 8,
    subdivision: "eighths",
  }),
  "funk-pocket-stabs": authoredTab({
    accessibleDescription:
      "Alternate muted sixteenth-note scratches, rests, and two syncopated A-minor chord stabs.",
    bpm: 92,
    events: [
      tabChord(
        0,
        [
          { fret: "x", string: 4 },
          { fret: "x", string: 3 },
          { fret: "x", string: 2 },
        ],
        { duration: 1, stroke: "down" },
      ),
      tabRest(1),
      tabChord(
        2,
        [
          { fret: 7, string: 4 },
          { fret: 5, string: 3 },
          { fret: 5, string: 2 },
        ],
        { accent: true, duration: 1, stroke: "up" },
      ),
      tabRest(3),
      tabChord(
        4,
        [
          { fret: "x", string: 4 },
          { fret: "x", string: 3 },
          { fret: "x", string: 2 },
        ],
        { duration: 1, stroke: "down" },
      ),
      tabChord(
        5,
        [
          { fret: "x", string: 4 },
          { fret: "x", string: 3 },
          { fret: "x", string: 2 },
        ],
        { duration: 1, stroke: "up" },
      ),
      tabRest(6, 2),
      tabChord(
        8,
        [
          { fret: 7, string: 4 },
          { fret: 5, string: 3 },
          { fret: 5, string: 2 },
        ],
        { accent: true, duration: 1, stroke: "down" },
      ),
      tabRest(9),
      tabChord(
        10,
        [
          { fret: "x", string: 4 },
          { fret: "x", string: 3 },
          { fret: "x", string: 2 },
        ],
        { duration: 1, stroke: "up" },
      ),
      tabRest(11),
      tabChord(
        12,
        [
          { fret: "x", string: 4 },
          { fret: "x", string: 3 },
          { fret: "x", string: 2 },
        ],
        { duration: 1, stroke: "down" },
      ),
      tabRest(13),
      tabChord(
        14,
        [
          { fret: 7, string: 4 },
          { fret: 5, string: 3 },
          { fret: 5, string: 2 },
        ],
        { accent: true, duration: 1, stroke: "up" },
      ),
      tabRest(15),
    ],
    id: "funk-pocket-stabs",
    pitchScope: pitchSet("A minor pocket", A_MINOR_TRIAD),
    repetitions: 8,
    subdivision: "sixteenths",
  }),
} as const satisfies Record<string, PracticeTabExample>;

export type PracticeTabExampleId = keyof typeof practiceTabExamples;

export const practiceTabExampleIds = Object.keys(
  practiceTabExamples,
) as PracticeTabExampleId[];

export const practiceTabPitchSets = {
  aMinorPentatonic: A_MINOR_PENTATONIC,
  aNaturalMinor: A_NATURAL_MINOR,
  cMajor: C_MAJOR,
  cMajorTriad: C_MAJOR_TRIAD,
};
