import {
  type PracticeRoutineId,
  practiceRoutines,
  practiceSources,
} from "@/data/practiceRoutines";
import { practiceTabExamples } from "@/data/practiceTabExamples";

type PracticeLibraryProps = {
  onSelectExercise: (routineId: PracticeRoutineId, stepIndex: number) => void;
};

export default function PracticeLibrary({
  onSelectExercise,
}: PracticeLibraryProps) {
  return (
    <div className="practiceLibrary">
      <header className="practiceLibrary__header">
        <span>Practice Library</span>
        <h1 data-practice-screen-heading tabIndex={-1}>
          Choose one thing to work on
        </h1>
        <p>
          Pick an exercise, then move into a focused session with the score and
          controls you need—nothing else.
        </p>
        <small>
          Start gently and stay relaxed. Stop for pain, weakness, tingling, or
          loss of control.
        </small>
      </header>

      <div className="practiceLibrary__groups">
        {practiceRoutines.map((routine) => (
          <section
            aria-labelledby={`${routine.id}-library-heading`}
            className="practiceCategory"
            key={routine.id}
          >
            <header className="practiceCategory__header">
              <div>
                <span>{routine.eyebrow}</span>
                <h2 id={`${routine.id}-library-heading`}>{routine.tabLabel}</h2>
              </div>
              <p>{routine.objective}</p>
            </header>

            <div className="practiceCategory__grid">
              {routine.steps.map((step, stepIndex) => {
                const example = practiceTabExamples[step.exampleId];

                return (
                  <button
                    className="exerciseCard"
                    key={step.exampleId}
                    onClick={() => onSelectExercise(routine.id, stepIndex)}
                    type="button"
                  >
                    <span className="exerciseCard__meta">
                      Exercise {stepIndex + 1} · {step.duration}
                    </span>
                    <strong>{step.title}</strong>
                    <span className="exerciseCard__description">
                      {step.instruction}
                    </span>
                    <span className="exerciseCard__footer">
                      <span>{example.bpm} BPM starting point</span>
                      <span aria-hidden="true">Start →</span>
                    </span>
                  </button>
                );
              })}
            </div>

            <details className="practiceCategory__sources">
              <summary>Coaching sources</summary>
              <ul>
                {routine.sourceIds.map((sourceId) => {
                  const source = practiceSources.find(
                    ({ id }) => id === sourceId,
                  );

                  if (!source) {
                    return null;
                  }

                  return (
                    <li key={source.id}>
                      <a href={source.url} rel="noreferrer" target="_blank">
                        {source.title} · {source.publisher}
                      </a>
                    </li>
                  );
                })}
              </ul>
            </details>
          </section>
        ))}
      </div>
    </div>
  );
}
