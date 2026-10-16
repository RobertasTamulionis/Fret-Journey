import type {
  GuitarStringCount,
  PitchClass,
  RegisteredTuningId,
  RegisteredTuningState,
} from "@/helpers/typesHelpers";

export type RegisteredTuningPreset = {
  readonly id: RegisteredTuningId;
  readonly label: string;
  readonly midiPitchesHighToLow: readonly number[];
  readonly notesLowToHigh: readonly string[];
  readonly source: "preset-default" | "preset-alternate";
  readonly stringCount: GuitarStringCount;
};

export const registeredTuningPresets = [
  {
    id: "6-standard-e",
    label: "E Standard",
    midiPitchesHighToLow: [64, 59, 55, 50, 45, 40],
    notesLowToHigh: ["E2", "A2", "D3", "G3", "B3", "E4"],
    source: "preset-default",
    stringCount: 6,
  },
  {
    id: "6-standard-eb",
    label: "E♭ Standard",
    midiPitchesHighToLow: [63, 58, 54, 49, 44, 39],
    notesLowToHigh: ["E♭2", "A♭2", "D♭3", "G♭3", "B♭3", "E♭4"],
    source: "preset-alternate",
    stringCount: 6,
  },
  {
    id: "6-standard-d",
    label: "D Standard",
    midiPitchesHighToLow: [62, 57, 53, 48, 43, 38],
    notesLowToHigh: ["D2", "G2", "C3", "F3", "A3", "D4"],
    source: "preset-alternate",
    stringCount: 6,
  },
  {
    id: "6-drop-d",
    label: "Drop D",
    midiPitchesHighToLow: [64, 59, 55, 50, 45, 38],
    notesLowToHigh: ["D2", "A2", "D3", "G3", "B3", "E4"],
    source: "preset-alternate",
    stringCount: 6,
  },
  {
    id: "6-drop-c",
    label: "Drop C",
    midiPitchesHighToLow: [62, 57, 53, 48, 43, 36],
    notesLowToHigh: ["C2", "G2", "C3", "F3", "A3", "D4"],
    source: "preset-alternate",
    stringCount: 6,
  },
  {
    id: "7-standard-b",
    label: "B Standard",
    midiPitchesHighToLow: [64, 59, 55, 50, 45, 40, 35],
    notesLowToHigh: ["B1", "E2", "A2", "D3", "G3", "B3", "E4"],
    source: "preset-default",
    stringCount: 7,
  },
  {
    id: "7-drop-a",
    label: "Drop A",
    midiPitchesHighToLow: [64, 59, 55, 50, 45, 40, 33],
    notesLowToHigh: ["A1", "E2", "A2", "D3", "G3", "B3", "E4"],
    source: "preset-alternate",
    stringCount: 7,
  },
  {
    id: "8-standard-f-sharp",
    label: "F♯ Standard",
    midiPitchesHighToLow: [64, 59, 55, 50, 45, 40, 35, 30],
    notesLowToHigh: ["F♯1", "B1", "E2", "A2", "D3", "G3", "B3", "E4"],
    source: "preset-default",
    stringCount: 8,
  },
  {
    id: "8-drop-e",
    label: "Drop E",
    midiPitchesHighToLow: [64, 59, 55, 50, 45, 40, 35, 28],
    notesLowToHigh: ["E1", "B1", "E2", "A2", "D3", "G3", "B3", "E4"],
    source: "preset-alternate",
    stringCount: 8,
  },
] as const satisfies readonly RegisteredTuningPreset[];

export const defaultRegisteredTuningIds: Readonly<
  Record<GuitarStringCount, RegisteredTuningId>
> = {
  6: "6-standard-e",
  7: "7-standard-b",
  8: "8-standard-f-sharp",
};

export const getRegisteredTuningPreset = (
  id: RegisteredTuningId,
): RegisteredTuningPreset => {
  const preset = registeredTuningPresets.find(
    (candidate) => candidate.id === id,
  );

  if (!preset) {
    throw new Error(`Unknown registered tuning preset: ${id}`);
  }

  return preset;
};

export const getRegisteredTuningPresetsForStringCount = (
  stringCount: GuitarStringCount,
): readonly RegisteredTuningPreset[] =>
  registeredTuningPresets.filter(
    (preset) => preset.stringCount === stringCount,
  );

export const getTuningPitchClasses = (
  preset: RegisteredTuningPreset,
): PitchClass[] =>
  preset.midiPitchesHighToLow.map(
    (midi) => (((midi % 12) + 12) % 12) as PitchClass,
  );

export const buildRegisteredTuningState = (
  preset: RegisteredTuningPreset,
): RegisteredTuningState => ({
  id: preset.id,
  midiPitches: [...preset.midiPitchesHighToLow],
  source: preset.source,
  status: "verified",
  version: 1,
});

export const getRegisteredFretMidi = (openMidi: number, fret: number): number =>
  openMidi + fret;
