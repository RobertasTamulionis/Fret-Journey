"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type MouseEvent, useEffect, useMemo, useState } from "react";
import Select from "@/components/ui/Select/Select";
import { progressionCatalog } from "@/data/progressionCatalog";
import {
  type AuthoredProgression,
  deleteAuthoredProgression,
  readAuthoredProgressionStore,
  resolveAuthoredProgression,
  writeAuthoredProgressionStore,
} from "@/features/progression-builder";
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
  setProgressionCategory,
  setProgressionChordCount,
  setProgressionCompatibility,
  setProgressionDevice,
  setProgressionDifficulty,
  setProgressionHarmonicScope,
  setProgressionMood,
  setProgressionSearch,
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

const progressionLibraryScrollKey = "fret-journey-progression-library-scroll";

const rememberProgressionLibraryScroll = (
  event: MouseEvent<HTMLAnchorElement>,
) => {
  if (
    event.button !== 0 ||
    event.altKey ||
    event.ctrlKey ||
    event.metaKey ||
    event.shiftKey
  ) {
    return;
  }

  window.sessionStorage.setItem(
    progressionLibraryScrollKey,
    String(window.scrollY),
  );
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
  const router = useRouter();
  const { currentKey, currentScale } = useAppSelector(
    (state) => state.fretboard,
  );
  const { progression, resolved } = item;
  const isCompatible = resolved.compatible;
  const coloredScopes = progression.harmonicDevices.filter(
    (scope) => scope !== "diatonic",
  );
  const href = buildProgressionHref(progression.slug, currentKey, currentScale);
  const prefetchProgression = () => router.prefetch(href);

  return (
    <article className="progressionCard">
      <Link
        className="progressionCard__link"
        href={href}
        onClick={(event) => {
          rememberProgressionLibraryScroll(event);
        }}
        onFocus={prefetchProgression}
        onPointerEnter={prefetchProgression}
        prefetch
      >
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
  const [savedProgressions, setSavedProgressions] = useState<
    readonly AuthoredProgression[]
  >([]);

  useEffect(() => {
    setSavedProgressions(
      readAuthoredProgressionStore(window.localStorage).progressions,
    );
  }, []);

  useEffect(() => {
    const storedScroll = window.sessionStorage.getItem(
      progressionLibraryScrollKey,
    );

    if (storedScroll === null) {
      return;
    }

    const scrollTop = Number.parseFloat(storedScroll);

    if (!Number.isFinite(scrollTop) || scrollTop < 0) {
      window.sessionStorage.removeItem(progressionLibraryScrollKey);
      return;
    }

    let settleFrame = 0;
    const restoreFrame = window.requestAnimationFrame(() => {
      window.scrollTo({ behavior: "instant", top: scrollTop });
      settleFrame = window.requestAnimationFrame(() => {
        window.scrollTo({ behavior: "instant", top: scrollTop });
        window.sessionStorage.removeItem(progressionLibraryScrollKey);
      });
    });

    return () => {
      window.cancelAnimationFrame(restoreFrame);
      window.cancelAnimationFrame(settleFrame);
    };
  }, []);
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
      const compatibilityDifference =
        Number(second.resolved.compatible) - Number(first.resolved.compatible);

      return (
        compatibilityDifference ||
        first.progression.title.localeCompare(second.progression.title)
      );
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

  const removeSavedProgression = (progression: AuthoredProgression) => {
    if (!window.confirm(`Delete “${progression.name}” from this browser?`)) {
      return;
    }
    const next = deleteAuthoredProgression(
      readAuthoredProgressionStore(window.localStorage),
      progression.id,
    );
    if (writeAuthoredProgressionStore(window.localStorage, next).ok) {
      setSavedProgressions(next.progressions);
    }
  };

  return (
    <section className="progressionLibrary">
      <header className="progressionLibrary__hero">
        <div>
          <span className="progressionLibrary__eyebrow">Harmony discovery</span>
          <div className="progressionLibrary__titleRow">
            <h1 className="progressionLibrary__heading">Progression Lab</h1>
            <span className="progressionLibrary__templateCount">
              <strong>{progressionCatalog.length}</strong> verified templates
            </span>
          </div>
        </div>
        <div className="progressionLibrary__heroActions">
          <ProgressionContext compact />
          <div className="progressionLibrary__inspireControl">
            <button
              aria-describedby="inspire-me-description"
              disabled={filteredItems.length === 0}
              onClick={inspire}
              type="button"
            >
              Inspire me
            </button>
            <span id="inspire-me-description" role="tooltip">
              Open a random progression from the current results.
            </span>
          </div>
        </div>
      </header>

      <section
        className="progressionLibrary__saved"
        aria-labelledby="saved-progressions-heading"
      >
        <div className="progressionLibrary__savedHeader">
          <div>
            <span className="progressionLibrary__eyebrow">
              Browser-local songwriting
            </span>
            <h2 id="saved-progressions-heading">Your progressions</h2>
          </div>
          <Link
            className="progressionLibrary__create"
            href="/progressions/builder"
          >
            Create progression
          </Link>
        </div>
        {savedProgressions.length > 0 ? (
          <div className="progressionLibrary__savedGrid">
            {savedProgressions.map((progression) => {
              const resolved = resolveAuthoredProgression(progression, {
                currentKey,
                currentScale,
              });
              return (
                <article
                  className="progressionLibrary__savedCard"
                  key={progression.id}
                >
                  <Link href={`/progressions/builder?id=${progression.id}`}>
                    <strong>{progression.name}</strong>
                    <span>{resolved.chordNames.join(" – ")}</span>
                    <small>
                      {progression.steps.length} chords · {progression.form}
                    </small>
                  </Link>
                  <button
                    onClick={() => removeSavedProgression(progression)}
                    type="button"
                  >
                    Delete
                  </button>
                </article>
              );
            })}
          </div>
        ) : (
          <p className="progressionLibrary__savedEmpty">
            No local progressions yet. Build an exact chord sequence without
            changing the reviewed catalog.
          </p>
        )}
      </section>

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

          <Select
            label="Style"
            onChange={(value) => dispatch(setProgressionStyle(value))}
            options={[
              { value: "all", label: "All styles" },
              ...styles.map((style) => ({ value: style, label: style })),
            ]}
            value={filters.style}
          />

          <Select
            label="Mood"
            onChange={(value) => dispatch(setProgressionMood(value))}
            options={[
              { value: "all", label: "All moods" },
              ...moods.map((mood) => ({ value: mood, label: mood })),
            ]}
            value={filters.mood}
          />

          <Select
            label="Difficulty"
            onChange={(value) =>
              dispatch(
                setProgressionDifficulty(value as ProgressionDifficultyFilter),
              )
            }
            options={[
              { value: "all", label: "Any difficulty" },
              { value: "beginner", label: "Beginner" },
              { value: "intermediate", label: "Intermediate" },
              { value: "advanced", label: "Advanced" },
            ]}
            value={filters.difficulty}
          />

          <Select
            label="Chord count"
            onChange={(value) =>
              dispatch(
                setProgressionChordCount(value as ProgressionChordCountFilter),
              )
            }
            options={[
              { value: "all", label: "Any length" },
              { value: "2-3", label: "2–3 chords" },
              { value: "4", label: "4 chords" },
              { value: "5-8", label: "5–8 chords" },
            ]}
            value={filters.chordCount}
          />
        </div>

        <details className="progressionFilters__advanced">
          <summary>Advanced filters</summary>
          <div className="progressionFilters__advancedGrid">
            <Select
              fullWidth
              label="Scale fit"
              onChange={(value) =>
                dispatch(
                  setProgressionCompatibility(
                    value as ProgressionCompatibilityFilter,
                  ),
                )
              }
              options={[
                { value: "all", label: "All, compatible first" },
                { value: "compatible", label: "Compatible only" },
                { value: "incompatible", label: "Incompatible only" },
              ]}
              size="sm"
              value={filters.compatibility}
            />
            <Select
              fullWidth
              label="Category"
              onChange={(value) => dispatch(setProgressionCategory(value))}
              options={[
                { value: "all", label: "All categories" },
                ...categories.map((category) => ({
                  value: category,
                  label: categoryLabels[category],
                })),
              ]}
              size="sm"
              value={filters.category}
            />
            <Select
              fullWidth
              label="Harmonic device"
              onChange={(value) => dispatch(setProgressionDevice(value))}
              options={[
                { value: "all", label: "All devices" },
                ...devices.map((device) => ({
                  value: device,
                  label: deviceLabels[device],
                })),
              ]}
              size="sm"
              value={filters.device}
            />
            <Select
              fullWidth
              label="Harmony"
              onChange={(value) =>
                dispatch(
                  setProgressionHarmonicScope(
                    value as ProgressionHarmonicScopeFilter,
                  ),
                )
              }
              options={[
                { value: "all", label: "Diatonic + color" },
                { value: "diatonic", label: "Diatonic only" },
                { value: "borrowed-chromatic", label: "Borrowed / chromatic" },
              ]}
              size="sm"
              value={filters.harmonicScope}
            />
          </div>
        </details>
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
        </div>
      )}
    </section>
  );
}
