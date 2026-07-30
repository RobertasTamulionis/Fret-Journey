"use client";
import { scaleDefinitions } from "@/helpers/fretboardHelpers";
import type { ScaleName } from "@/helpers/typesHelpers";
import { setScale } from "@/lib/redux/slices/fretboardSlice";
import { useAppDispatch, useAppSelector } from "@/lib/redux/store";
import "./availableScales.scss";

const availableScales = Object.values(scaleDefinitions);

export default function AvailableScales() {
  const dispatch = useAppDispatch();
  const { currentScale } = useAppSelector((state) => state.fretboard);

  return (
    <div className="availableScales">
      <h1 className="availableScales__heading">Scale Type</h1>
      <div className="availableScales__scales">
        {availableScales.map(({ name, label }) => (
          <button
            className={`availableScales__scale ${
              currentScale === name ? "availableScales__scale--active" : ""
            }`}
            key={name}
            onClick={() => dispatch(setScale(name as ScaleName))}
            type="button"
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
