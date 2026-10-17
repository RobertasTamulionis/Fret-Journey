export type MultisampleRegion = {
  maximumDuration?: number;
  rootMidi: number;
  sourceOffset?: number;
  url: string;
};

export type MultisampleManifest = {
  id: string;
  maximumMidi: number;
  minimumMidi: number;
  regions: readonly MultisampleRegion[];
};

const shinyguitarRoots = [
  [37, "db2"],
  [40, "e2"],
  [42, "gb2"],
  [45, "a2"],
  [48, "c3"],
  [51, "eb3"],
  [54, "gb3"],
  [57, "a3"],
  [60, "c4"],
  [63, "eb4"],
  [66, "gb4"],
  [69, "a4"],
  [72, "c5"],
  [75, "eb5"],
  [78, "gb5"],
  [81, "a5"],
  [84, "c6"],
] as const;

export const cleanElectricManifest: MultisampleManifest = {
  id: "clean-electric-v1",
  maximumMidi: 91,
  minimumMidi: 28,
  regions: [
    {
      maximumDuration: 1.18,
      rootMidi: 28,
      sourceOffset: 0,
      url: "/audio/clean-electric/low-eight-string/e1.mp3",
    },
    ...shinyguitarRoots.map(([rootMidi, name]) => ({
      rootMidi,
      url: `/audio/clean-electric/shinyguitar/${name}.wav`,
    })),
  ],
};

export const cleanElectricAssetSources = {
  lowEightString: {
    author: "minus_28_and_falling",
    license: "CC0-1.0",
    source: "https://freesound.org/people/minus_28_and_falling/sounds/557299/",
    sourceFormat: "16-bit mono WAV, 44.1 kHz",
    sourceNote: "Clean Drop-E 8-string guitar open E1, MIDI 28",
  },
  shinyguitar: {
    author: "D. Smolken / Karoryfer Samples",
    license: "CC0-1.0",
    source: "https://github.com/sfzinstruments/karoryfer.shinyguitar",
    version: "1.002",
  },
} as const;
