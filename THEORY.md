# Fret Journey theory contract

This document defines what “correct” means inside Fret Journey. Theory behavior
must follow this contract and pass `npm run theory:check` before it is changed.

## Scope

- Western 12-tone equal temperament (12-TET).
- Pitch-class identity is stored separately from written note spelling.
- Scale and chord labels use academically correct diatonic spelling.
- The tonic selector exposes the 15 spellings used by the conventional
  major-key signature set: C, C♯, D♭, D, E♭, E, F, F♯, G♭, G, A♭, A, B♭,
  B, and C♭.
- Those spellings are reused as tonics for every supported scale. A supported
  tonic/scale pairing is not necessarily a conventional key signature.
- Double sharps and double flats are supported when a scale requires them.
- Tuning controls may show paired enharmonic pitch-class labels such as C♯/D♭
  because custom tuning selects a sounding pitch class, not a tonal spelling.

Enharmonic notes may sound alike in 12-TET while serving different written and
harmonic roles. For example, C♯ major contains B♯, not C natural. The application
therefore stores a fret's sounding pitch class independently from the spelling
derived from the selected tonic and scale.

## Supported scales

| Scale | Scale-degree formula | Harmony shown |
| --- | --- | --- |
| Major | 1 2 3 4 5 6 7 | Diatonic triads, seventh chords, and ninth chords |
| Natural Minor | 1 2 ♭3 4 5 ♭6 ♭7 | Diatonic triads, seventh chords, and ninth chords |
| Minor Blues | 1 ♭3 4 ♭5 5 ♭7 | Common blues I–IV–V major, dominant-seventh, and dominant-ninth harmony |
| Harmonic Minor | 1 2 ♭3 4 5 ♭6 7 | Diatonic triads, seventh chords, and ninth chords |
| Phrygian Dominant | 1 ♭2 3 4 5 ♭6 ♭7 | Diatonic triads, seventh chords, and ninth chords |

“Minor Blues” is explicit because major and minor blues scales are different.
The I–IV–V display is labeled and implemented as common blues harmony; it is not
described as harmony obtained by stacking only notes of the minor-blues scale.

## Chord construction

For seven-note scales, chords are constructed by stacking thirds from each scale
degree and wrapping through the scale while preserving every note's diatonic
spelling:

- triads use 1–3–5;
- seventh chords use 1–3–5–7;
- ninth chords use 1–3–5–7–9.

A ninth chord includes its seventh; it is not treated as a triad with an added
second. Chord labels are derived from the resulting intervals, so major,
dominant, minor, half-diminished, diminished, minor-major, augmented-fifth, ♭9,
and ♯9 structures remain distinct. Chord-tone roles (root, third, fifth,
seventh, and ninth) drive fretboard styling, while the visible labels use exact
interval names such as R, M3, d5, M7, or A9.

Triad quality is determined from the first three chord tones:

- major: 1–3–5;
- minor: 1–♭3–5;
- diminished: 1–♭3–♭5;
- augmented: 1–3–♯5.

Minor-blues common harmony uses major triads on degrees I, IV, and V. Seventh
mode adds each chord's minor seventh, and ninth mode also adds its major ninth,
producing I7–IV7–V7 or I9–IV9–V9. Those chord tones intentionally need not all
belong to the selected minor-blues scale.

## Progression formulas

Progression Lab stores each progression once as an authored relative harmonic
formula. Transposed chord names and Roman-numeral labels are derived output;
neither is parsed back into the theory model.

Relative roots use the seven conventional tonic-relative major-scale letter
degrees as their coordinate system, even when a template is compatible with a
minor or modal context. A degree alteration changes its sounding pitch while
retaining its diatonic letter. For example, degree 3 in C is E, while flat 3 is
E♭. This makes formulas such as `i–♭VII–♭VI`, `♭II–I`, and `♭VII–I`
explicit rather than silently changing the meaning of a degree when the scale
selector changes.

Each progression step owns:

- a stable step identifier;
- a root degree and optional chromatic alteration;
- a chord-formula identifier;
- a positive harmonic duration in beats;
- an optional authored function and annotation;
- an optional relative bass specification;
- an optional applied-chord target, such as the target degree in `V/V`.

Applied dominants are resolved from their target. `V/V` in C therefore has D
as its root and uses the dominant-seventh formula when that formula is
authored; it is never substituted with the diatonic ii chord. Slash basses are
resolved and spelled independently, must belong to the authored chord for the
initial catalog, and are included in the displayed chord name.

Every progression declares compatible application scales. Compatibility is a
property of the authored template, not permission to reinterpret its formula.
An incompatible current scale may be explained or filtered, but the stored
roots and chord formulas remain unchanged.

### Generic chord formulas

Progression formulas are deliberately separate from the existing
`ScaleChord` and `ChordQuality` types. A generic formula records:

- a stable formula identifier and compact display suffix;
- the Roman-numeral case and decoration rule;
- every tone's semitone interval from the root;
- every tone's diatonic letter movement from the root;
- its chord-tone role;
- whether the tone is required or optional;
- explicit extension, suspension, alteration, omission, and replacement
  behavior.

The initial resolver supports major, minor, diminished, and augmented triads;
dominant, major, minor, half-diminished, and diminished sevenths; suspended
seconds and fourths; major and minor added ninths; major and minor sixths; and
dominant-seven suspended-fourth chords. Authored formula type always wins over
the Fretboard's global `Triads | 7ths | 9ths` interface setting.

Chord tones are spelled by both pitch interval and diatonic letter movement.
This preserves spellings such as F♯ rather than G♭ when F♯ is the chordal
third, and continues to support double accidentals where the selected tonic
requires them.

### Roman labels and harmonic scope

Roman labels are derived from the root degree, its alteration, formula case,
formula decoration, applied target, and optional bass. Major-family,
dominant, suspended, and added-tone formulas use uppercase numerals;
minor-family formulas use lowercase; diminished and half-diminished formulas
add their conventional symbols. Borrowed, applied, modal-interchange, and
chromatic scope is authored metadata and is surfaced by the interface rather
than inferred only from capitalization.

## Progression catalog contract

Every shipped template has a stable ID and slug, compatible tonal frameworks,
ordered steps, category, discovery tags, meter, an original short explanation,
an editorial-review state, and one or more valid source-ledger references. A
template may instead cite the explicit Fret Journey editorial source record
when it is an original theory exercise rather than a corpus-derived claim.

Catalog size never counts transpositions. Its normalized uniqueness signature
includes tonal framework, ordered relative chord specifications, durations,
and basses. For a loop, cyclic rotations share one canonical signature and
cannot be counted as separate entries. Distinct source works may contribute to
frequency evidence, but repeated sections within one work count once. The
production bundle contains only reviewed relative templates and source IDs,
not raw corpus files, song titles, artist names, lyrics, or complete song
charts.

## Fretboard label semantics

The four display modes are mutually exclusive and answer different learning
questions:

- **Notes** labels selected-scale positions with their correctly spelled note
  names.
- **Scale Degrees** labels those positions with the selected scale's degree
  formula.
- **Intervals** labels those positions as intervals measured from the tonic.
- **Chord Tones** highlights the active chord's pitch classes throughout the
  rendered neck, labels them with chord-relative intervals, and visually mutes
  other scale positions. Minor-blues harmony may introduce chord tones outside
  the selected scale, as described above.

## Fretboard and harmony boundaries

- `ScaleChord` describes harmonic content: scale degree, chord name and quality,
  size, and ordered spelled pitch-class tones with root, third, fifth, seventh,
  and ninth roles. It does not describe a guitar grip.
- Chord Tones maps matching pitch classes across every rendered fret. It does
  not select a bass note or inversion, decide omissions or doublings, assign
  fingers, barres, or mutes, or guarantee a playable hand shape.
- The beginner tuning controls retain a highest-string-to-lowest-string
  `PitchClass[]`. Exact registered tuning is stored alongside it only while the
  register is verified.
- Fret positions are rendered from fret 1 through the selected fret count.
  Open-string pitch classes appear in the tuning controls, not as fret-0 grid
  positions.
- The descending pitches used internally by shape generation express relative
  string order. They are not a general registered-pitch or audio model,
  especially for re-entrant or otherwise custom tunings.
- The existing scale-chord selector remains degree-based and separate from a
  generic progression-chord reference. It must not be used for borrowed,
  applied, suspended, altered, or slash chords.
- Progression-wide voice-leading, playback, finger assignments, practice
  scoring, and automatic omission choices remain outside the current model.

## Fretboard shape standard

Fret Journey uses three deliberately named systems. A shape is a visualization
aid, not a different scale, a finger assignment, or a guarantee that all shown
notes form one simultaneous physical grip. Every highlighted fret must belong
to the selected scale, and this is enforced by executable checks on 6-, 7-, and
8-string tuning. The two supported fret views present the same complete shapes
cyclically. The enlarged 12-fret view projects each shape onto one octave: fret
13 continues at fret 1, fret 14 at fret 2, and so on. The 24-fret view shows two
octave-equivalent placements of each shape. The second placement begins 12
frets above the first; any part beyond fret 24 continues from fret 1. These
rules apply consistently to 3NPS, CAGED, Pentatonic, Blues, and CAGED chord
anchors.

### 3NPS

Each position starts on a successive scale tone on the lowest string and places
three consecutive ascending scale tones on every string. Every seven-note scale
offered in this system has seven positions. The algorithm follows the selected
tuning rather than assuming a fixed six-string fret diagram. 3NPS is not offered
for Minor Blues; its six-note vocabulary is represented through Blues Boxes.

### CAGED

CAGED is offered for Major and Natural Minor when the highest six strings retain
standard-tuning intervals. Uniformly transposed standard tuning remains valid.
Seven- and eight-string instruments keep the canonical CAGED geometry on their
highest six strings; additional bass strings are deliberately not presented as
part of the named chord form.

The five controls are explicitly C, A, G, E, and D. Each scale layout contains a
ringed tonic-chord anchor derived from that movable chord form: 1–3–5 for Major
and 1–♭3–5 for Natural Minor. The surrounding highlighted notes complete the
selected scale shape. In the 24-fret view, the complete scale layout and its
ringed chord anchor appear in both octave-equivalent places; a placement crossing
fret 24 continues at fret 1. The shared 12-fret octave projection retains each
position's string, pitch-class, scale-degree, and chord-anchor identity. Either
view can split a form across the right and left edges of the visualization, but
keeps all five CAGED controls available without dropping any notes from the form.

Ringed CAGED anchors are harmonic and form landmarks. A form split by the
cyclic fret-24-to-fret-1 projection is not asserted to be one simultaneously
playable voicing.

CAGED is not offered for altered top-six-string tunings, Harmonic Minor,
Phrygian Dominant, or Minor Blues. Fret Journey does not relabel generic fret
windows as CAGED shapes.

### Pentatonic and Blues boxes

Major and natural-minor pentatonic use five movable, two-notes-per-string cyclic
boxes. Minor Blues uses the minor-pentatonic boxes with the ♭5 blue note added
inside each box's fret span. Pentatonic boxes are not offered for Harmonic Minor
or Phrygian Dominant because there is no single universally implied pentatonic
subset for those scale names.

## Registered guitar tuning

Registered pitches use MIDI note numbers solely as an exact pitch-and-octave
coordinate; this does not imply audio playback. Arrays retain the application's
internal highest-string-to-lowest-string order.

The verified defaults are:

| Instrument | Registered open strings, highest to lowest |
| --- | --- |
| 6 string | E4 (64), B3 (59), G3 (55), D3 (50), A2 (45), E2 (40) |
| 7 string | E4 (64), B3 (59), G3 (55), D3 (50), A2 (45), E2 (40), B1 (35) |
| 8 string | E4 (64), B3 (59), G3 (55), D3 (50), A2 (45), E2 (40), B1 (35), F♯1 (30) |

Changing string count restores that configuration's exact registered default.
The current pitch-class-only tuning control does not ask for octave. Changing a
string to a non-default pitch class therefore marks the whole tuning as
unregistered instead of guessing an octave. Returning every string to the
selected configuration's exact default pitch classes restores its registered
default. Uniformly transposed, drop, and re-entrant custom tunings remain
usable for pitch-class fretboard views and dynamic chord diagrams. Those
diagrams use the edited pitch classes to calculate exact strings and frets, but
they do not claim an exact sounding bass or inversion until a future
register-aware editor records every open-string octave explicitly.

## Playable voicing contract

A generated chord shape is a physical, non-cyclic string-and-fret assignment.
It is unrelated to CAGED overlay projection. The generator request contains the
chord name, root, every spelled chord tone and role, required-tone metadata, an
optional authored slash bass, the selected pitch-class tuning, and exact
registered open pitches when available. Formula identifiers never decide
whether a diagram can render.

The `dynamic-chord-v1` generator follows one shared contract for scale and
progression chords:

- every authored chord pitch class and role appears exactly once;
- no non-chord pitch class, omission, or doubling is introduced;
- each tone occupies a distinct string and every unused string is explicitly
  muted;
- open strings and physical frets 1 through 12 are eligible;
- all string subsets are searched rather than requiring adjacent strings;
- a maximum four-fret span is preferred and covers every current chord on all
  registered defaults; only a custom tuning with no compact complete result may
  use the deterministic wide fallback, up to an eleven-fret span;
- registered tunings calculate every sounding MIDI pitch and the true bass;
- an authored slash bass must be the lowest sounding registered pitch;
- pitch-class-only custom tunings place an authored slash bass on the lowest
  physical string used but label its exact register as unknown;
- deterministic deduplication and ranking prioritize the requested/root bass,
  contiguous string groups, smaller spans, lower positions, and open strings;
- at most sixteen ranked alternatives are returned for one chord request.

The current chord universe contains three, four, or five distinct tones, so it
fits the six-string minimum without omission. The exhaustive contract verifies
all 1,395 scale chords and all 14,475 resolved progression events on each
registered 6-, 7-, and 8-string default: 47,610 chord-and-tuning contexts with
at least one complete generated result.

The voicing record can represent omissions, doublings, fingers, and barres for
future verified features, but `dynamic-chord-v1` does not invent any of them.
Its diagrams support every current triad, seventh, ninth, suspended, added-tone,
sixth, and slash-bass chord. Shell voicings and omission-based reductions remain
separate future policies rather than silent substitutions.

Seven- and eight-string results always contain seven or eight explicit string
states. A shape that uses fewer strings mutes the remainder; it is never
rendered as an unlabeled six-string substitute.

Chord diagrams reverse the internal high-string-to-low-string array only for
presentation: the bass-side physical string is drawn on the left and the
treble-side string on the right. Each diagram exposes a textual description of
the chord, tuning, string count, mute/open/fret states, frets, register status,
calculated bass when available, and omissions.

`Selected Voicing` displays only the exact string-and-fret positions of the
chosen grip. `All Chord Tones` displays every matching pitch class across the
neck. These modes are never described as equivalent.

## Authored Practice tablature contract

Practice examples are static, reviewed playing prompts rather than shapes or
generated voicings. Every shipped example declares its tuning, rhythmic grid,
tempo, repetition count, events, accessible description, and pitch scope. The
current library uses the verified six-string Standard E register in the same
highest-to-lowest internal order as the fretboard: E4, B3, G3, D3, A2, E2. The
display labels those strings `e`, `B`, `G`, `D`, `A`, `E` from top to bottom.

Each score is one 4/4 measure divided into quarters, eighths, triplets, or
sixteenths. Notes and rests occupy explicit grid slots. A simultaneous event
groups its strings in one record; separate events cannot share a start slot.
Practice frets may use open fret `0` through fret `24`, even though the main
fretboard grid begins at fret 1. `x` is a dead note, `PM` is a pitched
palm-muted attack, and `REST` is silence; those meanings are not
interchangeable.

The visible notation uses `h` for hammer-on, `p` for pull-off, `/` and `\` for
ascending and descending slides, `b` with a target fret for a bend, `r` for a
bend release, `~` for sustain or vibrato, arrows for pick direction, and `>`
for an accent. Hammer-ons, pull-offs, slides, and releases require a preceding
numeric fret on the same string. A bend target is one or two frets above its
source and remains on the same string.

Tonal examples declare an allowed pitch-class set. Executable verification
checks every sounded fret and bend target against that set, while chromatic
coordination exercises declare their chromatic scope explicitly. The authored
tabs do not transpose to the Redux key, follow custom tuning, claim a fingering
or barre, or become verified chord grips. The Practice interface must label
their fixed Standard E context honestly while it may show the current
Fretboard key and scale separately.

## Verification

Run:

```sh
npm run theory:check
npx tsc --noEmit
```

`scripts/verify-theory.ts` is a Node `assert` suite. It checks representative
exact spellings, including B♯, C♭, and double flats; every scale triad,
seventh, and ninth formula across all supported tonics and scales; blues
I–IV–V harmony; chord-tone roles; Redux transitions; and available shapes
across the default 6-, 7-, and 8-string configurations in both fret views. It
also validates every progression's declared transpositions, Roman and chord
output, catalog uniqueness and source references, exact registered defaults,
custom-tuning register invalidation, and every current chord-and-tuning
context's non-empty generation, complete pitch/role membership, bounds, span,
registered bass, slash bass, string count, signature, and deterministic rank.
It also checks compact and pathological custom-tuning generation and
one-to-one routine-to-tab coverage, the
verified Standard E practice register, event and fret bounds, pitch-scope
membership, rests, bend targets, and same-string articulation direction for
every authored Practice example.

The suite does not validate visual layout, browser interactions, accessibility
behavior, unmodeled finger assignments or barres, progression-wide ergonomics,
audio, or the production build.

## Deferred theory work (non-normative)

Progression-wide automatic voice-leading, register-aware custom-tuning entry,
curated common open/barre libraries, shell and omission/doubling policies,
verified fingerings, audio, and progression practice evaluation are not part of
the current Progression Lab contract.

## Sources

- [Progression Lab source and provenance ledger](./docs/PROGRESSION_SOURCES.md)
- [Open Music Theory: harmony in pop/rock music](https://openmusictheory.github.io/popRockHarmony.html)
- [Open Music Theory: pitches and enharmonic equivalence](https://openmusictheory.github.io/pitches.html)
- [Open Music Theory: scales and scale degrees](https://openmusictheory.github.io/scales.html)
- [Open Music Theory: accidentals and double accidentals](https://openmusictheory.github.io/basicNotation.html)
- [musictheory.net: minor and harmonic-minor construction](https://www.musictheory.net/lessons/22)
- [musictheory.net: diatonic triads](https://www.musictheory.net/lessons/43)
- [musictheory.net: diatonic seventh chords](https://www.musictheory.net/lessons/46)
- [Open Music Theory: chord symbols and extensions](https://viva.pressbooks.pub/openmusictheory/chapter/chord-symbols/)
- [Berklee PULSE: minor pentatonic to blues](https://pulse.berklee.edu/?id=4&lesson=7)
- [Berklee: five-position pentatonic and blues practice](https://online.berklee.edu/takenote/country-music-guitar-essentials-chicken-pickin-string-bending-and-more/)
- [Fender: major scales and the CAGED system](https://www.fender.com/articles/scales/major-guitar-scales)
- [D’Addario: guide to the CAGED system](https://www.daddario.com/blogs/guitar/guitarists-guide-to-the-caged-system)
- [Berklee Guitar Handbook: triads and common I–IV–V blues harmony](https://assets.online.berklee.edu/handbooks/berklee-online-guitar-handbook.pdf)
- [BYU–Idaho Fundamentals of Jazz Improvisation: fifth mode of harmonic minor](https://content.byui.edu/file/be14498b-aa3f-4b2a-b9e6-4fb3fdbd1d12/1/05%20Theory%202.pdf)

The cited sources establish the theory definitions and recognized guitar-system
categories. Fret Journey's tuning-aware shape algorithms are documented above
as explicit application conventions and are tested rather than presented as
copied proprietary diagrams.
