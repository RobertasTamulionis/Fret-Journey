"use client";

import { formatNoteName, scaleDefinitions } from "@/helpers/fretboardHelpers";
import type {
  FretboardDisplayMode,
  ScaleChordSize,
} from "@/helpers/typesHelpers";
import { setDisplayMode } from "@/lib/redux/slices/fretboardSlice";
import { useAppDispatch, useAppSelector } from "@/lib/redux/store";
import "./displayModeSelector.scss";

const displayModes: {
  mode: FretboardDisplayMode;
  label: string;
}[] = [
  { mode: "notes", label: "Notes" },
  { mode: "degrees", label: "Scale Degrees" },
  { mode: "intervals", label: "Intervals" },
  { mode: "chord-tones", label: "Chord Tones" },
];

const chordToneDescriptions: Record<ScaleChordSize, string> = {
  triad: "root, third, and fifth",
  seventh: "root, third, fifth, and seventh",
  ninth: "root, third, fifth, seventh, and ninth",
};

export default function DisplayModeSelector() {
  const dispatch = useAppDispatch();
  const { currentKey, currentScale, displayMode, chordSize } = useAppSelector(
    (state) => state.fretboard,
  );
  const currentKeyLabel = formatNoteName(currentKey);
  const scaleDefinition = scaleDefinitions[currentScale];
  const scaleFormula = scaleDefinition.tones
    .map(({ degreeLabel }) => degreeLabel)
    .join(" ");

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
      {displayMode === "degrees" && (
        <div
          aria-atomic="true"
          aria-live="polite"
          className="displayModeSelector__guidance"
        >
          <p className="displayModeSelector__hint">
            Numbers show each note’s role relative to {currentKeyLabel}. 1 is
            the root; flats indicate lowered scale tones.
          </p>
          <p className="displayModeSelector__formula">
            <span className="displayModeSelector__formula-name">
              {currentKeyLabel} {scaleDefinition.label}
            </span>
            <span
              aria-hidden="true"
              className="displayModeSelector__formula-divider"
            >
              ·
            </span>
            <span className="displayModeSelector__formula-degrees">
              {scaleFormula}
            </span>
          </p>
        </div>
      )}
      {displayMode === "chord-tones" && (
        <div className="displayModeSelector__guidance">
          <p className="displayModeSelector__hint">
            Choose a scale chord to focus its {chordToneDescriptions[chordSize]}
            .
          </p>
        </div>
      )}
    </section>
  );
}
