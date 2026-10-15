import { formatChordIntervalName } from "@/features/musical-context";
import type {
  VoiceLeadingPathway,
  VoiceLeadingPathwaysResult,
  VoiceLeadingPolicy,
} from "@/features/voice-leading";
import { formatNoteName } from "@/helpers/musicTheory";

type VoiceLeadingPathwaysProps = {
  readonly activeStepIndex: number;
  readonly onPolicyChange: (policy: VoiceLeadingPolicy) => void;
  readonly onTargetSelect: (stepIndex: number) => void;
  readonly policy: VoiceLeadingPolicy;
  readonly result: VoiceLeadingPathwaysResult;
};

const policyLabels: Record<VoiceLeadingPolicy, string> = {
  ascending: "Ascending",
  descending: "Descending",
  smooth: "Smooth",
};

const formatMidiNote = (
  pathway: VoiceLeadingPathway,
  index: number,
): string => {
  if (!pathway.available) {
    return "";
  }

  const target = pathway.targets[index];
  return `${formatNoteName(target.chordTone.name)}${Math.floor(target.midi / 12) - 1}`;
};

const formatMovement = (movement: number | null): string => {
  if (movement === null) {
    return "Starting note";
  }

  if (movement === 0) {
    return "Same pitch";
  }

  return `${movement > 0 ? "+" : "−"}${Math.abs(movement)} semitone${Math.abs(movement) === 1 ? "" : "s"}`;
};

export default function VoiceLeadingPathways({
  activeStepIndex,
  onPolicyChange,
  onTargetSelect,
  policy,
  result,
}: VoiceLeadingPathwaysProps) {
  if (!result.available) {
    return (
      <section
        aria-labelledby="voice-leading-heading"
        className="progressionWorkspace__voiceLeading"
      >
        <div className="progressionWorkspace__voiceLeadingHeader">
          <span className="progressionWorkspace__sectionEyebrow">
            Melodic connection
          </span>
          <h2 id="voice-leading-heading">Chord-tone pathways</h2>
        </div>
        <p className="progressionWorkspace__voiceLeadingUnavailable">
          Voice-leading paths require a registered tuning because this custom
          tuning does not define string octaves. Pitch-class transition analysis
          remains available below.
        </p>
      </section>
    );
  }

  const pathway = result.pathways[policy];

  return (
    <section
      aria-labelledby="voice-leading-heading"
      className="progressionWorkspace__voiceLeading"
    >
      <div className="progressionWorkspace__voiceLeadingHeader">
        <div>
          <span className="progressionWorkspace__sectionEyebrow">
            Melodic connection
          </span>
          <h2 id="voice-leading-heading">Chord-tone pathways</h2>
        </div>
        <fieldset>
          <legend>Pathway</legend>
          {(Object.keys(policyLabels) as VoiceLeadingPolicy[]).map((option) => (
            <button
              aria-pressed={policy === option}
              key={option}
              onClick={() => onPolicyChange(option)}
              type="button"
            >
              {policyLabels[option]}
            </button>
          ))}
        </fieldset>
      </div>
      <p className="progressionWorkspace__voiceLeadingDisclaimer">
        These are playable examples, not the only correct connections. Targets
        are independent of the selected chord grips.
      </p>
      {pathway.available ? (
        <div className="progressionWorkspace__voiceLeadingTargets">
          {pathway.targets.map((target, index) => (
            <button
              aria-label={`Select ${target.chordName} target ${formatMidiNote(pathway, index)}, string ${target.stringIndex + 1}, ${target.fret === 0 ? "open" : `fret ${target.fret}`}`}
              aria-pressed={index === activeStepIndex}
              key={target.stepId}
              onClick={() => onTargetSelect(index)}
              type="button"
            >
              <span>
                <strong>{target.chordName}</strong>
                <small>{formatMovement(target.movementSemitones)}</small>
              </span>
              <b>{formatMidiNote(pathway, index)}</b>
              <span>
                <small>{formatChordIntervalName(target.intervalLabel)}</small>
                <small>
                  String {target.stringIndex + 1} ·{" "}
                  {target.fret === 0 ? "Open" : `Fret ${target.fret}`}
                </small>
              </span>
              <em>{target.explanation}</em>
            </button>
          ))}
        </div>
      ) : (
        <p className="progressionWorkspace__voiceLeadingUnavailable">
          No complete {policyLabels[policy].toLowerCase()} pathway fits this
          instrument and fret range without reversing direction.
        </p>
      )}
    </section>
  );
}
