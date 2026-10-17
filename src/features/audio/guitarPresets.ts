import { acousticGuitarManifest } from "./acousticGuitarManifest";
import { cleanElectricManifest } from "./cleanElectricManifest";
import type { GuitarPresetId } from "./types";

export type GuitarPresetDefinition = {
  id: GuitarPresetId;
  label: string;
  manifest: typeof cleanElectricManifest;
  processing: "acoustic" | "clean" | "high-gain";
};

export const guitarPresets = {
  "acoustic-guitar": {
    id: "acoustic-guitar",
    label: "Acoustic Guitar",
    manifest: acousticGuitarManifest,
    processing: "acoustic",
  },
  "clean-electric": {
    id: "clean-electric",
    label: "Clean Electric",
    manifest: cleanElectricManifest,
    processing: "clean",
  },
  "high-gain-electric": {
    id: "high-gain-electric",
    label: "High-Gain Electric",
    manifest: cleanElectricManifest,
    processing: "high-gain",
  },
} as const satisfies Record<GuitarPresetId, GuitarPresetDefinition>;
