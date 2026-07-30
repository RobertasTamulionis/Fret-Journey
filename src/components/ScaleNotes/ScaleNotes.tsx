"use client";
import React from "react";
import { useAppSelector } from "@/lib/redux/store";
import { getNotesInCurrentScale } from "@/helpers/fretboardHelpers";
import "./scaleNotes.scss";

function ScaleNotes() {
  const { currentKey, currentScale } = useAppSelector(
    (state) => state.fretboard
  );
  const curentScaleNotes = getNotesInCurrentScale(currentKey, currentScale);
  return (
    <div className="scaleNotes">
      <h1 className="scaleNotes__heading">Notes in a scale</h1>
      <div className="scaleNotes__notesWrapper">
        {curentScaleNotes.map((note, i) => (
          <p className={`scaleNotes__note scaleNotes__note--${i + 1}`} key={i}>
            {note}
          </p>
        ))}
      </div>
    </div>
  );
}

export default ScaleNotes;
