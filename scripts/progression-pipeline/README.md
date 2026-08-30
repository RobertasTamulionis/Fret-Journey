# Offline progression-candidate pipeline

This directory is a license-aware boundary between source-specific corpus
adapters and the reviewed production catalog.

`normalize-candidates.ts` accepts an intermediate JSON document containing
already-relative, phrase/section-level harmonic events. It validates two-to-
eight-chord windows, removes repeated sections within each source work,
canonicalizes loop rotations, counts a candidate once per distinct work, and
prints anonymous ranked candidates. It never emits work IDs, song names,
artists, lyrics, or source charts.

Run it only after the artifact/version/license/checksum steps in
`docs/PROGRESSION_SOURCES.md` are complete:

```sh
shasum -a 256 path/to/pinned-archive
npm run progressions:candidates -- path/to/relative-sections.json
```

Source-specific Harte/Rock Corpus parsers are deliberately not included in the
initial release because no external archive was downloaded or ingested. An
adapter must retain private work IDs long enough to deduplicate, output the
intermediate schema below, and be reviewed alongside its exact source pin.

```json
{
  "sourceId": "mcgill-billboard-2.0",
  "sourceVersion": "billboard-2.0-salami_chords.tar.xz",
  "works": [
    {
      "workId": "private-source-id",
      "sections": [
        {
          "sectionId": "private-section-id",
          "ambiguousKey": false,
          "containsModulation": false,
          "form": "loop",
          "events": [
            {
              "root": { "degree": 1, "alteration": 0 },
              "formulaId": "major",
              "durationBeats": 4
            },
            {
              "root": { "degree": 5, "alteration": 0 },
              "formulaId": "major",
              "durationBeats": 4
            }
          ]
        }
      ]
    }
  ]
}
```

The resulting candidates are research input, not production data. An editor
must still assess musical usefulness, verify provenance, assign an original
title/explanation/tags, and add a typed template by hand.
