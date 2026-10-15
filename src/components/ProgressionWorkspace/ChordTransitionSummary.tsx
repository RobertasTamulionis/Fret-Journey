import { formatChordIntervalName } from "@/features/musical-context";
import type { ProgressionStepContextAnalysis } from "@/features/musical-context/types";
import { getResolvedChordToneIntervalLabel } from "@/features/progressions";
import { formatNoteName } from "@/helpers/musicTheory";

type ChordTransitionSummaryProps = {
  readonly analysis: ProgressionStepContextAnalysis;
};

const formatToneNames = (
  tones: readonly { readonly name: string }[],
): string =>
  tones.length > 0
    ? tones.map(({ name }) => formatNoteName(name)).join(" · ")
    : "None";

const formatSharedToneName = (fromName: string, toName: string): string =>
  fromName === toName
    ? formatNoteName(toName)
    : `${formatNoteName(fromName)} → ${formatNoteName(toName)}`;

export default function ChordTransitionSummary({
  analysis,
}: ChordTransitionSummaryProps) {
  const transition = analysis.previousTransition;

  return (
    <section
      aria-labelledby="active-chord-transition-heading"
      className="progressionWorkspace__transition"
    >
      <div className="progressionWorkspace__transitionHeader">
        <span className="progressionWorkspace__sectionEyebrow">
          Active-chord transition
        </span>
        <h2 id="active-chord-transition-heading">
          {transition
            ? `${transition.fromChord.name} → ${transition.toChord.name}`
            : `Starting on ${analysis.step.chord.name}`}
        </h2>
      </div>

      {transition ? (
        <>
          <dl className="progressionWorkspace__transitionFacts">
            <div>
              <dt>Common tones</dt>
              <dd>
                {transition.commonTones.length > 0
                  ? transition.commonTones
                      .map(({ toneInFromChord, toneInToChord }) =>
                        formatSharedToneName(
                          toneInFromChord.name,
                          toneInToChord.name,
                        ),
                      )
                      .join(" · ")
                  : "None"}
              </dd>
            </div>
            <div>
              <dt>Leaving tones</dt>
              <dd>{formatToneNames(transition.leavingTones)}</dd>
            </div>
            <div>
              <dt>Entering tones</dt>
              <dd>{formatToneNames(transition.enteringTones)}</dd>
            </div>
          </dl>
          {transition.commonTones.length > 0 && (
            <div className="progressionWorkspace__roleChanges">
              <strong>Role changes</strong>
              <ul>
                {transition.commonTones.map(
                  ({ pitchClass, toneInFromChord, toneInToChord }) => (
                    <li key={pitchClass}>
                      <strong>
                        {formatSharedToneName(
                          toneInFromChord.name,
                          toneInToChord.name,
                        )}
                      </strong>
                      <span>
                        {transition.fromChord.name}{" "}
                        {formatChordIntervalName(
                          getResolvedChordToneIntervalLabel(toneInFromChord),
                        )}{" "}
                        → {transition.toChord.name}{" "}
                        {formatChordIntervalName(
                          getResolvedChordToneIntervalLabel(toneInToChord),
                        )}
                      </span>
                    </li>
                  ),
                )}
              </ul>
            </div>
          )}
        </>
      ) : (
        <p>
          This is the first chord in the progression, so there is no previous
          chord to compare.
        </p>
      )}
    </section>
  );
}
