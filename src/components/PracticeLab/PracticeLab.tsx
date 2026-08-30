"use client";

import Link from "next/link";
import { type KeyboardEvent, useRef, useState } from "react";
import {
  type PracticeRoutineId,
  practiceRoutines,
  practiceSources,
} from "@/data/practiceRoutines";
import { practiceTabExamples } from "@/data/practiceTabExamples";
import {
  formatNoteName,
  getScaleTones,
  scaleDefinitions,
} from "@/helpers/fretboardHelpers";
import { useAppSelector } from "@/lib/redux/store";
import PracticeTablature from "./PracticeTablature";
import "./practiceLab.scss";

const getTabId = (routineId: PracticeRoutineId): string =>
  `practice-tab-${routineId}`;

const getPanelId = (routineId: PracticeRoutineId): string =>
  `practice-panel-${routineId}`;

export default function PracticeLab() {
  const [activeRoutineId, setActiveRoutineId] =
    useState<PracticeRoutineId>("daily-mix");
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const { currentKey, currentScale } = useAppSelector(
    (state) => state.fretboard,
  );
  const activeRoutine =
    practiceRoutines.find(({ id }) => id === activeRoutineId) ??
    practiceRoutines[0];
  const currentScaleDefinition = scaleDefinitions[currentScale];
  const currentScaleTones = getScaleTones(currentKey, currentScale);
  const activeSources = activeRoutine.sourceIds
    .map((sourceId) => practiceSources.find(({ id }) => id === sourceId))
    .filter((source) => source !== undefined);
  const activeStep =
    activeRoutine.steps[activeStepIndex] ?? activeRoutine.steps[0];
  const activeExample = practiceTabExamples[activeStep.exampleId];

  const selectRoutine = (routineId: PracticeRoutineId) => {
    setActiveRoutineId(routineId);
    setActiveStepIndex(0);
  };

  const selectAndFocusTab = (index: number) => {
    const nextRoutine = practiceRoutines[index];

    if (!nextRoutine) {
      return;
    }

    selectRoutine(nextRoutine.id);
    const nextTab = tabRefs.current[index];
    nextTab?.focus();
    nextTab?.scrollIntoView({
      behavior: "auto",
      block: "nearest",
      inline: "nearest",
    });
  };

  const handleTabKeyDown = (
    event: KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) => {
    let nextIndex: number | undefined;

    if (event.key === "ArrowRight") {
      nextIndex = (index + 1) % practiceRoutines.length;
    } else if (event.key === "ArrowLeft") {
      nextIndex =
        (index - 1 + practiceRoutines.length) % practiceRoutines.length;
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = practiceRoutines.length - 1;
    }

    if (nextIndex === undefined) {
      return;
    }

    event.preventDefault();
    selectAndFocusTab(nextIndex);
  };

  return (
    <section className="practiceLab">
      <header className="practiceLab__hero">
        <div>
          <span className="practiceLab__eyebrow">Daily technique studio</span>
          <h1 className="practiceLab__heading">Practice Lab</h1>
          <p className="practiceLab__introduction">
            Stop running the same shapes on autopilot. Pick one movement, define
            one clean win, and finish by turning it into music.
          </p>
        </div>
        <div className="practiceLab__heroNote">
          <span>{practiceRoutines.length} guided sessions</span>
          <strong>Pick a focus. Keep a pulse. End with music.</strong>
        </div>
      </header>

      <div className="practiceLab__healthNote">
        <span aria-hidden="true">●</span>
        <p>
          Start gently and stay relaxed. Stop for pain, weakness, tingling,
          unusual fatigue, or loss of control. Your clean tempo is the useful
          number—not your maximum.
        </p>
      </div>

      <section
        aria-label="Daily guitar practice routines"
        className="practiceWorkspace"
      >
        <div
          aria-label="Practice technique"
          aria-orientation="horizontal"
          className="practiceTabs"
          role="tablist"
        >
          {practiceRoutines.map((routine, index) => {
            const isActive = routine.id === activeRoutine.id;

            return (
              <button
                aria-controls={getPanelId(routine.id)}
                aria-selected={isActive}
                className="practiceTabs__tab"
                id={getTabId(routine.id)}
                key={routine.id}
                onClick={() => selectRoutine(routine.id)}
                onKeyDown={(event) => handleTabKeyDown(event, index)}
                ref={(node) => {
                  tabRefs.current[index] = node;
                }}
                role="tab"
                tabIndex={isActive ? 0 : -1}
                type="button"
              >
                <span>{String(index + 1).padStart(2, "0")}</span>
                {routine.tabLabel}
              </button>
            );
          })}
        </div>

        {practiceRoutines
          .filter(({ id }) => id !== activeRoutine.id)
          .map((routine) => (
            <div
              aria-labelledby={getTabId(routine.id)}
              hidden
              id={getPanelId(routine.id)}
              key={routine.id}
              role="tabpanel"
            />
          ))}

        <div
          aria-labelledby={getTabId(activeRoutine.id)}
          className="practiceRoutine"
          id={getPanelId(activeRoutine.id)}
          role="tabpanel"
          // biome-ignore lint/a11y/noNoninteractiveTabindex: The active tab panel is the next keyboard focus stop after the tab list.
          tabIndex={0}
        >
          <header className="practiceRoutine__header">
            <div>
              <span className="practiceRoutine__eyebrow">
                {activeRoutine.eyebrow}
              </span>
              <h2>{activeRoutine.title}</h2>
              <p>{activeRoutine.objective}</p>
            </div>
            <dl className="practiceRoutine__facts">
              <div>
                <dt>Session</dt>
                <dd>{activeRoutine.duration}</dd>
              </div>
              <div>
                <dt>Exercises</dt>
                <dd>{activeRoutine.steps.length} playable tabs</dd>
              </div>
            </dl>
          </header>

          <section
            aria-labelledby={`${activeRoutine.id}-player-heading`}
            className="practicePlayer"
          >
            <header className="practicePlayer__header">
              <div>
                <span>Choose a drill</span>
                <h3 id={`${activeRoutine.id}-player-heading`}>
                  Select, loop, play
                </h3>
              </div>
              <p>One score at a time. No scrolling through a wall of notes.</p>
            </header>

            <ol className="practiceDrills" aria-label="Routine exercises">
              {activeRoutine.steps.map((step, index) => {
                const isActive = index === activeStepIndex;

                return (
                  <li key={step.exampleId}>
                    <button
                      aria-controls={`${activeRoutine.id}-active-drill`}
                      aria-pressed={isActive}
                      onClick={() => setActiveStepIndex(index)}
                      type="button"
                    >
                      <span>{String(index + 1).padStart(2, "0")}</span>
                      <strong>{step.title}</strong>
                      <small>{step.duration}</small>
                    </button>
                  </li>
                );
              })}
            </ol>

            <article
              aria-labelledby={`${activeStep.exampleId}-heading`}
              className="practiceDrill"
              id={`${activeRoutine.id}-active-drill`}
            >
              <header className="practiceDrill__header">
                <div>
                  <span>{activeStep.phase}</span>
                  <h4 id={`${activeStep.exampleId}-heading`}>
                    {activeStep.title}
                  </h4>
                </div>
                <time>{activeStep.duration}</time>
              </header>

              <PracticeTablature example={activeExample} />

              <div className="practiceDrill__guidance">
                <p>
                  <span>Play it</span>
                  {activeStep.instruction}
                </p>
                <p>
                  <span>Pass when</span>
                  {activeStep.success}
                </p>
              </div>

              <details className="practiceDrill__coach">
                <summary>Technique note</summary>
                <p>{activeStep.coach}</p>
              </details>

              <nav
                aria-label="Exercise navigation"
                className="practiceDrill__navigation"
              >
                <button
                  disabled={activeStepIndex === 0}
                  onClick={() => setActiveStepIndex((index) => index - 1)}
                  type="button"
                >
                  ← Previous
                </button>
                <span>
                  {activeStepIndex + 1} / {activeRoutine.steps.length}
                </span>
                <button
                  disabled={activeStepIndex === activeRoutine.steps.length - 1}
                  onClick={() => setActiveStepIndex((index) => index + 1)}
                  type="button"
                >
                  Next →
                </button>
              </nav>
            </article>
          </section>

          <aside className="practiceSupport" aria-label="Practice support">
            <section className="practiceSupport__context">
              <span>Your fretboard</span>
              <h3>
                {formatNoteName(currentKey)} {currentScaleDefinition.label}
              </h3>
              <p className="practiceSupport__formula">
                {currentScaleDefinition.tones
                  .map(({ degreeLabel }) => degreeLabel.replace("b", "♭"))
                  .join(" · ")}
              </p>
              <p>
                {currentScaleTones
                  .map(({ name }) => formatNoteName(name))
                  .join(" · ")}
              </p>
              <small>The authored tab above stays in Standard E.</small>
              <Link href="/">Open Fretboard</Link>
            </section>

            <details className="practiceSupport__details">
              <summary>
                <span>Routine notes</span>
                Progression + musical transfer
              </summary>
              <div>
                <section>
                  <h3>Change one variable</h3>
                  <p>{activeRoutine.progressionRule}</p>
                </section>
                <section>
                  <h3>Make it musical</h3>
                  <p>{activeRoutine.musicalPrompt}</p>
                </section>
                <ul>
                  {activeRoutine.qualityChecks.map((check) => (
                    <li key={check}>{check}</li>
                  ))}
                </ul>
              </div>
            </details>

            <details className="practiceSupport__details practiceSupport__sources">
              <summary>
                <span>Sources</span>
                Why these drills work
              </summary>
              <ul>
                {activeSources.map((source) => (
                  <li key={source.id}>
                    <a href={source.url} rel="noreferrer" target="_blank">
                      {source.title}
                      <small>{source.publisher}</small>
                    </a>
                  </li>
                ))}
              </ul>
            </details>
          </aside>
        </div>
      </section>
    </section>
  );
}
