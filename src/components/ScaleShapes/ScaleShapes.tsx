import {
  getAvailableScaleShapeSystems,
  getScaleShapeSystem,
} from "@/helpers/fretboardHelpers";
import {
  setActiveShape,
  toggleShapeSystem,
} from "@/lib/redux/slices/fretboardSlice";
import { useAppDispatch, useAppSelector } from "@/lib/redux/store";
import "./scaleShapes.scss";

function ScaleShapes() {
  const dispatch = useAppDispatch();
  const {
    showShapes,
    shapeSystem,
    activeShape,
    currentKey,
    currentScale,
    fretCount,
    tuning,
  } = useAppSelector((state) => state.fretboard);
  const activeShapeSystem = getScaleShapeSystem(shapeSystem, currentScale);
  const availableShapeSystems = getAvailableScaleShapeSystems(
    currentScale,
    tuning,
    currentKey,
    fretCount,
  );
  const activeShapeOption =
    activeShapeSystem.shapes[activeShape] ?? activeShapeSystem.shapes[0];
  const isCaged = shapeSystem === "caged";
  const showShapeHint = showShapes;

  const renderShapeButtons = () =>
    activeShapeSystem.shapes.map(({ label, shortLabel }, index) => (
      <button
        aria-describedby={
          showShapeHint && activeShape === index
            ? "scale-shape-hint"
            : undefined
        }
        aria-label={`Select ${label}`}
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

  return (
    <section className="scaleShapes">
      <h1>Scale Shapes</h1>
      <fieldset aria-label="Shape system" className="scaleShapes__systems">
        {availableShapeSystems.map((system) => {
          const isExpanded = showShapes && shapeSystem === system;

          return (
            <button
              aria-controls="scale-shape-options"
              aria-expanded={isExpanded}
              className={`scaleShapes__system ${
                isExpanded ? "scaleShapes__system--active" : ""
              }`}
              key={system}
              onClick={() => dispatch(toggleShapeSystem(system))}
              type="button"
            >
              {getScaleShapeSystem(system, currentScale).label}
            </button>
          );
        })}
      </fieldset>
      <fieldset
        aria-label={`${activeShapeSystem.label} shapes`}
        className={`scaleShapes__list ${
          isCaged ? "scaleShapes__list--caged" : ""
        }`}
        hidden={!showShapes}
        id="scale-shape-options"
      >
        {renderShapeButtons()}
      </fieldset>
      {showShapeHint && (
        <p
          aria-live="polite"
          className="scaleShapes__hint"
          id="scale-shape-hint"
        ></p>
      )}
    </section>
  );
}

export default ScaleShapes;
