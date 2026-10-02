# Fret Journey

Fret Journey is a desktop-first guitar-learning application with three connected
areas: Fretboard Explorer, Progression Lab, and Practice Lab. Together they use
the interactive fretboard to connect positions, scales, intervals, chords,
shapes, progressions, and practical playing across the neck.

The app is theory-first: pitch-class identity is separated from written note
spelling, scale and chord labels preserve correct enharmonic notation, and
theory behavior is governed by the sourced [theory contract](./THEORY.md).

## Current capabilities

- Explore 15 conventional tonic spellings across Major, Natural Minor, Minor
  Blues, Harmonic Minor, and Phrygian Dominant.
- Switch between Notes, Scale Degrees, Intervals, and Chord Tones.
- View enlarged cyclic 12-fret or full 24-fret layouts with only relevant notes
  rendered.
- Use 6-, 7-, or 8-string guitar presets and retune every string through a
  chromatic pitch-class selector.
- Explore context-aware 3NPS, CAGED, Pentatonic, and Blues Box patterns.
- Use named C, A, G, E, and D shapes with ringed tonic-chord anchors where
  CAGED is valid.
- Select triads, seventh chords, or ninth chords and highlight their root,
  third, fifth, seventh, and ninth roles across the neck.
- Read theory-derived note spellings, formulas, chord names, and active-chord
  summaries.
- Navigate with real routes between the Fretboard (`/`), progression library
  (`/progressions`), progression workspaces (`/progressions/[slug]`), and
  Practice Lab (`/practice`).
- Switch the complete application between persisted Graphite, Light, and Ember
  themes from the shared top-right header control.
- Set key, scale type, guitar string count, and per-string tuning in the shared
  Musical Context bar below navigation. Fretboard, Progression, and Practice
  consume the same Redux-owned context.
- Browse eight grouped Practice Library categories covering a rotating Daily
  Mix, Scales & Modes, String Skipping, Rhythm & Chugs, Alternate Picking,
  Legato, Sweep Picking, and Bends & Vibrato.
- Open any of 33 authored exercises in a focused Practice Session with a score
  resolved for the selected key, scale, 6-/7-/8-string guitar, and tuning, plus
  concise instruction, a tempo-synchronized current-event highlight, position
  feedback, local controls, and a simple completion flow.
- Reflow the exercise-card grid, score, guidance, and session control rail for
  tablet and phone viewports.
- Browse 225 editorially reviewed, genuinely distinct relative progression
  templates with search, compatibility-first ranking, filters, and an
  “Inspire me” action scoped to the visible verified results.
- Transpose authored Roman-numeral progressions without changing their chord
  types, including borrowed chords, applied dominants, altered roots,
  suspensions, added tones, and slash basses.
- Step through a progression while the active chord name, note list, fretboard,
  large chart, and compact chart overview update together.
- Navigate every returned compact voicing one at a time, grouped by Open,
  frets 1–4, frets 5–8, and frets 9–12. Each progression step remembers its
  selected grip for the current workspace session, and the compact progression
  shape strip uses those choices.
- Compare every chord tone across the neck with an exact selected voicing.
  Formula-independent diagrams dynamically place every authored tone for all
  current triads, sevenths, ninths, suspended chords, added tones, sixths, and
  slash-bass chords on the selected 6-, 7-, or 8-string guitar.

## Theory and shape coverage

| Scale | Available shape systems | Harmony |
| --- | --- | --- |
| Major | 3NPS, CAGED, Pentatonic | Diatonic triads, sevenths, and ninths |
| Natural Minor | 3NPS, CAGED, Pentatonic | Diatonic triads, sevenths, and ninths |
| Minor Blues | Blues Boxes | Common I-IV-V major, dominant-seventh, and dominant-ninth harmony |
| Harmonic Minor | 3NPS | Diatonic triads, sevenths, and ninths |
| Phrygian Dominant | 3NPS | Diatonic triads, sevenths, and ninths |

CAGED is available only for Major and Natural Minor when the highest six
strings preserve standard-tuning intervals. Seven- and eight-string guitars
retain the named CAGED geometry on their highest six strings.

Pentatonic boxes are available for Major and Natural Minor. Minor Blues uses
the same five-box foundation with the flat-five blue note added.

See [THEORY.md](./THEORY.md) for the complete theory contract, shape
conventions, implementation boundaries, and sources.

## Themes

The shared header offers Graphite, Light, and Ember themes on every route. The
selection is stored locally, applied to the root document before the interface
hydrates, and retained across route changes and reloads. Runtime semantic CSS
tokens theme the canvas, navigation, controls, cards, fretboard workspace,
progression tools, chord charts, and Practice score while keeping shape,
CAGED, chord-role, and technique colors functionally distinct. Theme choice is
a visual preference and does not alter music data or Redux tonal state.

## Practice Lab

Practice Lab separates browsing from playing. The Practice Library groups all
authored exercises by technique and opens a dedicated Practice Session instead
of expanding a dashboard in place. Its eight grouped categories contain 33
authored exercises, including a rotating Daily Mix and focused scale, string
skipping, rhythm, picking, legato, sweep, bend, and vibrato work.

The 33 immutable source examples are reviewed in verified six-string Standard E
tuning. A pure recipe resolver derives the displayed score from the selected
key, scale type, 6-/7-/8-string guitar, and exact pitch-class tuning without
mutating that source material. Scale navigation, alternate picking, legato,
string skipping, rhythm and chug, sweep, bend, and vibrato recipes preserve
their intended musical or technical relationship rather than merely relabeling
fixed frets. Chromatic coordination drills remain intentionally key-independent.

Registered Standard E, Standard B, and Standard F♯ presets expose verified
register. Custom per-string tuning remains playable and pitch-class-correct,
but the score labels its octave register as unverified because the tuning UI
does not collect octave numbers. Changing musical context during playback
stops the transport, resets Follow Along to the first event, and announces the
new context.

The focused session currently provides:

- Start, Pause, and Resume transport states, with a manually selected completion
  action rather than automatic completion.
- A default four-beat count-in followed by a looping current-event highlight.
  The selected subdivision controls both events per beat and metronome pulses;
  the transport boundary can supply a different count-in length without
  changing the audio engine.
- A synthesized Web Audio metronome with a distinct beat-one accent, optional
  subdivision clicks, and click volume. Count-in and exercise metronome
  playback are independent controls.
- A static guided score that emphasizes the current grouped note or rest, fades
  played events, and leaves upcoming events neutral. It does not animate a
  playhead between TAB positions.
- Current-position feedback for the active fret, authored pattern marker, and
  picking direction, including updates when a pattern shifts along the neck or
  reverses direction.
- An editable exercise countdown initialized from the authored practice window.
  It derives elapsed time from the Web Audio transport, starts after count-in,
  pauses and resumes with playback, and pauses the exercise at zero.
- Local, ephemeral duration, tempo, subdivision, metronome,
  reference-instrument, and volume preferences. The reference-instrument
  controls remain structural preferences and do not currently produce audio.
- A Session Complete view for repeating the exercise, opening the next
  exercise, or returning to the library. Completion and scores are not saved.

Practice controls use native keyboard-operable buttons and inputs with visible
focus states. Screen changes move focus to the new heading, the score viewport
can receive keyboard focus for horizontal scrolling, and reduced-motion
preferences disable smooth score movement. There are no custom transport
keyboard shortcuts.

Practice is the deliberate responsive exception to the otherwise desktop-first
application. At viewports below `1180px`, its route-loaded stylesheet releases
the document minimum width only while `.practiceLab` is present. The
exercise-card grid, score viewport, guidance, and right-side session
controls progressively stack, while the other routes retain the existing
wide-canvas contract.

The visible research links in each routine record why the drills emphasize
clean tempo, short focused repetitions, muting, pitch control, healthy warm-up,
and musical application. Practice copy is instructional content, not a new
music-theory definition; theory behavior remains governed by
[THEORY.md](./THEORY.md).

## Progression Lab

The progression slug is owned by the URL. Valid `key` and `scale` query
parameters make detail links shareable; invalid values are rejected safely.
Redux continues to own the shared tonal and instrument context, so key, scale,
string count, exact tuning, and fret count remain unchanged during client-side
navigation and browser history traversal.

The catalog stores each progression once as a relative formula rather than as
15 transposed copies. Uniqueness is enforced by stable identifiers and a
canonical normalized signature; loop rotations are not counted as separate
templates. Every entry carries an editorial status and source references.

Default 6-, 7-, and 8-string configurations include exact registered MIDI
pitches. Editing a string through the beginner-friendly pitch-class control
preserves the custom tuning but deliberately marks its register as ambiguous.
The dynamic diagram still uses the custom string pitch classes and includes
every authored chord tone. Because the octave register is unknown, it does not
claim an exact bass or inversion; authored slash basses are placed on the
lowest physical string used and described as register-unverified. Compact
four-fret shapes are preferred; unusual custom tunings can use a wider rendered
fret window rather than losing the diagram.

Progression workspaces preserve every ranked alternative returned by the
current generator while presenting one primary voicing at a time. Alternatives
are grouped by physical neck location and navigated with compact previous/next
controls. Selecting a grip updates the supporting chord chart and hero
exact-position neck, while `All Chord Tones` remains a separate pitch-class
map. A compact clickable shape strip previews the selected grip for every
progression step. Grip choices are local to the current workspace session and
remembered per step; they are not saved progress or an automatically optimized
voice-leading path.

The complete source ledger and ingestion policy live in
[docs/PROGRESSION_SOURCES.md](./docs/PROGRESSION_SOURCES.md). The catalog ships
original editorial templates; it does not ship song titles, artist names,
lyrics, or complete song charts. The offline candidate normalizer under
`scripts/progression-pipeline` is the reproducible boundary for future audited
corpus imports, and raw source datasets stay out of the production bundle.

## Getting started

Requirements:

- Node.js
- npm

```bash
git clone https://github.com/RobertasTamulionis/Fret-Journey.git
cd Fret-Journey
npm ci
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Turbopack development server |
| `npm run build` | Create a production build |
| `npm run start` | Start the built application |
| `npm run theory:check` | Verify theory, chord, shape, tuning, and Redux behavior |
| `npm run practice:audio:check` | Verify Practice timing, metronome scheduling, and transport lifecycle |
| `npm run progressions:candidates` | Normalize an audited relative-candidate file outside the production bundle |
| `npm run lint` | Run repository-wide Biome checks |
| `npm run format` | Format supported files with Biome |
| `npx tsc --noEmit` | Run TypeScript validation |

## Architecture

Current stack: Next.js 15 App Router, React 19, Motion 13, TypeScript, Redux
Toolkit, Sass, and Biome.

| Location | Responsibility |
| --- | --- |
| `src/app/page.tsx` | Fretboard route (`/`) |
| `src/app/progressions/page.tsx` | Progression library route |
| `src/app/progressions/[slug]/page.tsx` | Slug-backed progression workspace route |
| `src/app/practice/page.tsx` | Guided daily-practice route |
| `src/app/layout.tsx` | Root Redux provider and pre-hydration theme bootstrap shared by every route |
| `src/components/AppShell` | Shared route surface, navigation, and theme control |
| `src/components/MusicalContextBar` | Shared key, scale, guitar, and per-string tuning controls below navigation |
| `src/components/ThemeSelector` | Native persisted Graphite, Light, and Ember selector |
| `src/components/Fretboard/Fretboard.tsx` | Dashboard composition and fretboard rendering |
| `src/components/Fretboard/FretboardNeck.tsx` | Reusable all-tone and exact-voicing neck visualization |
| `src/components/ProgressionLibrary` | Catalog search, filtering, ranking, and cards |
| `src/components/ProgressionWorkspace` | Active-step timeline, diagrams, and fretboard integration |
| `src/components/PracticeLab` | Practice Library, focused Practice Session, Session Complete, local session state, and graphical tab player |
| `src/features/practice/session.ts` | Practice-session display helpers and control option contracts |
| `src/features/practice/tablature.ts` | Typed tuning, rhythm, event, notation, and pitch helpers for authored tabs |
| `src/features/practice/recipes.ts` | Immutable transformation intent for every authored Practice score |
| `src/features/practice/resolvePracticeTab.ts` | Pure key-, scale-, string-, and tuning-aware Practice score resolver |
| `src/features/practice/timing.ts` | Pure Practice beat, event-index, timeline, and metronome-pulse planning |
| `src/features/practice/audio/PracticeMetronomeEngine.ts` | Headless Web Audio transport and look-ahead metronome scheduler |
| `src/lib/motion.ts` | Shared restrained motion durations, easing, and Practice presentation variants |
| `src/features/theme/themes.ts` | Theme options, validation, storage key, and bootstrap script |
| `src/features/progressions` | Relative formulas, resolution, URL validation, and catalog contracts |
| `src/features/voicings` | Formula-independent dynamic chord generation, ranking, and accessible descriptions |
| `src/data/practiceRoutines.ts` | Typed practice routines and research-source records |
| `src/data/practiceTabExamples.ts` | Thirty-three immutable structured Standard E reference scores |
| `src/data/progressionCatalog.ts` | Static reviewed progression templates outside Redux |
| `src/data/progressionSources.ts` | Machine-readable source and license ledger |
| `src/helpers/musicTheory.ts` | 12-TET pitch classes, note spelling, scales, chord construction, and chord-tone roles |
| `src/helpers/fretboardHelpers.ts` | Guitar configurations, fret positions, shape availability, and shape geometry |
| `src/helpers/typesHelpers.ts` | Shared domain types |
| `src/lib/redux/slices/fretboardSlice.ts` | Shared tonal/instrument context and fretboard interface state |
| `src/lib/redux/slices/progressionLabSlice.ts` | Progression-only filters and workspace selections |
| `scripts/progression-pipeline` | Offline candidate normalization workflow |
| `scripts/verify-theory.ts` | Executable theory, fret, authored-tab, and reducer contract |
| `THEORY.md` | Human-readable theory contract |
| `AGENTS.md` | Product, design, engineering, and contributor guidance |

React components should consume the shared theory and fretboard helpers rather
than reproduce theory rules inside the interface.

## Verification

Run the theory contract after changing notes, scales, chords, tunings, fret
positions, reducers, or shape logic:

```bash
npm run theory:check
npm run practice:audio:check
npx tsc --noEmit
```

For broader changes, also run the relevant focused Biome checks, then:

```bash
npm run lint
npm run build
```

Do not run the development server and production build concurrently because
both write to `.next`.

### Current validation snapshot

As of 2026-09-26:

- `npm run theory:check` passes for 15 tonics, 5 scales, 1,395 scale chords,
  4,770 shape/tuning combinations, 225 progression templates, 14,475 resolved
  progression events, and all 47,610 scale/progression chord-and-tuning contexts
  with 761,718 validated generated voicings, plus 33 authored Practice tabs and
  all 7,425 registered key/scale/string-count Practice resolution contexts.
- `npx tsc --noEmit` passes.
- Focused Biome checks pass for all touched Practice resolver, context-bar,
  session, tablature, and executable-theory files.
- `npm run lint` still reports the existing untouched baseline: 7 formatting or
  semantic errors and 2 import warnings.
- A development-server route smoke check returns 200 for
  `open-axis-pop?key=E&scale=minor` after the position explorer compiles.
- `npm run build` was attempted without a development server but stalled during
  optimized compilation without emitting an error and was stopped. This Next
  15.5.3 CLI does not expose the documented `--webpack` fallback flag.
- Live Chrome verification passes for Practice direct load, exercise query URL
  and browser Back behavior, a playing-session reset on context change,
  7-string and custom-tuning resolution labels, and Graphite/Light/Ember context
  bar contrast at desktop width. Narrow-screen and automated visual-regression
  coverage remain unavailable; the repository has no E2E or CI workflow.

## Current limitations

Fret Journey remains a visualization, exploration, and guided-routine tool.
Practice now includes its first scheduled audio layer and an editable transport-
synchronized exercise countdown, but not a reference-instrument system:

- Dynamic diagrams include every authored chord tone for all current scale and
  progression chords. They do not yet generate omission-based shell voicings.
- The progression position explorer exposes all alternatives returned by
  `dynamic-chord-v1`, but generation currently stops at fret 12 even when the
  24-fret neck is selected.
- Custom pitch-class-only and re-entrant tunings receive note-correct physical
  diagrams, but their exact bass and inversion remain unknown until every open
  string has an explicit octave register.
- Finger assignments and barres are omitted until they can be modeled and
  verified.
- The fretboard grid starts at fret 1. Open strings are represented by the
  tuning controls rather than fret-0 note positions.
- Fret markers are display-only rather than selectable practice targets.
- Practice Session provides local Start/Pause/Resume, configurable count-in,
  tempo, subdivision, an audible metronome, a looping synchronized current-event
  highlight, an editable countdown, and manual completion state. The countdown
  starts after count-in, freezes while paused, and pauses playback at zero;
  subdivision controls event advancement and click density without rebuilding
  or rewriting the TAB. Reference-instrument controls do not produce audio.
  Displayed scores resolve from immutable
  Standard E references; custom pitch-class tunings cannot claim an exact
  octave register until octave-aware tuning input exists.
- There are no drums, backing tracks, reference-note playback, progression
  trainer, saved practice progress, practice scoring, or account system. Only
  the visual theme preference is persisted.
- The Fretboard and Progression workspaces retain the intentional `1180px`
  desktop canvas and horizontal scrolling on narrower viewports. Practice Lab
  is the route-scoped exception and adapts its shell, library grid, score, and
  session controls for narrow screens.

## Backlog

### Expanded voicings and progression training

Progression browsing and complete dynamic chord diagrams now ship. The
following work remains deferred:

- Find close voice-leading paths across a complete progression and identify
  held common tones.
- Extend generated position coverage beyond fret 12 while retaining bounded,
  deterministic results and acceptable exhaustive-verification performance.
- Add Learn/Recall progression-training interactions after the voicing
  foundation is validated.
- Add curated common open/barre vocabulary, finger assignments, and verified
  barre metadata.
- Add optional shell and omission-based alternatives with explicit
  required-tone, omission, and doubling policies.
- Define an explicit registered-pitch workflow for supported custom and
  re-entrant tunings.
- If explicitly reopened, add optional reference playback as separate work
  beyond the current metronome layer. Keep drums, backing tracks, practice
  scoring, accounts, cloud persistence, favorites/history, progression
  building, and AI suggestions deferred.

This remaining backlog should stay deferred until it is explicitly reopened.
