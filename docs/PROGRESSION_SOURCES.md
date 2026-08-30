# Progression Lab source and provenance ledger

Retrieved and reviewed: 2026-08-21.

This ledger distinguishes sources that shaped the editorial method from data
that was actually ingested. The initial production catalog contains 225
original Fret Journey theory templates. It does not claim statistical
frequency, song association, or direct extraction from any third-party corpus.
Raw source archives, song titles, artists, lyrics, and complete charts are not
included in the application bundle.

## Production catalog sources

### `fret-journey-editorial-2026-08`

- Type: original editorial theory templates.
- Version: Progression Lab initial catalog, 2026-08-21.
- Authors: Fret Journey project contributors.
- Allowed use: production catalog formulas, original names, explanations,
  categories, and discovery tags.
- Review: every entry is typed, normalized, deduplicated, and resolved through
  every declared tonic by `npm run theory:check`.
- Checksum: not applicable to an external artifact; the catalog is versioned
  with the application source.

### `open-music-theory-pop-rock-2022`

- Canonical URL: <https://openmusictheory.github.io/popRockHarmony.html>
- Repository pin:
  <https://github.com/openmusictheory/openmusictheory.github.io/commit/a907aa015f7ec54b925ddb070d2d36aecd0dc705>
- Version: rendered 2022 chapter; repository snapshot
  `a907aa015f7ec54b925ddb070d2d36aecd0dc705`.
- License: CC BY-SA 4.0.
- Creator/publisher: Open Music Theory / Hybrid Pedagogy Publishing.
- Catalog use: theory reference for canonical pop/rock harmonic families only.
  Fret Journey's titles and explanations are original and do not adapt the
  chapter's prose.
- Required attribution if text is adapted later: credit, source and license
  links, change indication, and ShareAlike compliance.
- SHA-256: not recorded because no page snapshot or repository archive is
  copied into this release.

## Approved statistical inputs, not yet ingested

### `mcgill-billboard-2.0`

- Canonical URL:
  <https://ddmal.ca/research/The_McGill_Billboard_Project_%28Chord_Analysis_Dataset%29/>
- Artifact: `billboard-2.0-salami_chords.tar.xz`, the complete phrase-aware 2.0
  archive. Version 2.0.1 applies to the LAB/MIREX exports, not this full
  structured archive.
- License: CC0.
- Requested citation: Burgoyne, Wild, and Fujinaga, *An Expert Ground Truth Set
  for Audio Chord Recognition and Music Analysis*, ISMIR 2011.
- Allowed future use: anonymous two-to-eight-event phrase/section windows,
  normalized into relative harmony and counted once per distinct source work.
- Transformation rule: strip song and artist metadata from shipped output;
  exclude ambiguous keys and modulation-heavy samples; deduplicate repeated
  sections.
- SHA-256: pending. The official page does not publish a digest. If ingested,
  hash the exact XZ artifact locally and record it before extraction.

### `rock-corpus-2.1`

- Canonical URL: <https://rockcorpus.midside.com/index.html>
- Harmonic format: <https://rockcorpus.midside.com/harmonic_analyses.html>
- Artifact: <https://rockcorpus.midside.com/versions/rock_corpus_v2-1.zip>
- Version: 2.1.
- License: CC BY 4.0.
- Creators: Trevor de Clercq and David Temperley.
- Required attribution: creator credit, source and license links, and a notice
  describing normalization and anonymization.
- Allowed future use: expert Roman-numeral evidence. Two independent analyses
  of one work must not be counted as two distinct source works.
- SHA-256: pending. No official digest was found; hash the exact 2.1 ZIP before
  extraction if it is ingested.

## Excluded until a subset-level audit

### `choco-1.0.0`

- Repository: <https://github.com/smashub/choco>
- Release: <https://github.com/smashub/choco/releases/tag/v1.0.0>
- Pin: `v1.0.0`, commit
  `f7dd3ee5670d367b57b412d640cc396e57c1b4ea`.
- License: generally CC BY 4.0, but several partitions are
  CC BY-NC-SA 4.0 and upstream rights vary.
- Policy: never ingest wholesale. Any future adapter needs an allowlist,
  ChoCo attribution, upstream attribution, and a recorded transformation.
  iReal Pro, Real Book, Chordify, noncommercial, and unclear subsets are
  excluded from this project.
- SHA-256: pending because the release archive is not consumed.

### `when-in-rome-1c61fe4`

- Repository: <https://github.com/MarkGotham/When-in-Rome>
- Pin: commit `1c61fe41b8c2910296d7d2bcbf6476c7c1f2fe35`.
- License: repository-original work is CC BY-SA 4.0; converted corpora retain
  varying upstream licenses.
- Policy: excluded from automated ingest. A future inclusion must record both
  this commit and the exact upstream corpus, analyst, version, license, and
  eligible files.
- SHA-256: pending because no subcorpus is consumed.

## Voicing reference, not consumed

### `chords-db-0.4.0`

- Repository: <https://github.com/tombatossals/chords-db>
- Tagged pin: `v0.4.0`, commit
  `921beeaffdf1d98774b2f422e4275d7300682837`.
- License: MIT, copyright 2016 David Rubert.
- Policy: optional seed/reference only. No data is reused in this release. Any
  future reuse must retain the MIT notice and independently verify pitch
  content, string orientation, registered bass, inversion, span, fingers, and
  barres. Finger and barre claims are never trusted implicitly.
- SHA-256: pending because the tag archive is not consumed.

## Reproducible import policy

Before a statistical source can affect the production catalog:

1. Download the exact pinned artifact into a local, ignored staging directory.
2. Record its locally computed SHA-256 beside this ledger.
3. Preserve source work identity only during deduplication and frequency
   counting; never emit it to the production catalog.
4. Extract phrase/section windows of two to eight harmonic events.
5. Normalize key, mode, degree alteration, formula, inversion, duration, and
   applied function into the typed Progression Lab schema.
6. Exclude ambiguous tonics and modulation-heavy windows.
7. Deduplicate repeated sections inside each work, then canonicalize equivalent
   loop rotations across works.
8. Count frequency once per distinct work, rank candidates, and require an
   editorial review with an original name and explanation.
9. Run exhaustive declared-tonic resolution and source-reference validation.
10. Keep raw archives and intermediate work metadata out of the production
    bundle and repository.

The initial release stops before step 1 for external corpora. Its catalog is
therefore accurately described as editorially authored and source-informed,
not corpus-mined.
