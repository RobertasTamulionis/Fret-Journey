import type { MultisampleManifest } from "./cleanElectricManifest";

const acousticRoots = [
  [40, "e2"],
  [44, "gs2"],
  [48, "c3"],
  [52, "e3"],
  [56, "gs3"],
  [60, "c4"],
  [64, "e4"],
  [68, "gs4"],
  [72, "c5"],
  [76, "e5"],
  [80, "gs5"],
  [84, "c6"],
] as const;

export const acousticGuitarManifest: MultisampleManifest = {
  id: "acoustic-guitar-v1",
  maximumMidi: 88,
  minimumMidi: 28,
  regions: acousticRoots.map(([rootMidi, name]) => ({
    rootMidi,
    url: `/audio/acoustic/meta-steel/${name}.ogg`,
  })),
};

export const acousticGuitarAssetSource = {
  author: "Meta Creative Audio",
  license: "CC0-1.0",
  nativeMaximumMidi: 84,
  nativeMinimumMidi: 40,
  source: "https://github.com/facebookincubator/Meta-open-sound",
  sourceFormat: "24-bit mono WAV, 48 kHz; bundled browser OGG derivatives",
  version: "meta-steel-guitar-v1.0.0",
} as const;
