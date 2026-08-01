"use client";
import type React from "react";
import { useState } from "react";
import {
  chromaticPitchClasses,
  formatPitchClass,
  getScaleDegree,
  guitarStringIds,
} from "@/helpers/fretboardHelpers";
import type { PitchClass } from "@/helpers/typesHelpers";
import { setTuningNote } from "@/lib/redux/slices/fretboardSlice";
import { useAppDispatch, useAppSelector } from "@/lib/redux/store";
import "./tuning.scss";

export default function Tuning(): React.ReactElement {
  const dispatch = useAppDispatch();

  const { tuning, currentKey, currentScale } = useAppSelector(
    (state) => state.fretboard,
  );

  const [activeStringIndex, setActiveStringIndex] = useState<number | null>(
    null,
  );

  const selectTuningNote = (
    pitchClass: PitchClass,
    tuningNoteIndex: number,
  ): void => {
    dispatch(
      setTuningNote({
        pitchClass,
        tuningNoteIndex,
      }),
    );
    setActiveStringIndex(null);
  };

  const tuningSelection = (tuningNoteIndex: number): React.ReactElement[] => {
    return chromaticPitchClasses.map((pitchClass) => {
      const isSelected = tuning[tuningNoteIndex] === pitchClass;

      return (
        <button
          aria-pressed={isSelected}
          key={pitchClass}
          onClick={() => selectTuningNote(pitchClass, tuningNoteIndex)}
          className={`tuning__selection-note ${
            isSelected ? "tuning__selection-note--active" : ""
          }`}
          type="button"
        >
          {formatPitchClass(pitchClass)}
        </button>
      );
    });
  };

  const setActiveNoteSelection = (index: number): void => {
    setActiveStringIndex((currentIndex) =>
      currentIndex === index ? null : index,
    );
  };

  return (
    <div className="tuning">
      {tuning.map((tuningPitchClass, index: number) => {
        const noteIndex = getScaleDegree(
          tuningPitchClass,
          currentKey,
          currentScale,
        );
        const isSelectionOpen = activeStringIndex === index;
        const selectionId = `tuning-selection-${index}`;
        const tuningNoteClassName: string = `
          tuning__note
          ${noteIndex ? `tuning__note--${noteIndex}` : ""}
        `;

        return (
          <div key={guitarStringIds[index]} className="tuning__noteWrapper">
            <button
              aria-controls={selectionId}
              aria-expanded={isSelectionOpen}
              aria-label={`Change tuning for string ${index + 1}, currently ${formatPitchClass(tuningPitchClass)}`}
              onClick={() => setActiveNoteSelection(index)}
              className={tuningNoteClassName}
              type="button"
            >
              {formatPitchClass(tuningPitchClass)}
            </button>
            <div
              aria-hidden={!isSelectionOpen}
              className={`tuning__selection ${
                isSelectionOpen ? "tuning__selection--active" : ""
              }`}
              id={selectionId}
            >
              {isSelectionOpen ? tuningSelection(index) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}
