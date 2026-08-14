"use client";
import { formatNoteName, getScaleChords } from "@/helpers/fretboardHelpers";
import type { ScaleChordSize } from "@/helpers/typesHelpers";
import {
  setChordSize,
  setSelectedChordDegree,
} from "@/lib/redux/slices/fretboardSlice";
import { useAppDispatch, useAppSelector } from "@/lib/redux/store";
import "./scaleChords.scss";

const chordSizeOptions: Array<{
  label: string;
  size: ScaleChordSize;
}> = [
  { size: "triad", label: "Triads" },
  { size: "seventh", label: "7ths" },
  { size: "ninth", label: "9ths" },
];

const diatonicChordCopy: Record<
  ScaleChordSize,
  { description: string; heading: string }
> = {
  triad: {
    heading: "Diatonic triads in the scale",
    description:
      "Three-note chords built from alternating scale tones: root, third, and fifth.",
  },
  seventh: {
    heading: "Diatonic seventh chords in the scale",
    description:
      "Four-note chords built from alternating scale tones through the seventh.",
  },
  ninth: {
    heading: "Diatonic ninth chords in the scale",
    description:
      "Five-note chords built from alternating scale tones through the ninth. Ninths include the seventh.",
  },
};

const bluesChordDescriptions: Record<ScaleChordSize, string> = {
  triad: "Major triads on I, IV, and V.",
  seventh: "Dominant seventh chords on I, IV, and V.",
  ninth: "Dominant ninth chords on I, IV, and V.",
};

function ScaleChords(): React.ReactElement {
  const dispatch = useAppDispatch();
  const {
    chordSize,
    currentKey,
    currentScale,
    displayMode,
    selectedChordDegree,
  } = useAppSelector((state) => state.fretboard);
  const scaleChords = getScaleChords(currentKey, currentScale, chordSize);
  const activeChord =
    scaleChords.find(({ degree }) => degree === selectedChordDegree) ??
    scaleChords[0];
  const isChordToneMode = displayMode === "chord-tones";
  const heading =
    currentScale === "blues"
      ? "Common blues harmony"
      : diatonicChordCopy[chordSize].heading;
  const description =
    currentScale === "blues"
      ? bluesChordDescriptions[chordSize]
      : diatonicChordCopy[chordSize].description;

  return (
    <section aria-labelledby="scale-chords-heading" className="scaleChords">
      <div className="scaleChords__header">
        <div className="scaleChords__introduction">
          <h1 id="scale-chords-heading">{heading}</h1>
          <p className="scaleChords__description">{description}</p>
        </div>
        <fieldset className="scaleChords__sizeSelector">
          <legend className="scaleChords__sizeLegend">Chord size</legend>
          <div className="scaleChords__sizeOptions">
            {chordSizeOptions.map(({ label, size }) => {
              const isActive = chordSize === size;

              return (
                <button
                  aria-pressed={isActive}
                  className={`scaleChords__sizeButton ${
                    isActive ? "scaleChords__sizeButton--active" : ""
                  }`}
                  key={size}
                  onClick={() => dispatch(setChordSize(size))}
                  type="button"
                >
                  {label}
                </button>
              );
            })}
          </div>
        </fieldset>
      </div>
      <div className="scaleChords__chordsWrapper">
        {scaleChords.map(({ root, label, notes, degree }) => {
          const isActive = isChordToneMode && selectedChordDegree === degree;
          const noteNames = notes.map(({ name }) => formatNoteName(name));

          return (
            <button
              aria-label={`Show ${formatNoteName(root.name)} ${label} chord tones: ${noteNames.join(", ")}`}
              aria-pressed={isActive}
              className={`scaleChords__chord ${
                isActive ? "scaleChords__chord--active" : ""
              }`}
              key={`${degree}-${root.name}`}
              onClick={() => dispatch(setSelectedChordDegree(degree))}
              type="button"
            >
              <span className="scaleChords__root">
                {formatNoteName(root.name)}
              </span>
              <span className="scaleChords__quality">{label}</span>
            </button>
          );
        })}
      </div>
      {isChordToneMode && activeChord && (
        <div
          aria-atomic="true"
          aria-live="polite"
          className="scaleChords__activeChord"
        >
          <span className="scaleChords__activeLabel">Active chord</span>
          <strong className="scaleChords__activeName">
            {formatNoteName(activeChord.root.name)} {activeChord.label}
          </strong>
          <span className="scaleChords__activeNotes">
            {activeChord.notes
              .map(({ name }) => formatNoteName(name))
              .join(" · ")}
          </span>
        </div>
      )}
    </section>
  );
}

export default ScaleChords;
