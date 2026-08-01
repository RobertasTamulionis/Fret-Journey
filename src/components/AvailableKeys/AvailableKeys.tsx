"use client";
import { tonicOptions } from "@/helpers/fretboardHelpers";
import { setKey } from "@/lib/redux/slices/fretboardSlice";
import { useAppDispatch, useAppSelector } from "@/lib/redux/store";
import "./availableKeys.scss";

export default function AvailableKeys() {
  const dispatch = useAppDispatch();
  const { currentKey } = useAppSelector((state) => state.fretboard);

  return (
    <div className="availableKeys">
      <h1 className="availableKeys__heading">Scale Key</h1>
      <div className="availableKeys__keys">
        {tonicOptions.map(({ label, name }) => {
          return (
            <button
              className={`availableKeys__key ${currentKey === name ? "availableKeys__key--active" : ""}`}
              key={name}
              onClick={() => dispatch(setKey(name))}
              type="button"
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
