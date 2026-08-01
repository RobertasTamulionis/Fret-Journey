"use client";
import { formatNoteName, getScaleChords } from "@/helpers/fretboardHelpers";
import { setSelectedChordDegree } from "@/lib/redux/slices/fretboardSlice";
import { useAppDispatch, useAppSelector } from "@/lib/redux/store";
import "./scaleChords.scss";

const chordQualityLabels = {
  major: "Maj",
  minor: "Min",
  diminished: "Dim",
  augmented: "Aug",
  dominant7: "7",
};

function ScaleChords(): React.ReactElement {
  const dispatch = useAppDispatch();
  const { currentKey, currentScale, displayMode, selectedChordDegree } =
    useAppSelector((state) => state.fretboard);
  const scaleChords = getScaleChords(currentKey, currentScale);
  const heading =
    currentScale === "blues"
      ? "Common blues harmony"
      : "Diatonic triads in the scale";

  return (
    <div className="scaleChords">
      <h1>{heading}</h1>
      <div className="scaleChords__chordsWrapper">
        {scaleChords.map(({ root, quality, degree }) => (
          <button
            aria-label={`Focus ${formatNoteName(root.name)} ${quality} chord tones`}
            aria-pressed={
              displayMode === "chord-tones" && selectedChordDegree === degree
            }
            className={`scaleChords__chord ${
              displayMode === "chord-tones" && selectedChordDegree === degree
                ? "scaleChords__chord--active"
                : ""
            }`}
            key={`${degree}-${root.name}`}
            onClick={() => dispatch(setSelectedChordDegree(degree))}
            type="button"
          >
            {formatNoteName(root.name)} {chordQualityLabels[quality]}
          </button>
        ))}
      </div>
    </div>
  );
}

export default ScaleChords;
