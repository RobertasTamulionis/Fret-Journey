import type { ResolvedProgression } from "@/features/progressions";
import { getScaleTones } from "@/helpers/musicTheory";
import { analyzeChordTransition } from "./chordTransitions";
import { analyzeNoteInContext } from "./noteAnalysis";
import type { ProgressionContextAnalysis } from "./types";

export const analyzeProgressionContext = (
  progression: ResolvedProgression,
): ProgressionContextAnalysis => {
  const context = {
    currentKey: progression.tonic,
    currentScale: progression.selectedScale,
  };

  return {
    scaleTones: getScaleTones(context.currentKey, context.currentScale),
    steps: progression.steps.map((step, stepIndex, steps) => ({
      chordToneContexts: step.chord.tones.map((tone) =>
        analyzeNoteInContext(context, tone.pitchClass, step.chord),
      ),
      nextTransition: steps[stepIndex + 1]
        ? analyzeChordTransition(step.chord, steps[stepIndex + 1].chord)
        : undefined,
      previousTransition: steps[stepIndex - 1]
        ? analyzeChordTransition(steps[stepIndex - 1].chord, step.chord)
        : undefined,
      step,
      stepIndex,
    })),
  };
};
