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
| Major | 1 2 3 4 5 6 7 | Diatonic triads built in thirds |
| Natural Minor | 1 2 ♭3 4 5 ♭6 ♭7 | Diatonic triads built in thirds |
| Minor Blues | 1 ♭3 4 ♭5 5 ♭7 | Common blues I7–IV7–V7 harmony |
| Harmonic Minor | 1 2 ♭3 4 5 ♭6 7 | Diatonic triads built in thirds |
| Phrygian Dominant | 1 ♭2 3 4 5 ♭6 ♭7 | Diatonic triads built in thirds |

“Minor Blues” is explicit because major and minor blues scales are different.
The I7–IV7–V7 display is labeled and implemented as common blues harmony; it is
not described as harmony obtained by stacking only notes of the minor-blues
scale.

## Chord construction

For seven-note scales, triads are constructed by taking scale tones 1–3–5 from
each degree, wrapping through the scale while preserving each note's diatonic
spelling. Chord quality is determined from the resulting pitch intervals:

- major: 1–3–5;
- minor: 1–♭3–5;
- diminished: 1–♭3–♭5;
- augmented: 1–3–♯5.

Minor-blues common harmony uses dominant-seventh chords on degrees I, IV, and V,
spelled 1–3–5–♭7 from each chord root.

## Guitar fingering standard

Fret Journey uses three deliberately named systems. A shape is a visualization
aid, not a different scale: every highlighted fret must belong to the selected
scale, and this is enforced by executable checks on 6-, 7-, and 8-string tuning.

### 3NPS

Each position starts on a successive scale tone on the lowest string and places
three consecutive ascending scale tones on every string. Every seven-note scale
offered in this system has seven positions. The algorithm follows the selected
tuning rather than assuming a fixed six-string fret diagram. 3NPS is not offered
for Minor Blues; its six-note vocabulary is represented through Positions and
Blues Boxes.

### Positions

The UI intentionally says “Positions,” not “CAGED.” Major and natural-minor use
five compact vertical layouts; Harmonic Minor, Phrygian Dominant, and Minor Blues
use five overlapping tonic-relative fret regions. Fret Journey does not claim
that these are C–A–G–E–D chord-form shapes.

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
double flats, harmonic-minor and Phrygian-dominant triads, blues harmony, all
supported tonic/scale combinations, and every available shape for 6/7/8 strings.

## Sources

- [Open Music Theory: pitches and enharmonic equivalence](https://openmusictheory.github.io/pitches.html)
- [Open Music Theory: scales and scale degrees](https://openmusictheory.github.io/scales.html)
- [Open Music Theory: accidentals and double accidentals](https://openmusictheory.github.io/basicNotation.html)
- [musictheory.net: minor and harmonic-minor construction](https://www.musictheory.net/lessons/22)
- [musictheory.net: diatonic triads](https://www.musictheory.net/lessons/43)
- [Berklee PULSE: minor pentatonic to blues](https://pulse.berklee.edu/?id=4&lesson=7)
- [Berklee: five-position pentatonic and blues practice](https://online.berklee.edu/takenote/country-music-guitar-essentials-chicken-pickin-string-bending-and-more/)
- [Berklee Guitar Handbook: triads and common I–IV–V blues harmony](https://assets.online.berklee.edu/handbooks/berklee-online-guitar-handbook.pdf)
- [BYU–Idaho Fundamentals of Jazz Improvisation: fifth mode of harmonic minor](https://content.byui.edu/file/be14498b-aa3f-4b2a-b9e6-4fb3fdbd1d12/1/05%20Theory%202.pdf)

The cited sources establish the theory definitions and recognized guitar-system
categories. Fret Journey's tuning-aware shape algorithms are documented above
as explicit application conventions and are tested rather than presented as
copied proprietary diagrams.
