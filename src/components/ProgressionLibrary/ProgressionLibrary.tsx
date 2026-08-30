"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { progressionCatalog } from "@/data/progressionCatalog";
import {
  buildProgressionHref,
  isProgressionCompatibleWithScale,
  type ProgressionCategory,
  type ProgressionTemplate,
  type ResolvedProgression,
  resolveProgression,
} from "@/features/progressions";
import { scaleDefinitions } from "@/helpers/fretboardHelpers";
import {
  type ProgressionChordCountFilter,
  type ProgressionCompatibilityFilter,
  type ProgressionDifficultyFilter,
  type ProgressionHarmonicScopeFilter,
  type ProgressionSort,
  resetProgressionFilters,
  setProgressionCategory,
  setProgressionChordCount,
  setProgressionCompatibility,
  setProgressionDevice,
  setProgressionDifficulty,
  setProgressionHarmonicScope,
  setProgressionMood,
  setProgressionSearch,
  setProgressionSort,
  setProgressionStyle,
} from "@/lib/redux/slices/progressionLabSlice";
import { useAppDispatch, useAppSelector } from "@/lib/redux/store";
import ProgressionContext from "../ProgressionContext/ProgressionContext";
import "./progressionLibrary.scss";

const categoryLabels: Record<ProgressionCategory, string> = {
  blues: "Blues",
  "borrowed-chord": "Borrowed chords",
  cadence: "Cadences",
  "chromatic-mediant": "Chromatic mediants",
  cinematic: "Cinematic",
  "circle-progression": "Circle progressions",
  "gospel-rnb": "Gospel / R&B",
  "harmonic-minor": "Harmonic minor",
  "jazz-turnaround": "Jazz turnarounds",
  "major-diatonic": "Major diatonic",
  modal: "Modal",
  "natural-minor": "Natural minor",
  "phrygian-dominant": "Phrygian dominant",
  "pop-rock-loop": "Pop / rock loops",
  "secondary-dominant": "Secondary dominants",
};

const deviceLabels = {
  borrowed: "Borrowed",
  chromatic: "Chromatic",
  diatonic: "Diatonic",
  "modal-interchange": "Modal interchange",
  "secondary-dominant": "Secondary dominant",
} as const;

type LibraryItem = {
  progression: ProgressionTemplate;
  resolved: ResolvedProgression;
};

const matchesChordCount = (
  chordCount: number,
  filter: ProgressionChordCountFilter,
): boolean => {
  if (filter === "2-3") {
    return chordCount >= 2 && chordCount <= 3;
  }

  if (filter === "4") {
    return chordCount === 4;
  }

  if (filter === "5-8") {
    return chordCount >= 5 && chordCount <= 8;
  }

  return true;
};

const getCompatibleScaleLabel = (progression: ProgressionTemplate): string =>
  progression.compatibleScales
    .map((scale) => scaleDefinitions[scale].label)
    .join(" / ");

function ProgressionCard({ item }: { item: LibraryItem }) {
  const { currentKey, currentScale } = useAppSelector(
    (state) => state.fretboard,
  );
  const { progression, resolved } = item;
  const isCompatible = resolved.compatible;
  const coloredScopes = progression.harmonicDevices.filter(
    (scope) => scope !== "diatonic",
  );

  return (
    <article className="progressionCard">
      <div className="progressionCard__topline">
        <span className="progressionCard__category">
          {categoryLabels[progression.category]}
        </span>
        <span
          className={`progressionCard__compatibility ${
            isCompatible ? "progressionCard__compatibility--compatible" : ""
          }`}
        >
          {isCompatible
            ? "Fits current scale"
            : `Best in ${getCompatibleScaleLabel(progression)}`}
        </span>
      </div>
      <h2 className="progressionCard__title">{progression.title}</h2>
      <p className="progressionCard__formula">{resolved.formula}</p>
      <p className="progressionCard__chords">
        {resolved.chordNames.join(" – ")}
      </p>
      <div className="progressionCard__tags">
        {progression.moodTags[0] && <span>{progression.moodTags[0]}</span>}
        <span>{progression.form === "loop" ? "Loop" : "Sequence"}</span>
        <span>{progression.steps.length} chords</span>
        {coloredScopes.map((scope) => (
          <span className="progressionCard__tag--color" key={scope}>
            {deviceLabels[scope]}
          </span>
        ))}
      </div>
      <Link
        className="progressionCard__link"
        href={buildProgressionHref(progression.slug, currentKey, currentScale)}
      >
        Inspect progression
        <span aria-hidden="true">↗</span>
      </Link>
    </article>
  );
}

export default function ProgressionLibrary() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { currentKey, currentScale } = useAppSelector(
    (state) => state.fretboard,
  );
  const filters = useAppSelector((state) => state.progressionLab);
  const categories = useMemo(
    () =>
      [...new Set(progressionCatalog.map(({ category }) => category))].sort(
        (first, second) =>
          categoryLabels[first].localeCompare(categoryLabels[second]),
      ),
    [],
  );
  const devices = useMemo(
    () =>
      [
        ...new Set(
          progressionCatalog.flatMap(({ harmonicDevices }) => harmonicDevices),
        ),
      ].sort(),
    [],
  );
  const moods = useMemo(
    () =>
      [
        ...new Set(progressionCatalog.flatMap(({ moodTags }) => moodTags)),
      ].sort(),
    [],
  );
  const styles = useMemo(
    () =>
      [
        ...new Set(progressionCatalog.flatMap(({ styleTags }) => styleTags)),
      ].sort(),
    [],
  );

  const filteredItems = useMemo(() => {
    const normalizedSearch = filters.search.trim().toLocaleLowerCase();
    const items = progressionCatalog
      .map((progression) => ({
        progression,
        resolved: resolveProgression(progression, {
          currentKey,
          currentScale,
        }),
      }))
      .filter(({ progression, resolved }) => {
        const isCompatible = isProgressionCompatibleWithScale(
          progression,
          currentScale,
        );
        const matchesCompatibility =
          filters.compatibility === "all" ||
          (filters.compatibility === "compatible" && isCompatible) ||
          (filters.compatibility === "incompatible" && !isCompatible);
        const matchesScope =
          filters.harmonicScope === "all" ||
          (filters.harmonicScope === "diatonic" &&
            progression.harmonicDevices.every(
              (device) => device === "diatonic",
            )) ||
          (filters.harmonicScope === "borrowed-chromatic" &&
            progression.harmonicDevices.some(
              (device) => device !== "diatonic",
            ));
        const searchText = [
          progression.title,
          progression.explanation,
          progression.category,
          ...progression.styleTags,
          ...progression.moodTags,
          resolved.formula,
          ...resolved.chordNames,
        ]
          .join(" ")
          .toLocaleLowerCase();

        return (
          matchesCompatibility &&
          matchesChordCount(progression.steps.length, filters.chordCount) &&
          (filters.category === "all" ||
            progression.category === filters.category) &&
          (filters.style === "all" ||
            progression.styleTags.includes(filters.style)) &&
          (filters.device === "all" ||
            progression.harmonicDevices.includes(
              filters.device as ProgressionTemplate["harmonicDevices"][number],
            )) &&
          (filters.mood === "all" ||
            progression.moodTags.includes(filters.mood)) &&
          matchesScope &&
          (filters.difficulty === "all" ||
            progression.difficulty === filters.difficulty) &&
          (!normalizedSearch || searchText.includes(normalizedSearch))
        );
      });

    return items.sort((first, second) => {
      if (filters.sort === "alphabetical") {
        return first.progression.title.localeCompare(second.progression.title);
      }

      if (filters.sort === "shortest") {
        return (
          first.progression.steps.length - second.progression.steps.length ||
          first.progression.title.localeCompare(second.progression.title)
        );
      }

      const compatibilityDifference =
        Number(second.resolved.compatible) - Number(first.resolved.compatible);

      return compatibilityDifference;
    });
  }, [currentKey, currentScale, filters]);

  const inspire = () => {
    const verifiedItems = filteredItems.filter(
      ({ progression }) => progression.reviewStatus === "verified",
    );

    if (verifiedItems.length === 0) {
      return;
    }

    const selection =
      verifiedItems[Math.floor(Math.random() * verifiedItems.length)];
    router.push(
      buildProgressionHref(
        selection.progression.slug,
        currentKey,
        currentScale,
      ),
    );
  };

  return (
    <section className="progressionLibrary">
      <header className="progressionLibrary__hero">
        <div>
          <span className="progressionLibrary__eyebrow">Harmony discovery</span>
          <h1 className="progressionLibrary__heading">Progression Lab</h1>
          <p className="progressionLibrary__introduction">
            Explore reviewed harmonic formulas, transpose them without losing
            their identity, and follow every chord onto the guitar.
          </p>
        </div>
        <div className="progressionLibrary__heroActions">
          <span>{progressionCatalog.length} verified templates</span>
          <button
            disabled={filteredItems.length === 0}
            onClick={inspire}
            type="button"
          >
            Inspire me
          </button>
        </div>
      </header>

      <ProgressionContext />

      <section
        aria-labelledby="progression-filters-heading"
        className="progressionFilters"
      >
        <div className="progressionFilters__header">
          <div>
            <h2 id="progression-filters-heading">Find a progression</h2>
            <p aria-live="polite">
              {filteredItems.length} of {progressionCatalog.length} templates
            </p>
          </div>
          <button
            className="progressionFilters__reset"
            onClick={() => dispatch(resetProgressionFilters())}
            type="button"
          >
            Reset filters
          </button>
        </div>

        <div className="progressionFilters__grid">
          <label className="progressionFilters__search">
            <span>Search</span>
            <input
              onChange={(event) =>
                dispatch(setProgressionSearch(event.target.value))
              }
              placeholder="Formula, chord, mood, or device"
              type="search"
              value={filters.search}
            />
          </label>

          <label>
            <span>Scale fit</span>
            <select
              onChange={(event) =>
                dispatch(
                  setProgressionCompatibility(
                    event.target.value as ProgressionCompatibilityFilter,
                  ),
                )
              }
              value={filters.compatibility}
            >
              <option value="all">All, compatible first</option>
              <option value="compatible">Compatible only</option>
              <option value="incompatible">Incompatible only</option>
            </select>
          </label>

          <label>
            <span>Chord count</span>
            <select
              onChange={(event) =>
                dispatch(
                  setProgressionChordCount(
                    event.target.value as ProgressionChordCountFilter,
                  ),
                )
              }
              value={filters.chordCount}
            >
              <option value="all">Any length</option>
              <option value="2-3">2–3 chords</option>
              <option value="4">4 chords</option>
              <option value="5-8">5–8 chords</option>
            </select>
          </label>

          <label>
            <span>Category</span>
            <select
              onChange={(event) =>
                dispatch(setProgressionCategory(event.target.value))
              }
              value={filters.category}
            >
              <option value="all">All categories</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {categoryLabels[category]}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Style</span>
            <select
              onChange={(event) =>
                dispatch(setProgressionStyle(event.target.value))
              }
              value={filters.style}
            >
              <option value="all">All styles</option>
              {styles.map((style) => (
                <option key={style} value={style}>
                  {style}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Harmonic device</span>
            <select
              onChange={(event) =>
                dispatch(setProgressionDevice(event.target.value))
              }
              value={filters.device}
            >
              <option value="all">All devices</option>
              {devices.map((device) => (
                <option key={device} value={device}>
                  {deviceLabels[device]}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Mood</span>
            <select
              onChange={(event) =>
                dispatch(setProgressionMood(event.target.value))
              }
              value={filters.mood}
            >
              <option value="all">All moods</option>
              {moods.map((mood) => (
                <option key={mood} value={mood}>
                  {mood}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Harmony</span>
            <select
              onChange={(event) =>
                dispatch(
                  setProgressionHarmonicScope(
                    event.target.value as ProgressionHarmonicScopeFilter,
                  ),
                )
              }
              value={filters.harmonicScope}
            >
              <option value="all">Diatonic + color</option>
              <option value="diatonic">Diatonic only</option>
              <option value="borrowed-chromatic">Borrowed / chromatic</option>
            </select>
          </label>

          <label>
            <span>Difficulty</span>
            <select
              onChange={(event) =>
                dispatch(
                  setProgressionDifficulty(
                    event.target.value as ProgressionDifficultyFilter,
                  ),
                )
              }
              value={filters.difficulty}
            >
              <option value="all">Any difficulty</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </label>

          <label>
            <span>Sort</span>
            <select
              onChange={(event) =>
                dispatch(
                  setProgressionSort(event.target.value as ProgressionSort),
                )
              }
              value={filters.sort}
            >
              <option value="recommended">Compatible first</option>
              <option value="shortest">Shortest first</option>
              <option value="alphabetical">Alphabetical</option>
            </select>
          </label>
        </div>
      </section>

      {filteredItems.length > 0 ? (
        <div className="progressionLibrary__grid">
          {filteredItems.map((item) => (
            <ProgressionCard item={item} key={item.progression.id} />
          ))}
        </div>
      ) : (
        <div className="progressionLibrary__empty">
          <strong>No reviewed progression matches every filter.</strong>
          <p>Try a broader scale fit, chord count, or harmonic scope.</p>
          <button
            onClick={() => dispatch(resetProgressionFilters())}
            type="button"
          >
            Clear filters
          </button>
        </div>
      )}
    </section>
  );
}
