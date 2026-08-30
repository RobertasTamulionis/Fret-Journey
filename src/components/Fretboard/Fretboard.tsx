"use client";
import Link from "next/link";
import { getProgressionBySlug } from "@/data/progressionCatalog";
import {
  buildProgressionHref,
  getResolvedChordToneIntervalLabel,
  resolveRelativeChord,
} from "@/features/progressions";
import {
  buildCagedChordShape,
  buildScaleShape,
  formatNoteName,
  getScaleChords,
  getScaleShapeSystem,
} from "@/helpers/fretboardHelpers";
import { useAppSelector } from "@/lib/redux/store";
import AvailableKeys from "../AvailableKeys/AvailableKeys";
import AvailableScales from "../AvailableScales/AvailableScales";
import DisplayModeSelector from "../DisplayModeSelector/DisplayModeSelector";
import FretCountSelector from "../FretCountSelector/FretCountSelector";
import ScaleChords from "../ScaleChords/ScaleChords";
import ScaleShapes from "../ScaleShapes/ScaleShapes";
import StringCountSelector from "../StringCountSelector/StringCountSelector";
import FretboardNeck from "./FretboardNeck";

export default function Fretboard() {
  const {
    tuning,
    fretCount,
    currentKey,
    currentScale,
    activeShape,
    shapeSystem,
    showShapes,
    displayMode,
    chordSize,
    selectedChordDegree,
    activeProgressionChord,
  } = useAppSelector((state) => state.fretboard);

  const activeShapePositions = buildScaleShape(
    shapeSystem,
    tuning,
    fretCount,
    currentKey,
    currentScale,
    activeShape,
  );
  const activeCagedChordPositions =
    shapeSystem === "caged"
      ? buildCagedChordShape(
          tuning,
          fretCount,
          currentKey,
          currentScale,
          activeShape,
        )
      : undefined;
  const activeCagedShapeLabel =
    shapeSystem === "caged"
      ? getScaleShapeSystem(shapeSystem, currentScale).shapes[activeShape]
          ?.label
      : undefined;
  const scaleChords = getScaleChords(currentKey, currentScale, chordSize);
  const selectedScaleChord =
    scaleChords.find(({ degree }) => degree === selectedChordDegree) ??
    scaleChords[0];
  const progressionTemplate = activeProgressionChord
    ? getProgressionBySlug(activeProgressionChord.progressionSlug)
    : undefined;
  const progressionStep = progressionTemplate?.steps.find(
    ({ id }) => id === activeProgressionChord?.stepId,
  );
  const progressionChord = progressionStep
    ? resolveRelativeChord(progressionStep.chord, currentKey)
    : undefined;
  const chordVisualization = progressionChord
    ? {
        tones: progressionChord.tones.map((tone) => ({
          intervalName: getResolvedChordToneIntervalLabel(tone),
          pitchClass: tone.pitchClass,
          role: tone.role,
        })),
      }
    : { tones: selectedScaleChord.notes };

  return (
    <>
      <div className="fretboard__dashboard">
        <AvailableKeys />
        <AvailableScales />
        <StringCountSelector />
        <FretCountSelector />
        <ScaleShapes />
        <DisplayModeSelector />
        <ScaleChords />
      </div>
      {progressionTemplate && progressionStep && progressionChord && (
        <div
          aria-atomic="true"
          aria-live="polite"
          className="fretboard__progressionBridge"
        >
          <span>Progression chord</span>
          <strong>{progressionChord.name}</strong>
          <span>
            {progressionChord.tones
              .map(({ name }) => formatNoteName(name))
              .join(" · ")}
          </span>
          <Link
            href={buildProgressionHref(
              progressionTemplate.slug,
              currentKey,
              currentScale,
            )}
          >
            Return to {progressionTemplate.title}
          </Link>
        </div>
      )}
      <FretboardNeck
        accessibleLabel={
          progressionChord
            ? `${progressionChord.name} chord tones on the guitar fretboard`
            : undefined
        }
        cagedAnchorLabel={activeCagedShapeLabel}
        cagedAnchorPositions={
          showShapes ? activeCagedChordPositions : undefined
        }
        chord={chordVisualization}
        currentKey={currentKey}
        currentScale={currentScale}
        displayMode={displayMode}
        fretCount={fretCount}
        shapeIndex={activeShape}
        shapePositions={showShapes ? activeShapePositions : undefined}
        tuning={tuning}
      />
    </>
  );
}
