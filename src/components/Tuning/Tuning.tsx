"use client";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import type React from "react";
import { useEffect, useId, useRef, useState } from "react";
import {
  chromaticPitchClasses,
  formatPitchClass,
  getScaleDegree,
  guitarStringIds,
} from "@/helpers/fretboardHelpers";
import type { PitchClass } from "@/helpers/typesHelpers";
import {
  type FretJourneyMotionCustom,
  tuningNoteVariants,
  tuningSelectionVariants,
} from "@/lib/motion";
import { setTuningNote } from "@/lib/redux/slices/fretboardSlice";
import { useAppDispatch, useAppSelector } from "@/lib/redux/store";
import "./tuning.scss";

export default function Tuning(): React.ReactElement {
  const dispatch = useAppDispatch();
  const tuningId = useId();
  const tuningRef = useRef<HTMLDivElement>(null);

  const { tuning, currentKey, currentScale } = useAppSelector(
    (state) => state.fretboard,
  );

  const [activeStringIndex, setActiveStringIndex] = useState<number | null>(
    null,
  );
  const motionCustom: FretJourneyMotionCustom = {
    reducedMotion: Boolean(useReducedMotion()),
  };

  useEffect(() => {
    if (activeStringIndex === null) {
      return;
    }

    const closeOnOutsidePointerDown = (event: PointerEvent): void => {
      if (
        event.target instanceof Node &&
        !tuningRef.current?.contains(event.target)
      ) {
        setActiveStringIndex(null);
      }
    };

    document.addEventListener("pointerdown", closeOnOutsidePointerDown);

    return () => {
      document.removeEventListener("pointerdown", closeOnOutsidePointerDown);
    };
  }, [activeStringIndex]);

  const selectTuningNote = (
    pitchClass: PitchClass,
    tuningNoteIndex: number,
  ): void => {
    dispatch(
      setTuningNote({
        pitchClass,
        tuningNoteIndex,
      }),
    );
    setActiveStringIndex(null);
  };

  const tuningSelection = (tuningNoteIndex: number): React.ReactElement[] => {
    return chromaticPitchClasses.map((pitchClass) => {
      const isSelected = tuning[tuningNoteIndex] === pitchClass;

      return (
        <motion.button
          aria-pressed={isSelected}
          custom={motionCustom}
          key={pitchClass}
          onClick={() => selectTuningNote(pitchClass, tuningNoteIndex)}
          className={`tuning__selection-note ${
            isSelected ? "tuning__selection-note--active" : ""
          }`}
          type="button"
          variants={tuningNoteVariants}
        >
          {formatPitchClass(pitchClass)}
        </motion.button>
      );
    });
  };

  const setActiveNoteSelection = (index: number): void => {
    setActiveStringIndex((currentIndex) =>
      currentIndex === index ? null : index,
    );
  };

  return (
    <div className="tuning" ref={tuningRef}>
      {tuning.map((tuningPitchClass, index: number) => {
        const tuningLabel = formatPitchClass(tuningPitchClass);
        const noteIndex = getScaleDegree(
          tuningPitchClass,
          currentKey,
          currentScale,
        );
        const isSelectionOpen = activeStringIndex === index;
        const selectionId = `${tuningId}-selection-${index}`;
        const tuningNoteClassName: string = `
          tuning__note
          ${noteIndex ? `tuning__note--${noteIndex}` : ""}
          ${tuningLabel.includes("/") ? "tuning__note--enharmonic" : ""}
        `;

        return (
          <div key={guitarStringIds[index]} className="tuning__noteWrapper">
            <button
              aria-controls={selectionId}
              aria-expanded={isSelectionOpen}
              aria-label={`Change tuning for string ${index + 1}, currently ${tuningLabel}`}
              onClick={() => setActiveNoteSelection(index)}
              className={tuningNoteClassName}
              type="button"
            >
              {tuningLabel}
            </button>
            <AnimatePresence initial={false}>
              {isSelectionOpen && (
                <motion.div
                  animate="visible"
                  className="tuning__selection tuning__selection--active"
                  custom={motionCustom}
                  exit="exit"
                  id={selectionId}
                  initial="hidden"
                  key={selectionId}
                  variants={tuningSelectionVariants}
                >
                  {tuningSelection(index)}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
