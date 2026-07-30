"use client";
import type React from "react";
import { useState } from "react";
import {
  allNotes,
  getScaleDegree,
  guitarStringIds,
} from "@/helpers/fretboardHelpers";
import type { Note } from "@/helpers/typesHelpers";
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

  const selectTuningNote = (note: Note, tuningNoteIndex: number): void => {
    dispatch(
      setTuningNote({
        note,
        tuningNoteIndex,
      }),
    );
    setActiveStringIndex(null);
  };

  const tuningSelection = (tuningNoteIndex: number): React.ReactElement[] => {
    return allNotes.map((note: Note) => {
      const isSelected = tuning[tuningNoteIndex] === note;

      return (
        <button
          aria-pressed={isSelected}
          key={note}
          onClick={() => selectTuningNote(note, tuningNoteIndex)}
          className={`tuning__selection-note ${
            isSelected ? "tuning__selection-note--active" : ""
          }`}
          type="button"
        >
          {note}
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
      {tuning.map((tuningNote: Note, index: number) => {
        const noteIndex = getScaleDegree(tuningNote, currentKey, currentScale);
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
              aria-label={`Change tuning for string ${index + 1}, currently ${tuningNote}`}
              onClick={() => setActiveNoteSelection(index)}
              className={tuningNoteClassName}
              type="button"
            >
              {tuningNote}
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
