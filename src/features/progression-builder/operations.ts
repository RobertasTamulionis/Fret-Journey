import type { AuthoredChordSpec, AuthoredProgressionStep } from "./types";

export const appendAuthoredChord = (
  steps: readonly AuthoredProgressionStep[],
  chord: AuthoredChordSpec,
  id: string,
): readonly AuthoredProgressionStep[] => [...steps, { chord, id }];

export const replaceAuthoredChord = (
  steps: readonly AuthoredProgressionStep[],
  index: number,
  chord: AuthoredChordSpec,
): readonly AuthoredProgressionStep[] =>
  steps.map((step, stepIndex) =>
    stepIndex === index ? { ...step, chord } : step,
  );

export const moveAuthoredChord = (
  steps: readonly AuthoredProgressionStep[],
  index: number,
  direction: -1 | 1,
): readonly AuthoredProgressionStep[] => {
  const destination = index + direction;
  if (index < 0 || destination < 0 || destination >= steps.length) return steps;
  const next = [...steps];
  [next[index], next[destination]] = [next[destination], next[index]];
  return next;
};

export const removeAuthoredChord = (
  steps: readonly AuthoredProgressionStep[],
  index: number,
): readonly AuthoredProgressionStep[] =>
  steps.filter((_, stepIndex) => stepIndex !== index);
