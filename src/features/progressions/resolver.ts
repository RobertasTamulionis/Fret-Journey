import {
  formatNoteName,
  getPitchClass,
  getPitchClassAtOffset,
  normalizePitchClass,
  spellPitchClassAtDiatonicOffset,
} from "@/helpers/musicTheory";
import type {
  PitchClass,
  ScaleDegree,
  SpelledNote,
  TonicName,
} from "@/helpers/typesHelpers";
import { getChordFormula } from "./chordFormulas";
import type {
  AppliedChordTarget,
  DegreeAlteration,
  HarmonicScope,
  ProgressionStep,
  ProgressionTemplate,
  RelativeChordSpec,
  RelativeDegree,
  ResolvedChord,
  ResolvedChordTone,
  ResolvedProgression,
  ResolvedProgressionStep,
  TonalContext,
} from "./types";

const majorDegreeSemitones: Record<ScaleDegree, number> = {
  1: 0,
  2: 2,
  3: 4,
  4: 5,
  5: 7,
  6: 9,
  7: 11,
};

const upperRomanNumerals: Record<ScaleDegree, string> = {
  1: "I",
  2: "II",
  3: "III",
  4: "IV",
  5: "V",
  6: "VI",
  7: "VII",
};

const accidentalSymbols: Record<DegreeAlteration, string> = {
  [-2]: "♭♭",
  [-1]: "♭",
  0: "",
  1: "♯",
  2: "♯♯",
};

const degreeAlterations: DegreeAlteration[] = [-2, -1, 0, 1, 2];

const assertRelativeDegree = (relativeDegree: RelativeDegree): void => {
  if (
    !Number.isInteger(relativeDegree.degree) ||
    !Object.hasOwn(majorDegreeSemitones, relativeDegree.degree)
  ) {
    throw new Error(`Invalid relative scale degree: ${relativeDegree.degree}`);
  }

  if (!degreeAlterations.includes(relativeDegree.alteration)) {
    throw new Error(
      `Invalid degree alteration: ${relativeDegree.alteration}. Expected -2 through 2.`,
    );
  }
};

export const getRelativeDegreeOffset = (
  relativeDegree: RelativeDegree,
): PitchClass => {
  assertRelativeDegree(relativeDegree);
  return normalizePitchClass(
    majorDegreeSemitones[relativeDegree.degree] + relativeDegree.alteration,
  );
};

export const resolveRelativeDegree = (
  tonic: TonicName,
  relativeDegree: RelativeDegree,
): SpelledNote => {
  const tonicPitchClass = getPitchClass(tonic);
  const pitchClass = getPitchClassAtOffset(
    tonicPitchClass,
    getRelativeDegreeOffset(relativeDegree),
  );

  return spellPitchClassAtDiatonicOffset(
    tonic,
    pitchClass,
    relativeDegree.degree - 1,
  );
};

export const formatRelativeDegree = (
  relativeDegree: RelativeDegree,
  letterCase: "upper" | "lower" = "upper",
): string => {
  assertRelativeDegree(relativeDegree);
  const numeral = upperRomanNumerals[relativeDegree.degree];

  return `${accidentalSymbols[relativeDegree.alteration]}${
    letterCase === "lower" ? numeral.toLowerCase() : numeral
  }`;
};

export const formatRelativeBassDegree = (
  relativeDegree: RelativeDegree,
): string => {
  assertRelativeDegree(relativeDegree);
  return `${accidentalSymbols[relativeDegree.alteration]}${relativeDegree.degree}`;
};

export const deriveAppliedDominantRoot = (
  target: AppliedChordTarget,
): RelativeDegree => {
  assertRelativeDegree(target);
  const degree = (((target.degree - 1 + 4) % 7) + 1) as ScaleDegree;
  const rootOffset = normalizePitchClass(getRelativeDegreeOffset(target) + 7);
  let alteration = rootOffset - majorDegreeSemitones[degree];

  if (alteration > 6) {
    alteration -= 12;
  }

  if (alteration < -2 || alteration > 2) {
    throw new Error(
      `Applied dominant of ${formatRelativeDegree(target, target.romanCase)} requires an unsupported root alteration of ${alteration}`,
    );
  }

  return { alteration: alteration as DegreeAlteration, degree };
};

const assertHarmonicScope = (spec: RelativeChordSpec): void => {
  if (
    spec.appliedTo &&
    spec.harmonicScope !== undefined &&
    spec.harmonicScope !== "secondary-dominant"
  ) {
    throw new Error(
      "An applied dominant must use the secondary-dominant harmonic scope",
    );
  }

  if (!spec.appliedTo && spec.harmonicScope === "secondary-dominant") {
    throw new Error(
      "The secondary-dominant harmonic scope requires an applied target",
    );
  }
};

const assertAppliedDominant = (spec: RelativeChordSpec): void => {
  assertHarmonicScope(spec);

  if (!spec.appliedTo) {
    return;
  }

  assertRelativeDegree(spec.appliedTo);
  const formula = getChordFormula(spec.formulaId);

  if (!formula.supportsAppliedDominant) {
    throw new Error(
      `${formula.displayName} cannot be authored as an applied dominant`,
    );
  }

  const expectedRoot = deriveAppliedDominantRoot(spec.appliedTo);

  if (
    spec.root.degree !== expectedRoot.degree ||
    spec.root.alteration !== expectedRoot.alteration
  ) {
    throw new Error(
      `${formatRelativeDegree(spec.root)} is not the correctly spelled V of ${formatRelativeDegree(spec.appliedTo, spec.appliedTo.romanCase)}`,
    );
  }
};

const resolveHarmonicScope = (spec: RelativeChordSpec): HarmonicScope => {
  if (spec.appliedTo) {
    return "secondary-dominant";
  }

  return spec.harmonicScope ?? "diatonic";
};

export const deriveRomanNumeral = (spec: RelativeChordSpec): string => {
  assertRelativeDegree(spec.root);
  assertAppliedDominant(spec);
  const formula = getChordFormula(spec.formulaId);
  const chordRoman = spec.appliedTo
    ? `V${formula.romanSuffix}/${formatRelativeDegree(
        spec.appliedTo,
        spec.appliedTo.romanCase ?? "upper",
      )}`
    : `${formatRelativeDegree(spec.root, formula.romanCase)}${formula.romanSuffix}`;

  if (!spec.bass) {
    return chordRoman;
  }

  const bassRoman = formatRelativeBassDegree(spec.bass);
  return spec.appliedTo
    ? `(${chordRoman})/${bassRoman}`
    : `${chordRoman}/${bassRoman}`;
};

export const resolveRelativeChord = (
  spec: RelativeChordSpec,
  tonic: TonicName,
): ResolvedChord => {
  assertRelativeDegree(spec.root);
  assertAppliedDominant(spec);

  if (spec.bass) {
    assertRelativeDegree(spec.bass);
  }

  const formula = getChordFormula(spec.formulaId);
  const relativeRoot = spec.appliedTo
    ? deriveAppliedDominantRoot(spec.appliedTo)
    : spec.root;
  const root = resolveRelativeDegree(tonic, relativeRoot);
  const tones: ResolvedChordTone[] = formula.tones.map((formulaTone) => {
    const pitchClass = getPitchClassAtOffset(
      root.pitchClass,
      formulaTone.semitones,
    );

    return {
      ...spellPitchClassAtDiatonicOffset(
        root.name,
        pitchClass,
        formulaTone.diatonicSteps,
      ),
      ...formulaTone,
    };
  });
  const bass = spec.bass ? resolveRelativeDegree(tonic, spec.bass) : undefined;

  if (bass && !tones.some(({ pitchClass }) => pitchClass === bass.pitchClass)) {
    throw new Error(
      `Slash bass ${bass.name} must be a tone of ${root.name}${formula.suffix}`,
    );
  }

  const chordName = `${formatNoteName(root.name)}${formula.suffix}`;

  return {
    bass,
    formula,
    harmonicScope: resolveHarmonicScope(spec),
    name: bass ? `${chordName}/${formatNoteName(bass.name)}` : chordName,
    pitchClasses: tones.map(({ pitchClass }) => pitchClass),
    romanNumeral: deriveRomanNumeral(spec),
    root,
    source: spec,
    tones,
  };
};

export const resolveProgressionStep = (
  step: ProgressionStep,
  tonic: TonicName,
): ResolvedProgressionStep => {
  if (!Number.isFinite(step.durationBeats) || step.durationBeats <= 0) {
    throw new Error(
      `Progression step ${step.id} must have a positive beat duration`,
    );
  }

  return {
    ...step,
    chord: resolveRelativeChord(step.chord, tonic),
  };
};

export const resolveProgression = (
  template: ProgressionTemplate,
  context: TonalContext,
): ResolvedProgression => {
  const steps = template.steps.map((step) =>
    resolveProgressionStep(step, context.currentKey),
  );

  return {
    chordNames: steps.map(({ chord }) => chord.name),
    compatible: template.compatibleScales.includes(context.currentScale),
    formula: steps.map(({ chord }) => chord.romanNumeral).join(" – "),
    selectedScale: context.currentScale,
    steps,
    template,
    tonic: context.currentKey,
  };
};
