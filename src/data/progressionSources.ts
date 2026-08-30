export type ProgressionSourceId =
  | "fret-journey-editorial-2026-08"
  | "open-music-theory-pop-rock-2022"
  | "mcgill-billboard-2.0"
  | "rock-corpus-2.1"
  | "choco-1.0.0"
  | "when-in-rome-1c61fe4"
  | "chords-db-0.4.0";

export type ProgressionSourceRecord = {
  allowedUse: string;
  artifactUrl?: string;
  canonicalUrl?: string;
  catalogStatus: "used" | "approved-not-ingested" | "excluded" | "reference";
  checksumSha256: string | null;
  creators: readonly string[];
  id: ProgressionSourceId;
  license: string;
  pin: string;
  retrievedAt: "2026-08-21";
  title: string;
};

export const progressionSources: readonly ProgressionSourceRecord[] = [
  {
    allowedUse:
      "Original reviewed relative theory templates and editorial copy.",
    catalogStatus: "used",
    checksumSha256: null,
    creators: ["Fret Journey project contributors"],
    id: "fret-journey-editorial-2026-08",
    license: "Project-authored source",
    pin: "Initial Progression Lab catalog, 2026-08-21",
    retrievedAt: "2026-08-21",
    title: "Fret Journey editorial progression collection",
  },
  {
    allowedUse:
      "Canonical-family theory reference; no copied or adapted editorial prose.",
    canonicalUrl: "https://openmusictheory.github.io/popRockHarmony.html",
    catalogStatus: "used",
    checksumSha256: null,
    creators: ["Open Music Theory", "Hybrid Pedagogy Publishing"],
    id: "open-music-theory-pop-rock-2022",
    license: "CC BY-SA 4.0",
    pin: "a907aa015f7ec54b925ddb070d2d36aecd0dc705",
    retrievedAt: "2026-08-21",
    title: "Harmony in pop/rock music",
  },
  {
    allowedUse:
      "Future anonymous phrase-window statistics after local checksum and transformation review.",
    canonicalUrl:
      "https://ddmal.ca/research/The_McGill_Billboard_Project_%28Chord_Analysis_Dataset%29/",
    catalogStatus: "approved-not-ingested",
    checksumSha256: null,
    creators: ["John Ashley Burgoyne", "Jonathan Wild", "Ichiro Fujinaga"],
    id: "mcgill-billboard-2.0",
    license: "CC0",
    pin: "billboard-2.0-salami_chords.tar.xz",
    retrievedAt: "2026-08-21",
    title: "McGill Billboard Project 2.0",
  },
  {
    allowedUse:
      "Future anonymous Roman-numeral statistics with CC BY attribution and transformation notice.",
    artifactUrl: "https://rockcorpus.midside.com/versions/rock_corpus_v2-1.zip",
    canonicalUrl: "https://rockcorpus.midside.com/index.html",
    catalogStatus: "approved-not-ingested",
    checksumSha256: null,
    creators: ["Trevor de Clercq", "David Temperley"],
    id: "rock-corpus-2.1",
    license: "CC BY 4.0",
    pin: "2.1",
    retrievedAt: "2026-08-21",
    title: "A Corpus Study of Rock Music",
  },
  {
    allowedUse:
      "Excluded until every selected partition and upstream corpus is allowlisted and audited.",
    canonicalUrl: "https://github.com/smashub/choco",
    catalogStatus: "excluded",
    checksumSha256: null,
    creators: ["ChoCo project contributors"],
    id: "choco-1.0.0",
    license: "Mixed; commonly CC BY 4.0 or CC BY-NC-SA 4.0",
    pin: "v1.0.0 / f7dd3ee5670d367b57b412d640cc396e57c1b4ea",
    retrievedAt: "2026-08-21",
    title: "ChoCo",
  },
  {
    allowedUse:
      "Excluded until both the repository conversion and exact upstream subcorpus license are recorded.",
    canonicalUrl: "https://github.com/MarkGotham/When-in-Rome",
    catalogStatus: "excluded",
    checksumSha256: null,
    creators: ["Mark Gotham", "When in Rome contributors"],
    id: "when-in-rome-1c61fe4",
    license: "CC BY-SA 4.0 plus varying upstream licenses",
    pin: "1c61fe41b8c2910296d7d2bcbf6476c7c1f2fe35",
    retrievedAt: "2026-08-21",
    title: "When in Rome",
  },
  {
    allowedUse:
      "Unused reference only; any future shape data requires MIT notice and independent voicing verification.",
    canonicalUrl: "https://github.com/tombatossals/chords-db",
    catalogStatus: "reference",
    checksumSha256: null,
    creators: ["David Rubert"],
    id: "chords-db-0.4.0",
    license: "MIT",
    pin: "v0.4.0 / 921beeaffdf1d98774b2f422e4275d7300682837",
    retrievedAt: "2026-08-21",
    title: "chords-db",
  },
] as const;

export const progressionSourceById = new Map(
  progressionSources.map((source) => [source.id, source]),
);

export const productionCatalogSourceIds = new Set<ProgressionSourceId>(
  progressionSources
    .filter(({ catalogStatus }) => catalogStatus === "used")
    .map(({ id }) => id),
);

export const isProgressionSourceId = (
  value: unknown,
): value is ProgressionSourceId =>
  typeof value === "string" &&
  progressionSourceById.has(value as ProgressionSourceId);

export const isProductionCatalogSourceId = (
  value: unknown,
): value is ProgressionSourceId =>
  isProgressionSourceId(value) && productionCatalogSourceIds.has(value);
