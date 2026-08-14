"use client";
import { type CSSProperties, Fragment } from "react";
import {
  buildCagedChordShape,
  buildFretPositions,
  buildScaleShape,
  formatNoteName,
  getChordTone,
  getChordToneIntervalName,
  getScaleChords,
  getScaleShapeSystem,
  guitarStringIds,
} from "@/helpers/fretboardHelpers";
import type {
  IntervalName,
  PitchClass,
  ScaleDegree,
  ScaleDegreeLabel,
} from "@/helpers/typesHelpers";
import { useAppSelector } from "@/lib/redux/store";
import AvailableKeys from "../AvailableKeys/AvailableKeys";
import AvailableScales from "../AvailableScales/AvailableScales";
import DisplayModeSelector from "../DisplayModeSelector/DisplayModeSelector";
import FretboardNumbers from "../FretboardNumbers/FretboardNumbers";
import FretCountSelector from "../FretCountSelector/FretCountSelector";
import ScaleChords from "../ScaleChords/ScaleChords";
import ScaleShapes from "../ScaleShapes/ScaleShapes";
import StringCountSelector from "../StringCountSelector/StringCountSelector";
import Tuning from "../Tuning/Tuning";
import "./fretboard.scss";

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
  } = useAppSelector((state) => state.fretboard);

  const fretPositions = buildFretPositions(
    tuning,
    fretCount,
    currentKey,
    currentScale,
  );
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
  const selectedChord =
    scaleChords.find(({ degree }) => degree === selectedChordDegree) ??
    scaleChords[0];

  const buildCurrentNoteClassName = (scaleDegree?: ScaleDegree) => {
    if (scaleDegree) {
      return `fretboard__fret-piece--note-${scaleDegree}`;
    }

    return "";
  };

  const buildNoteFontSizeClassName = (label?: string) => {
    if (label && label.length > 2) {
      return "fretboard__fret-piece--double-note";
    }

    return "";
  };

  const getSpokenScaleDegree = (degreeLabel: ScaleDegreeLabel): string => {
    if (degreeLabel.startsWith("b")) {
      return `flat ${degreeLabel.slice(1)}`;
    }

    return degreeLabel;
  };

  const getFretLabel = (
    pitchClass: PitchClass,
    noteName?: string,
    scaleDegree?: ScaleDegree,
    degreeLabel?: ScaleDegreeLabel,
    intervalName?: IntervalName,
  ): string | undefined => {
    if (displayMode === "chord-tones") {
      const chordToneName = getChordToneIntervalName(selectedChord, pitchClass);

      if (chordToneName) {
        return chordToneName;
      }

      return scaleDegree && noteName ? formatNoteName(noteName) : undefined;
    }

    if (!scaleDegree) {
      return undefined;
    }

    if (displayMode === "degrees") {
      return degreeLabel;
    }

    if (displayMode === "intervals") {
      return intervalName;
    }

    return noteName ? formatNoteName(noteName) : undefined;
  };

  const buildChordToneClassName = (
    pitchClass: PitchClass,
    isScaleNote: boolean,
  ): string => {
    if (displayMode !== "chord-tones") {
      return "";
    }

    const chordTone = getChordTone(selectedChord, pitchClass);

    if (!chordTone) {
      return isScaleNote ? "fretboard__fret-piece--muted" : "";
    }

    return `fretboard__fret-piece--chord-tone fretboard__fret-piece--chord-${chordTone.role}`;
  };

  const buildShapesClassName = (stringIndex: number, fret: number): string => {
    if (!showShapes || !activeShapePositions.has(`${stringIndex}-${fret}`)) {
      return "";
    }

    return `fretboard__fret-piece--S${activeShape + 1}`;
  };

  const buildFretboard = () =>
    fretPositions.map((stringPositions, stringIndex) => (
      <div
        key={guitarStringIds[stringIndex]}
        className={`fretboard__string s-${stringIndex + 1}`}
      >
        {stringPositions.map(
          ({
            fret,
            pitchClass,
            noteName,
            scaleDegree,
            degreeLabel,
            intervalName,
          }) => {
            const isScaleNote = Boolean(scaleDegree);
            const isChordTone =
              displayMode === "chord-tones" &&
              selectedChord.notes.some(
                (note) => note.pitchClass === pitchClass,
              );
            const isVisibleNote = isScaleNote || isChordTone;
            const isCagedAnchor =
              showShapes &&
              activeCagedChordPositions?.has(`${stringIndex}-${fret}`);
            const fretLabel = getFretLabel(
              pitchClass,
              noteName,
              scaleDegree,
              degreeLabel,
              intervalName,
            );
            const noteClassName = `
            fretboard__fret-piece
            ${isVisibleNote ? "fretboard__fret-piece--note" : ""}
            ${buildCurrentNoteClassName(scaleDegree)}
            ${buildNoteFontSizeClassName(fretLabel)}
            ${buildShapesClassName(stringIndex, fret)}
            ${buildChordToneClassName(pitchClass, isScaleNote)}
          `;

            return (
              <div
                data-note={fretLabel}
                className={noteClassName}
                key={`${stringIndex}-${fret}`}
              >
                {isCagedAnchor && activeCagedShapeLabel && degreeLabel && (
                  <span
                    aria-label={`${activeCagedShapeLabel} chord anchor at string ${stringIndex + 1}, fret ${fret}, scale degree ${getSpokenScaleDegree(degreeLabel)}`}
                    className="fretboard__caged-anchor-ring"
                    role="img"
                  />
                )}
              </div>
            );
          },
        )}
      </div>
    ));

  return (
    <Fragment>
      <div className="fretboard__dashboard">
        <AvailableKeys />
        <AvailableScales />
        <StringCountSelector />
        <FretCountSelector />
        <ScaleShapes />
        <DisplayModeSelector />
        <ScaleChords />
      </div>
      <div
        className="fretboard"
        data-fret-count={fretCount}
        style={{ "--string-count": tuning.length } as CSSProperties}
      >
        <Tuning key={tuning.length} />
        <div className="fretboard__notes">{buildFretboard()}</div>
        <FretboardNumbers />
      </div>
    </Fragment>
  );
}
