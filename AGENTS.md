# Fret Journey Agent Notes

# Product Vision

Fret Journey is a premium desktop guitar-learning application centered around an interactive fretboard.

The application should feel closer to Linear, Raycast, Arc Browser and Vercel than a traditional music education website.

The goal is to create the best fretboard visualization experience available.

When multiple solutions are possible, prioritize:

1. Learning experience
2. Visual clarity
3. Simplicity
4. Consistency
5. Maintainability

---

# Documentation Responsibilities

Keep these documents aligned with the implementation:

- `README.md` describes current user-facing capabilities, setup, and known
  limitations.
- `THEORY.md` is the normative music-theory and fretboard-shape contract.
- `AGENTS.md` records product direction, architecture, interaction contracts,
  workflow, and deferred work.

When theory behavior changes, update the shared helpers, `THEORY.md`, and
`scripts/verify-theory.ts` together. Do not document planned behavior as though
it already ships.

---

# Current Product State

The application currently supports:

- 15 tonic spellings across Major, Natural Minor, Minor Blues, Harmonic Minor,
  and Phrygian Dominant
- 6-, 7-, and 8-string presets with per-string pitch-class tuning
- cyclic 12-fret and full 24-fret views
- mutually exclusive Notes, Scale Degrees, Intervals, and Chord Tones modes
- triads, seventh chords, and ninth chords
- explicit common I–IV–V harmony for Minor Blues
- tuning-aware 3NPS, CAGED, Pentatonic, and Blues Box patterns where valid
- named C, A, G, E, and D controls with ringed tonic-chord anchors
- route-backed Fretboard, progression-library, and progression-detail
  workspaces under a shared application shell
- persisted Graphite, Light, and Ember visual themes selected from the shared
  top-right header control on every route
- a route-backed Practice Library, focused Practice Session, and Session
  Complete flow covering a rotating Daily Mix plus seven focused technique
  categories and 33 structured playable examples
- a static catalog of 225 reviewed, genuinely distinct relative progression
  templates with search, filtering, compatibility ranking, and source records
- key-specific progression resolution for diatonic, borrowed, applied,
  suspended, added-tone, altered-root, and slash-bass chords
- registered default pitches for 6-, 7-, and 8-string guitars
- formula-independent dynamic diagrams containing every authored tone for all
  current scale and progression chords on 6-, 7-, and 8-string guitars

The shared shell exposes `/`, `/progressions`, `/progressions/[slug]`, and
`/practice` with real links and browser-history behavior. Fret cells and fret
markers remain visual output rather than selectable practice targets.

---

# Repository Map

- `src/app/page.tsx` mounts the main experience.
- `src/app/progressions/page.tsx` mounts the progression library.
- `src/app/progressions/[slug]/page.tsx` resolves the URL-owned progression
  identity and mounts its workspace.
- `src/app/practice/page.tsx` mounts the guided daily-practice workspace.
- `src/app/layout.tsx` owns the root Redux provider shared by every route;
  `src/components/AppShell` owns the shared route surface, navigation, and
  theme-selector placement.
- `src/components/ThemeSelector` owns the native persisted theme control;
  `src/features/theme/themes.ts` owns theme IDs, parsing, storage, and the
  pre-hydration bootstrap.
- `src/components/Fretboard/Fretboard.tsx` composes the dashboard and renders
  the neck.
- `src/components/Fretboard/FretboardNeck.tsx` renders prop-driven all-tone or
  exact selected-voicing neck states.
- `src/components/ProgressionLibrary` and `src/components/ProgressionWorkspace`
  own the two progression experiences.
- `src/components/PracticeLab` owns the grouped exercise library, focused
  session layout, local session state, active graphical tab score, and simple
  completion flow.
- `src/helpers/musicTheory.ts` owns pitch classes, spelling, scale definitions,
  chord construction, and chord-tone roles.
- `src/helpers/fretboardHelpers.ts` owns guitar configurations, tuning and fret
  geometry, shape availability, and shape builders.
- `src/helpers/typesHelpers.ts` owns shared domain types.
- `src/lib/redux/slices/fretboardSlice.ts` owns user selections and reconciles
  dependent state.
- `src/lib/redux/slices/progressionLabSlice.ts` owns progression-only filters,
  sort, active step, selected voicing, and visualization choice.
- `src/features/progressions` owns relative chord formulas, resolution, URL
  validation, presentation, and catalog validation.
- `src/features/voicings` owns formula-independent dynamic chord generation,
  request adapters, ranking, signatures, and accessible chart descriptions.
- `src/data/progressionCatalog.ts` holds static templates outside Redux, while
  `src/data/progressionSources.ts` is the machine-readable source ledger.
- `src/data/practiceRoutines.ts` holds typed routine copy and its visible
  research-source records outside Redux.
- `src/data/practiceTabExamples.ts` holds the 33 authored Standard E scores;
  `src/features/practice/tablature.ts` owns their tuning, grid, event, pitch,
  articulation, notation, and accessibility types and helpers.
- `src/features/practice/session.ts` owns derived session display helpers and
  the bounded tempo, subdivision, and instrument option contracts.
- `docs/PROGRESSION_SOURCES.md` documents provenance, licenses, and the import
  boundary; `scripts/progression-pipeline` normalizes audited candidates
  offline without bundling raw datasets.
- Component SCSS is colocated; shared Sass variables and mixins live under
  `src/lib/styles`.
- `scripts/verify-theory.ts` is the executable domain and reducer contract.

`MaterialButton`, `MaterialContainer`, and the `Intervals` component alias are
not on the current main render path. Confirm a component is live before treating
it as product behavior or extending it.

---

# Design Philosophy

Act as both a Senior Product Designer and Senior Frontend Engineer.

If UI decisions are ambiguous:

- prioritize visual quality over matching existing implementation
- reduce visual noise
- prefer fewer controls over more controls
- use whitespace generously
- maintain strong visual hierarchy
- avoid generic UI patterns
- make every component feel intentionally designed

The application should feel modern, premium and polished.

---

# Visual Style

The visual language is inspired by:

- Linear
- Raycast
- Arc Browser
- Vercel

The design should use:

- modern dark theme
- soft neumorphism
- subtle gradients
- large rounded corners
- premium shadows
- smooth animations
- restrained glow effects

Avoid:

- Bootstrap appearance
- Material UI appearance
- Windows desktop styling
- heavy borders
- excessive gradients
- unnecessary glassmorphism

Less is more.

---

# Color System

The application ships three runtime themes: graphite-and-cyan `Graphite`, an
off-white-and-teal `Light`, and dark warm `Ember` with an orange accent. The
root `data-theme` attribute and semantic CSS custom properties in
`src/lib/styles/_themes.scss` must drive every live route and component. Do not
reintroduce fixed dark structural colors inside component Sass.

Each theme uses one primary interface accent. Purple shape overlays, green
CAGED anchors, scale degrees, chord-tone roles, compatibility states, and
Practice articulation colors are semantic learning colors rather than theme
choices. Preserve their functional distinction and provide theme-specific
contrast where required.

Avoid rainbow color palettes unless they communicate meaningful information.

If multiple colors are displayed simultaneously, there must be a functional reason.

---

# Layout

The interface should breathe.

Prefer:

- generous spacing
- large cards
- consistent alignment
- clear grouping
- predictable layouts

Use an 8px spacing system.

Typical spacing:

- 8
- 16
- 24
- 32

The Fretboard and Progression workspaces remain desktop-first. By default, the
document keeps an `1180px` minimum width and permits horizontal scrolling on
narrower viewports; the dashboard uses a 15-column grid and switches to 12
columns below `1350px`. `/practice` is the explicit route-scoped exception:
while Practice Lab is mounted, the document shell, primary navigation, library
grid, score, and session controls adapt to narrow viewports. Keep that override
conditional on Practice; do not remove the desktop minimum from `/` or
`/progressions`, and do not describe the whole application as mobile-ready.

---

# Components

Buttons

- rounded pills or rounded rectangles
- subtle gradients
- hover animation
- pressed state
- selected state uses accent color
- avoid sharp corners

Cards

- soft shadows
- subtle borders
- consistent padding
- rounded corners

Typography

- Inter or Geist
- clear hierarchy
- avoid oversized text
- prioritize readability

Animations

- 150–250ms
- ease-in-out
- subtle
- never distracting

---

# Fretboard

The fretboard is the primary experience.

It should receive the highest design priority.

Optimize for:

- readability
- fast pattern recognition
- minimal visual clutter

Guidelines:

- only render active notes
- never render placeholder note circles
- use authentic guitar fret markers
- maintain consistent note size
- keep string and fret lines clean and subtle
- avoid decorative effects that reduce readability

The fretboard should remain easy to read even when displaying many notes.

Current fretboard conventions:

- the grid renders frets 1 through the selected 12- or 24-fret count
- open strings are represented by the tuning controls, not fret-0 cells
- fret markers are display-only
- scale shapes use the cyclic octave projection defined in `THEORY.md`
- CAGED anchor rings are form landmarks and remain visually distinct from
  chord-tone role styling

---

# Music Theory

Musical correctness always takes priority over UI convenience.

Rules:

- use 12-tone equal temperament
- separate pitch-class identity from display spelling
- preserve beginner-friendly enharmonic labels such as A#/Bb
- keep theory data-driven
- avoid duplicated music theory logic

Intervals, scales, chords, tunings and positions should all come from shared theory data.

Current ownership and terminology:

- `musicTheory.ts` is the source of truth for tonal spelling, scale formulas,
  tertian chord construction, and chord-tone roles.
- `fretboardHelpers.ts` is the source of truth for instrument layouts, fret
  positions, shape systems, and cyclic projection.
- `THEORY.md` defines the accepted musical and application-specific rules.
- “Chord Tones” means a pitch-class map across the neck, not a playable chord
  grip.
- “Selected Voicing” means only the exact strings and physical fret positions
  in one verified grip; it must remain unmistakable from “All Chord Tones.”
- “Shape” means a visualization pattern, not a finger assignment.

---

# Interaction Contracts

- Notes, Scale Degrees, Intervals, and Chord Tones remain mutually exclusive.
- Selecting a chord or changing chord size enters Chord Tones mode.
- Chord Tones highlights every matching pitch class across the rendered neck;
  it must not imply that every highlighted note belongs to one physical grip.
- Clicking the currently open shape-system control closes it. Do not add a
  separate redundant visibility switch.
- Reconcile shape availability after key, scale, fret count, string count, or
  tuning changes. If the active system becomes invalid, use the first valid
  system, reset to shape 1, and leave the overlay closed.
- Changing string count resets to that configuration's default tuning.
- Tuning arrays run from highest string to lowest string.
- Only one string-tuning selector opens at a time. Selecting a pitch class must
  mark it, update the string, and close the selector.
- Keep CAGED anchors independent from chord-tone opacity and styling.
- Preserve `aria-pressed`, `aria-expanded`, `aria-live`, visible labels,
  keyboard focus, and reduced-motion behavior when changing controls.
- Use real Next.js links and `aria-current="page"` for the main Fretboard,
  Progressions, and Practice navigation; do not replace route navigation with
  tabs or a modal.
- Keep the native Theme selector outside the primary navigation. Theme state is
  local UI preference, not Redux domain state: validate stored values, apply
  `data-theme` before hydration, persist only the selected theme ID, retain the
  choice across every route, and preserve a visible label and focus ring.
- Practice selection and session controls stay local and ephemeral. Keep the
  experience separated into Practice Library, Practice Session, and Session
  Complete rather than rebuilding one settings-heavy page.
- Practice routines may read the Redux-owned current key and scale for separate
  context, but their authored tabs stay explicitly fixed to verified six-string
  Standard E. Do not imply that a tab transposed, followed custom tuning, or
  became a verified grip. Session tempo and subdivision controls must not
  silently rewrite the authored score timing; practice scoring and persistence
  remain out of scope.
- Keep the Practice primary flow `exercise library -> focused session ->
  completion`. In the session, prioritize concise instruction, the graphical
  tablature, primary transport action, current position, and remaining time;
  keep secondary controls visually subordinate.
- Practice-only responsive overrides must activate on entry to `/practice` and
  disappear on navigation away from it. Keep root-width, body, shell, and
  navigation changes conditional on `.practiceLab`; preserve visible focus,
  source links, and access to every exercise and session control at each width.
- Keep the Practice Library categories and cards reachable at every supported
  width, and stack the session control rail below the tablature on narrow
  screens.
- Redux owns shared key, scale, string count, exact tuning, registered tuning,
  and fret count. The pathname owns progression identity; never duplicate a
  selected progression ID in Redux.
- Detail URLs accept validated `key` and `scale` parameters. On direct load,
  valid URL context takes priority over in-memory Redux context and defaults;
  invalid values are rejected safely.
- Authored progression chord formulas are independent of the global Triads,
  7ths, or 9ths selection.
- Progression steps may open a generic active-chord reference on the main
  fretboard. Do not force borrowed, applied, or altered chords through
  `selectedChordDegree`.
- A pitch-class tuning edit preserves the tuning but invalidates exact register
  unless it exactly restores the selected configuration's registered default.
- Pitch-class-only custom tunings still generate from their actual edited string
  pitch classes. They must not borrow a standard-tuning diagram or claim an
  exact bass/inversion without registered octaves.

---

# Current Boundaries

- Default 6-, 7-, and 8-string tunings have registered MIDI pitches. Custom and
  re-entrant tunings edited through the pitch-class UI remain deliberately
  unregistered because octave inference would be ambiguous.
- `dynamic-chord-v1` generates complete three-, four-, and five-tone diagrams
  from chord notes rather than formula IDs. It includes open strings, searches
  all string subsets through fret 12, prefers a maximum four-fret span, and
  introduces no omissions or doublings. Only custom tunings without a compact
  result may use the wide fallback through eleven frets. Fingerings and barres
  are not invented.
- Practice Lab is a curated guided-routine library. Its durations, clean-tempo
  rules, success criteria, musical prompts, health note, and external research
  links are instructional copy rather than an active timer, metronome, backing
  track, or saved completion system.
- Authored Practice tablature is a verified static Standard E event library,
  not generated shape, fingering, barre, or voicing data. Its pitches, rests,
  fret bounds, bend targets, and same-string articulations follow `THEORY.md`
  and `scripts/verify-theory.ts`.
- Narrow-screen responsiveness currently applies only to Practice Lab. The
  Fretboard and Progression workspaces retain their deliberate desktop canvas.
- Free-form Practice coaching remains pedagogical copy. Structured authored
  tablature crosses the theory boundary and must keep its data model,
  `THEORY.md`, and executable checks aligned whenever pitches, tunings, frets,
  rhythm grids, or articulations change.
- Every current triad, seventh, ninth, suspended, added-tone, sixth, and
  slash-bass chord receives a complete generated diagram. Shell reductions,
  omission-based alternatives, curated common-shape libraries, fingerings, and
  barre metadata remain unsupported.
- CAGED is available only for Major and Natural Minor when the highest six
  strings retain standard-tuning intervals. Extra bass strings on 7- and
  8-string instruments are outside the named CAGED form.
- Harmonic Minor and Phrygian Dominant expose 3NPS only. Minor Blues exposes
  Blues Boxes only.
- There is no scheduled audio, running metronome, active timer, progression
  trainer, saved practice progress, practice scoring, account system, E2E
  runner, visual-regression suite, or CI workflow. Theme preference is the only
  local persistence.

---

# Engineering

Keep business logic outside React components.

Prefer:

- reusable components
- reusable hooks
- reusable utility functions
- typed data models
- CSS variables
- composition over duplication

Avoid unnecessary dependencies.

Do not rewrite working logic solely for visual changes.

---

# Code Quality

When improving UI:

- reuse existing components first
- keep files organized
- avoid duplicated CSS
- avoid unnecessary abstraction
- keep naming consistent

If an existing solution can simply be improved, prefer refinement over replacement.

---

# Backlog

## Expanded Voicings and Progression Training

Progression browsing and complete formula-independent dynamic chord diagrams
now ship. The following remains future work:

- Choose nearby voicings across the complete progression rather than greedily
  choosing only the next chord.
- Highlight common tones and movement for each voice.
- Add Learn/Recall progression-training interactions only after the voicing
  foundation is verified.
- Add curated common open/barre vocabulary, finger assignments, and barres only
  after verification.
- Treat shell and omission-based alternatives as later stages with explicit
  required-tone, omission, and doubling rules.
- Add a deliberate registered-pitch workflow before supporting custom or
  re-entrant tuning diagrams.
- Keep audio, tempo/metronome/looping, automatic progression-wide
  voice-leading, progression building, AI suggestions, favorites/history,
  accounts, cloud persistence, practice scoring, and song associations
  deferred.

Do not implement this remaining backlog until the user explicitly reopens it.

---

# Validation

For theory, tuning, chord, reducer, or shape changes:

1. Run `npm run theory:check`.
2. Run `npx tsc --noEmit`.
3. Run focused Biome checks for touched files.
4. Run `npm run lint` and distinguish new failures from the known baseline.
5. Run `npm run build` before major handoffs when feasible.
6. Visually verify the relevant 12/24-fret and 6/7/8-string states for UI work.
7. For Practice responsive changes, verify direct load and client navigation
   into and away from `/practice` at narrow and desktop widths. Confirm `/` and
   `/progressions` retain the `1180px` canvas and browser history does not leave
   Practice-only root or shell styles active.
8. For theme changes, verify Graphite, Light, and Ember on `/`, `/progressions`,
   one progression detail, and `/practice`; check reload persistence, native
   selector keyboard/focus behavior, semantic visualization contrast, and that
   saved Light applies before the first rendered frame.

Never run `npm run build` concurrently with `npm run dev`; both write to
`.next`. Domain checks do not prove browser interaction, accessibility, or
visual correctness. Report every unverified validation layer explicitly.

Current verified baseline as of 2026-08-30:

- `npm run theory:check` passes for 15 tonics, 5 scales, 1,395 scale chords,
  4,770 shape/tuning combinations, 225 progression templates, 14,475 resolved
  progression events, and all 47,610 scale/progression chord-and-tuning contexts
  with 761,718 validated generated voicings.
- `npx tsc --noEmit` passes.
- Focused Biome checks pass for the dynamic voicing generator, request adapters,
  diagram/workspace integration, layout metadata, and theory suite; direct
  Progression Workspace Sass compilation passes.
- `npm run lint` reports 5 formatting errors and 2 warnings, chiefly existing
  untouched formatting and import issues.
- Development-server route smoke checks pass for add9-heavy and seventh-heavy
  progression details after dynamic generation warms.
- `npm run build` was not run because an existing development server owns
  `.next`; build and dev must not write there concurrently.
- Diagram interaction, focus behavior, theme rendering, and screenshot
  inspection remain unverified because no browser instance was connected.

If validation fails because of unrelated baseline, sandbox, or experimental
files, report the issue instead of modifying unrelated code.
