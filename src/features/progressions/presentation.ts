import type { ResolvedChordTone } from "./types";

const intervalNamesByRole: Record<
  ResolvedChordTone["role"],
  Partial<Record<number, string>>
> = {
  fifth: { 6: "d5", 7: "P5", 8: "A5" },
  fourth: { 5: "P4", 6: "A4" },
  ninth: { 1: "m9", 2: "M9", 3: "A9" },
  root: { 0: "R" },
  second: { 1: "m2", 2: "M2", 3: "A2" },
  seventh: { 9: "d7", 10: "m7", 11: "M7" },
  sixth: { 8: "m6", 9: "M6", 10: "A6" },
  third: { 3: "m3", 4: "M3", 5: "A3" },
};

export const getResolvedChordToneIntervalLabel = (
  tone: ResolvedChordTone,
): string => {
  const simpleSemitones = tone.semitones % 12;
  return intervalNamesByRole[tone.role][simpleSemitones] ?? tone.role;
};
