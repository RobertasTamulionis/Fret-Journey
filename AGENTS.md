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

## Product Scope

Fret Journey should help a player connect fretboard positions, scales,
intervals, chords, shapes, progressions, and practical playing. New features
should strengthen one or more of those relationships and reuse the shared
theory and fretboard model where appropriate. Do not turn the product into a
generic all-in-one music platform whose features are disconnected from learning
the guitar neck.

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
- a progression-detail position explorer exposing every returned compact grip
  by physical neck region, with session-local selections remembered per chord
  step and reflected in the complete-progression overview

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
  request adapters, ranking, signatures, physical-location grouping, and
  accessible chart descriptions.
- `src/data/progressionCatalog.ts` holds static templates outside Redux, while
  `src/data/progressionSources.ts` is the machine-readable source ledger.
- `src/data/practiceRoutines.ts` holds typed routine copy and its visible
  research-source records outside Redux.
- `src/data/practiceTabExamples.ts` holds the 33 authored Standard E scores;
  `src/features/practice/tablature.ts` owns their tuning, grid, event, pitch,
  articulation, notation, and accessibility types and helpers.
- `src/features/practice/session.ts` owns derived session display helpers and
  the bounded tempo, subdivision, and instrument option contracts.
- `src/features/practice/timing.ts` owns pure beat, slot, timeline, and
  metronome-pulse planning; `src/features/practice/audio` owns the headless Web
  Audio transport and scheduler.
- `docs/PROGRESSION_SOURCES.md` documents provenance, licenses, and the import
  boundary; `scripts/progression-pipeline` normalizes audited candidates
  offline without bundling raw datasets.
- Component SCSS is colocated; shared Sass variables and mixins live under
  `src/lib/styles`.
- `src/lib/motion.ts` owns the small shared presentation-motion vocabulary.
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
- Use Motion through `motion/react` for reusable presentation transitions.
  Motion must never own musical timing, transport state, active-slot
  calculation, or Web Audio scheduling.
- Prefer opacity and small transforms, respect reduced-motion preferences, and
  avoid animating high-frequency tablature nodes or state that is already
  synchronized by the Practice transport.

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

# Practice Lab

## Current Practice Behavior

- Preserve the primary flow `Practice Library -> Practice Session -> Session
  Complete`. The library groups eight technique categories and 33 authored
  exercises; it should feel like choosing a workout rather than configuring
  software.
- Practice selection and session controls are local and ephemeral. React owns
  the selected exercise and control preferences; the headless Practice audio
  engine owns the active transport timeline. Do not duplicate this state in
  Redux.
- Authored tabs are verified six-string Standard E scores. They do not
  transpose with the shared key or follow custom tuning, and the UI must not
  imply that they do.
- Start, Pause, and Resume control a transport-configured count-in (currently
  four beats), audible metronome, and looping visual playhead. Web Audio time is
  the transport clock. Visual snapshots and audible pulses share pure
  beat/timing helpers; click subdivision remains independent from authored
  score subdivision and must not rewrite the score or its playhead timing.
- The exercise-duration value is a static authored practice window, not a
  countdown. Completion is user-triggered; there is no automatic completion,
  scoring, or saved history.
- Count-in and exercise metronome enablement are separate controls. The
  metronome synthesizes a distinct beat-one accent plus optional subdivisions;
  reference-instrument controls remain preference-only and produce no audio.

## Practice Design and Interaction Principles

- In the session, prioritize the current exercise, readable graphical
  tablature, active playhead/note, authored practice window, tempo, and primary
  transport action. Settings and the compact pattern diagram stay secondary.
- Keep idle, playing, paused, and completed states visually and semantically
  distinct. Completed is a separate screen; it is not another transport status.
- Keep Practice consistent with Fret Journey's premium theme-driven visual
  language: generous spacing, restrained emphasis, soft depth, large rounded
  surfaces, high-contrast type, and glow only for active or important elements.
- Communicate past, current, and upcoming score states through position, shape,
  contrast, and text as well as color. Keep notation readable while the current
  fret, pattern-position marker, and direction update.
- Keep playhead movement subtle and synchronized with the existing timing
  helper. Do not replace the practice engine solely to animate the score.
- Preserve native keyboard operation, visible focus states, semantic control
  labels, screen-transition focus management, a focusable horizontally
  scrollable score, and reduced-motion behavior. Do not add custom keyboard
  shortcuts without an explicit interaction design.
- Practice is the route-scoped responsive exception. Activate its root and
  shell overrides only while `.practiceLab` is mounted, keep every library and
  session control reachable, and stack the control rail below the score on
  narrow screens. `/` and `/progressions` retain their desktop canvas.

## Practice Audio Architecture

- `src/features/practice/timing.ts` owns pure beat/slot conversion and pulse
  planning. Both the visual playhead and scheduled clicks derive from that beat
  axis.
- `PracticeMetronomeEngine` has no React imports. It owns the Web Audio timeline
  and schedules a short look-ahead window against `AudioContext.currentTime`;
  its timeout only wakes the scheduler and is not the musical clock.
- React samples transport snapshots with `requestAnimationFrame` for visual
  presentation. It does not advance musical time and avoids rerendering when
  the visible phase, active slot, and count-in value have not changed.
- Audio context creation/resume stays inside Start or Resume user gestures.
  Pause, exercise changes, manual completion, unmount, and tempo or pulse-plan
  changes cancel queued sources. A generation guard prevents stale activations
  and duplicate schedulers under React Strict Mode.
- Count-in length is supplied at the transport boundary. Count-in enablement and
  exercise metronome enablement remain independent; the current UI defaults to
  a four-beat count-in without making four beats an engine invariant.

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
- Redux owns shared key, scale, string count, exact tuning, registered tuning,
  and fret count. The pathname owns progression identity; never duplicate a
  selected progression ID in Redux.
- Progression voicing choices are ephemeral and keyed only by the authored step
  ID. Preserve one selected signature per step, clear the map when detail state
  resets, and make the large chart, exact-position neck, and overview use those
  selections without storing the progression slug in Redux.
- Expose every alternative returned by `dynamic-chord-v1` in the progression
  position explorer. Group them by physical Open/1–4/5–8/9–12 neck regions,
  retain exact signatures and full fret ranges, and call them generated compact
  grips rather than every possible guitar fingering.
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
- Progression detail exposes all alternatives returned by the generator and
  remembers a selected signature per chord step for the current session. The
  24-fret neck does not imply 24-fret generation; upper-neck generation beyond
  fret 12 remains unsupported.
- Practice content remains a curated guided-routine library. Its durations,
  clean-tempo rules, success criteria, musical prompts, health note, and
  external research links remain instructional copy. The current session has a
  looping visual playhead synchronized to its local tempo and the authored tab
  subdivision, plus structural metronome and instrument preferences. It still
  has no running countdown, backing track, reference-note audio, automatic
  completion, or saved completion system. Its first audio layer is a scheduled
  synthesized metronome with count-in, beat-one accent, and subdivision clicks.
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
- There is no running exercise countdown, drums, backing track, reference-note
  playback, progression trainer, saved practice progress, practice scoring,
  account system, E2E runner, visual-regression suite, or CI workflow. Theme
  preference is the only local persistence.

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
- Extend deterministic generated position coverage beyond fret 12 without
  turning the bounded UI into an exhaustive list of overlapping permutations.
- Highlight common tones and movement for each voice.
- Add Learn/Recall progression-training interactions only after the voicing
  foundation is verified.
- Add curated common open/barre vocabulary, finger assignments, and barres only
  after verification.
- Treat shell and omission-based alternatives as later stages with explicit
  required-tone, omission, and doubling rules.
- Add a deliberate registered-pitch workflow before supporting custom or
  re-entrant tuning diagrams.
- Keep Practice countdown and audio beyond the first metronome layer, automatic
  progression-wide voice-leading, progression building, AI suggestions,
  favorites/history, accounts, cloud persistence, practice scoring, and song
  associations deferred.

Do not implement this remaining backlog until the user explicitly reopens it.

---

# Validation

For theory, tuning, chord, reducer, or shape changes:

1. Run `npm run theory:check`.
2. For Practice transport/audio changes, run `npm run practice:audio:check`.
3. Run `npx tsc --noEmit`.
4. Run focused Biome checks for touched files.
5. Run `npm run lint` and distinguish new failures from the known baseline.
6. Run `npm run build` before major handoffs when feasible.
7. Visually verify the relevant 12/24-fret and 6/7/8-string states for UI work.
8. For Practice responsive changes, verify direct load and client navigation
   into and away from `/practice` at narrow and desktop widths. Confirm `/` and
   `/progressions` retain the `1180px` canvas and browser history does not leave
   Practice-only root or shell styles active.
9. For theme changes, verify Graphite, Light, and Ember on `/`, `/progressions`,
   one progression detail, and `/practice`; check reload persistence, native
   selector keyboard/focus behavior, semantic visualization contrast, and that
   saved Light applies before the first rendered frame.

Never run `npm run build` concurrently with `npm run dev`; both write to
`.next`. Domain checks do not prove browser interaction, accessibility, or
visual correctness. Report every unverified validation layer explicitly.

Current verified baseline as of 2026-09-01:

- `npm run theory:check` passes for 15 tonics, 5 scales, 1,395 scale chords,
  4,770 shape/tuning combinations, 225 progression templates, 14,475 resolved
  progression events, and all 47,610 scale/progression chord-and-tuning contexts
  with 761,718 validated generated voicings.
- `npx tsc --noEmit` passes.
- Focused Biome checks pass for the progression workspace, physical-location
  grouping, per-step voicing state, and theory suite; direct Progression
  Workspace Sass compilation passes.
- `npm run lint` reports 5 formatting errors and 2 warnings, chiefly existing
  untouched formatting and import issues.
- A development-server route smoke check passes for
  `open-axis-pop?key=E&scale=minor` after the position explorer compiles.
- `npm run build` was attempted without a development server but stalled during
  optimized compilation without emitting an error and was stopped; it is not a
  passing build result.
- Diagram interaction, focus behavior, theme rendering, and screenshot
  inspection remain unverified because no browser instance was connected.

If validation fails because of unrelated baseline, sandbox, or experimental
files, report the issue instead of modifying unrelated code.
