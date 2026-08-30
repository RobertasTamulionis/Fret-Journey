import { scaleDefinitions, tonicOptions } from "@/helpers/musicTheory";
import type { ScaleDegree, ScaleName, TonicName } from "@/helpers/typesHelpers";
import type {
  DegreeAlteration,
  ProgressionTemplate,
  ProgressionUrlContext,
  RelativeDegree,
  TonalContext,
} from "./types";

export type ProgressionSearchParams =
  | { get(name: string): string | null }
  | Record<string, string | string[] | undefined>;

const tonicNames = new Set<TonicName>(tonicOptions.map(({ name }) => name));
const scaleNames = new Set<ScaleName>(
  Object.keys(scaleDefinitions) as ScaleName[],
);
const scaleDegrees = new Set<ScaleDegree>([1, 2, 3, 4, 5, 6, 7]);
const degreeAlterations = new Set<DegreeAlteration>([-2, -1, 0, 1, 2]);

export const isTonicName = (value: unknown): value is TonicName =>
  typeof value === "string" && tonicNames.has(value as TonicName);

export const isScaleName = (value: unknown): value is ScaleName =>
  typeof value === "string" && scaleNames.has(value as ScaleName);

export const isRelativeDegree = (value: unknown): value is RelativeDegree => {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<RelativeDegree>;
  return (
    scaleDegrees.has(candidate.degree as ScaleDegree) &&
    degreeAlterations.has(candidate.alteration as DegreeAlteration)
  );
};

const getSearchParameter = (
  searchParams: ProgressionSearchParams,
  name: "key" | "scale",
): string | undefined => {
  if ("get" in searchParams && typeof searchParams.get === "function") {
    return searchParams.get(name) ?? undefined;
  }

  const parameterRecord = searchParams as Record<
    string,
    string | string[] | undefined
  >;
  const value = parameterRecord[name];

  if (typeof value === "string") {
    return value;
  }

  if (Array.isArray(value) && value.length === 1) {
    return value[0];
  }

  return undefined;
};

export const parseProgressionUrlContext = (
  searchParams: ProgressionSearchParams,
): ProgressionUrlContext => {
  const key = getSearchParameter(searchParams, "key");
  const scale = getSearchParameter(searchParams, "scale");

  return {
    ...(isTonicName(key) ? { currentKey: key } : {}),
    ...(isScaleName(scale) ? { currentScale: scale } : {}),
  };
};

export const resolveProgressionTonalContext = ({
  defaults,
  existing,
  url,
}: {
  defaults: TonalContext;
  existing?: Partial<TonalContext>;
  url?: ProgressionUrlContext;
}): TonalContext => ({
  currentKey: url?.currentKey ?? existing?.currentKey ?? defaults.currentKey,
  currentScale:
    url?.currentScale ?? existing?.currentScale ?? defaults.currentScale,
});

export const isProgressionCompatibleWithScale = (
  progression: Pick<ProgressionTemplate, "compatibleScales">,
  scale: ScaleName,
): boolean => progression.compatibleScales.includes(scale);

export const rankCompatibleProgressionsFirst = <
  Progression extends Pick<ProgressionTemplate, "compatibleScales">,
>(
  progressions: readonly Progression[],
  scale: ScaleName,
): Progression[] =>
  progressions
    .map((progression, originalIndex) => ({ progression, originalIndex }))
    .sort((first, second) => {
      const compatibilityDifference =
        Number(isProgressionCompatibleWithScale(second.progression, scale)) -
        Number(isProgressionCompatibleWithScale(first.progression, scale));

      return (
        compatibilityDifference || first.originalIndex - second.originalIndex
      );
    })
    .map(({ progression }) => progression);
