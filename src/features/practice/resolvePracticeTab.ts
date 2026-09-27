import {
  type PracticeTabExampleId,
  practiceTabExamples,
} from "@/data/practiceTabExamples";
import {
  getPracticeTabPitchClass,
  type PracticeTabEvent,
  type PracticeTabExample,
  type PracticeTabNote,
  type PracticeTabPitchScope,
  type PracticeTabStringNumber,
  type PracticeTabTuning,
} from "@/features/practice/tablature";
import {
  formatNoteName,
  formatPitchClass,
  getPitchClass,
  getScaleChords,
  getScaleTones,
  getTuningLabel,
  normalizePitchClass,
  scaleDefinitions,
} from "@/helpers/fretboardHelpers";
import type {
  GuitarStringCount,
  PitchClass,
  RegisteredTuningState,
  ScaleName,
  TonicName,
} from "@/helpers/typesHelpers";
import {
  type PracticeExerciseRecipe,
  practiceExerciseRecipes,
} from "./recipes";

export type PracticeResolutionContext = {
  currentKey: TonicName;
  currentScale: ScaleName;
  registeredTuning: RegisteredTuningState;
  stringCount: GuitarStringCount;
  tuning: readonly PitchClass[];
};

const nearestFret = (
  openPitchClass: PitchClass,
  targetPitchClass: PitchClass,
  preferredFret: number,
  direction?: "down" | "up",
): number => {
  const candidates = Array.from({ length: 25 }, (_, fret) => fret).filter(
    (fret) => normalizePitchClass(openPitchClass + fret) === targetPitchClass,
  );
  const directional = candidates.filter((fret) =>
    direction === "up"
      ? fret > preferredFret
      : direction === "down"
        ? fret < preferredFret
        : true,
  );
  const choices = directional.length > 0 ? directional : candidates;

  return choices.reduce((best, fret) =>
    Math.abs(fret - preferredFret) < Math.abs(best - preferredFret)
      ? fret
      : best,
  );
};

const fiveToneTarget = (
  context: PracticeResolutionContext,
): readonly PitchClass[] => {
  const scale = getScaleTones(context.currentKey, context.currentScale).map(
    ({ pitchClass }) => pitchClass,
  );
  const indices =
    context.currentScale === "major" || context.currentScale === "blues"
      ? [0, 1, 2, 4, 5]
      : [0, 2, 3, 4, 6];

  return indices
    .map((index) => scale[index])
    .filter((pitchClass): pitchClass is PitchClass => pitchClass !== undefined);
};

const getTargetPitchClasses = (
  source: PracticeTabExample,
  recipe: PracticeExerciseRecipe,
  context: PracticeResolutionContext,
): readonly PitchClass[] | null => {
  if (recipe.pitchPolicy === "chromatic") {
    return null;
  }

  if (recipe.pitchPolicy === "tonic-triad") {
    return getScaleChords(
      context.currentKey,
      context.currentScale,
      "triad",
    )[0].notes.map(({ pitchClass }) => pitchClass);
  }

  if (recipe.pitchPolicy === "scale-five-tone") {
    return fiveToneTarget(context);
  }

  if (recipe.pitchPolicy === "scale") {
    return getScaleTones(context.currentKey, context.currentScale).map(
      ({ pitchClass }) => pitchClass,
    );
  }

  if (source.pitchScope.kind === "set") {
    const targetRoot = getPitchClass(context.currentKey);
    const offset = normalizePitchClass(targetRoot - recipe.sourceTonic);
    return source.pitchScope.pitchClasses.map((pitchClass) =>
      normalizePitchClass(pitchClass + offset),
    );
  }

  return null;
};

const mapPitchClass = (
  sourcePitchClass: PitchClass,
  source: PracticeTabExample,
  recipe: PracticeExerciseRecipe,
  context: PracticeResolutionContext,
  targetPitchClasses: readonly PitchClass[] | null,
): PitchClass => {
  if (recipe.pitchPolicy === "chromatic") {
    return sourcePitchClass;
  }

  if (recipe.pitchPolicy === "tonic-transpose") {
    return normalizePitchClass(
      sourcePitchClass +
        normalizePitchClass(
          getPitchClass(context.currentKey) - recipe.sourceTonic,
        ),
    );
  }

  if (source.pitchScope.kind !== "set" || targetPitchClasses === null) {
    return sourcePitchClass;
  }

  const sourceIndex = source.pitchScope.pitchClasses.indexOf(sourcePitchClass);
  return sourceIndex >= 0
    ? targetPitchClasses[sourceIndex % targetPitchClasses.length]
    : sourcePitchClass;
};

const resolveStringNumber = (
  sourceString: PracticeTabStringNumber,
  recipe: PracticeExerciseRecipe,
  stringCount: GuitarStringCount,
): PracticeTabStringNumber =>
  (recipe.stringRange === "lowest-six"
    ? sourceString + (stringCount - 6)
    : sourceString) as PracticeTabStringNumber;

const resolveEvents = (
  source: PracticeTabExample,
  recipe: PracticeExerciseRecipe,
  context: PracticeResolutionContext,
  targetPitchClasses: readonly PitchClass[] | null,
): readonly PracticeTabEvent[] => {
  const previousFrets = new Map<number, number>();
  const connectedStrings = new Set(
    source.events.flatMap((event) =>
      event.kind === "notes"
        ? event.notes.flatMap((note) =>
            note.articulation &&
            note.articulation !== "bend" &&
            note.articulation !== "vibrato"
              ? [resolveStringNumber(note.string, recipe, context.stringCount)]
              : [],
          )
        : [],
    ),
  );

  return source.events.map((event) => {
    if (event.kind === "rest") {
      return event;
    }

    const notes = event.notes.map((note): PracticeTabNote => {
      const string = resolveStringNumber(
        note.string,
        recipe,
        context.stringCount,
      );
      if (note.fret === "x") {
        return { ...note, string };
      }

      const sourcePitchClass = getPracticeTabPitchClass(
        source.tuningId,
        note.string,
        note.fret,
      );
      const targetPitchClass = mapPitchClass(
        sourcePitchClass,
        source,
        recipe,
        context,
        targetPitchClasses,
      );
      const previousFret = previousFrets.get(string);
      const direction =
        note.articulation === "hammer" || note.articulation === "slide-up"
          ? "up"
          : note.articulation === "pull" || note.articulation === "slide-down"
            ? "down"
            : undefined;
      const preferredFret =
        previousFret ??
        (connectedStrings.has(string) ? Math.max(12, note.fret) : note.fret);
      const fret =
        note.articulation === "release" && previousFret !== undefined
          ? previousFret
          : nearestFret(
              context.tuning[string - 1],
              targetPitchClass,
              preferredFret,
              direction,
            );
      const bendDistance =
        note.targetFret === undefined ? undefined : note.targetFret - note.fret;
      const targetFret =
        bendDistance === undefined
          ? undefined
          : Math.min(24, fret + bendDistance);

      previousFrets.set(string, fret);
      return { ...note, fret, string, targetFret };
    }) as unknown as readonly [PracticeTabNote, ...PracticeTabNote[]];

    return { ...event, notes };
  });
};

const buildPitchScope = (
  source: PracticeTabExample,
  events: readonly PracticeTabEvent[],
  recipe: PracticeExerciseRecipe,
  context: PracticeResolutionContext,
): PracticeTabPitchScope => {
  if (source.pitchScope.kind === "chromatic") {
    return source.pitchScope;
  }

  const pitches = new Set<PitchClass>();
  events.forEach((event) => {
    if (event.kind === "rest") return;
    event.notes.forEach((note) => {
      if (note.fret === "x") return;
      pitches.add(
        getPracticeTabPitchClass(context.tuning, note.string, note.fret),
      );
      if (note.targetFret !== undefined) {
        pitches.add(
          getPracticeTabPitchClass(
            context.tuning,
            note.string,
            note.targetFret,
          ),
        );
      }
    });
  });

  const label =
    recipe.pitchPolicy === "tonic-transpose"
      ? `${formatNoteName(context.currentKey)} transposed technique tones`
      : recipe.pitchPolicy === "tonic-triad"
        ? `${formatNoteName(context.currentKey)} tonic triad`
        : `${formatNoteName(context.currentKey)} ${scaleDefinitions[context.currentScale].label}`;

  return {
    kind: "set",
    label,
    pitchClasses: [...pitches],
  };
};

const buildTuning = (
  context: PracticeResolutionContext,
): PracticeTabTuning => ({
  label: `${context.stringCount}-string · ${getTuningLabel(context.stringCount, context.registeredTuning)}`,
  midiPitchesHighToLow:
    context.registeredTuning.status === "verified"
      ? context.registeredTuning.midiPitches
      : null,
  pitchClassesHighToLow: [...context.tuning],
  registerStatus: context.registeredTuning.status,
  stringLabelsHighToLow: context.tuning.map(formatPitchClass),
});

const resolveMarkers = (
  source: PracticeTabExample,
  events: readonly PracticeTabEvent[],
) => {
  const frets = events.flatMap((event) =>
    event.kind === "notes"
      ? event.notes.flatMap((note) =>
          typeof note.fret === "number" ? [note.fret] : [],
        )
      : [],
  );
  const position = frets.length > 0 ? Math.min(...frets) : 0;

  return source.markers?.map((marker) => ({
    ...marker,
    label: /^position \d+$/i.test(marker.label)
      ? `position ${position}`
      : marker.label === "Am"
        ? "i"
        : marker.label === "F"
          ? "VI"
          : marker.label === "G"
            ? "VII"
            : marker.label,
  }));
};

export const getPracticeContextLabel = (
  context: PracticeResolutionContext,
): string =>
  `${formatNoteName(context.currentKey)} ${scaleDefinitions[context.currentScale].label}, ${context.stringCount}-string, ${getTuningLabel(context.stringCount, context.registeredTuning)}`;

/** Resolve a reviewed source tab into a fresh, context-specific score. */
export const resolvePracticeTab = (
  exampleId: PracticeTabExampleId,
  context: PracticeResolutionContext,
): PracticeTabExample => {
  const source = practiceTabExamples[exampleId];
  const recipe = practiceExerciseRecipes[exampleId];
  const targetPitchClasses = getTargetPitchClasses(source, recipe, context);
  const events = resolveEvents(source, recipe, context, targetPitchClasses);
  const pitchScope = buildPitchScope(source, events, recipe, context);
  const contextLabel = getPracticeContextLabel(context);
  const registerNote =
    context.registeredTuning.status === "verified"
      ? "Registered pitch range."
      : "Pitch classes are exact; octave register is unverified for this custom tuning.";

  return {
    ...source,
    accessibleDescription: `Play the displayed ${pitchScope.label.toLowerCase()} exercise in ${contextLabel}. Follow the shown strings, frets, rhythm, and articulations. ${registerNote}`,
    events,
    markers: resolveMarkers(source, events),
    pitchScope,
    resolvedContext: {
      key: context.currentKey,
      label: contextLabel,
      scale: context.currentScale,
    },
    tuning: buildTuning(context),
  };
};
