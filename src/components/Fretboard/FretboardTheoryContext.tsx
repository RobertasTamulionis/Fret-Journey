import {
  buildPitchClassContextMap,
  type ContextChord,
  formatChordIntervalName,
  getScaleColorDegrees,
} from "@/features/musical-context";
import {
  formatNoteName,
  getScaleTones,
  scaleDefinitions,
} from "@/helpers/musicTheory";
import type { PitchClass, ScaleName, TonicName } from "@/helpers/typesHelpers";

type DisplayChordTone = {
  readonly intervalLabel: string;
  readonly name: string;
  readonly pitchClass: PitchClass;
};

type FretboardTheoryContextProps = {
  readonly chord?: ContextChord;
  readonly chordName?: string;
  readonly chordTones?: readonly DisplayChordTone[];
  readonly currentKey: TonicName;
  readonly currentScale: ScaleName;
};

const scaleColorExplanations: Readonly<Record<ScaleName, string>> = {
  major: "The reference major collection; no separate color degree is marked.",
  minor:
    "The flat sixth gives Aeolian its darker color beside the minor third.",
  blues:
    "The flat fifth is the chromatic blue note that colors minor pentatonic.",
  "harmonic-minor":
    "The raised seventh separates this sound from Natural Minor and pulls toward the tonic.",
  "phrygian-dominant":
    "The flat second and major third create the defining contrast around the tonic.",
};

const joinDegreeLabels = (labels: readonly string[]): string => {
  if (labels.length === 0) {
    return "None separately marked";
  }

  if (labels.length === 1) {
    return labels[0];
  }

  return `${labels.slice(0, -1).join(", ")} and ${labels.at(-1)}`;
};

export default function FretboardTheoryContext({
  chord,
  chordName,
  chordTones,
  currentKey,
  currentScale,
}: FretboardTheoryContextProps) {
  const scaleDefinition = scaleDefinitions[currentScale];
  const scaleTones = getScaleTones(currentKey, currentScale);
  const colorDegrees = getScaleColorDegrees(currentScale);
  const pitchClassContexts = chord
    ? buildPitchClassContextMap({ currentKey, currentScale }, chord)
    : undefined;
  const nonChordScaleTones = pitchClassContexts
    ? scaleTones.filter(
        ({ pitchClass }) =>
          !pitchClassContexts.get(pitchClass)?.chord.isChordTone,
      )
    : [];
  const outsideScaleChordTones =
    chordTones?.filter(
      ({ pitchClass }) => !pitchClassContexts?.get(pitchClass)?.scale.inScale,
    ) ?? [];

  return (
    <section
      aria-label="Scale identity and contextual note roles"
      className="fretboardTheoryContext"
    >
      <div className="fretboardTheoryContext__scale">
        <span className="fretboardTheoryContext__eyebrow">Scale identity</span>
        <h2>
          {formatNoteName(currentKey)} {scaleDefinition.label}
        </h2>
        <dl className="fretboardTheoryContext__facts">
          <div>
            <dt>Notes</dt>
            <dd>
              {scaleTones.map(({ name }) => formatNoteName(name)).join(" · ")}
            </dd>
          </div>
          <div>
            <dt>Formula</dt>
            <dd>
              {scaleTones.map(({ degreeLabel }) => degreeLabel).join(" · ")}
            </dd>
          </div>
          <div>
            <dt>Color</dt>
            <dd>
              {joinDegreeLabels(
                colorDegrees.map(({ degreeLabel }) => degreeLabel),
              )}
            </dd>
          </div>
        </dl>
        <p>{scaleColorExplanations[currentScale]}</p>
      </div>

      {chord && chordName && chordTones && pitchClassContexts && (
        <div className="fretboardTheoryContext__roles">
          <span className="fretboardTheoryContext__eyebrow">Note roles</span>
          <h2>{chordName} in this scale</h2>
          <ul className="fretboardTheoryContext__toneList">
            {chordTones.map(({ intervalLabel, name, pitchClass }) => {
              const context = pitchClassContexts.get(pitchClass);
              const scaleRole = context?.scale.tone
                ? `scale ${context.scale.tone.degreeLabel}`
                : "outside the scale";

              return (
                <li key={`${pitchClass}-${intervalLabel}`}>
                  <strong>{formatNoteName(name)}</strong>
                  <span>{scaleRole}</span>
                  <span>chord {formatChordIntervalName(intervalLabel)}</span>
                </li>
              );
            })}
          </ul>
          {nonChordScaleTones.length > 0 && (
            <p>
              <strong>Other scale tones</strong>{" "}
              {nonChordScaleTones
                .map(
                  ({ degreeLabel, name }) =>
                    `${formatNoteName(name)} (${degreeLabel})`,
                )
                .join(" · ")}
            </p>
          )}
          {outsideScaleChordTones.length > 0 && (
            <p>
              <strong>Chord tones outside the scale</strong>{" "}
              {outsideScaleChordTones
                .map(({ name }) => formatNoteName(name))
                .join(" · ")}
            </p>
          )}
        </div>
      )}
    </section>
  );
}
