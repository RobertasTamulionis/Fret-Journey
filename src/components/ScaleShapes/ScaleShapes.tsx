import type React from "react";
import {
  setActiveShape,
  setShowShapes,
} from "@/lib/redux/slices/fretboardSlice";
import { useAppDispatch, useAppSelector } from "@/lib/redux/store";
import Switch from "../Switch/Switch";
import "./scaleShapes.scss";

function ScaleShapes() {
  const dispatch = useAppDispatch();
  const { showShapes, activeShape } = useAppSelector(
    (state) => state.fretboard,
  );

  const renderButtons = (arr: number[]): React.ReactElement[] => {
    return arr.map((nr) => (
      <button
        aria-label={`Show three-notes-per-string shape ${nr}`}
        key={nr}
        className={`scaleShapes__list-item ${
          activeShape === nr - 1 ? "scaleShapes__list-item--active" : ""
        }`}
        onClick={() => dispatch(setActiveShape(nr - 1))}
        type="button"
      >
        {nr}
      </button>
    ));
  };

  return (
    <section className="scaleShapes">
      <h1>3NPS Shapes</h1>
      <div className="scaleShapes__controls">
        <Switch
          switchAction={() => dispatch(setShowShapes(!showShapes))}
          states={["Hide", "Show"]}
        />
        {showShapes && (
          <div className="scaleShapes__list">
            {renderButtons([1, 2, 3, 4, 5, 6, 7])}
          </div>
        )}
      </div>
    </section>
  );
}

export default ScaleShapes;
