import {
  getPracticeTabBeatSize,
  type PracticeTabSubdivision,
  practiceTabSlotCount,
} from "./tablature";

export const practiceBeatsPerMeasure = 4;

export type PracticeTimelineAnchor = {
  audioTime: number;
  exerciseBeat: number;
  tempo: number;
};

export type PracticeMetronomePulse = {
  accented: boolean;
  beat: number;
  kind: "beat" | "subdivision";
  subdivisionIndex: number;
};

type PlanPracticeMetronomePulsesOptions = {
  beatsPerMeasure?: number;
  fromBeat: number;
  subdivision: PracticeTabSubdivision;
  toBeat: number;
};

const schedulingEpsilon = 1e-9;

const positiveModulo = (value: number, divisor: number): number =>
  ((value % divisor) + divisor) % divisor;

export const clampPracticeTempo = (tempo: number): number =>
  Math.min(240, Math.max(30, tempo));

export const getPracticeSecondsPerBeat = (tempo: number): number =>
  60 / clampPracticeTempo(tempo);

export const getPracticeSlotsPerBeat = (
  subdivision: PracticeTabSubdivision,
): number => getPracticeTabBeatSize(subdivision);

export const getPracticeSecondsPerSlot = (
  tempo: number,
  subdivision: PracticeTabSubdivision,
): number =>
  getPracticeSecondsPerBeat(tempo) / getPracticeSlotsPerBeat(subdivision);

export const getPracticeSlotDurationMs = (
  tempo: number,
  subdivision: PracticeTabSubdivision,
): number => getPracticeSecondsPerSlot(tempo, subdivision) * 1_000;

export const getPracticeExerciseBeatAtAudioTime = (
  anchor: PracticeTimelineAnchor,
  audioTime: number,
): number =>
  anchor.exerciseBeat +
  (audioTime - anchor.audioTime) / getPracticeSecondsPerBeat(anchor.tempo);

export const getPracticeAudioTimeAtExerciseBeat = (
  anchor: PracticeTimelineAnchor,
  exerciseBeat: number,
): number =>
  anchor.audioTime +
  (exerciseBeat - anchor.exerciseBeat) *
    getPracticeSecondsPerBeat(anchor.tempo);

export const getPracticeActiveSlotAtBeat = (
  exerciseBeat: number,
  authoredSubdivision: PracticeTabSubdivision,
): number => {
  const slotsPerBeat = getPracticeSlotsPerBeat(authoredSubdivision);
  const slotCount = practiceTabSlotCount[authoredSubdivision];
  const measureBeat = positiveModulo(exerciseBeat, practiceBeatsPerMeasure);

  return Math.min(
    slotCount - 1,
    Math.floor(measureBeat * slotsPerBeat + schedulingEpsilon),
  );
};

export const getPracticeSlotStartBeat = (
  exerciseBeat: number,
  authoredSubdivision: PracticeTabSubdivision,
): number => {
  const slotsPerBeat = getPracticeSlotsPerBeat(authoredSubdivision);

  return (
    Math.floor(exerciseBeat * slotsPerBeat + schedulingEpsilon) / slotsPerBeat
  );
};

export const planPracticeMetronomePulses = ({
  beatsPerMeasure = practiceBeatsPerMeasure,
  fromBeat,
  subdivision,
  toBeat,
}: PlanPracticeMetronomePulsesOptions): PracticeMetronomePulse[] => {
  if (toBeat <= fromBeat || beatsPerMeasure <= 0) {
    return [];
  }

  const pulsesPerBeat = getPracticeSlotsPerBeat(subdivision);
  const firstPulse = Math.ceil(fromBeat * pulsesPerBeat - schedulingEpsilon);
  const finalPulse = Math.ceil(toBeat * pulsesPerBeat - schedulingEpsilon);
  const pulses: PracticeMetronomePulse[] = [];

  for (let pulse = firstPulse; pulse < finalPulse; pulse += 1) {
    const beat = pulse === 0 ? 0 : pulse / pulsesPerBeat;
    const subdivisionIndex = positiveModulo(pulse, pulsesPerBeat);
    const measureBeat = positiveModulo(Math.floor(beat), beatsPerMeasure);

    pulses.push({
      accented: subdivisionIndex === 0 && measureBeat === 0,
      beat,
      kind: subdivisionIndex === 0 ? "beat" : "subdivision",
      subdivisionIndex,
    });
  }

  return pulses;
};
