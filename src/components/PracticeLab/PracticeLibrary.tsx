"use client";

import { useMemo, useState } from "react";
import {
  formatPracticeTag,
  getPracticeContentType,
  type PracticeDifficulty,
  practiceDifficulties,
  practiceExerciseMetadata,
} from "@/data/practiceExerciseMetadata";
import {
  type PracticeRoutine,
  type PracticeRoutineId,
  type PracticeStep,
  practiceRoutines,
  practiceSources,
} from "@/data/practiceRoutines";
import {
  type PracticeTabExampleId,
  practiceTabExampleIds,
  practiceTabExamples,
} from "@/data/practiceTabExamples";
import {
  getPracticeContextCompatibility,
  resolvePracticeTab,
} from "@/features/practice/resolvePracticeTab";
import type { PracticeTabExample } from "@/features/practice/tablature";
import { useAppSelector } from "@/lib/redux/store";
import CompactPracticeTabPreview from "./CompactPracticeTabPreview";
import Select from "@/components/ui/Select/Select";

type PracticeLibraryProps = {
  onSelectExercise: (routineId: PracticeRoutineId, stepIndex: number) => void;
};

type ExerciseCardProps = {
  authoredContext: string | null;
  example: PracticeTabExample;
  onSelect: () => void;
  routine: PracticeRoutine;
  step: PracticeStep;
};

const familyMarks: Record<string, string> = {
  "alternate-picking": "↕",
  downpicking: "↓",
  "expressive-lead": "~",
  gallops: "∿",
  legato: "⌒",
  "musical-phrasing": "◒",
  "palm-muted-metal": "×",
  "pedal-riffs": "⊥",
  "scale-navigation": "↗",
  "string-skipping": "⌁",
  "sweep-picking": "⤢",
};

function ExerciseCard({
  authoredContext,
  example,
  onSelect,
  routine,
  step,
}: ExerciseCardProps) {
  const metadata = practiceExerciseMetadata[step.exampleId];
  const contentType = getPracticeContentType(step.exampleId);

  return (
    <button
      className="exerciseCard"
      data-family={metadata.familyId}
      onClick={onSelect}
      type="button"
    >
      <span className="exerciseCard__identity">
        <span aria-hidden="true" className="exerciseCard__familyMark">
          {familyMarks[metadata.familyId] ?? "·"}
        </span>
        <span>{formatPracticeTag(metadata.familyId)}</span>
        <span aria-hidden="true">·</span>
        <span>
          {contentType === "drill" ? "Technique drill" : "Musical exercise"}
        </span>
        <span aria-hidden="true">·</span>
        <span>{formatPracticeTag(metadata.difficulty)}</span>
      </span>

      <strong>{step.title}</strong>
      <CompactPracticeTabPreview example={example} />

      <span className="exerciseCard__chips">
        {metadata.techniques.slice(0, 3).map((technique) => (
          <span key={technique}>{formatPracticeTag(technique)}</span>
        ))}
      </span>

      <span className="exerciseCard__metrics">
        <span>{metadata.tempo.recommended} BPM</span>
        <span>{formatPracticeTag(example.subdivision)}</span>
        <span>{step.duration}</span>
        {authoredContext && <span>Authored · {authoredContext}</span>}
      </span>
      <span className="exerciseCard__focus">{metadata.focus}</span>

      <span className="exerciseCard__footer">
        <span>{routine.tabLabel}</span>
        <span aria-hidden="true">Start →</span>
      </span>
    </button>
  );
}

export default function PracticeLibrary({
  onSelectExercise,
}: PracticeLibraryProps) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<PracticeRoutineId | "all">("all");
  const [difficulty, setDifficulty] = useState<PracticeDifficulty | "all">(
    "all",
  );
  const { currentKey, currentScale, registeredTuning, stringCount, tuning } =
    useAppSelector((state) => state.fretboard);
  const resolutionContext = useMemo(
    () => ({ currentKey, currentScale, registeredTuning, stringCount, tuning }),
    [currentKey, currentScale, registeredTuning, stringCount, tuning],
  );
  const resolvedExamples = useMemo(
    () =>
      Object.fromEntries(
        practiceRoutines.flatMap((routine) =>
          routine.steps.map((step) => {
            const compatibility = getPracticeContextCompatibility(
              step.exampleId,
              resolutionContext,
            );

            return [
              step.exampleId,
              compatibility.compatible
                ? resolvePracticeTab(step.exampleId, resolutionContext)
                : practiceTabExamples[step.exampleId],
            ];
          }),
        ),
      ) as Record<PracticeTabExampleId, PracticeTabExample>,
    [resolutionContext],
  );
  const incompatibleContexts = useMemo(
    () =>
      Object.fromEntries(
        practiceTabExampleIds.flatMap((exampleId) => {
          const compatibility = getPracticeContextCompatibility(
            exampleId,
            resolutionContext,
          );

          return compatibility.compatible
            ? []
            : [[exampleId, compatibility.authoredContextLabel ?? "Authored"]];
        }),
      ) as Partial<Record<PracticeTabExampleId, string>>,
    [resolutionContext],
  );
  const normalizedSearch = search.trim().toLowerCase();
  const filteredRoutines = useMemo(
    () =>
      practiceRoutines
        .filter((routine) => category === "all" || routine.id === category)
        .map((routine) => ({
          ...routine,
          visibleSteps: routine.steps
            .map((step, stepIndex) => ({ step, stepIndex }))
            .filter(({ step }) => {
              if (category === "all" && step.isSharedReference) {
                return false;
              }

              const metadata = practiceExerciseMetadata[step.exampleId];
              const searchableText = [
                step.title,
                step.instruction,
                metadata.focus,
                getPracticeContentType(step.exampleId),
                ...metadata.genres,
                ...metadata.techniques,
              ]
                .join(" ")
                .toLowerCase();

              return (
                (!normalizedSearch ||
                  searchableText.includes(normalizedSearch)) &&
                (difficulty === "all" || metadata.difficulty === difficulty)
              );
            }),
        }))
        .filter(({ visibleSteps }) => visibleSteps.length > 0),
    [category, difficulty, normalizedSearch],
  );
  const visibleExerciseCount = filteredRoutines.reduce(
    (count, routine) => count + routine.visibleSteps.length,
    0,
  );
  const totalExerciseCount = practiceTabExampleIds.length;
  return (
    <div className="practiceLibrary">
      <header className="practiceLibrary__header">
        <span>Practice Library</span>
        <h1 data-practice-screen-heading tabIndex={-1}>
          Exercises
        </h1>
      </header>

      <section
        aria-label="Find a practice exercise"
        className="practiceFilters"
      >
        <div className="practiceFilters__heading">
          <div>
            <span>Explore the library</span>
            <strong>
              {visibleExerciseCount} of {totalExerciseCount}
            </strong>
          </div>
          <p>Choose a family, then narrow by level only when useful.</p>
        </div>
        <div className="practiceFilters__searchRow">
          <label>
            <span>Search</span>
            <input
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Riff, gallop, legato…"
              type="search"
              value={search}
            />
          </label>
          <Select
            label="Level"
            onChange={(next) =>
              setDifficulty(next as PracticeDifficulty | "all")
            }
            options={[
              { value: "all", label: "All levels" },
              ...practiceDifficulties.map((value) => ({
                value,
                label: formatPracticeTag(value),
              })),
            ]}
            value={difficulty}
          />
        </div>
        <div className="practiceFilters__categories">
          <button
            aria-pressed={category === "all"}
            onClick={() => setCategory("all")}
            type="button"
          >
            All
          </button>
          {practiceRoutines.map((routine) => (
            <button
              aria-pressed={category === routine.id}
              key={routine.id}
              onClick={() => setCategory(routine.id)}
              type="button"
            >
              {routine.tabLabel}
            </button>
          ))}
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
                <p>{routine.objective}</p>
              </div>
            </header>

            <div className="practiceCategory__grid">
              {routine.visibleSteps.map(({ step, stepIndex }) => (
                <ExerciseCard
                  authoredContext={incompatibleContexts[step.exampleId] ?? null}
                  example={resolvedExamples[step.exampleId]}
                  key={step.exampleId}
                  onSelect={() => onSelectExercise(routine.id, stepIndex)}
                  routine={routine}
                  step={step}
                />
              ))}
            </div>

            <details className="practiceCategory__sources">
              <summary>Coaching sources</summary>
              <ul>
                {routine.sourceIds.map((sourceId) => {
                  const source = practiceSources.find(
                    ({ id }) => id === sourceId,
                  );
                  return source ? (
                    <li key={source.id}>
                      <a href={source.url} rel="noreferrer" target="_blank">
                        {source.title} · {source.publisher}
                      </a>
                    </li>
                  ) : null;
                })}
              </ul>
            </details>
          </section>
        ))}
        {visibleExerciseCount === 0 && (
          <div className="practiceLibrary__empty">
            <strong>No exercises match those filters.</strong>
            <span>Try another family, level, or search term.</span>
          </div>
        )}
      </div>
    </div>
  );
}
