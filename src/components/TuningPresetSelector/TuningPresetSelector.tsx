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
import Select from "@/components/ui/Select/Select";

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
      <Select
        id={selectId}
        label="Tuning preset"
        options={[
          ...(selectedPreset
            ? []
            : [{ value: "custom", label: "Custom tuning" }]),
          ...presets.map((preset) => ({
            value: preset.id,
            label: preset.label,
          })),
        ]}
        onChange={(next) =>
          next !== "custom" &&
          dispatch(setRegisteredTuningPreset(next as RegisteredTuningId))
        }
        value={value}
      />
      <span aria-live="polite">{openStringSummary}</span>
    </div>
  );
}
