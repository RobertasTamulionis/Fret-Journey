import {
  deriveRomanNumeral,
  getChordFormula,
  type HarmonicScope,
  type ProgressionTemplate,
  type RelativeChordSpec,
  type RelativeDegree,
  type ResolvedChord,
  type ResolvedProgression,
  resolveRelativeDegree,
  type TonalContext,
} from "@/features/progressions";
import {
  formatNoteName,
  getPitchClass,
  getPitchClassAtOffset,
  getScaleTone,
  spellPitchClassAtDiatonicOffset,
} from "@/helpers/musicTheory";
import type { ScaleDegree, TonicName } from "@/helpers/typesHelpers";
import type { AuthoredChordSpec, AuthoredProgression } from "./types";

const degrees: ScaleDegree[] = [1, 2, 3, 4, 5, 6, 7];
const alterations = [-2, -1, 0, 1, 2] as const;

const findRelativeDegree = (
  tonic: TonicName,
  note: TonicName,
): RelativeDegree => {
  const candidates = degrees
    .flatMap((degree) =>
      alterations.map((alteration) => ({ alteration, degree })),
    )
    .flatMap((candidate) => {
      try {
        return [
          { candidate, resolved: resolveRelativeDegree(tonic, candidate) },
        ];
      } catch {
        return [];
      }
    });
  const exact = candidates.find(
    ({ resolved }) => resolved.name === note,
  )?.candidate;
  if (exact) return exact;

  const pitchClass = getPitchClass(note);
  const equivalent = candidates.find(
    ({ resolved }) => resolved.pitchClass === pitchClass,
  )?.candidate;
  if (!equivalent) throw new Error(`Cannot relate ${note} to ${tonic}`);
  return equivalent;
};

export const resolveAuthoredChord = (
  chord: AuthoredChordSpec,
  context: TonalContext,
): ResolvedChord => {
  const formula = getChordFormula(chord.formulaId);
  const rootPitchClass = getPitchClass(chord.root);
  const tones = formula.tones.map((formulaTone) => {
    const pitchClass = getPitchClassAtOffset(
      rootPitchClass,
      formulaTone.semitones,
    );
    return {
      ...spellPitchClassAtDiatonicOffset(
        chord.root,
        pitchClass,
        formulaTone.diatonicSteps,
      ),
      ...formulaTone,
    };
  });
  const bass = chord.bass
    ? {
        ...spellPitchClassAtDiatonicOffset(
          chord.bass,
          getPitchClass(chord.bass),
          0,
        ),
      }
    : undefined;
  if (bass && !tones.some(({ pitchClass }) => pitchClass === bass.pitchClass)) {
    throw new Error(`Slash bass ${chord.bass} must be a chord tone.`);
  }
  const source: RelativeChordSpec = {
    ...(bass
      ? {
          bass: findRelativeDegree(context.currentKey, chord.bass as TonicName),
        }
      : {}),
    formulaId: chord.formulaId,
    root: findRelativeDegree(context.currentKey, chord.root),
  };
  const harmonicScope: HarmonicScope = tones.every(({ pitchClass }) =>
    Boolean(getScaleTone(pitchClass, context.currentKey, context.currentScale)),
  )
    ? "diatonic"
    : "chromatic";
  const baseName = `${formatNoteName(chord.root)}${formula.suffix}`;

  return {
    bass,
    formula,
    harmonicScope,
    name: bass ? `${baseName}/${formatNoteName(bass.name)}` : baseName,
    pitchClasses: tones.map(({ pitchClass }) => pitchClass),
    romanNumeral: deriveRomanNumeral(source),
    root: spellPitchClassAtDiatonicOffset(chord.root, rootPitchClass, 0),
    source,
    tones,
  };
};

export const resolveAuthoredProgression = (
  progression: AuthoredProgression,
  context: TonalContext = {
    currentKey: progression.context.tonic,
    currentScale: progression.context.scale,
  },
): ResolvedProgression => {
  const steps = progression.steps.map((step) => ({
    chord: resolveAuthoredChord(step.chord, context),
    durationBeats: 4,
    id: step.id,
  }));
  const template: ProgressionTemplate = {
    category: "pop-rock-loop",
    compatibleScales: [context.currentScale],
    explanation: "A browser-local progression authored by the player.",
    form: progression.form,
    harmonicDevices: [
      ...new Set(steps.map(({ chord }) => chord.harmonicScope)),
    ],
    id: progression.id,
    moodTags: [],
    reviewStatus: "draft",
    slug: `local-${progression.id}`,
    sourceReferenceIds: [],
    steps: steps.map(({ chord, durationBeats, id }) => ({
      chord: chord.source,
      durationBeats,
      id,
    })),
    styleTags: [],
    title: progression.name,
    tonalFramework: context.currentScale,
  };

  return {
    chordNames: steps.map(({ chord }) => chord.name),
    compatible: steps.every(({ chord }) => chord.harmonicScope === "diatonic"),
    formula: steps.map(({ chord }) => chord.romanNumeral).join(" – "),
    selectedScale: context.currentScale,
    steps,
    template,
    tonic: context.currentKey,
  };
};
