import type { ResolvedChord } from "@/features/progressions";
import { normalizePitchClass } from "@/helpers/musicTheory";
import type { PitchClass } from "@/helpers/typesHelpers";
import type {
  ChordToneRelationship,
  ChordTransitionAnalysis,
  PitchClassTarget,
} from "./types";

export const findCommonChordTones = (
  fromChord: ResolvedChord,
  toChord: ResolvedChord,
): readonly ChordToneRelationship[] =>
  fromChord.tones.flatMap((toneInFromChord) => {
    const toneInToChord = toChord.tones.find(
      (tone) => tone.pitchClass === toneInFromChord.pitchClass,
    );

    return toneInToChord
      ? [
          {
            pitchClass: toneInFromChord.pitchClass,
            toneInFromChord,
            toneInToChord,
          },
        ]
      : [];
  });

export const findNearestChordToneTargetsByPitchClass = (
  sourcePitchClass: PitchClass,
  destinationChord: ResolvedChord,
): readonly PitchClassTarget[] => {
  const targets = destinationChord.tones.map((targetTone) => {
    const ascendingDistanceSemitones = normalizePitchClass(
      targetTone.pitchClass - sourcePitchClass,
    );
    const descendingDistanceSemitones = normalizePitchClass(
      sourcePitchClass - targetTone.pitchClass,
    );

    return {
      ascendingDistanceSemitones,
      descendingDistanceSemitones,
      minimumDistanceSemitones: Math.min(
        ascendingDistanceSemitones,
        descendingDistanceSemitones,
      ),
      sourcePitchClass,
      targetTone,
    };
  });
  const nearestDistance = Math.min(
    ...targets.map(({ minimumDistanceSemitones }) => minimumDistanceSemitones),
  );

  return targets.filter(
    ({ minimumDistanceSemitones }) =>
      minimumDistanceSemitones === nearestDistance,
  );
};

export const analyzeChordTransition = (
  fromChord: ResolvedChord,
  toChord: ResolvedChord,
): ChordTransitionAnalysis => {
  const commonTones = findCommonChordTones(fromChord, toChord);
  const commonPitchClasses = new Set(
    commonTones.map(({ pitchClass }) => pitchClass),
  );
  const leavingTones = fromChord.tones.filter(
    ({ pitchClass }) => !commonPitchClasses.has(pitchClass),
  );
  const enteringTones = toChord.tones.filter(
    ({ pitchClass }) => !commonPitchClasses.has(pitchClass),
  );

  return {
    commonTones,
    enteringTones,
    fromChord,
    leavingTones,
    nearestPitchClassTargets: leavingTones.map((sourceTone) => ({
      sourceTone,
      targets: findNearestChordToneTargetsByPitchClass(
        sourceTone.pitchClass,
        toChord,
      ),
    })),
    toChord,
  };
};
