import type React from "react";
import {
  getScaleShapeSystem,
  scaleShapeSystems,
} from "@/helpers/fretboardHelpers";
import type { ScaleShapeSystem } from "@/helpers/typesHelpers";
import {
  setActiveShape,
  setShapeSystem,
  setShowShapes,
} from "@/lib/redux/slices/fretboardSlice";
import { useAppDispatch, useAppSelector } from "@/lib/redux/store";
import Switch from "../Switch/Switch";
import "./scaleShapes.scss";

function ScaleShapes() {
  const dispatch = useAppDispatch();
  const { showShapes, shapeSystem, activeShape, currentScale } = useAppSelector(
    (state) => state.fretboard,
  );
  const activeShapeSystem = getScaleShapeSystem(shapeSystem, currentScale);

  const renderShapeButtons = (): React.ReactElement[] => {
    return activeShapeSystem.shapes.map(({ label, shortLabel }, index) => (
      <button
        aria-label={`Show ${label}`}
        aria-pressed={activeShape === index}
        key={label}
        className={`scaleShapes__list-item ${
          activeShape === index ? "scaleShapes__list-item--active" : ""
        }`}
        onClick={() => dispatch(setActiveShape(index))}
        type="button"
      >
        {shortLabel}
      </button>
    ));
  };

  return (
    <section className="scaleShapes">
      <h1>Scale Shapes</h1>
      <fieldset aria-label="Shape system" className="scaleShapes__systems">
        {(Object.keys(scaleShapeSystems) as ScaleShapeSystem[]).map(
          (system) => {
            const isActive = shapeSystem === system;

            return (
              <button
                aria-pressed={isActive}
                className={`scaleShapes__system ${
                  isActive ? "scaleShapes__system--active" : ""
                }`}
                key={system}
                onClick={() => dispatch(setShapeSystem(system))}
                type="button"
              >
                {scaleShapeSystems[system].label}
              </button>
            );
          },
        )}
      </fieldset>
      <div className="scaleShapes__controls">
        <Switch
          switchAction={() => dispatch(setShowShapes(!showShapes))}
          states={["Hide", "Show"]}
        />
        {showShapes && (
          <fieldset
            aria-label={`${activeShapeSystem.label} shapes`}
            className="scaleShapes__list"
          >
            {renderShapeButtons()}
          </fieldset>
        )}
      </div>
    </section>
  );
}

export default ScaleShapes;
