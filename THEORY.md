# Fret Journey theory contract

This document defines what “correct” means inside Fret Journey. Theory behavior
must follow this contract and pass `npm run theory:check` before it is changed.

## Scope

- Western 12-tone equal temperament (12-TET).
- Pitch-class identity is stored separately from written note spelling.
- Scale and chord labels use academically correct diatonic spelling.
- The supported tonic list is the conventional 15-key-signature set: C, C♯,
  D♭, D, E♭, E, F, F♯, G♭, G, A♭, A, B♭, B, and C♭.
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

## Guitar fingering standard

Fret Journey uses three deliberately named systems. A shape is a visualization
aid, not a different scale: every highlighted fret must belong to the selected
scale, and this is enforced by executable checks on 6-, 7-, and 8-string tuning.
The two supported fret views present the same complete shapes cyclically. The
enlarged 12-fret view projects each shape onto one octave: fret 13 continues at
fret 1, fret 14 at fret 2, and so on. The 24-fret view shows two
octave-equivalent placements of each shape. The second placement begins 12 frets
above the first; any part beyond fret 24 continues from fret 1. These rules apply
consistently to 3NPS, CAGED, Pentatonic, Blues, and CAGED chord anchors.

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

CAGED is not offered for altered top-six-string tunings, Harmonic Minor,
Phrygian Dominant, or Minor Blues. Fret Journey does not relabel generic fret
windows as CAGED shapes.

### Pentatonic and Blues boxes

Major and natural-minor pentatonic use five movable, two-notes-per-string cyclic
boxes. Minor Blues uses the minor-pentatonic boxes with the ♭5 blue note added
inside each box's fret span. Pentatonic boxes are not offered for Harmonic Minor
or Phrygian Dominant because there is no single universally implied pentatonic
subset for those scale names.

## Verification

Run:

```sh
npm run theory:check
npx tsc --noEmit
```

The theory check verifies representative exact spellings, including B♯, C♭,
double flats, every triad/seventh/ninth formula across all supported tonics and
scales, blues I–IV–V harmony, chord-tone roles, Redux transitions, and every
available shape for 6/7/8 strings.

## Sources

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
