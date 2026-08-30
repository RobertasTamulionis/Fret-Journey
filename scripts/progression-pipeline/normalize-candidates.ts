import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  isChordFormulaId,
  isRelativeDegree,
  type RelativeChordSpec,
} from "../../src/features/progressions";

type IntermediateEvent = RelativeChordSpec & {
  durationBeats: number;
};

type IntermediateSection = {
  ambiguousKey: boolean;
  containsModulation: boolean;
  events: IntermediateEvent[];
  form: "loop" | "sequence";
  sectionId: string;
};

type IntermediateWork = {
  sections: IntermediateSection[];
  workId: string;
};

type IntermediateCorpus = {
  sourceId: "mcgill-billboard-2.0" | "rock-corpus-2.1";
  sourceVersion: string;
  works: IntermediateWork[];
};

type AnonymousCandidate = {
  events: IntermediateEvent[];
  form: IntermediateSection["form"];
  sourceId: IntermediateCorpus["sourceId"];
  sourceVersion: string;
  sourceWorkCount: number;
};

const serializeEvent = (event: IntermediateEvent): string =>
  JSON.stringify({
    appliedTo: event.appliedTo ?? null,
    bass: event.bass ?? null,
    durationBeats: event.durationBeats,
    formulaId: event.formulaId,
    harmonicScope: event.harmonicScope ?? "diatonic",
    root: event.root,
  });

const rotations = <Value>(values: readonly Value[]): Value[][] =>
  values.map((_, offset) => [
    ...values.slice(offset),
    ...values.slice(0, offset),
  ]);

const getSectionSignature = (section: IntermediateSection): string => {
  const eventSignatures = section.events.map(serializeEvent);
  const normalizedEvents =
    section.form === "loop"
      ? rotations(eventSignatures)
          .map((rotation) => rotation.join("|"))
          .sort()[0]
      : eventSignatures.join("|");

  return `${section.form}:${normalizedEvents}`;
};

const assertEvent = (event: IntermediateEvent): void => {
  assert.ok(isRelativeDegree(event.root), "Invalid relative root");
  assert.ok(isChordFormulaId(event.formulaId), "Unknown chord formula");
  assert.ok(
    Number.isFinite(event.durationBeats) && event.durationBeats > 0,
    "Chord duration must be positive",
  );

  if (event.bass) {
    assert.ok(isRelativeDegree(event.bass), "Invalid relative bass");
  }

  if (event.appliedTo) {
    assert.ok(isRelativeDegree(event.appliedTo), "Invalid applied target");
  }
};

export const normalizeCorpusCandidates = (
  corpus: IntermediateCorpus,
): AnonymousCandidate[] => {
  assert.ok(corpus.sourceVersion.trim(), "Source version is required");
  const candidates = new Map<
    string,
    {
      events: IntermediateEvent[];
      form: IntermediateSection["form"];
      workIds: Set<string>;
    }
  >();

  corpus.works.forEach((work) => {
    assert.ok(
      work.workId.trim(),
      "Private work ID is required for deduplication",
    );
    const signaturesInWork = new Set<string>();

    work.sections.forEach((section) => {
      if (section.ambiguousKey || section.containsModulation) {
        return;
      }

      if (section.events.length < 2 || section.events.length > 8) {
        return;
      }

      section.events.forEach(assertEvent);
      const signature = getSectionSignature(section);

      if (signaturesInWork.has(signature)) {
        return;
      }

      signaturesInWork.add(signature);
      const candidate = candidates.get(signature) ?? {
        events: section.events,
        form: section.form,
        workIds: new Set<string>(),
      };
      candidate.workIds.add(work.workId);
      candidates.set(signature, candidate);
    });
  });

  return [...candidates.values()]
    .map(({ events, form, workIds }) => ({
      events,
      form,
      sourceId: corpus.sourceId,
      sourceVersion: corpus.sourceVersion,
      sourceWorkCount: workIds.size,
    }))
    .sort(
      (first, second) =>
        second.sourceWorkCount - first.sourceWorkCount ||
        first.events.length - second.events.length ||
        first.events
          .map(serializeEvent)
          .join("|")
          .localeCompare(second.events.map(serializeEvent).join("|")),
    );
};

const inputPath = process.argv[2];

if (!inputPath) {
  console.error(
    "Usage: npm run progressions:candidates -- path/to/relative-sections.json",
  );
  process.exitCode = 1;
} else {
  const corpus = JSON.parse(
    await readFile(inputPath, "utf8"),
  ) as IntermediateCorpus;
  const candidates = normalizeCorpusCandidates(corpus);
  console.log(JSON.stringify(candidates, null, 2));
}
