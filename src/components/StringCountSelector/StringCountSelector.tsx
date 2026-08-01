"use client";

import { guitarConfigurations } from "@/helpers/fretboardHelpers";
import type { GuitarStringCount } from "@/helpers/typesHelpers";
import { setStringCount } from "@/lib/redux/slices/fretboardSlice";
import { useAppDispatch, useAppSelector } from "@/lib/redux/store";
import "./stringCountSelector.scss";

const stringCounts: GuitarStringCount[] = [6, 7, 8];

export default function StringCountSelector() {
  const dispatch = useAppDispatch();
  const stringCount = useAppSelector((state) => state.fretboard.stringCount);

  return (
    <section className="stringCountSelector">
      <h1 className="stringCountSelector__heading">Guitar Strings</h1>
      <div className="stringCountSelector__options">
        {stringCounts.map((count) => {
          const isActive = count === stringCount;

          return (
            <button
              aria-label={`Use ${guitarConfigurations[count].label.toLowerCase()} guitar`}
              aria-pressed={isActive}
              className={`stringCountSelector__option ${
                isActive ? "stringCountSelector__option--active" : ""
              }`}
              key={count}
              onClick={() => dispatch(setStringCount(count))}
              type="button"
            >
              {count}
            </button>
          );
        })}
      </div>
    </section>
  );
}
