import { useId } from "react";
import {
  describeVoicing,
  getVoicingPositionLabel,
  type PlayableVoicing,
} from "@/features/voicings";
import "./chordDiagram.scss";

export type ChordDiagramSize = "large" | "compact";

type ChordDiagramProps = {
  size?: ChordDiagramSize;
  tuningLabel: string;
  voicing: PlayableVoicing;
};

const diagramWidth = 228;
const diagramHeight = 238;
const gridLeft = 42;
const gridRight = 210;
const gridTop = 48;
const gridHeight = 170;
const minimumDisplayedFretCount = 5;
const markerY = 27;

const getStringX = (index: number, stringCount: number): number => {
  if (stringCount <= 1) {
    return (gridLeft + gridRight) / 2;
  }

  return gridLeft + ((gridRight - gridLeft) * index) / (stringCount - 1);
};

export default function ChordDiagram({
  size = "large",
  tuningLabel,
  voicing,
}: ChordDiagramProps) {
  const accessibilityId = useId();
  const captionId = `${accessibilityId}-caption`;
  const descriptionId = `${accessibilityId}-description`;
  const stringsLowToHigh = voicing.strings
    .slice(0, voicing.stringCount)
    .reverse();
  const startsAtNut = voicing.baseFret <= 1;
  const firstDisplayedFret = startsAtNut ? 1 : voicing.baseFret;
  const highestFret = voicing.strings.reduce(
    (highest, state) =>
      state.kind === "fretted" ? Math.max(highest, state.fret) : highest,
    firstDisplayedFret,
  );
  const displayedFretCount = Math.max(
    minimumDisplayedFretCount,
    highestFret - firstDisplayedFret + 1,
  );
  const fretHeight = gridHeight / displayedFretCount;
  const fretLineOffsets = Array.from(
    { length: displayedFretCount + 1 },
    (_, index) => index,
  );
  const gridBottom = gridTop + gridHeight;
  const dotRadius = Math.max(4, Math.min(8, fretHeight * 0.3));
  const rootRingRadius = dotRadius + Math.max(2, dotRadius * 0.375);
  const rootMarkSize = Math.max(5, Math.min(8, fretHeight * 0.42));
  const description = describeVoicing(voicing, tuningLabel);

  return (
    <figure
      aria-describedby={descriptionId}
      aria-labelledby={captionId}
      className={`chordDiagram chordDiagram--${size}`}
    >
      <figcaption className="chordDiagram__caption" id={captionId}>
        <strong className="chordDiagram__name">{voicing.chordName}</strong>
        <span className="chordDiagram__meta">
          {getVoicingPositionLabel(voicing)} · {voicing.stringCount} strings
        </span>
      </figcaption>

      <svg
        aria-hidden="true"
        className="chordDiagram__graphic"
        focusable="false"
        viewBox={`0 0 ${diagramWidth} ${diagramHeight}`}
      >
        <text
          className="chordDiagram__positionLabel"
          x="4"
          y={startsAtNut ? gridTop + 4 : gridTop + fretHeight / 2 + 3}
        >
          {startsAtNut ? "Nut" : `${firstDisplayedFret}fr`}
        </text>

        {fretLineOffsets.map((fretLineOffset) => {
          const y = gridTop + fretLineOffset * fretHeight;
          const isNut = startsAtNut && fretLineOffset === 0;

          return (
            <line
              className={`chordDiagram__fret ${
                isNut ? "chordDiagram__fret--nut" : ""
              }`}
              key={`fret-${fretLineOffset}`}
              x1={gridLeft}
              x2={gridRight}
              y1={y}
              y2={y}
            />
          );
        })}

        {stringsLowToHigh.map((state, presentationIndex) => {
          const x = getStringX(presentationIndex, voicing.stringCount);

          return (
            <line
              className="chordDiagram__string"
              key={`string-${state.stringIndex}`}
              x1={x}
              x2={x}
              y1={gridTop}
              y2={gridBottom}
            />
          );
        })}

        {stringsLowToHigh.map((state, presentationIndex) => {
          const x = getStringX(presentationIndex, voicing.stringCount);

          if (state.kind === "muted" || state.kind === "open") {
            return (
              <text
                className={`chordDiagram__stringState chordDiagram__stringState--${state.kind}`}
                key={`state-${state.stringIndex}`}
                textAnchor="middle"
                x={x}
                y={markerY}
              >
                {state.kind === "muted" ? "×" : "○"}
              </text>
            );
          }

          const fretOffset = state.fret - firstDisplayedFret;

          if (fretOffset < 0 || fretOffset >= displayedFretCount) {
            return null;
          }

          const y = gridTop + (fretOffset + 0.5) * fretHeight;
          const isRoot = state.role === "root";

          return (
            <g key={`state-${state.stringIndex}`}>
              {isRoot && (
                <circle
                  className="chordDiagram__rootRing"
                  cx={x}
                  cy={y}
                  r={rootRingRadius}
                />
              )}
              <circle
                className={`chordDiagram__dot ${
                  isRoot ? "chordDiagram__dot--root" : ""
                }`}
                cx={x}
                cy={y}
                r={dotRadius}
              />
              {isRoot && (
                <text
                  className="chordDiagram__rootMark"
                  style={{ fontSize: rootMarkSize }}
                  textAnchor="middle"
                  x={x}
                  y={y + rootMarkSize * 0.4}
                >
                  R
                </text>
              )}
            </g>
          );
        })}
      </svg>

      <span className="chordDiagram__tuning" aria-hidden="true">
        {tuningLabel}
      </span>
      <p className="chordDiagram__description" id={descriptionId}>
        {description}
      </p>
    </figure>
  );
}
