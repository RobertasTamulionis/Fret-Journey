"use client";

import { type CSSProperties, useId } from "react";
import {
  buildFretPositions,
  formatNoteName,
  formatPitchClass,
  guitarStringIds,
} from "@/helpers/fretboardHelpers";
import type {
  FretboardDisplayMode,
  PitchClass,
  ScaleDegree,
  ScaleDegreeLabel,
  ScaleName,
  TonicName,
} from "@/helpers/typesHelpers";
import FretboardNumbers from "../FretboardNumbers/FretboardNumbers";
import Tuning from "../Tuning/Tuning";
import "./fretboard.scss";

export type ChordVisualization = {
  tones: readonly {
    intervalName: string;
    pitchClass: PitchClass;
    role: string;
  }[];
};

export type FretboardVisualizationMode =
  | "standard"
  | "all-chord-tones"
  | "selected-voicing";

export type FretboardNeckProps = {
  accessibleLabel?: string;
  accessibleSummary?: string;
  cagedAnchorLabel?: string;
  cagedAnchorPositions?: ReadonlySet<string>;
  chord?: ChordVisualization;
  currentKey: TonicName;
  currentScale: ScaleName;
  displayMode: FretboardDisplayMode;
  exactPositions?: ReadonlySet<string>;
  fretCount: number;
  shapeIndex?: number;
  shapePositions?: ReadonlySet<string>;
  tuning: PitchClass[];
  visualizationMode?: FretboardVisualizationMode;
};

const supportedChordToneRoles = new Set([
  "root",
  "second",
  "third",
  "fourth",
  "fifth",
  "sixth",
  "seventh",
  "ninth",
]);

const defaultSummaries: Record<FretboardVisualizationMode, string> = {
  "all-chord-tones":
    "Every matching chord pitch class is shown across the neck. This is a pitch-class map, not a playable chord grip.",
  "selected-voicing":
    "Only the exact fretted positions belonging to the selected playable voicing are shown.",
  standard:
    "Scale notes and the selected fretboard labels are shown across the neck.",
};

const getSpokenScaleDegree = (degreeLabel: ScaleDegreeLabel): string => {
  if (degreeLabel.startsWith("b")) {
    return `flat ${degreeLabel.slice(1)}`;
  }

  return degreeLabel;
};

const getScaleDegreeClassName = (scaleDegree?: ScaleDegree): string =>
  scaleDegree ? `fretboard__fret-piece--note-${scaleDegree}` : "";

const getLabelSizeClassName = (label?: string): string =>
  label && label.length > 2 ? "fretboard__fret-piece--double-note" : "";

const getChordToneRoleClassName = (role: string): string =>
  supportedChordToneRoles.has(role) ? role : "other";

export default function FretboardNeck({
  accessibleLabel = "Interactive guitar fretboard",
  accessibleSummary,
  cagedAnchorLabel,
  cagedAnchorPositions,
  chord,
  currentKey,
  currentScale,
  displayMode,
  exactPositions,
  fretCount,
  shapeIndex = 0,
  shapePositions,
  tuning,
  visualizationMode = "standard",
}: FretboardNeckProps) {
  const summaryId = useId();
  const fretPositions = buildFretPositions(
    tuning,
    fretCount,
    currentKey,
    currentScale,
  );
  const summary =
    accessibleSummary ??
    (visualizationMode === "standard" && displayMode === "chord-tones"
      ? "Every matching selected-chord pitch class is shown across the neck, with other scale tones subdued. This is a pitch-class map, not a playable chord grip."
      : defaultSummaries[visualizationMode]);

  const getChordTone = (pitchClass: PitchClass) =>
    chord?.tones.find((tone) => tone.pitchClass === pitchClass);

  const getFretLabel = (
    pitchClass: PitchClass,
    noteName?: string,
    scaleDegree?: ScaleDegree,
    degreeLabel?: ScaleDegreeLabel,
    intervalName?: string,
  ): string | undefined => {
    const chordTone = getChordTone(pitchClass);

    if (visualizationMode !== "standard") {
      return chordTone?.intervalName ?? formatPitchClass(pitchClass);
    }

    if (displayMode === "chord-tones") {
      if (chordTone) {
        return chordTone.intervalName;
      }

      return scaleDegree && noteName ? formatNoteName(noteName) : undefined;
    }

    if (!scaleDegree) {
      return undefined;
    }

    if (displayMode === "degrees") {
      return degreeLabel;
    }

    if (displayMode === "intervals") {
      return intervalName;
    }

    return noteName ? formatNoteName(noteName) : undefined;
  };

  const getChordToneClassName = (
    pitchClass: PitchClass,
    isScaleNote: boolean,
  ): string => {
    const shouldStyleChordTones =
      visualizationMode !== "standard" || displayMode === "chord-tones";

    if (!shouldStyleChordTones) {
      return "";
    }

    const chordTone = getChordTone(pitchClass);

    if (!chordTone) {
      return visualizationMode === "standard" && isScaleNote
        ? "fretboard__fret-piece--muted"
        : "";
    }

    const roleClassName = getChordToneRoleClassName(chordTone.role);

    return `fretboard__fret-piece--chord-tone fretboard__fret-piece--chord-${roleClassName}`;
  };

  return (
    <section
      aria-describedby={summaryId}
      aria-label={accessibleLabel}
      className="fretboard"
      data-fret-count={fretCount}
      style={{ "--string-count": tuning.length } as CSSProperties}
    >
      <p className="fretboard__summary" id={summaryId}>
        {summary}
      </p>
      <Tuning key={tuning.length} />
      <div className="fretboard__notes">
        {fretPositions.map((stringPositions, stringIndex) => (
          <div
            className={`fretboard__string s-${stringIndex + 1}`}
            key={guitarStringIds[stringIndex]}
          >
            {stringPositions.map(
              ({
                degreeLabel,
                fret,
                intervalName,
                noteName,
                pitchClass,
                scaleDegree,
              }) => {
                const positionKey = `${stringIndex}-${fret}`;
                const isScaleNote = Boolean(scaleDegree);
                const isChordTone = Boolean(getChordTone(pitchClass));
                const isExactPosition = Boolean(
                  exactPositions?.has(positionKey),
                );
                const isVisibleNote =
                  visualizationMode === "selected-voicing"
                    ? isExactPosition
                    : visualizationMode === "all-chord-tones"
                      ? isChordTone
                      : isScaleNote ||
                        (displayMode === "chord-tones" && isChordTone);
                const isCagedAnchor =
                  visualizationMode === "standard" &&
                  cagedAnchorPositions?.has(positionKey);
                const fretLabel = isVisibleNote
                  ? getFretLabel(
                      pitchClass,
                      noteName,
                      scaleDegree,
                      degreeLabel,
                      intervalName,
                    )
                  : undefined;
                const shapeClassName =
                  visualizationMode === "standard" &&
                  shapePositions?.has(positionKey)
                    ? `fretboard__fret-piece--S${shapeIndex + 1}`
                    : "";
                const chordToneClassName = isVisibleNote
                  ? getChordToneClassName(pitchClass, isScaleNote)
                  : "";
                const noteClassName = `
                  fretboard__fret-piece
                  ${isVisibleNote ? "fretboard__fret-piece--note" : ""}
                  ${isVisibleNote ? getScaleDegreeClassName(scaleDegree) : ""}
                  ${getLabelSizeClassName(fretLabel)}
                  ${shapeClassName}
                  ${chordToneClassName}
                `;

                return (
                  <div
                    className={noteClassName}
                    data-note={fretLabel}
                    key={positionKey}
                  >
                    {isCagedAnchor && cagedAnchorLabel && degreeLabel && (
                      <span
                        aria-label={`${cagedAnchorLabel} chord anchor at string ${stringIndex + 1}, fret ${fret}, scale degree ${getSpokenScaleDegree(degreeLabel)}`}
                        className="fretboard__caged-anchor-ring"
                        role="img"
                      />
                    )}
                  </div>
                );
              },
            )}
          </div>
        ))}
      </div>
      <FretboardNumbers />
    </section>
  );
}
