"use client";

import type { FretboardDisplayMode } from "@/helpers/typesHelpers";
import { setDisplayMode } from "@/lib/redux/slices/fretboardSlice";
import { useAppDispatch, useAppSelector } from "@/lib/redux/store";
import "./displayModeSelector.scss";

const displayModes: {
  mode: FretboardDisplayMode;
  label: string;
}[] = [
  { mode: "notes", label: "Notes" },
  { mode: "degrees", label: "Degrees" },
  { mode: "intervals", label: "Intervals" },
  { mode: "chord-tones", label: "Chord Tones" },
];

export default function DisplayModeSelector() {
  const dispatch = useAppDispatch();
  const displayMode = useAppSelector((state) => state.fretboard.displayMode);

  return (
    <section className="displayModeSelector">
      <fieldset className="displayModeSelector__options">
        <legend className="displayModeSelector__heading">
          Fretboard Labels
        </legend>
        {displayModes.map(({ mode, label }) => {
          const isActive = displayMode === mode;

          return (
            <button
              aria-pressed={isActive}
              className={`displayModeSelector__option ${
                isActive ? "displayModeSelector__option--active" : ""
              }`}
              key={mode}
              onClick={() => dispatch(setDisplayMode(mode))}
              type="button"
            >
              {label}
            </button>
          );
        })}
      </fieldset>
      {displayMode === "chord-tones" && (
        <p className="displayModeSelector__hint">
          Choose a scale chord to focus its root, third, and fifth.
        </p>
      )}
    </section>
  );
}
