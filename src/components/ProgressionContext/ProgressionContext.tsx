"use client";

import {
  formatNoteName,
  getTuningLabel,
  scaleDefinitions,
} from "@/helpers/fretboardHelpers";
import { useAppSelector } from "@/lib/redux/store";
import AvailableKeys from "../AvailableKeys/AvailableKeys";
import AvailableScales from "../AvailableScales/AvailableScales";
import "./progressionContext.scss";

type ProgressionContextProps = {
  compact?: boolean;
  controls?: boolean;
};

export default function ProgressionContext({
  compact = false,
  controls = true,
}: ProgressionContextProps) {
  const { currentKey, currentScale, registeredTuning, stringCount } =
    useAppSelector((state) => state.fretboard);
  const contextLabel = `${formatNoteName(currentKey)} ${
    scaleDefinitions[currentScale].label
  } · ${stringCount} strings · ${getTuningLabel(
    stringCount,
    registeredTuning,
  )}`;

  return (
    <section
      aria-label="Shared musical and instrument context"
      className={`progressionContext ${
        compact ? "progressionContext--compact" : ""
      }`}
    >
      <div
        aria-atomic="true"
        aria-live="polite"
        className="progressionContext__summary"
      >
        <span className="progressionContext__summaryLabel">Current setup</span>
        <strong>{contextLabel}</strong>
      </div>
      {controls && (
        <div className="progressionContext__controls">
          <AvailableKeys />
          <AvailableScales />
        </div>
      )}
    </section>
  );
}
