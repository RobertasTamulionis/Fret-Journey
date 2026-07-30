"use client";
import { allNotes } from "@/helpers/fretboardHelpers";
import { setKey } from "@/lib/redux/slices/fretboardSlice";
import { useAppDispatch, useAppSelector } from "@/lib/redux/store";
import "./availableKeys.scss";

export default function AvailableKeys() {
  const dispatch = useAppDispatch();
  const { currentKey } = useAppSelector((state) => state.fretboard);

  return (
    <div className="availableKeys">
      <h1 className="availableKeys__heading">Scale Key</h1>
      <div className="availableKeys__keys">
        {allNotes.map((note) => {
          return (
            <button
              className={`availableKeys__key ${currentKey === note ? "availableKeys__key--active" : ""}`}
              key={note}
              onClick={() => dispatch(setKey(note))}
              type="button"
            >
              {note}
            </button>
          );
        })}
      </div>
    </div>
  );
}
