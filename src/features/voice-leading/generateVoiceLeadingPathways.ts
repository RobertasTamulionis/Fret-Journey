import { formatChordIntervalName } from "@/features/musical-context";
import {
  getResolvedChordToneIntervalLabel,
  type ResolvedProgressionStep,
} from "@/features/progressions";
import { normalizePitchClass } from "@/helpers/musicTheory";
import type {
  VoiceLeadingCandidate,
  VoiceLeadingPathway,
  VoiceLeadingPathwaysResult,
  VoiceLeadingPolicy,
  VoiceLeadingRequest,
} from "./types";

type PathCost = readonly [
  maximumLeap: number,
  totalMovement: number,
  largePositionShifts: number,
  fretMovement: number,
  stringMovement: number,
  startRegisterDistance: number,
];

type PathState = {
  readonly cost: PathCost;
  readonly path: readonly VoiceLeadingCandidate[];
};

const compareCandidates = (
  first: VoiceLeadingCandidate,
  second: VoiceLeadingCandidate,
): number =>
  first.midi - second.midi ||
  first.stringIndex - second.stringIndex ||
  first.fret - second.fret ||
  first.chordTone.role.localeCompare(second.chordTone.role);

const compareCosts = (first: PathCost, second: PathCost): number => {
  for (let index = 0; index < first.length; index += 1) {
    const difference = first[index] - second[index];

    if (difference !== 0) {
      return difference;
    }
  }

  return 0;
};

const getPathSignature = (path: readonly VoiceLeadingCandidate[]): string =>
  path
    .map(({ fret, midi, stringIndex }) => `${midi}:${stringIndex}:${fret}`)
    .join("|");

const compareStates = (first: PathState, second: PathState): number =>
  compareCosts(first.cost, second.cost) ||
  getPathSignature(first.path).localeCompare(getPathSignature(second.path));

export const enumerateVoiceLeadingCandidates = (
  step: ResolvedProgressionStep,
  registeredOpenMidi: readonly number[],
  fretCount: number,
): readonly VoiceLeadingCandidate[] => {
  const tonesByPitchClass = new Map(
    step.chord.tones.map((tone) => [tone.pitchClass, tone]),
  );

  return registeredOpenMidi
    .flatMap((openMidi, stringIndex) =>
      Array.from({ length: fretCount + 1 }, (_, fret) => {
        const midi = openMidi + fret;
        const pitchClass = normalizePitchClass(midi);
        const chordTone = tonesByPitchClass.get(pitchClass);

        return chordTone
          ? [{ chordTone, fret, midi, pitchClass, stringIndex }]
          : [];
      }).flat(),
    )
    .sort(compareCandidates);
};

const permitsMovement = (
  policy: VoiceLeadingPolicy,
  movement: number,
): boolean =>
  policy === "smooth" ||
  (policy === "ascending" && movement >= 0) ||
  (policy === "descending" && movement <= 0);

const extendCost = (
  current: PathCost,
  previous: VoiceLeadingCandidate,
  candidate: VoiceLeadingCandidate,
): PathCost => {
  const melodicDistance = Math.abs(candidate.midi - previous.midi);
  const fretDistance = Math.abs(candidate.fret - previous.fret);
  const stringDistance = Math.abs(candidate.stringIndex - previous.stringIndex);

  return [
    Math.max(current[0], melodicDistance),
    current[1] + melodicDistance,
    current[2] + (fretDistance > 4 ? 1 : 0),
    current[3] + fretDistance,
    current[4] + stringDistance,
    current[5],
  ];
};

const getUnavailablePathway = (
  policy: VoiceLeadingPolicy,
  reason: "direction-unavailable" | "no-playable-candidates",
): VoiceLeadingPathway => ({ available: false, policy, reason });

type CandidatePathResult =
  | {
      readonly available: true;
      readonly candidates: readonly VoiceLeadingCandidate[];
    }
  | {
      readonly available: false;
      readonly reason: "direction-unavailable" | "no-playable-candidates";
    };

const buildPath = (
  candidateSets: readonly (readonly VoiceLeadingCandidate[])[],
  policy: VoiceLeadingPolicy,
  middleMidi: number,
): CandidatePathResult => {
  const firstCandidates = candidateSets[0];

  if (!firstCandidates || firstCandidates.length === 0) {
    return { available: false, reason: "no-playable-candidates" };
  }

  let states = firstCandidates.map<PathState>((candidate) => ({
    cost: [0, 0, 0, 0, 0, Math.abs(candidate.midi - middleMidi)],
    path: [candidate],
  }));

  for (const candidates of candidateSets.slice(1)) {
    if (candidates.length === 0) {
      return { available: false, reason: "no-playable-candidates" };
    }

    const nextStates: PathState[] = [];

    for (const candidate of candidates) {
      let bestState: PathState | undefined;

      for (const state of states) {
        const previous = state.path.at(-1);

        if (!previous) {
          continue;
        }

        const movement = candidate.midi - previous.midi;

        if (!permitsMovement(policy, movement)) {
          continue;
        }

        const nextState: PathState = {
          cost: extendCost(state.cost, previous, candidate),
          path: [...state.path, candidate],
        };

        if (!bestState || compareStates(nextState, bestState) < 0) {
          bestState = nextState;
        }
      }

      if (bestState) {
        nextStates.push(bestState);
      }
    }

    if (nextStates.length === 0) {
      return { available: false, reason: "direction-unavailable" };
    }

    states = nextStates;
  }

  const best = [...states].sort(compareStates)[0];

  if (!best) {
    return { available: false, reason: "direction-unavailable" };
  }

  return { available: true, candidates: best.path };
};

const movementWords = (movement: number): string => {
  const distance = Math.abs(movement);
  const unit = distance === 1 ? "semitone" : "semitones";
  return `Moves ${movement > 0 ? "up" : "down"} ${distance} ${unit}`;
};

const describeTarget = (
  candidate: VoiceLeadingCandidate,
  previous: VoiceLeadingCandidate | undefined,
): string => {
  const role = formatChordIntervalName(
    getResolvedChordToneIntervalLabel(candidate.chordTone),
  );

  if (!previous) {
    return `Starts on the ${role}`;
  }

  const movement = candidate.midi - previous.midi;

  if (movement === 0) {
    const previousRole = getResolvedChordToneIntervalLabel(previous.chordTone);
    const currentRole = getResolvedChordToneIntervalLabel(candidate.chordTone);
    return previousRole === currentRole
      ? "Common note retained"
      : `Same note, now the ${role}`;
  }

  return `${movementWords(movement)} to the ${role}`;
};

const addTargetDetails = (
  policy: VoiceLeadingPolicy,
  candidates: readonly VoiceLeadingCandidate[],
  steps: readonly ResolvedProgressionStep[],
): VoiceLeadingPathway => {
  return {
    available: true,
    policy,
    targets: candidates.map((candidate, stepIndex) => {
      const step = steps[stepIndex];
      const previous = candidates[stepIndex - 1];

      return {
        ...candidate,
        chordName: step.chord.name,
        explanation: describeTarget(candidate, previous),
        intervalLabel: getResolvedChordToneIntervalLabel(candidate.chordTone),
        movementSemitones: previous ? candidate.midi - previous.midi : null,
        stepId: step.id,
        stepIndex,
      };
    }),
  };
};

export const generateVoiceLeadingPathways = (
  request: VoiceLeadingRequest,
): VoiceLeadingPathwaysResult => {
  const { fretCount, registeredTuning, steps, stringCount } = request;

  if (registeredTuning.status !== "verified") {
    return { available: false, reason: "unregistered-tuning" };
  }

  if (
    steps.length === 0 ||
    registeredTuning.midiPitches.length !== stringCount ||
    !Number.isInteger(fretCount) ||
    fretCount < 1
  ) {
    return { available: false, reason: "invalid-request" };
  }

  const candidateSets = steps.map((step) =>
    enumerateVoiceLeadingCandidates(
      step,
      registeredTuning.midiPitches,
      fretCount,
    ),
  );
  const allMidi = registeredTuning.midiPitches.flatMap((midi) => [
    midi,
    midi + fretCount,
  ]);
  const middleMidi = (Math.min(...allMidi) + Math.max(...allMidi)) / 2;
  const buildDetailedPath = (policy: VoiceLeadingPolicy) => {
    const result = buildPath(candidateSets, policy, middleMidi);

    if (!result.available) {
      return getUnavailablePathway(policy, result.reason);
    }

    return addTargetDetails(policy, result.candidates, steps);
  };

  return {
    available: true,
    candidateCount: candidateSets.reduce(
      (total, candidates) => total + candidates.length,
      0,
    ),
    pathways: {
      ascending: buildDetailedPath("ascending"),
      descending: buildDetailedPath("descending"),
      smooth: buildDetailedPath("smooth"),
    },
  };
};
