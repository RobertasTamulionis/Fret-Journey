"use client";

import { useMemo, useState } from "react";
import FretboardNeck, {
  type ChordVisualization,
  type FretboardPitchEmphasis,
} from "@/components/Fretboard/FretboardNeck";
import type {
  ImprovisationApproach,
  ImprovisationGuidance,
  ImprovisationObjective,
} from "@/features/improvisation";
import { getImprovisationObjectiveAvailability } from "@/features/improvisation";
import { formatChordIntervalName } from "@/features/musical-context";
import type { ResolvedProgression } from "@/features/progressions";
import { getResolvedChordToneIntervalLabel } from "@/features/progressions";
import { formatNoteName, formatPitchClass } from "@/helpers/musicTheory";
import type { PitchClass, ScaleName, TonicName } from "@/helpers/typesHelpers";

type ImprovisationWorkspaceProps = {
  readonly currentKey: TonicName;
  readonly currentScale: ScaleName;
  readonly fretCount: number;
  readonly guidance: ImprovisationGuidance;
  readonly onExit: () => void;
  readonly onSelectStep: (index: number) => void;
  readonly progression: ResolvedProgression;
  readonly tuning: PitchClass[];
};

const objectiveLabels: Record<ImprovisationObjective, string> = {
  "chord-tones": "Chord Tones Only",
  "connect-changes": "Connect the Changes",
  "target-third": "Target the Third",
};

const formatToneList = (tones: readonly { readonly name: string }[]): string =>
  tones.map(({ name }) => formatNoteName(name)).join(", ");

const formatApproach = (approach: ImprovisationApproach): string => {
  const source = formatPitchClass(approach.sourcePitchClass);
  const target = formatNoteName(approach.targetTone.name);
  const distance =
    approach.distanceSemitones === 1 ? "one semitone" : "two semitones";
  const position = approach.direction === "ascending" ? "below" : "above";
  const scaleNote = approach.sourceInScale
    ? "in the selected scale"
    : "outside the selected scale";

  return `Approach ${target} from ${source}, ${distance} ${position} (${scaleNote}).`;
};

const getInstruction = (
  objective: ImprovisationObjective,
  guidance: ImprovisationGuidance,
): string => {
  const { activeStep, activeThird, nextStep, transition } = guidance;

  if (objective === "chord-tones") {
    return `Build your phrase around ${formatToneList(activeStep.chord.tones)}. These notes establish ${activeStep.chord.name}; other notes are not automatically incorrect.`;
  }

  if (objective === "target-third") {
    return activeThird
      ? `Aim for ${formatNoteName(activeThird.name)}, the ${formatChordIntervalName(getResolvedChordToneIntervalLabel(activeThird))} of ${activeStep.chord.name}. Keep the other chord tones available as support.`
      : `This chord has no third. Use Chord Tones Only or Connect the Changes instead; no major or minor quality is being invented.`;
  }

  if (!nextStep || !transition) {
    return `${activeStep.chord.name} is the phrase destination. Resolve deliberately on one of its chord tones.`;
  }

  const common = transition.commonTones[0];
  if (common) {
    return `Retain ${formatNoteName(common.toneInFromChord.name)} as ${activeStep.chord.name} changes to ${nextStep.chord.name}. Its chord role may change even though the pitch stays the same.`;
  }

  const approach = guidance.suggestedApproaches[0];
  if (approach) {
    return formatApproach(approach);
  }

  return `Choose a tone from ${nextStep.chord.name} as your destination. Proximity is a possibility, not a guarantee of a satisfying resolution.`;
};

const buildEmphasis = (
  objective: ImprovisationObjective,
  guidance: ImprovisationGuidance,
): ReadonlyMap<PitchClass, FretboardPitchEmphasis> => {
  const emphasis = new Map<PitchClass, FretboardPitchEmphasis>();

  if (objective === "chord-tones") {
    for (const tone of guidance.activeStep.chord.tones) {
      emphasis.set(tone.pitchClass, {
        kind: "objective-target",
        label: getResolvedChordToneIntervalLabel(tone),
      });
    }
  }

  if (objective === "target-third" && guidance.activeThird) {
    emphasis.set(guidance.activeThird.pitchClass, {
      kind: "objective-target",
      label: getResolvedChordToneIntervalLabel(guidance.activeThird),
    });
  }

  if (objective === "connect-changes" && guidance.transition) {
    for (const relationship of guidance.transition.commonTones) {
      emphasis.set(relationship.pitchClass, {
        kind: "connection",
        label: getResolvedChordToneIntervalLabel(relationship.toneInToChord),
      });
    }

    for (const tone of guidance.transition.enteringTones) {
      emphasis.set(tone.pitchClass, {
        kind: "objective-target",
        label: getResolvedChordToneIntervalLabel(tone),
      });
    }

    for (const approach of guidance.suggestedApproaches) {
      if (!emphasis.has(approach.sourcePitchClass)) {
        emphasis.set(approach.sourcePitchClass, {
          kind: "connection",
          label: formatPitchClass(approach.sourcePitchClass),
        });
      }
    }
  }

  return emphasis;
};

export default function ImprovisationWorkspace({
  currentKey,
  currentScale,
  fretCount,
  guidance,
  onExit,
  onSelectStep,
  progression,
  tuning,
}: ImprovisationWorkspaceProps) {
  const [objective, setObjective] =
    useState<ImprovisationObjective>("chord-tones");
  const emphasis = useMemo(
    () => buildEmphasis(objective, guidance),
    [guidance, objective],
  );
  const objectiveAvailability = getImprovisationObjectiveAvailability(
    guidance,
    objective,
  );
  const chord: ChordVisualization = useMemo(
    () => ({
      tones: guidance.activeStep.chord.tones.map((tone) => ({
        intervalName: getResolvedChordToneIntervalLabel(tone),
        pitchClass: tone.pitchClass,
        role: tone.role,
      })),
    }),
    [guidance.activeStep.chord.tones],
  );
  const previousIndex =
    guidance.activeStepIndex > 0
      ? guidance.activeStepIndex - 1
      : progression.template.form === "loop"
        ? progression.steps.length - 1
        : undefined;
  const nextIndex = guidance.nextStep
    ? guidance.isLoopClosure
      ? 0
      : guidance.activeStepIndex + 1
    : undefined;
  const transitionLabel = guidance.nextStep
    ? `${guidance.activeStep.chord.name} → ${guidance.nextStep.chord.name}${guidance.isLoopClosure ? " · loop" : ""}`
    : `${guidance.activeStep.chord.name} · phrase destination`;

  return (
    <section className="improvisationWorkspace">
      <header className="improvisationWorkspace__header">
        <div>
          <span>Improvisation Mode</span>
          <h1>{progression.template.title}</h1>
          <p>Decide what to emphasize now, then prepare the next change.</p>
        </div>
        <button onClick={onExit} type="button">
          Exit Improvisation Mode
        </button>
      </header>

      <fieldset className="improvisationWorkspace__objectives">
        <legend>Improvisation objective</legend>
        {(Object.keys(objectiveLabels) as ImprovisationObjective[]).map(
          (option) => (
            <button
              aria-pressed={objective === option}
              key={option}
              onClick={() => setObjective(option)}
              type="button"
            >
              <strong>{objectiveLabels[option]}</strong>
              <small>
                {option === "chord-tones"
                  ? "Anchor the harmony"
                  : option === "target-third"
                    ? "Hear chord quality"
                    : "Prepare the next chord"}
              </small>
            </button>
          ),
        )}
      </fieldset>

      <nav
        aria-label="Improvisation chord navigation"
        className="improvisationWorkspace__navigation"
      >
        <button
          disabled={previousIndex === undefined}
          onClick={() =>
            previousIndex !== undefined && onSelectStep(previousIndex)
          }
          type="button"
        >
          ← Previous chord
        </button>
        <div aria-atomic="true" aria-live="polite">
          <small>
            Chord {guidance.activeStepIndex + 1} of {progression.steps.length}
          </small>
          <strong>{transitionLabel}</strong>
        </div>
        <button
          disabled={nextIndex === undefined}
          onClick={() => nextIndex !== undefined && onSelectStep(nextIndex)}
          type="button"
        >
          Next chord →
        </button>
      </nav>

      <fieldset className="improvisationWorkspace__timeline">
        <legend>Progression steps</legend>
        {progression.steps.map((step, index) => (
          <button
            aria-label={`Select chord ${index + 1}: ${step.chord.name}`}
            aria-pressed={index === guidance.activeStepIndex}
            key={step.id}
            onClick={() => onSelectStep(index)}
            type="button"
          >
            <span>{step.chord.romanNumeral}</span>
            <strong>{step.chord.name}</strong>
          </button>
        ))}
      </fieldset>

      <section
        className="improvisationWorkspace__instruction"
        data-objective-available={objectiveAvailability.available}
        aria-live="polite"
      >
        <div>
          <span>Current objective</span>
          <h2>{objectiveLabels[objective]}</h2>
        </div>
        <p>{getInstruction(objective, guidance)}</p>
      </section>

      <div className="improvisationWorkspace__neck">
        <FretboardNeck
          accessibleLabel={`${guidance.activeStep.chord.name} improvisation fretboard`}
          accessibleSummary={`${getInstruction(objective, guidance)} Objective targets use a strong ring; next-chord connections use a secondary ring.`}
          chord={chord}
          currentKey={currentKey}
          currentScale={currentScale}
          displayMode="chord-tones"
          fretCount={fretCount}
          pitchClassContexts={guidance.pitchContexts}
          pitchClassEmphasis={emphasis}
          tuning={tuning}
          visualizationMode="improvisation"
        />
        <ul
          className="improvisationWorkspace__legend"
          aria-label="Fretboard legend"
        >
          <li>
            <i data-kind="target" /> Objective target
          </li>
          {objective === "connect-changes" && (
            <li>
              <i data-kind="connection" /> Next-chord connection
            </li>
          )}
          <li>
            <i data-kind="chord" /> Active chord tone
          </li>
          <li>
            <i data-kind="scale" /> Other scale note
          </li>
        </ul>
      </div>

      {objective === "connect-changes" && guidance.nextStep && (
        <section className="improvisationWorkspace__connections">
          <div>
            <span>Useful connection</span>
            <h2>{transitionLabel}</h2>
          </div>
          <ul>
            {guidance.transition?.commonTones.slice(0, 2).map((tone) => (
              <li key={`common-${tone.pitchClass}`}>
                Retain {formatNoteName(tone.toneInFromChord.name)}:{" "}
                {formatChordIntervalName(
                  getResolvedChordToneIntervalLabel(tone.toneInFromChord),
                )}{" "}
                becomes{" "}
                {formatChordIntervalName(
                  getResolvedChordToneIntervalLabel(tone.toneInToChord),
                )}
                .
              </li>
            ))}
            {guidance.suggestedApproaches.map((approach) => (
              <li
                key={`${approach.sourcePitchClass}-${approach.targetTone.pitchClass}-${approach.direction}`}
              >
                {formatApproach(approach)}
              </li>
            ))}
          </ul>
          <p>
            These are possibilities, not guaranteed or exclusive resolutions.
          </p>
        </section>
      )}
    </section>
  );
}
