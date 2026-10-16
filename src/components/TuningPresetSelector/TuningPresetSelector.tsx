"use client";

import { useId } from "react";
import {
  getRegisteredTuningPreset,
  getRegisteredTuningPresetsForStringCount,
} from "@/features/tunings";
import { formatPitchClass } from "@/helpers/musicTheory";
import type { RegisteredTuningId } from "@/helpers/typesHelpers";
import { setRegisteredTuningPreset } from "@/lib/redux/slices/fretboardSlice";
import { useAppDispatch, useAppSelector } from "@/lib/redux/store";
import "./tuningPresetSelector.scss";

export default function TuningPresetSelector() {
  const dispatch = useAppDispatch();
  const selectId = useId();
  const { registeredTuning, stringCount, tuning } = useAppSelector(
    (state) => state.fretboard,
  );
  const presets = getRegisteredTuningPresetsForStringCount(stringCount);
  const selectedPreset =
    registeredTuning.status === "verified"
      ? getRegisteredTuningPreset(registeredTuning.id)
      : undefined;
  const value = selectedPreset?.id ?? "custom";
  const openStringSummary = selectedPreset
    ? selectedPreset.notesLowToHigh.join(" · ")
    : `${[...tuning].reverse().map(formatPitchClass).join(" · ")} · Octaves unverified`;

  return (
    <div className="tuningPresetSelector">
      <label htmlFor={selectId}>Tuning preset</label>
      <select
        id={selectId}
        onChange={(event) =>
          event.target.value !== "custom" &&
          dispatch(
            setRegisteredTuningPreset(event.target.value as RegisteredTuningId),
          )
        }
        value={value}
      >
        {!selectedPreset && <option value="custom">Custom tuning</option>}
        {presets.map((preset) => (
          <option key={preset.id} value={preset.id}>
            {preset.label}
          </option>
        ))}
      </select>
      <span aria-live="polite">{openStringSummary}</span>
    </div>
  );
}
