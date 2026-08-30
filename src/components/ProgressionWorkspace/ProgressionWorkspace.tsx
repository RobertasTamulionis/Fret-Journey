"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";
import ChordDiagram from "@/components/ChordDiagram/ChordDiagram";
import FretboardNeck, {
  type ChordVisualization,
} from "@/components/Fretboard/FretboardNeck";
import FretCountSelector from "@/components/FretCountSelector/FretCountSelector";
import ProgressionContext from "@/components/ProgressionContext/ProgressionContext";
import {
  getResolvedChordToneIntervalLabel,
  type ProgressionTemplate,
  type ResolvedChord,
  resolveProgression,
} from "@/features/progressions";
import { useProgressionUrlContext } from "@/features/progressions/useProgressionUrlContext";
import {
  buildResolvedChordVoicingRequest,
  generateChordVoicings,
  getVoicingPositionLabel,
  type PlayableVoicing,
} from "@/features/voicings";
import {
  formatNoteName,
  getTuningLabel,
  scaleDefinitions,
} from "@/helpers/fretboardHelpers";
import type {
  GuitarStringCount,
  PitchClass,
  RegisteredTuningState,
} from "@/helpers/typesHelpers";
import { setActiveProgressionChord } from "@/lib/redux/slices/fretboardSlice";
import {
  resetProgressionDetail,
  setProgressionActiveStep,
  setProgressionVisualizationMode,
  setSelectedVoicingSignature,
} from "@/lib/redux/slices/progressionLabSlice";
import { useAppDispatch, useAppSelector } from "@/lib/redux/store";
import "./progressionWorkspace.scss";

type ProgressionWorkspaceProps = {
  progression: ProgressionTemplate;
};

type VoicingSet = [PlayableVoicing, ...PlayableVoicing[]];

const harmonicScopeLabels: Record<ResolvedChord["harmonicScope"], string> = {
  borrowed: "Borrowed",
  chromatic: "Chromatic",
  diatonic: "Diatonic",
  "modal-interchange": "Modal interchange",
  "secondary-dominant": "Secondary dominant",
};

const getVoicings = (
  chord: ResolvedChord,
  registeredTuning: RegisteredTuningState,
  stringCount: GuitarStringCount,
  tuning: readonly PitchClass[],
): VoicingSet => {
  const voicings = generateChordVoicings(
    buildResolvedChordVoicingRequest(chord, {
      registeredTuning,
      stringCount,
      tuning,
    }),
  );

  if (voicings.length === 0) {
    throw new Error(
      `Dynamic voicing coverage invariant failed for ${chord.name} on ${stringCount} strings`,
    );
  }

  return voicings as VoicingSet;
};

const getChordVisualization = (chord: ResolvedChord): ChordVisualization => ({
  tones: chord.tones.map((tone) => ({
    intervalName: getResolvedChordToneIntervalLabel(tone),
    pitchClass: tone.pitchClass,
    role: tone.role,
  })),
});

const getExactPositions = (
  voicing: PlayableVoicing | undefined,
): ReadonlySet<string> =>
  new Set(
    voicing?.strings.flatMap((state) =>
      state.kind === "fretted" ? [`${state.stringIndex}-${state.fret}`] : [],
    ) ?? [],
  );

const getCompatibleScaleLabel = (progression: ProgressionTemplate): string =>
  progression.compatibleScales
    .map((scale) => scaleDefinitions[scale].label)
    .join(" or ");

export default function ProgressionWorkspace({
  progression,
}: ProgressionWorkspaceProps) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const isUrlContextReady = useProgressionUrlContext();
  const {
    currentKey,
    currentScale,
    fretCount,
    registeredTuning,
    stringCount,
    tuning,
  } = useAppSelector((state) => state.fretboard);
  const { activeStepIndex, selectedVoicingSignature, visualizationMode } =
    useAppSelector((state) => state.progressionLab);

  useEffect(() => {
    dispatch(resetProgressionDetail());
  }, [dispatch]);

  const resolved = useMemo(
    () => resolveProgression(progression, { currentKey, currentScale }),
    [currentKey, currentScale, progression],
  );
  const safeActiveStepIndex = Math.min(
    activeStepIndex,
    resolved.steps.length - 1,
  );
  const activeStep = resolved.steps[safeActiveStepIndex];
  const voicingsByStep = useMemo(
    () =>
      resolved.steps.map(({ chord }) =>
        getVoicings(chord, registeredTuning, stringCount, tuning),
      ),
    [registeredTuning, resolved.steps, stringCount, tuning],
  );
  const activeVoicings = voicingsByStep[safeActiveStepIndex];
  const selectedVoicing =
    activeVoicings.find(
      ({ signature }) => signature === selectedVoicingSignature,
    ) ?? activeVoicings[0];
  const exactPositions = useMemo(
    () => getExactPositions(selectedVoicing),
    [selectedVoicing],
  );
  const chordVisualization = useMemo(
    () => getChordVisualization(activeStep.chord),
    [activeStep.chord],
  );
  const tuningLabel = getTuningLabel(stringCount, registeredTuning);
  const isFirstStep = safeActiveStepIndex === 0;
  const isLastStep = safeActiveStepIndex === resolved.steps.length - 1;

  if (!isUrlContextReady) {
    return (
      <div aria-live="polite" className="progressionWorkspace__loading">
        Resolving progression context…
      </div>
    );
  }

  const selectStep = (index: number) => {
    dispatch(setProgressionActiveStep(index));
  };

  const openOnFretboard = () => {
    dispatch(
      setActiveProgressionChord({
        progressionSlug: progression.slug,
        stepId: activeStep.id,
      }),
    );
    router.push("/");
  };

  return (
    <section className="progressionWorkspace">
      <header className="progressionWorkspace__hero">
        <div>
          <Link className="progressionWorkspace__backLink" href="/progressions">
            <span aria-hidden="true">←</span> Progression library
          </Link>
          <span className="progressionWorkspace__eyebrow">
            {progression.category.replaceAll("-", " ")} · {progression.form}
          </span>
          <h1 className="progressionWorkspace__heading">{progression.title}</h1>
          <p className="progressionWorkspace__formula">{resolved.formula}</p>
          <p className="progressionWorkspace__chordNames">
            {resolved.chordNames.join(" – ")}
          </p>
        </div>
        <div className="progressionWorkspace__why">
          <span>Why it works</span>
          <p>{progression.explanation}</p>
        </div>
      </header>

      <ProgressionContext compact />

      {!resolved.compatible && (
        <div
          aria-atomic="true"
          aria-live="polite"
          className="progressionWorkspace__compatibilityNotice"
        >
          <strong>This formula is not authored for the selected scale.</strong>
          <span>
            It remains unchanged and is shown in {formatNoteName(currentKey)}.
            Choose {getCompatibleScaleLabel(progression)} for its reviewed tonal
            context.
          </span>
        </div>
      )}

      <section
        aria-labelledby="progression-timeline-heading"
        className="progressionWorkspace__timelinePanel"
      >
        <div className="progressionWorkspace__sectionHeader">
          <div>
            <span className="progressionWorkspace__sectionEyebrow">
              Harmonic timeline
            </span>
            <h2 id="progression-timeline-heading">Choose a chord step</h2>
          </div>
          <div className="progressionWorkspace__timelineNavigation">
            <button
              aria-label="Select previous chord"
              disabled={isFirstStep}
              onClick={() => selectStep(safeActiveStepIndex - 1)}
              type="button"
            >
              Previous
            </button>
            <span aria-live="polite">
              {safeActiveStepIndex + 1} / {resolved.steps.length}
            </span>
            <button
              aria-label="Select next chord"
              disabled={isLastStep}
              onClick={() => selectStep(safeActiveStepIndex + 1)}
              type="button"
            >
              Next
            </button>
          </div>
        </div>
        <fieldset
          aria-label="Progression chord timeline"
          className="progressionWorkspace__timeline"
        >
          {resolved.steps.map((step, index) => {
            const isActive = index === safeActiveStepIndex;

            return (
              <button
                aria-controls="active-progression-chord"
                aria-label={`Select step ${index + 1}: ${step.chord.romanNumeral}, ${step.chord.name}, ${step.durationBeats} beats`}
                aria-pressed={isActive}
                className={`progressionWorkspace__timelineStep ${
                  isActive ? "progressionWorkspace__timelineStep--active" : ""
                }`}
                key={step.id}
                onClick={() => selectStep(index)}
                style={{ flexGrow: step.durationBeats }}
                type="button"
              >
                <span>{step.chord.romanNumeral}</span>
                <strong>{step.chord.name}</strong>
                <small>
                  {step.durationBeats} beats
                  {step.chord.harmonicScope !== "diatonic" &&
                    ` · ${harmonicScopeLabels[step.chord.harmonicScope]}`}
                </small>
              </button>
            );
          })}
        </fieldset>
      </section>

      <section
        className="progressionWorkspace__activeChord"
        id="active-progression-chord"
      >
        <div className="progressionWorkspace__activeHeader">
          <div aria-atomic="true" aria-live="polite">
            <span className="progressionWorkspace__sectionEyebrow">
              Active chord · {activeStep.chord.romanNumeral}
              {activeStep.chord.harmonicScope !== "diatonic" &&
                ` · ${harmonicScopeLabels[activeStep.chord.harmonicScope]}`}
            </span>
            <h2>{activeStep.chord.name}</h2>
            <p className="progressionWorkspace__noteList">
              {activeStep.chord.tones
                .map(({ name }) => formatNoteName(name))
                .join(" · ")}
            </p>
            {activeStep.annotation && <p>{activeStep.annotation}</p>}
          </div>
          <button
            className="progressionWorkspace__openButton"
            onClick={openOnFretboard}
            type="button"
          >
            Open on Fretboard
          </button>
        </div>

        <div className="progressionWorkspace__activeGrid">
          <div className="progressionWorkspace__voicingColumn">
            <div className="progressionWorkspace__viewControls">
              <fieldset>
                <legend>Fretboard view</legend>
                <div>
                  <button
                    aria-pressed={visualizationMode === "selected-voicing"}
                    onClick={() =>
                      dispatch(
                        setProgressionVisualizationMode("selected-voicing"),
                      )
                    }
                    type="button"
                  >
                    Selected Voicing
                  </button>
                  <button
                    aria-pressed={visualizationMode === "all-chord-tones"}
                    onClick={() =>
                      dispatch(
                        setProgressionVisualizationMode("all-chord-tones"),
                      )
                    }
                    type="button"
                  >
                    All Chord Tones
                  </button>
                </div>
              </fieldset>
              <div className="progressionWorkspace__fretControl">
                <FretCountSelector />
              </div>
            </div>

            <dl className="progressionWorkspace__voicingFacts">
              <div>
                <dt>Bass</dt>
                <dd>
                  {selectedVoicing.bass
                    ? formatNoteName(selectedVoicing.bass.noteName)
                    : "Register unavailable"}
                </dd>
              </div>
              <div>
                <dt>Position</dt>
                <dd>{getVoicingPositionLabel(selectedVoicing)}</dd>
              </div>
              <div>
                <dt>Fret span</dt>
                <dd>{selectedVoicing.fretSpan} frets</dd>
              </div>
              <div>
                <dt>Difficulty</dt>
                <dd>{selectedVoicing.difficulty.label}</dd>
              </div>
            </dl>

            {activeVoicings.length > 1 && (
              <section
                aria-labelledby="voicing-alternatives-heading"
                className="progressionWorkspace__alternatives"
              >
                <h3 id="voicing-alternatives-heading">
                  Generated alternatives
                </h3>
                <div>
                  {activeVoicings.slice(0, 4).map((voicing, index) => (
                    <div
                      className="progressionWorkspace__voicingOption"
                      data-selected={
                        selectedVoicing.signature === voicing.signature
                      }
                      key={voicing.signature}
                    >
                      <ChordDiagram
                        size="compact"
                        tuningLabel={tuningLabel}
                        voicing={voicing}
                      />
                      <button
                        aria-label={`Select ${voicing.chordName}, ${getVoicingPositionLabel(voicing)}, base fret ${voicing.baseFret}`}
                        aria-pressed={
                          selectedVoicing.signature === voicing.signature
                        }
                        onClick={() =>
                          dispatch(
                            setSelectedVoicingSignature(voicing.signature),
                          )
                        }
                        type="button"
                      >
                        {selectedVoicing.signature === voicing.signature
                          ? `Voicing ${index + 1} selected`
                          : `Use voicing ${index + 1}`}
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          <div className="progressionWorkspace__diagramColumn">
            <span className="progressionWorkspace__sectionEyebrow">
              Complete generated voicing
            </span>
            <ChordDiagram
              size="large"
              tuningLabel={tuningLabel}
              voicing={selectedVoicing}
            />
          </div>
        </div>
      </section>

      <section
        aria-labelledby="progression-neck-heading"
        className="progressionWorkspace__neckPanel"
      >
        <div className="progressionWorkspace__sectionHeader">
          <div>
            <span className="progressionWorkspace__sectionEyebrow">
              One neck, two meanings
            </span>
            <h2 id="progression-neck-heading">
              {visualizationMode === "selected-voicing"
                ? "Selected generated voicing"
                : "All matching chord tones"}
            </h2>
          </div>
          <p>
            {visualizationMode === "selected-voicing"
              ? "Only the exact generated fretted positions in this complete chord shape are highlighted."
              : "Every matching pitch class is highlighted; this is not one playable grip."}
          </p>
        </div>
        <FretboardNeck
          accessibleLabel={`${activeStep.chord.name} progression fretboard`}
          chord={chordVisualization}
          currentKey={currentKey}
          currentScale={currentScale}
          displayMode="chord-tones"
          exactPositions={exactPositions}
          fretCount={fretCount}
          tuning={tuning}
          visualizationMode={visualizationMode}
        />
      </section>

      <section
        aria-labelledby="progression-overview-heading"
        className="progressionWorkspace__overview"
      >
        <div className="progressionWorkspace__sectionHeader">
          <div>
            <span className="progressionWorkspace__sectionEyebrow">
              Complete progression
            </span>
            <h2 id="progression-overview-heading">Every chord at a glance</h2>
          </div>
          <p>Every diagram is generated from the complete authored chord.</p>
        </div>
        <div className="progressionWorkspace__overviewGrid">
          {resolved.steps.map((step, index) => {
            const overviewVoicing = voicingsByStep[index][0];

            return (
              <article
                className={`progressionWorkspace__overviewCard ${
                  index === safeActiveStepIndex
                    ? "progressionWorkspace__overviewCard--active"
                    : ""
                }`}
                key={step.id}
              >
                <div className="progressionWorkspace__overviewHeading">
                  <span>{step.chord.romanNumeral}</span>
                  <strong>{step.chord.name}</strong>
                </div>
                <ChordDiagram
                  size="compact"
                  tuningLabel={tuningLabel}
                  voicing={overviewVoicing}
                />
                <button
                  aria-label={`Inspect ${step.chord.name}, step ${index + 1}`}
                  onClick={() => selectStep(index)}
                  type="button"
                >
                  Inspect chord
                </button>
              </article>
            );
          })}
        </div>
      </section>
    </section>
  );
}
