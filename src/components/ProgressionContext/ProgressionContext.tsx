"use client";

import {
  formatNoteName,
  getTuningLabel,
  scaleDefinitions,
} from "@/helpers/fretboardHelpers";
import { useAppSelector } from "@/lib/redux/store";
import AvailableKeys from "../AvailableKeys/AvailableKeys";
import AvailableScales from "../AvailableScales/AvailableScales";
import StringCountSelector from "../StringCountSelector/StringCountSelector";
import Tuning from "../Tuning/Tuning";
import "./progressionContext.scss";

type ProgressionContextProps = {
  compact?: boolean;
};

export default function ProgressionContext({
  compact = false,
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
    <details
      aria-label="Shared musical and instrument context"
      className={`progressionContext ${
        compact ? "progressionContext--compact" : ""
      }`}
    >
      <summary
        aria-atomic="true"
        aria-live="polite"
        className="progressionContext__summary"
      >
        <strong>{contextLabel}</strong>
        <span aria-hidden="true">Edit</span>
      </summary>
      <div className="progressionContext__controls">
        <div className="progressionContext__tonalControls">
          <AvailableKeys />
          <AvailableScales />
        </div>
        <div className="progressionContext__instrumentControls">
          <StringCountSelector />
          <fieldset>
            <legend>String tuning</legend>
            <Tuning />
          </fieldset>
        </div>
      </div>
    </details>
  );
}
