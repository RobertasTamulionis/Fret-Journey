import type { PracticeStep } from "@/data/practiceRoutines";

type SessionCompleteProps = {
  hasNextExercise: boolean;
  onBackToLibrary: () => void;
  onNextExercise: () => void;
  onRepeat: () => void;
  step: PracticeStep;
  tempo: number;
};

export default function SessionComplete({
  hasNextExercise,
  onBackToLibrary,
  onNextExercise,
  onRepeat,
  step,
  tempo,
}: SessionCompleteProps) {
  return (
    <section className="sessionComplete">
      <span aria-hidden="true" className="sessionComplete__mark">
        ✓
      </span>
      <span className="sessionComplete__eyebrow">Exercise completed</span>
      <h1 data-practice-screen-heading tabIndex={-1}>
        {step.title}
      </h1>
      <p>You finished this focused practice session.</p>
      <dl>
        <div>
          <dt>Tempo used</dt>
          <dd>{tempo} BPM</dd>
        </div>
      </dl>
      <div className="sessionComplete__actions">
        <button
          className="practicePrimaryAction"
          onClick={onRepeat}
          type="button"
        >
          Repeat exercise
        </button>
        <button
          disabled={!hasNextExercise}
          onClick={onNextExercise}
          type="button"
        >
          Next exercise
        </button>
        <button onClick={onBackToLibrary} type="button">
          Back to library
        </button>
      </div>
    </section>
  );
}
