"use client";

import {
  getJourneyRecommendedExerciseId,
  type PracticeJourney,
} from "@/data/practiceJourneys";
import { practiceRoutines } from "@/data/practiceRoutines";
import type { PracticeTabExampleId } from "@/data/practiceTabExamples";
import { getPracticeContextCompatibility } from "@/features/practice/resolvePracticeTab";
import { useAppSelector } from "@/lib/redux/store";

type PracticeJourneyOverviewProps = {
  completedExerciseIds: readonly PracticeTabExampleId[];
  journey: PracticeJourney;
  onBack: () => void;
  onSelectExercise: (exerciseId: PracticeTabExampleId) => void;
};

const getExerciseTitle = (exerciseId: PracticeTabExampleId): string => {
  for (const routine of practiceRoutines) {
    const step = routine.steps.find(
      (candidate) =>
        candidate.exampleId === exerciseId && !candidate.isSharedReference,
    );
    if (step) return step.title;
  }

  for (const routine of practiceRoutines) {
    const step = routine.steps.find(
      (candidate) => candidate.exampleId === exerciseId,
    );
    if (step) return step.title;
  }

  return exerciseId;
};

export default function PracticeJourneyOverview({
  completedExerciseIds,
  journey,
  onBack,
  onSelectExercise,
}: PracticeJourneyOverviewProps) {
  const { currentKey, currentScale, registeredTuning, stringCount, tuning } =
    useAppSelector((state) => state.fretboard);
  const context = {
    currentKey,
    currentScale,
    registeredTuning,
    stringCount,
    tuning,
  };
  const recommendedExerciseId = getJourneyRecommendedExerciseId(
    journey,
    completedExerciseIds,
  );
  const completedCount = completedExerciseIds.length;
  const journeyComplete = completedCount === journey.steps.length;

  return (
    <div className="practiceJourney" data-practice-screen-heading tabIndex={-1}>
      <button className="practiceTextButton" onClick={onBack} type="button">
        ← Practice Library
      </button>

      <header className="practiceJourney__header">
        <span>Exercise Journey</span>
        <h1>{journey.title}</h1>
        <strong>{journey.finalOutcome}</strong>
        <p>{journey.description}</p>
        <div className="practiceJourney__progress">
          <span>
            {completedCount} / {journey.steps.length} sessions complete
          </span>
          <progress max={journey.steps.length} value={completedCount}>
            {completedCount} of {journey.steps.length}
          </progress>
        </div>
        <p className="practiceJourney__recommendation">
          {journeyComplete
            ? "Journey complete. Repeat any step whenever you want to reinforce it."
            : `Recommended next: ${getExerciseTitle(recommendedExerciseId as PracticeTabExampleId)}`}
        </p>
      </header>

      <ol className="practiceJourney__steps">
        {journey.steps.map((journeyStep, index) => {
          const completed = completedExerciseIds.includes(
            journeyStep.exerciseId,
          );
          const recommended = journeyStep.exerciseId === recommendedExerciseId;
          const compatibility = getPracticeContextCompatibility(
            journeyStep.exerciseId,
            context,
          );

          return (
            <li
              className="practiceJourneyStep"
              data-completed={completed}
              data-recommended={recommended}
              key={journeyStep.exerciseId}
            >
              <span className="practiceJourneyStep__number">
                {completed ? "✓" : index + 1}
              </span>
              <div className="practiceJourneyStep__copy">
                <div>
                  <span>
                    Step {index + 1} of {journey.steps.length}
                  </span>
                  {recommended && <em>Recommended</em>}
                  {completed && <em>Completed</em>}
                </div>
                <h2>{getExerciseTitle(journeyStep.exerciseId)}</h2>
                <p>{journeyStep.objective}</p>
                <small>{journeyStep.transition}</small>
                {!compatibility.compatible && (
                  <span className="practiceJourneyStep__context">
                    Authored · {compatibility.authoredContextLabel}
                  </span>
                )}
              </div>
              <button
                className={recommended ? "practicePrimaryAction" : undefined}
                onClick={() => onSelectExercise(journeyStep.exerciseId)}
                type="button"
              >
                {completed ? "Repeat step" : "Start step"}
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
