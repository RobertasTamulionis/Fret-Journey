"use client";

import { setFretNoteCount } from "@/lib/redux/slices/fretboardSlice";
import { useAppDispatch, useAppSelector } from "@/lib/redux/store";
import "./fretCountSelector.scss";

const fretCounts = [12, 24] as const;

export default function FretCountSelector() {
  const dispatch = useAppDispatch();
  const fretCount = useAppSelector((state) => state.fretboard.fretCount);

  return (
    <fieldset className="fretCountSelector">
      <legend className="fretCountSelector__heading">Fret View</legend>
      <div className="fretCountSelector__options">
        {fretCounts.map((count) => {
          const isActive = count === fretCount;

          return (
            <button
              aria-label={
                count === 12
                  ? "Show 12 frets with enlarged notes"
                  : "Show the full 24-fret view"
              }
              aria-pressed={isActive}
              className={`fretCountSelector__option ${
                isActive ? "fretCountSelector__option--active" : ""
              }`}
              key={count}
              onClick={() => dispatch(setFretNoteCount(count))}
              type="button"
            >
              {count}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
