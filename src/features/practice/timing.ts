import {
  getPracticeScoreSlotCount,
  getPracticeSequenceEvents,
  getPracticeTabBeatSize,
  type PracticeTabExample,
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

export const getPracticeScoreLengthBeats = (
  example: Pick<PracticeTabExample, "measureCount" | "subdivision">,
): number =>
  getPracticeScoreSlotCount(example) /
  getPracticeSubdivisionUnitsPerBeat(example.subdivision);

export const getPracticeAuthoredSlotAtBeat = (
  exerciseBeat: number,
  example: Pick<PracticeTabExample, "measureCount" | "subdivision">,
): number => {
  const eventsPerBeat = getPracticeSubdivisionUnitsPerBeat(example.subdivision);
  const scoreSlotCount = getPracticeScoreSlotCount(example);

  return positiveModulo(
    Math.floor(exerciseBeat * eventsPerBeat + schedulingEpsilon),
    scoreSlotCount,
  );
};

/**
 * Resolve Follow Along from the authored score grid. `at` is the zero-based
 * start slot and `duration` is the number of authored slots for which the
 * event remains current. Uncovered slots are silence and return `null`;
 * authors should use explicit rest events when that silence is instructional.
 * A later authored start supersedes an earlier event whose duration overlaps.
 */
export const getPracticeActiveEventIndexAtBeat = (
  exerciseBeat: number,
  example: Pick<PracticeTabExample, "events" | "measureCount" | "subdivision">,
): number | null => {
  const authoredSlot = getPracticeAuthoredSlotAtBeat(exerciseBeat, example);
  const sequenceEvents = getPracticeSequenceEvents(example);
  const eventIndex = sequenceEvents.findLastIndex(
    (event) =>
      event.at <= authoredSlot && authoredSlot < event.at + event.duration,
  );

  return eventIndex === -1 ? null : eventIndex;
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
