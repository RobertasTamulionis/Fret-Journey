import { normalizePitchClass } from "@/helpers/musicTheory";
import type { PitchClass } from "@/helpers/typesHelpers";
import type {
  ChordVoicingRequest,
  ChordVoicingTone,
  PlayableVoicing,
  VoicingDifficulty,
  VoicingStringState,
} from "./types";

export const chordVoicingGeneratorVersion = "dynamic-chord-v1" as const;
export const chordVoicingMaximumFret = 12;
export const chordVoicingPreferredMaximumFretSpan = 4;
export const chordVoicingMaximumFretSpan = 11;
export const chordVoicingResultLimit = 16;

type ToneCandidate = {
  fret: number;
  midi?: number;
  openMidi?: number;
  openPitchClass: PitchClass;
  stringIndex: number;
  tone: ChordVoicingTone;
};

const getDifficulty = (
  baseFret: number,
  fretSpan: number,
  internalMutedStringCount: number,
  hasOpenString: boolean,
): VoicingDifficulty => {
  const score =
    Math.max(baseFret, 1) +
    fretSpan * 2 +
    internalMutedStringCount * 3 -
    (hasOpenString ? 1 : 0);

  if (baseFret <= 5 && fretSpan <= 3 && internalMutedStringCount === 0) {
    return { label: "easy", score };
  }

  if (baseFret <= 9 && fretSpan <= chordVoicingPreferredMaximumFretSpan) {
    return { label: "moderate", score };
  }

  return { label: "advanced", score };
};

const isPitchClass = (value: number): value is PitchClass =>
  Number.isInteger(value) && value >= 0 && value <= 11;

const isValidRequest = (request: ChordVoicingRequest): boolean => {
  if (
    request.tones.length === 0 ||
    request.tones.length > request.stringCount ||
    request.tuning.length !== request.stringCount ||
    !request.tuning.every(isPitchClass) ||
    !isPitchClass(request.rootPitchClass)
  ) {
    return false;
  }

  const uniquePitchClasses = new Set(
    request.tones.map(({ pitchClass }) => pitchClass),
  );
  const uniqueRoles = new Set(request.tones.map(({ role }) => role));

  if (
    uniquePitchClasses.size !== request.tones.length ||
    uniqueRoles.size !== request.tones.length ||
    request.tones.filter(({ role }) => role === "root").length !== 1 ||
    !request.tones.some(
      ({ pitchClass, role }) =>
        role === "root" && pitchClass === request.rootPitchClass,
    ) ||
    !request.tones.every(({ pitchClass }) => isPitchClass(pitchClass)) ||
    (request.bassPitchClass !== undefined &&
      !request.tones.some(
        ({ pitchClass }) => pitchClass === request.bassPitchClass,
      ))
  ) {
    return false;
  }

  if (request.registeredOpenMidi == null) {
    return true;
  }

  return (
    request.registeredOpenMidi.length === request.stringCount &&
    request.registeredOpenMidi.every(
      (midi, stringIndex) =>
        Number.isInteger(midi) &&
        normalizePitchClass(midi) === request.tuning[stringIndex],
    )
  );
};

const getMatchingFrets = (
  openPitchClass: PitchClass,
  tonePitchClass: PitchClass,
  firstFret: number,
  lastFret: number,
): number[] =>
  Array.from(
    { length: lastFret - firstFret + 1 },
    (_, index) => firstFret + index,
  ).filter(
    (fret) => normalizePitchClass(openPitchClass + fret) === tonePitchClass,
  );

const buildSignature = (
  stringCount: number,
  states: VoicingStringState[],
): string =>
  `${stringCount}:${states
    .map((state) =>
      state.kind === "muted" ? "x" : `${state.fret}-${state.role}`,
    )
    .join(":")}`;

const getInternalMutedStringCount = (
  selected: readonly ToneCandidate[],
): number => {
  const soundedIndexes = selected
    .map(({ stringIndex }) => stringIndex)
    .sort((first, second) => first - second);
  const first = soundedIndexes[0];
  const last = soundedIndexes.at(-1);

  if (first === undefined || last === undefined) {
    return 0;
  }

  return last - first + 1 - soundedIndexes.length;
};

const getBass = (
  selected: readonly ToneCandidate[],
): PlayableVoicing["bass"] => {
  if (selected.some(({ midi }) => midi === undefined)) {
    return undefined;
  }

  const bass = selected.reduce((lowest, candidate) =>
    (candidate.midi as number) < (lowest.midi as number) ? candidate : lowest,
  );

  return {
    midi: bass.midi as number,
    noteName: bass.tone.name,
    pitchClass: bass.tone.pitchClass,
    role: bass.tone.role,
  };
};

const getUnregisteredAuthoredBassCandidate = (
  selected: readonly ToneCandidate[],
  bassPitchClass: PitchClass,
): ToneCandidate | undefined =>
  selected.find(({ tone }) => tone.pitchClass === bassPitchClass);

const buildRank = (
  selected: readonly ToneCandidate[],
  bass: PlayableVoicing["bass"],
  rootPitchClass: PitchClass,
  authoredBassPitchClass?: PitchClass,
): number => {
  const frets = selected.map(({ fret }) => fret);
  const baseFret = Math.min(...frets);
  const fretSpan = Math.max(...frets) - baseFret;
  const internalMutedStringCount = getInternalMutedStringCount(selected);
  const stringIndexes = selected.map(({ stringIndex }) => stringIndex);
  const highestUsedStringIndex = Math.min(...stringIndexes);
  const lowestUsedStringIndex = Math.max(...stringIndexes);
  const hasOpenString = frets.includes(0);
  const bassPenalty = bass
    ? bass.pitchClass === (authoredBassPitchClass ?? rootPitchClass)
      ? 0
      : 1
    : authoredBassPitchClass === undefined
      ? 0
      : (() => {
          const authoredBassCandidate = getUnregisteredAuthoredBassCandidate(
            selected,
            authoredBassPitchClass,
          );
          return authoredBassCandidate?.stringIndex === lowestUsedStringIndex
            ? 0
            : 1;
        })();

  return (
    bassPenalty * 1_000_000 +
    internalMutedStringCount * 100_000 +
    fretSpan * 10_000 +
    baseFret * 100 +
    (hasOpenString ? 0 : 10) +
    highestUsedStringIndex
  );
};

const buildVoicing = (
  request: ChordVoicingRequest,
  selected: readonly ToneCandidate[],
): PlayableVoicing | undefined => {
  const bass = getBass(selected);

  if (
    request.bassPitchClass !== undefined &&
    bass !== undefined &&
    bass.pitchClass !== request.bassPitchClass
  ) {
    return undefined;
  }

  if (request.bassPitchClass !== undefined && bass === undefined) {
    const authoredBassCandidate = getUnregisteredAuthoredBassCandidate(
      selected,
      request.bassPitchClass,
    );
    const lowestUsedStringIndex = Math.max(
      ...selected.map(({ stringIndex }) => stringIndex),
    );

    if (authoredBassCandidate?.stringIndex !== lowestUsedStringIndex) {
      return undefined;
    }
  }

  const selectedByString = new Map(
    selected.map((candidate) => [candidate.stringIndex, candidate]),
  );
  const strings: VoicingStringState[] = request.tuning.map(
    (openPitchClass, stringIndex) => {
      const candidate = selectedByString.get(stringIndex);
      const openMidi = request.registeredOpenMidi?.[stringIndex];

      if (!candidate) {
        return {
          kind: "muted",
          ...(openMidi === undefined ? {} : { openMidi }),
          openPitchClass,
          stringIndex,
        };
      }

      const sounding = {
        ...(candidate.midi === undefined ? {} : { midi: candidate.midi }),
        noteName: candidate.tone.name,
        ...(openMidi === undefined ? {} : { openMidi }),
        openPitchClass,
        pitchClass: candidate.tone.pitchClass,
        role: candidate.tone.role,
        stringIndex,
      };

      return candidate.fret === 0
        ? ({ ...sounding, fret: 0, kind: "open" } as const)
        : ({ ...sounding, fret: candidate.fret, kind: "fretted" } as const);
    },
  );
  const frets = selected.map(({ fret }) => fret);
  const baseFret = Math.min(...frets);
  const fretSpan = Math.max(...frets) - baseFret;
  const internalMutedStringCount = getInternalMutedStringCount(selected);
  const signature = buildSignature(request.stringCount, strings);

  return {
    ...(request.bassPitchClass === undefined
      ? {}
      : { authoredBassPitchClass: request.bassPitchClass }),
    baseFret,
    ...(bass === undefined ? {} : { bass }),
    chordName: request.chordName,
    difficulty: getDifficulty(
      baseFret,
      fretSpan,
      internalMutedStringCount,
      frets.includes(0),
    ),
    doublings: [],
    fretSpan,
    generatorVersion: chordVoicingGeneratorVersion,
    omissions: [],
    rank: buildRank(
      selected,
      bass,
      request.rootPitchClass,
      request.bassPitchClass,
    ),
    registerStatus:
      request.registeredOpenMidi == null ? "pitch-class-only" : "verified",
    requiredTones: request.tones
      .filter(({ required }) => required)
      .map(({ role }) => role),
    signature,
    stringCount: request.stringCount,
    strings,
    toneRoles: request.tones.map(({ role }) => role),
  };
};

const getCandidateOptions = (
  request: ChordVoicingRequest,
  tone: ChordVoicingTone,
  firstFret: number,
  lastFret: number,
): ToneCandidate[] =>
  request.tuning.flatMap((openPitchClass, stringIndex) => {
    const openMidi = request.registeredOpenMidi?.[stringIndex];

    return getMatchingFrets(
      openPitchClass,
      tone.pitchClass,
      firstFret,
      lastFret,
    ).map((fret) => ({
      fret,
      ...(openMidi === undefined ? {} : { midi: openMidi + fret, openMidi }),
      openPitchClass,
      stringIndex,
      tone,
    }));
  });

const collectVoicings = (
  request: ChordVoicingRequest,
  maximumFretSpan: number,
): Map<string, PlayableVoicing> => {
  const results = new Map<string, PlayableVoicing>();

  for (let firstFret = 0; firstFret <= chordVoicingMaximumFret; firstFret++) {
    const lastFret = Math.min(
      chordVoicingMaximumFret,
      firstFret + maximumFretSpan,
    );
    const candidateSets = request.tones
      .map((tone) => ({
        candidates: getCandidateOptions(request, tone, firstFret, lastFret),
        tone,
      }))
      .sort(
        (first, second) =>
          first.candidates.length - second.candidates.length ||
          first.tone.role.localeCompare(second.tone.role),
      );

    if (candidateSets.some(({ candidates }) => candidates.length === 0)) {
      continue;
    }

    const usedStringIndexes = new Set<number>();
    const selected: ToneCandidate[] = [];
    let acceptedInWindow = 0;

    const search = (toneIndex: number): void => {
      if (acceptedInWindow >= chordVoicingResultLimit) {
        return;
      }

      if (toneIndex === candidateSets.length) {
        const voicing = buildVoicing(request, selected);

        if (voicing) {
          const existing = results.get(voicing.signature);

          if (!existing || voicing.rank < existing.rank) {
            results.set(voicing.signature, voicing);
          }
          acceptedInWindow += 1;
        }
        return;
      }

      const candidateSet = candidateSets[toneIndex];

      for (const candidate of candidateSet.candidates) {
        if (usedStringIndexes.has(candidate.stringIndex)) {
          continue;
        }

        usedStringIndexes.add(candidate.stringIndex);
        selected.push(candidate);
        search(toneIndex + 1);
        selected.pop();
        usedStringIndexes.delete(candidate.stringIndex);

        if (acceptedInWindow >= chordVoicingResultLimit) {
          return;
        }
      }
    };

    search(0);
  }

  return results;
};

export const generateChordVoicings = (
  request: ChordVoicingRequest,
): PlayableVoicing[] => {
  if (!isValidRequest(request)) {
    return [];
  }

  const preferredResults = collectVoicings(
    request,
    chordVoicingPreferredMaximumFretSpan,
  );
  const results =
    preferredResults.size > 0
      ? preferredResults
      : collectVoicings(request, chordVoicingMaximumFretSpan);

  return [...results.values()]
    .sort(
      (first, second) =>
        first.rank - second.rank ||
        first.signature.localeCompare(second.signature),
    )
    .slice(0, chordVoicingResultLimit);
};
