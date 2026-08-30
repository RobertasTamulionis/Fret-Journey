import { isProductionCatalogSourceId } from "@/data/progressionSources";
import { tonicOptions } from "@/helpers/musicTheory";
import type { ScaleName } from "@/helpers/typesHelpers";
import { isChordFormulaId } from "./chordFormulas";
import { resolveRelativeChord } from "./resolver";
import type {
  ProgressionCategory,
  ProgressionStep,
  ProgressionTemplate,
  RelativeChordSpec,
} from "./types";
import { isRelativeDegree, isScaleName } from "./validators";

export const progressionCategories: readonly ProgressionCategory[] = [
  "major-diatonic",
  "natural-minor",
  "harmonic-minor",
  "phrygian-dominant",
  "blues",
  "pop-rock-loop",
  "cadence",
  "circle-progression",
  "jazz-turnaround",
  "modal",
  "borrowed-chord",
  "secondary-dominant",
  "chromatic-mediant",
  "gospel-rnb",
  "cinematic",
];

export const minimumProgressionCatalogCount = 210;

export type ProgressionCatalogIssue = {
  code: string;
  message: string;
  templateId?: string;
};

export type ProgressionCatalogValidation = {
  categoryCounts: Record<ProgressionCategory, number>;
  count: number;
  issues: readonly ProgressionCatalogIssue[];
  uniqueSignatureCount: number;
  valid: boolean;
};

const emptyCategoryCounts = (): Record<ProgressionCategory, number> =>
  Object.fromEntries(
    progressionCategories.map((category) => [category, 0]),
  ) as Record<ProgressionCategory, number>;

const normalizeDegree = (
  degree: RelativeChordSpec["root"] | undefined,
): string => (degree ? `${degree.alteration}:${degree.degree}` : "-");

const normalizeChord = (chord: RelativeChordSpec): string =>
  [
    `root=${normalizeDegree(chord.root)}`,
    `formula=${chord.formulaId}`,
    `scope=${chord.appliedTo ? "secondary-dominant" : (chord.harmonicScope ?? "diatonic")}`,
    `target=${normalizeDegree(chord.appliedTo)}`,
    `targetCase=${chord.appliedTo?.romanCase ?? "upper"}`,
    `bass=${normalizeDegree(chord.bass)}`,
  ].join("|");

const normalizeStep = (step: ProgressionStep): string =>
  `${normalizeChord(step.chord)}|beats=${step.durationBeats}`;

const getCanonicalLoopOrder = (steps: readonly ProgressionStep[]): string => {
  const normalizedSteps = steps.map(normalizeStep);
  const rotations = normalizedSteps.map((_, startIndex) =>
    normalizedSteps
      .slice(startIndex)
      .concat(normalizedSteps.slice(0, startIndex))
      .join(">"),
  );

  return rotations.sort()[0] ?? "";
};

export const getProgressionUniquenessSignature = (
  template: Pick<ProgressionTemplate, "form" | "steps" | "tonalFramework">,
): string => {
  const orderedSteps =
    template.form === "loop"
      ? getCanonicalLoopOrder(template.steps)
      : template.steps.map(normalizeStep).join(">");

  return `${template.tonalFramework}|${template.form}|${orderedSteps}`;
};

const isNonEmptyText = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

const addIssue = (
  issues: ProgressionCatalogIssue[],
  issue: ProgressionCatalogIssue,
): void => {
  issues.push(issue);
};

const validateChordSpec = (
  template: ProgressionTemplate,
  step: ProgressionStep,
  issues: ProgressionCatalogIssue[],
): void => {
  if (!isRelativeDegree(step.chord.root)) {
    addIssue(issues, {
      code: "invalid-root",
      message: `${step.id} has an invalid relative root`,
      templateId: template.id,
    });
  }

  if (step.chord.bass && !isRelativeDegree(step.chord.bass)) {
    addIssue(issues, {
      code: "invalid-bass",
      message: `${step.id} has an invalid relative bass`,
      templateId: template.id,
    });
  }

  if (step.chord.appliedTo && !isRelativeDegree(step.chord.appliedTo)) {
    addIssue(issues, {
      code: "invalid-applied-target",
      message: `${step.id} has an invalid applied target`,
      templateId: template.id,
    });
  }

  if (!isChordFormulaId(step.chord.formulaId)) {
    addIssue(issues, {
      code: "invalid-formula",
      message: `${step.id} has an invalid chord formula`,
      templateId: template.id,
    });
  }

  if (!Number.isFinite(step.durationBeats) || step.durationBeats <= 0) {
    addIssue(issues, {
      code: "invalid-duration",
      message: `${step.id} must have a positive duration`,
      templateId: template.id,
    });
  }

  const scope = step.chord.appliedTo
    ? "secondary-dominant"
    : (step.chord.harmonicScope ?? "diatonic");

  if (!template.harmonicDevices.includes(scope)) {
    addIssue(issues, {
      code: "missing-harmonic-device",
      message: `${step.id} uses ${scope}, which is missing from harmonicDevices`,
      templateId: template.id,
    });
  }

  for (const { name: tonic } of tonicOptions) {
    try {
      resolveRelativeChord(step.chord, tonic);
    } catch (error) {
      addIssue(issues, {
        code: "transposition-failed",
        message: `${step.id} fails in ${tonic}: ${error instanceof Error ? error.message : String(error)}`,
        templateId: template.id,
      });
    }
  }
};

export const validateProgressionCatalog = (
  catalog: readonly ProgressionTemplate[],
  minimumCount = minimumProgressionCatalogCount,
): ProgressionCatalogValidation => {
  const issues: ProgressionCatalogIssue[] = [];
  const categoryCounts = emptyCategoryCounts();
  const ids = new Set<string>();
  const slugs = new Set<string>();
  const stepIds = new Set<string>();
  const signatures = new Map<string, string>();

  if (catalog.length < minimumCount) {
    addIssue(issues, {
      code: "catalog-too-small",
      message: `Catalog has ${catalog.length} entries; expected at least ${minimumCount}`,
    });
  }

  for (const template of catalog) {
    if (progressionCategories.includes(template.category)) {
      categoryCounts[template.category] += 1;
    } else {
      addIssue(issues, {
        code: "invalid-category",
        message: `${template.id} has an invalid category`,
        templateId: template.id,
      });
    }

    if (!isNonEmptyText(template.id) || ids.has(template.id)) {
      addIssue(issues, {
        code: "duplicate-or-empty-id",
        message: `Invalid or duplicate template id: ${template.id}`,
        templateId: template.id,
      });
    }
    ids.add(template.id);

    if (
      !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(template.slug) ||
      slugs.has(template.slug)
    ) {
      addIssue(issues, {
        code: "duplicate-or-invalid-slug",
        message: `Invalid or duplicate slug: ${template.slug}`,
        templateId: template.id,
      });
    }
    slugs.add(template.slug);

    if (
      !isNonEmptyText(template.title) ||
      !isNonEmptyText(template.explanation)
    ) {
      addIssue(issues, {
        code: "missing-editorial-copy",
        message: `${template.id} needs a title and original explanation`,
        templateId: template.id,
      });
    }

    if (template.reviewStatus !== "verified") {
      addIssue(issues, {
        code: "not-verified",
        message: `${template.id} is not editorially verified`,
        templateId: template.id,
      });
    }

    if (!isScaleName(template.tonalFramework)) {
      addIssue(issues, {
        code: "invalid-framework",
        message: `${template.id} has an invalid tonal framework`,
        templateId: template.id,
      });
    }

    if (
      template.compatibleScales.length === 0 ||
      !template.compatibleScales.every((scale): scale is ScaleName =>
        isScaleName(scale),
      ) ||
      !template.compatibleScales.includes(template.tonalFramework)
    ) {
      addIssue(issues, {
        code: "invalid-compatibility",
        message: `${template.id} must include its valid tonal framework in compatibleScales`,
        templateId: template.id,
      });
    }

    if (
      template.sourceReferenceIds.length === 0 ||
      !template.sourceReferenceIds.every(isProductionCatalogSourceId)
    ) {
      addIssue(issues, {
        code: "invalid-source",
        message: `${template.id} has an empty or unknown source reference`,
        templateId: template.id,
      });
    }

    if (
      new Set(template.sourceReferenceIds).size !==
      template.sourceReferenceIds.length
    ) {
      addIssue(issues, {
        code: "duplicate-source",
        message: `${template.id} repeats a source reference`,
        templateId: template.id,
      });
    }

    if (template.steps.length < 2 || template.steps.length > 8) {
      addIssue(issues, {
        code: "invalid-step-count",
        message: `${template.id} must contain 2 through 8 chord events`,
        templateId: template.id,
      });
    }

    const localStepIds = new Set<string>();
    for (const step of template.steps) {
      if (
        !isNonEmptyText(step.id) ||
        localStepIds.has(step.id) ||
        stepIds.has(step.id)
      ) {
        addIssue(issues, {
          code: "duplicate-or-empty-step-id",
          message: `${template.id} has invalid or duplicate step id ${step.id}`,
          templateId: template.id,
        });
      }
      localStepIds.add(step.id);
      stepIds.add(step.id);
      validateChordSpec(template, step, issues);
    }

    const signature = getProgressionUniquenessSignature(template);
    const existingTemplateId = signatures.get(signature);
    if (existingTemplateId) {
      addIssue(issues, {
        code: "duplicate-signature",
        message: `${template.id} duplicates ${existingTemplateId}`,
        templateId: template.id,
      });
    } else {
      signatures.set(signature, template.id);
    }
  }

  for (const category of progressionCategories) {
    if (categoryCounts[category] === 0) {
      addIssue(issues, {
        code: "missing-category",
        message: `Catalog has no ${category} entries`,
      });
    }
  }

  return {
    categoryCounts,
    count: catalog.length,
    issues,
    uniqueSignatureCount: signatures.size,
    valid: issues.length === 0,
  };
};

export const assertValidProgressionCatalog = (
  catalog: readonly ProgressionTemplate[],
  minimumCount = minimumProgressionCatalogCount,
): ProgressionCatalogValidation => {
  const validation = validateProgressionCatalog(catalog, minimumCount);

  if (!validation.valid) {
    const summary = validation.issues
      .slice(0, 20)
      .map(({ code, message }) => `${code}: ${message}`)
      .join("\n");
    throw new Error(
      `Progression catalog validation failed with ${validation.issues.length} issue(s):\n${summary}`,
    );
  }

  return validation;
};
