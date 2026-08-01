"use client";
import { type CSSProperties, Fragment } from "react";
import {
  buildFretPositions,
  buildScaleShape,
  getChordToneIntervalName,
  getScaleChords,
  guitarStringIds,
} from "@/helpers/fretboardHelpers";
import type { IntervalName, Note, ScaleDegree } from "@/helpers/typesHelpers";
import { useAppSelector } from "@/lib/redux/store";
import AvailableKeys from "../AvailableKeys/AvailableKeys";
import AvailableScales from "../AvailableScales/AvailableScales";
import DisplayModeSelector from "../DisplayModeSelector/DisplayModeSelector";
import FretboardNumbers from "../FretboardNumbers/FretboardNumbers";
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
  const scaleChords = getScaleChords(currentKey, currentScale);
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

  const getFretLabel = (
    note: Note,
    scaleDegree?: ScaleDegree,
    intervalName?: IntervalName,
  ): string | undefined => {
    if (displayMode === "chord-tones") {
      const chordToneName = getChordToneIntervalName(selectedChord, note);

      if (chordToneName) {
        return chordToneName;
      }

      return scaleDegree ? note : undefined;
    }

    if (!scaleDegree) {
      return undefined;
    }

    if (displayMode === "degrees") {
      return String(scaleDegree);
    }

    if (displayMode === "intervals") {
      return intervalName;
    }

    return note;
  };

  const buildChordToneClassName = (
    note: Note,
    isScaleNote: boolean,
  ): string => {
    if (displayMode !== "chord-tones") {
      return "";
    }

    const chordToneIndex = selectedChord.notes.indexOf(note);

    if (chordToneIndex === -1) {
      return isScaleNote ? "fretboard__fret-piece--muted" : "";
    }

    const chordToneClasses = ["root", "third", "fifth", "seventh"];
    return `fretboard__fret-piece--chord-tone fretboard__fret-piece--chord-${chordToneClasses[chordToneIndex]}`;
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
        {stringPositions.map(({ fret, note, scaleDegree, intervalName }) => {
          const isScaleNote = Boolean(scaleDegree);
          const isChordTone =
            displayMode === "chord-tones" && selectedChord.notes.includes(note);
          const isVisibleNote = isScaleNote || isChordTone;
          const fretLabel = getFretLabel(note, scaleDegree, intervalName);
          const noteClassName = `
            fretboard__fret-piece
            ${isVisibleNote ? "fretboard__fret-piece--note" : ""}
            ${buildCurrentNoteClassName(scaleDegree)}
            ${buildNoteFontSizeClassName(fretLabel)}
            ${buildShapesClassName(stringIndex, fret)}
            ${buildChordToneClassName(note, isScaleNote)}
          `;

          return (
            <div
              data-note={fretLabel}
              className={noteClassName}
              key={`${stringIndex}-${fret}`}
            />
          );
        })}
      </div>
    ));

  return (
    <Fragment>
      <div className="fretboard__dashboard">
        <AvailableKeys />
        <AvailableScales />
        <StringCountSelector />
        <ScaleShapes />
        <DisplayModeSelector />
        <ScaleChords />
      </div>
      <div
        className="fretboard"
        style={{ "--string-count": tuning.length } as CSSProperties}
      >
        <Tuning key={tuning.length} />
        <div className="fretboard__notes">{buildFretboard()}</div>
        <FretboardNumbers />
      </div>
    </Fragment>
  );
}
