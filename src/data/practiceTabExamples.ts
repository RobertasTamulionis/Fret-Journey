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
  "daily-mechanics": authoredTab({
    accessibleDescription:
      "Alternate pick C, D, E on the G string, cross to E, F, G on the B string, then reverse the B-string fragment.",
    bpm: 72,
    events: [
      ...tabLine(3, [5, 7, 9], { strokePattern: "alternate-down" }),
      ...tabLine(2, [null, null, null, 5, 6, 8, 6, 5], {
        strokePattern: "alternate-down",
      }),
    ],
    id: "daily-mechanics",
    pitchScope: pitchSet("A natural minor · hand sync", A_NATURAL_MINOR),
    repetitions: 8,
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
      "Play an E minor riff using low E open notes, low E fret 3, A string fret 2, D string fret 2, and a rest on beat two.",
    bpm: 76,
    events: [
      ...tabLine(6, [0, 0, 3, null, null, null, 3, 0], {
        accentSlots: [2, 6],
        palmMuteDepth: "light",
        strokePattern: "down",
      }),
      ...tabLine(5, [null, null, null, null, 2]),
      ...tabLine(4, [null, null, null, null, null, 2]),
      tabRest(3),
    ],
    id: "daily-play",
    pitchScope: pitchSet("E minor riff", E_MINOR),
    repetitions: 8,
    subdivision: "eighths",
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
      "Ascend from B-string fret 5 across the high E string to fret 12, then descend to G-string fret 7 in A natural minor.",
    bpm: 72,
    events: [
      ...tabLine(2, [
        5,
        6,
        8,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        8,
        6,
        5,
      ]),
      ...tabLine(1, [null, null, null, 5, 7, 8, 10, 12, 10, 8, 7, 5]),
      ...tabLine(3, [
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        7,
      ]),
    ].map((event, index) => ({
      ...event,
      stroke: index % 2 === 0 ? "down" : "up",
    })),
    id: "scales-connect",
    markers: [
      { at: 0, label: "position 5" },
      { at: 6, label: "shift" },
    ],
    pitchScope: pitchSet(
      "A natural minor · connected positions",
      A_NATURAL_MINOR,
    ),
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
      "Outline an A minor triad across non-adjacent strings using low E fret 5, D fret 10, B fret 5, then D fret 10.",
    bpm: 58,
    events: [
      ...tabLine(6, [5, null, null, null, 5]),
      ...tabLine(4, [null, 10, null, 10, null, 10]),
      ...tabLine(2, [null, null, 5, null, null, null, 5]),
      ...tabLine(1, [null, null, null, null, null, null, null, 5]),
    ].map((event) => ({ ...event, stroke: "down" as const })),
    id: "skipping-arpeggio",
    pitchScope: pitchSet("A minor triad", A_MINOR_TRIAD),
    repetitions: 6,
    subdivision: "eighths",
  }),
  "skipping-phrase": authoredTab({
    accessibleDescription:
      "Play A on low E, A on D, G on B, rest, then C on G, A on high E, E on B, and rest.",
    bpm: 64,
    events: [
      ...tabLine(6, [5]),
      ...tabLine(4, [null, 7]),
      ...tabLine(2, [null, null, 8, null, null, null, 5]),
      ...tabLine(3, [null, null, null, null, 5]),
      ...tabLine(1, [null, null, null, null, null, 5]),
      tabRest(3),
      tabRest(7),
    ],
    id: "skipping-phrase",
    markers: [
      { at: 0, label: "question" },
      { at: 4, label: "answer" },
    ],
    pitchScope: pitchSet("A minor pentatonic phrase", A_MINOR_PENTATONIC),
    repetitions: 4,
    subdivision: "eighths",
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
  "chugs-grid": authoredTab({
    accessibleDescription:
      "Downpick eight palm-muted low E notes and accent beats one and three without changing the pulse.",
    bpm: 82,
    events: [
      ...tabLine(6, [0, 0, 0, 0, 0, 0, 0, 0], {
        accentSlots: [0, 4],
        palmMuteDepth: "medium",
        strokePattern: "down",
      }),
    ],
    id: "chugs-grid",
    pitchScope: pitchSet("Low E pedal · accents", E_PEDAL),
    repetitions: 8,
    subdivision: "eighths",
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
  "chugs-riff": authoredTab({
    accessibleDescription:
      "Chug three low E pedal notes, rest, strike a G5 power chord, return to low E, strike A5, then rest.",
    bpm: 86,
    events: [
      ...tabLine(6, [0, 0, 0], {
        palmMuteDepth: "medium",
        strokePattern: "down",
      }),
      tabRest(3),
      tabChord(
        4,
        [
          { fret: 3, string: 6 },
          { fret: 5, string: 5 },
        ],
        { accent: true, duration: 1, stroke: "down" },
      ),
      tabChord(5, [{ fret: 0, string: 6 }], {
        duration: 1,
        palmMuteDepth: "medium",
        stroke: "down",
      }),
      tabChord(
        6,
        [
          { fret: 5, string: 6 },
          { fret: 7, string: 5 },
        ],
        { accent: true, duration: 1, stroke: "down" },
      ),
      tabRest(7),
    ],
    id: "chugs-riff",
    markers: [
      { at: 0, label: "pedal" },
      { at: 4, label: "G5" },
      { at: 6, label: "A5" },
    ],
    pitchScope: pitchSet("E minor chug riff", E_MINOR),
    repetitions: 8,
    subdivision: "eighths",
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
      tabRest(12, 4),
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
      "Strict alternate pick A, C, G, E, rest, D, E, and hold A as a short A minor pentatonic phrase.",
    bpm: 74,
    events: [
      ...tabLine(
        1,
        [5, 8, null, null, null, null, null, { fret: 5, duration: 1 }],
        {
          accentSlots: [1],
          strokePattern: "alternate-down",
        },
      ),
      ...tabLine(2, [null, null, 8, 5, null, null, 5], {
        strokePattern: "alternate-down",
      }),
      ...tabLine(3, [null, null, null, null, null, 7], {
        strokePattern: "alternate-down",
      }),
      tabRest(4),
    ],
    id: "alternate-phrase",
    pitchScope: pitchSet("A minor pentatonic phrase", A_MINOR_PENTATONIC),
    repetitions: 6,
    subdivision: "eighths",
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
      "Play E hammering to G, cross to A and hammer to C, rest, then pull C to A and finish with E to A.",
    bpm: 62,
    events: [
      ...tabLine(2, [
        { fret: 5, stroke: "down" },
        { articulation: "hammer", fret: 8 },
        null,
        null,
        null,
        null,
        5,
      ]),
      ...tabLine(1, [
        null,
        null,
        { fret: 5, stroke: "down" },
        { articulation: "hammer", fret: 8 },
        null,
        { articulation: "pull", fret: 5 },
        null,
        { articulation: "vibrato", fret: 5 },
      ]),
      tabRest(4),
    ],
    id: "legato-phrase",
    pitchScope: pitchSet("A minor pentatonic phrase", A_MINOR_PENTATONIC),
    repetitions: 4,
    subdivision: "eighths",
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
      "Sweep G fret 14, B fret 13, high E fret 12, hammer to 17 and pull to 12, then return through B 13 and G 14.",
    bpm: 52,
    events: [
      ...tabLine(3, [14, null, null, null, null, null, 14]),
      ...tabLine(2, [null, 13, null, null, null, 13]),
      ...tabLine(1, [
        null,
        null,
        12,
        { articulation: "hammer", fret: 17 },
        { articulation: "pull", fret: 12 },
      ]),
      tabRest(7),
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
    pitchScope: pitchSet("A minor triad turnaround", A_MINOR_TRIAD),
    repetitions: 8,
    subdivision: "eighths",
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
      "Bend B-string fret 8 to the pitch of fret 10, hold for two beats, release to fret 8, then rest.",
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
      "Hold A at B-string fret 10 with narrow vibrato for two beats, then repeat with wider vibrato for two beats.",
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
      { at: 0, label: "narrow" },
      { at: 2, label: "wide" },
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
