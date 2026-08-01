"use client";
import { getScaleChords } from "@/helpers/fretboardHelpers";
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

  return (
    <div className="scaleChords">
      <h1>Chords in a scale</h1>
      <div className="scaleChords__chordsWrapper">
        {scaleChords.map(({ root, quality, degree }) => (
          <button
            aria-label={`Focus ${root} ${quality} chord tones`}
            aria-pressed={
              displayMode === "chord-tones" && selectedChordDegree === degree
            }
            className={`scaleChords__chord ${
              displayMode === "chord-tones" && selectedChordDegree === degree
                ? "scaleChords__chord--active"
                : ""
            }`}
            key={`${degree}-${root}`}
            onClick={() => dispatch(setSelectedChordDegree(degree))}
            type="button"
          >
            {root} {chordQualityLabels[quality]}
          </button>
        ))}
      </div>
    </div>
  );
}

export default ScaleChords;
