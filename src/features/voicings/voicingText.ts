import { formatPitchClass } from "@/helpers/musicTheory";
import type {
  PlayableVoicing,
  VoicingStringState,
  VoicingToneRole,
} from "./types";

const roleLabels: Record<VoicingToneRole, string> = {
  fifth: "Fifth",
  fourth: "Fourth",
  ninth: "Ninth",
  root: "Root",
  second: "Second",
  seventh: "Seventh",
  sixth: "Sixth",
  third: "Third",
};

const describeString = (state: VoicingStringState): string => {
  const stringNumber = state.stringIndex + 1;

  if (state.kind === "muted") {
    return `string ${stringNumber} muted`;
  }

  if (state.kind === "open") {
    return `string ${stringNumber} open ${state.noteName}`;
  }

  return `string ${stringNumber} fret ${state.fret} ${state.noteName}`;
};

export const getVoicingPositionLabel = (voicing: PlayableVoicing): string => {
  if (voicing.bass) {
    return `${roleLabels[voicing.bass.role]} in bass`;
  }

  if (voicing.authoredBassPitchClass !== undefined) {
    return "Authored bass on lowest physical string";
  }

  return "Pitch-class position";
};

export const describeVoicing = (
  voicing: PlayableVoicing,
  tuningLabel: string,
): string => {
  const omissions =
    voicing.omissions.length > 0
      ? ` Omitted tones: ${voicing.omissions.join(", ")}.`
      : " Every authored chord tone is included.";
  const bass = voicing.bass
    ? ` Bass ${voicing.bass.noteName} (${formatPitchClass(
        voicing.bass.pitchClass,
      )}), ${getVoicingPositionLabel(voicing).toLowerCase()}.`
    : voicing.authoredBassPitchClass !== undefined
      ? ` The authored ${formatPitchClass(
          voicing.authoredBassPitchClass,
        )} bass is placed on the lowest physical string used; its octave is not registered.`
      : " Exact bass register is unavailable for this pitch-class-only tuning.";

  return `${voicing.chordName}, ${voicing.stringCount} strings in ${tuningLabel}. ${voicing.strings
    .map(describeString)
    .join("; ")}.${bass}${omissions}`;
};
