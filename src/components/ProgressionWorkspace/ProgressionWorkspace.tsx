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
  getVoicingLocation,
  getVoicingPositionLabel,
  groupVoicingsByNeckRegion,
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

type ProgressionWorkspaceProps = { progression: ProgressionTemplate };
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

const getExactPositions = (voicing: PlayableVoicing): ReadonlySet<string> =>
  new Set(
    voicing.strings.flatMap((state) =>
      state.kind === "fretted" ? [`${state.stringIndex}-${state.fret}`] : [],
    ),
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
  const {
    activeStepIndex,
    selectedVoicingSignaturesByStepId,
    visualizationMode,
  } = useAppSelector((state) => state.progressionLab);

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
      ({ signature }) =>
        signature === selectedVoicingSignaturesByStepId[activeStep.id],
    ) ?? activeVoicings[0];
  const selectedLocation = getVoicingLocation(selectedVoicing);
  const locationGroups = useMemo(
    () => groupVoicingsByNeckRegion(activeVoicings),
    [activeVoicings],
  );
  const activeGroup =
    locationGroups.find(({ id }) => id === selectedLocation.region.id) ??
    locationGroups.find(({ locations }) => locations.length > 0);
  const activeLocations = activeGroup?.locations ?? [selectedLocation];
  const activeVoicingIndex = Math.max(
    0,
    activeLocations.findIndex(
      ({ signature }) => signature === selectedVoicing.signature,
    ),
  );
  const exactPositions = useMemo(
    () => getExactPositions(selectedVoicing),
    [selectedVoicing],
  );
  const chordVisualization = useMemo(
    () => getChordVisualization(activeStep.chord),
    [activeStep.chord],
  );
  const tuningLabel = getTuningLabel(stringCount, registeredTuning);

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

  const selectVoicing = (signature: string) => {
    dispatch(setSelectedVoicingSignature({ signature, stepId: activeStep.id }));
    dispatch(setProgressionVisualizationMode("selected-voicing"));
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
        <div className="progressionWorkspace__identity">
          <Link className="progressionWorkspace__backLink" href="/progressions">
            <span aria-hidden="true">←</span> Progressions
          </Link>
          <span className="progressionWorkspace__eyebrow">
            {progression.category.replaceAll("-", " ")} · {progression.form}
          </span>
          <h1>{progression.title}</h1>
          <p className="progressionWorkspace__formula">{resolved.formula}</p>
          <p className="progressionWorkspace__chordNames">
            {resolved.chordNames.join(" – ")}
          </p>
        </div>
        <div className="progressionWorkspace__heroAside">
          <ProgressionContext compact />
          <p className="progressionWorkspace__why">
            <strong>Why it works</strong>
            {progression.explanation}
          </p>
        </div>
      </header>

      {!resolved.compatible && (
        <div
          aria-live="polite"
          className="progressionWorkspace__compatibilityNotice"
        >
          <strong>Outside this progression’s reviewed scale context.</strong>
          <span>
            The formula remains unchanged in {formatNoteName(currentKey)}. Its
            reviewed context is {getCompatibleScaleLabel(progression)}.
          </span>
        </div>
      )}

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
              className="progressionWorkspace__timelineStep"
              key={step.id}
              onClick={() => selectStep(index)}
              style={{ flexGrow: step.durationBeats }}
              type="button"
            >
              <span>{step.chord.romanNumeral}</span>
              <strong>{step.chord.name}</strong>
              <small>
                {isActive ? "Active" : `${step.durationBeats} beats`}
              </small>
            </button>
          );
        })}
      </fieldset>

      <section
        className="progressionWorkspace__main"
        id="active-progression-chord"
      >
        <div className="progressionWorkspace__neckWorkspace">
          <div className="progressionWorkspace__activeHeader">
            <div aria-atomic="true" aria-live="polite">
              <span className="progressionWorkspace__sectionEyebrow">
                {activeStep.chord.romanNumeral}
                {activeStep.chord.harmonicScope !== "diatonic" &&
                  ` · ${harmonicScopeLabels[activeStep.chord.harmonicScope]}`}
              </span>
              <h2>{activeStep.chord.name}</h2>
              <p>
                {activeStep.chord.tones
                  .map(({ name }) => formatNoteName(name))
                  .join(" · ")}
              </p>
            </div>
            <div className="progressionWorkspace__neckActions">
              <fieldset>
                <legend>Fretboard view</legend>
                <button
                  aria-pressed={visualizationMode === "selected-voicing"}
                  onClick={() =>
                    dispatch(
                      setProgressionVisualizationMode("selected-voicing"),
                    )
                  }
                  type="button"
                >
                  Selected voicing
                </button>
                <button
                  aria-pressed={visualizationMode === "all-chord-tones"}
                  onClick={() =>
                    dispatch(setProgressionVisualizationMode("all-chord-tones"))
                  }
                  type="button"
                >
                  All chord tones
                </button>
              </fieldset>
              <FretCountSelector />
              <button onClick={openOnFretboard} type="button">
                Open on Fretboard
              </button>
            </div>
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
        </div>

        <aside className="progressionWorkspace__voicingPanel">
          <div>
            <span className="progressionWorkspace__sectionEyebrow">
              Chord shape
            </span>
            <h2>{activeStep.chord.name}</h2>
            <p>
              {activeStep.chord.romanNumeral} · chord {safeActiveStepIndex + 1}{" "}
              / {resolved.steps.length}
            </p>
          </div>

          <fieldset className="progressionWorkspace__regions">
            <legend>Voicing neck location</legend>
            {locationGroups.map((group) => (
              <button
                aria-label={`${group.label}, ${group.locations.length} grips`}
                aria-pressed={group.id === activeGroup?.id}
                disabled={group.locations.length === 0}
                key={group.id}
                onClick={() =>
                  group.locations[0] &&
                  selectVoicing(group.locations[0].signature)
                }
                type="button"
              >
                {group.label}
              </button>
            ))}
          </fieldset>

          <ChordDiagram
            size="compact"
            tuningLabel={tuningLabel}
            voicing={selectedVoicing}
          />

          <div className="progressionWorkspace__voicingNavigation">
            <button
              aria-label="Previous generated voicing"
              disabled={activeVoicingIndex === 0}
              onClick={() =>
                selectVoicing(activeLocations[activeVoicingIndex - 1].signature)
              }
              type="button"
            >
              ‹
            </button>
            <span aria-live="polite">
              {activeVoicingIndex + 1} / {activeLocations.length}
            </span>
            <button
              aria-label="Next generated voicing"
              disabled={activeVoicingIndex === activeLocations.length - 1}
              onClick={() =>
                selectVoicing(activeLocations[activeVoicingIndex + 1].signature)
              }
              type="button"
            >
              ›
            </button>
          </div>

          <dl className="progressionWorkspace__voicingFacts">
            <div>
              <dt>Position</dt>
              <dd>{getVoicingPositionLabel(selectedVoicing)}</dd>
            </div>
            <div>
              <dt>Location</dt>
              <dd>{selectedLocation.label}</dd>
            </div>
            <div>
              <dt>Difficulty</dt>
              <dd>{selectedVoicing.difficulty.label}</dd>
            </div>
          </dl>
        </aside>
      </section>

      <section
        aria-labelledby="progression-shapes-heading"
        className="progressionWorkspace__shapes"
      >
        <div className="progressionWorkspace__shapesHeader">
          <span className="progressionWorkspace__sectionEyebrow">
            Physical path
          </span>
          <h2 id="progression-shapes-heading">Progression shapes</h2>
        </div>
        <div className="progressionWorkspace__shapeStrip">
          {resolved.steps.map((step, index) => {
            const stepVoicings = voicingsByStep[index];
            const voicing =
              stepVoicings.find(
                ({ signature }) =>
                  signature === selectedVoicingSignaturesByStepId[step.id],
              ) ?? stepVoicings[0];
            const location = getVoicingLocation(voicing);

            return (
              <button
                aria-label={`Select ${step.chord.name}, step ${index + 1}, ${location.label}`}
                aria-pressed={index === safeActiveStepIndex}
                className="progressionWorkspace__shapePreview"
                key={step.id}
                onClick={() => selectStep(index)}
                type="button"
              >
                <span>
                  <strong>{step.chord.name}</strong>
                  <small>{step.chord.romanNumeral}</small>
                </span>
                <ChordDiagram
                  size="compact"
                  tuningLabel={tuningLabel}
                  voicing={voicing}
                />
                <small>{location.label}</small>
              </button>
            );
          })}
        </div>
      </section>
    </section>
  );
}
