import type { ResolvedChord } from "@/features/progressions";
import { formatNoteName, type ScaleChord } from "@/helpers/musicTheory";
import type {
  GuitarStringCount,
  PitchClass,
  RegisteredTuningState,
} from "@/helpers/typesHelpers";
import type { ChordVoicingRequest } from "./types";

type TuningContext = {
  registeredTuning: RegisteredTuningState;
  stringCount: GuitarStringCount;
  tuning: readonly PitchClass[];
};

const getRegisteredOpenMidi = (
  registeredTuning: RegisteredTuningState,
): readonly number[] | null =>
  registeredTuning.status === "verified" ? registeredTuning.midiPitches : null;

export const buildResolvedChordVoicingRequest = (
  chord: ResolvedChord,
  context: TuningContext,
): ChordVoicingRequest => ({
  ...(chord.bass ? { bassPitchClass: chord.bass.pitchClass } : {}),
  chordName: chord.name,
  registeredOpenMidi: getRegisteredOpenMidi(context.registeredTuning),
  rootPitchClass: chord.root.pitchClass,
  stringCount: context.stringCount,
  tones: chord.tones.map(({ name, pitchClass, required, role }) => ({
    name,
    pitchClass,
    required,
    role,
  })),
  tuning: context.tuning,
});

export const buildScaleChordVoicingRequest = (
  chord: ScaleChord,
  context: TuningContext,
): ChordVoicingRequest => ({
  chordName: `${formatNoteName(chord.root.name)} ${chord.label}`,
  registeredOpenMidi: getRegisteredOpenMidi(context.registeredTuning),
  rootPitchClass: chord.root.pitchClass,
  stringCount: context.stringCount,
  tones: chord.notes.map(({ name, pitchClass, role }) => ({
    name,
    pitchClass,
    required: true,
    role,
  })),
  tuning: context.tuning,
});
