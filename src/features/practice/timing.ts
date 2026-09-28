import {
  getPracticeTabBeatSize,
  type PracticeTabSubdivision,
} from "./tablature";

export const practiceBeatsPerMeasure = 4;
export const practiceTempoMaximum = 240;
export const practiceTempoMinimum = 30;

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
  Math.min(practiceTempoMaximum, Math.max(practiceTempoMinimum, tempo));

export const getPracticeSecondsPerBeat = (tempo: number): number =>
  60 / clampPracticeTempo(tempo);

export const getPracticeSubdivisionUnitsPerBeat = (
  subdivision: PracticeTabSubdivision,
): number => getPracticeTabBeatSize(subdivision);

export const getPracticeSecondsPerEvent = (
  tempo: number,
  subdivision: PracticeTabSubdivision,
): number =>
  getPracticeSecondsPerBeat(tempo) /
  getPracticeSubdivisionUnitsPerBeat(subdivision);

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

export const getPracticeActiveEventIndexAtBeat = (
  exerciseBeat: number,
  subdivision: PracticeTabSubdivision,
  eventCount: number,
): number => {
  const eventsPerBeat = getPracticeSubdivisionUnitsPerBeat(subdivision);
  const boundedEventCount = Math.max(1, Math.floor(eventCount));

  return positiveModulo(
    Math.floor(exerciseBeat * eventsPerBeat + schedulingEpsilon),
    boundedEventCount,
  );
};

export const getPracticeEventStartBeat = (
  exerciseBeat: number,
  subdivision: PracticeTabSubdivision,
): number => {
  const eventsPerBeat = getPracticeSubdivisionUnitsPerBeat(subdivision);

  return (
    Math.floor(exerciseBeat * eventsPerBeat + schedulingEpsilon) / eventsPerBeat
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

  const pulsesPerBeat = getPracticeSubdivisionUnitsPerBeat(subdivision);
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
