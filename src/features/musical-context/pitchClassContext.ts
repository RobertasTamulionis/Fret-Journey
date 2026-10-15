import type { TonalContext } from "@/features/progressions";
import { chromaticPitchClasses } from "@/helpers/musicTheory";
import { analyzeNoteInContext, getScaleColorDegrees } from "./noteAnalysis";
import type {
  ContextChord,
  PitchClassContext,
  PitchClassContextMap,
} from "./types";

export const buildPitchClassContextMap = (
  context: TonalContext,
  chord: ContextChord,
): PitchClassContextMap => {
  const scaleColorDegreeLabels = new Set(
    getScaleColorDegrees(context.currentScale).map(
      ({ degreeLabel }) => degreeLabel,
    ),
  );

  return new Map(
    chromaticPitchClasses.map((pitchClass) => {
      const analysis = analyzeNoteInContext(context, pitchClass, chord);
      const entry: PitchClassContext = {
        ...analysis,
        isScaleColorDegree: Boolean(
          analysis.scale.tone &&
            scaleColorDegreeLabels.has(analysis.scale.tone.degreeLabel),
        ),
      };

      return [pitchClass, entry] as const;
    }),
  );
};
