import {
  analyzeChordTransition,
  analyzeNoteInContext,
  getScaleColorDegrees,
} from "@/features/musical-context";
import type {
  ResolvedProgression,
  TonalContext,
} from "@/features/progressions";
import {
  chromaticPitchClasses,
  normalizePitchClass,
} from "@/helpers/musicTheory";
import type { PitchClass } from "@/helpers/typesHelpers";
import type {
  ImprovisationApproach,
  ImprovisationGuidance,
  ImprovisationObjective,
  ImprovisationObjectiveAvailability,
} from "./types";

const compareApproaches = (
  first: ImprovisationApproach,
  second: ImprovisationApproach,
): number =>
  Number(second.sourceInScale) - Number(first.sourceInScale) ||
  first.distanceSemitones - second.distanceSemitones ||
  first.targetTone.pitchClass - second.targetTone.pitchClass ||
  first.sourcePitchClass - second.sourcePitchClass ||
  first.direction.localeCompare(second.direction);

const getApproaches = (
  sourcePitchClass: PitchClass,
  context: TonalContext,
  destinationTones: ImprovisationGuidance["activeStep"]["chord"]["tones"],
  commonPitchClasses: ReadonlySet<PitchClass>,
): readonly ImprovisationApproach[] => {
  if (commonPitchClasses.has(sourcePitchClass)) {
    return [];
  }

  const sourceInScale = analyzeNoteInContext(context, sourcePitchClass).scale
    .inScale;

  return destinationTones
    .flatMap((targetTone) => {
      if (targetTone.pitchClass === sourcePitchClass) {
        return [];
      }

      const ascending = normalizePitchClass(
        targetTone.pitchClass - sourcePitchClass,
      );
      const descending = normalizePitchClass(
        sourcePitchClass - targetTone.pitchClass,
      );
      const approaches: ImprovisationApproach[] = [];

      if (ascending === 1 || ascending === 2) {
        approaches.push({
          direction: "ascending",
          distanceSemitones: ascending,
          sourceInScale,
          sourcePitchClass,
          targetTone,
        });
      }

      if (descending === 1 || descending === 2) {
        approaches.push({
          direction: "descending",
          distanceSemitones: descending,
          sourceInScale,
          sourcePitchClass,
          targetTone,
        });
      }

      return approaches;
    })
    .sort(compareApproaches);
};

export const buildImprovisationGuidance = (
  progression: ResolvedProgression,
  activeStepIndex: number,
): ImprovisationGuidance => {
  if (
    !Number.isInteger(activeStepIndex) ||
    activeStepIndex < 0 ||
    activeStepIndex >= progression.steps.length
  ) {
    throw new Error(`Invalid improvisation step index: ${activeStepIndex}`);
  }

  const activeStep = progression.steps[activeStepIndex];
  const isFinalStep = activeStepIndex === progression.steps.length - 1;
  const isLoopClosure = isFinalStep && progression.template.form === "loop";
  const nextStep = isLoopClosure
    ? progression.steps[0]
    : progression.steps[activeStepIndex + 1];
  const transition = nextStep
    ? analyzeChordTransition(activeStep.chord, nextStep.chord)
    : undefined;
  const commonPitchClasses = new Set(
    transition?.commonTones.map(({ pitchClass }) => pitchClass) ?? [],
  );
  const enteringPitchClasses = new Set(
    transition?.enteringTones.map(({ pitchClass }) => pitchClass) ?? [],
  );
  const leavingPitchClasses = new Set(
    transition?.leavingTones.map(({ pitchClass }) => pitchClass) ?? [],
  );
  const context: TonalContext = {
    currentKey: progression.tonic,
    currentScale: progression.selectedScale,
  };
  const scaleColorDegreeLabels = new Set(
    getScaleColorDegrees(context.currentScale).map(
      ({ degreeLabel }) => degreeLabel,
    ),
  );
  const allApproaches: ImprovisationApproach[] = [];
  const pitchContexts = new Map(
    chromaticPitchClasses.map((pitchClass) => {
      const approaches = nextStep
        ? getApproaches(
            pitchClass,
            context,
            nextStep.chord.tones,
            commonPitchClasses,
          )
        : [];
      allApproaches.push(...approaches);

      const noteContext = analyzeNoteInContext(
        context,
        pitchClass,
        activeStep.chord,
      );

      return [
        pitchClass,
        {
          ...noteContext,
          approaches,
          isCommonTone: commonPitchClasses.has(pitchClass),
          isEnteringTone: enteringPitchClasses.has(pitchClass),
          isLeavingTone: leavingPitchClasses.has(pitchClass),
          isScaleColorDegree: Boolean(
            noteContext.scale.tone &&
              scaleColorDegreeLabels.has(noteContext.scale.tone.degreeLabel),
          ),
          nextChordTone: nextStep?.chord.tones.find(
            (tone) => tone.pitchClass === pitchClass,
          ),
        },
      ] as const;
    }),
  );

  return {
    activeStep,
    activeStepIndex,
    activeThird: activeStep.chord.tones.find(({ role }) => role === "third"),
    isLoopClosure,
    nextStep,
    pitchContexts,
    suggestedApproaches: allApproaches.sort(compareApproaches).slice(0, 3),
    transition,
  };
};

export const getImprovisationObjectiveAvailability = (
  guidance: ImprovisationGuidance,
  objective: ImprovisationObjective,
): ImprovisationObjectiveAvailability =>
  objective === "target-third" && !guidance.activeThird
    ? { available: false, reason: "missing-third" }
    : { available: true };
