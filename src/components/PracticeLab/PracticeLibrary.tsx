"use client";

import { useMemo, useState } from "react";
import {
  formatPracticeTag,
  type PracticeDifficulty,
  type PracticeGenre,
  type PracticeTechnique,
  practiceDifficulties,
  practiceExerciseMetadata,
  practiceGenres,
  practiceTechniques,
} from "@/data/practiceExerciseMetadata";
import {
  type PracticeRoutineId,
  practiceRoutines,
  practiceSources,
} from "@/data/practiceRoutines";

type PracticeLibraryProps = {
  onSelectExercise: (routineId: PracticeRoutineId, stepIndex: number) => void;
};

export default function PracticeLibrary({
  onSelectExercise,
}: PracticeLibraryProps) {
  const [search, setSearch] = useState("");
  const [genre, setGenre] = useState<PracticeGenre | "all">("all");
  const [technique, setTechnique] = useState<PracticeTechnique | "all">("all");
  const [difficulty, setDifficulty] = useState<PracticeDifficulty | "all">(
    "all",
  );
  const normalizedSearch = search.trim().toLowerCase();
  const filteredRoutines = useMemo(
    () =>
      practiceRoutines
        .map((routine) => ({
          ...routine,
          visibleSteps: routine.steps
            .map((step, stepIndex) => ({ step, stepIndex }))
            .filter(({ step }) => {
              const metadata = practiceExerciseMetadata[step.exampleId];
              const searchableText = [
                step.title,
                step.instruction,
                metadata.focus,
                ...metadata.genres,
                ...metadata.techniques,
              ]
                .join(" ")
                .toLowerCase();

              return (
                (!normalizedSearch ||
                  searchableText.includes(normalizedSearch)) &&
                (genre === "all" || metadata.genres.includes(genre)) &&
                (technique === "all" ||
                  metadata.techniques.includes(technique)) &&
                (difficulty === "all" || metadata.difficulty === difficulty)
              );
            }),
        }))
        .filter(({ visibleSteps }) => visibleSteps.length > 0),
    [difficulty, genre, normalizedSearch, technique],
  );
  const visibleExerciseCount = filteredRoutines.reduce(
    (count, routine) => count + routine.visibleSteps.length,
    0,
  );
  const totalExerciseCount = practiceRoutines.reduce(
    (count, routine) => count + routine.steps.length,
    0,
  );

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

      <section
        aria-label="Find a practice exercise"
        className="practiceFilters"
      >
        <div className="practiceFilters__heading">
          <div>
            <span>Find an exercise</span>
            <strong>
              {visibleExerciseCount} of {totalExerciseCount}
            </strong>
          </div>
          <p>Filter by the result you want, not an exercise number.</p>
        </div>
        <div className="practiceFilters__controls">
          <label>
            <span>Search</span>
            <input
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Riff, gallop, legato…"
              type="search"
              value={search}
            />
          </label>
          <label>
            <span>Genre</span>
            <select
              onChange={(event) =>
                setGenre(event.target.value as PracticeGenre | "all")
              }
              value={genre}
            >
              <option value="all">All genres</option>
              {practiceGenres.map((value) => (
                <option key={value} value={value}>
                  {formatPracticeTag(value)}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Technique</span>
            <select
              onChange={(event) =>
                setTechnique(event.target.value as PracticeTechnique | "all")
              }
              value={technique}
            >
              <option value="all">All techniques</option>
              {practiceTechniques.map((value) => (
                <option key={value} value={value}>
                  {formatPracticeTag(value)}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Difficulty</span>
            <select
              onChange={(event) =>
                setDifficulty(event.target.value as PracticeDifficulty | "all")
              }
              value={difficulty}
            >
              <option value="all">All difficulties</option>
              {practiceDifficulties.map((value) => (
                <option key={value} value={value}>
                  {formatPracticeTag(value)}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <div className="practiceLibrary__groups">
        {filteredRoutines.map((routine) => (
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
            </header>

            <div className="practiceCategory__grid">
              {routine.visibleSteps.map(({ step, stepIndex }) => {
                const metadata = practiceExerciseMetadata[step.exampleId];

                return (
                  <button
                    className="exerciseCard"
                    key={step.exampleId}
                    onClick={() => onSelectExercise(routine.id, stepIndex)}
                    type="button"
                  >
                    <span className="exerciseCard__meta">
                      {formatPracticeTag(metadata.techniques[0])}
                    </span>
                    <strong>{step.title}</strong>
                    <span className="exerciseCard__description">
                      {step.instruction}
                    </span>
                    <span className="exerciseCard__footer">
                      <span>
                        {formatPracticeTag(metadata.difficulty)} ·{" "}
                        {step.duration}
                      </span>
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
        {visibleExerciseCount === 0 && (
          <div className="practiceLibrary__empty">
            <strong>No exercises match those filters.</strong>
            <span>Try a broader genre, technique, or search term.</span>
          </div>
        )}
      </div>
    </div>
  );
}
