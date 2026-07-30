# Fret Journey Agent Notes

## Product Frame
- We are building a guitar-learning app centered on an interactive fretboard.
- The app should help users see notes, scales, intervals, chords, tunings, and fretboard shapes dynamically.
- Prefer musical correctness and a clean theory model before adding more UI surface.

## Engineering Preferences
- Keep music theory logic in helpers or domain modules, not inside React components.
- Keep React components focused on rendering and dispatching user actions.
- Prefer typed data structures over ad hoc string parsing.
- Avoid adding dependencies unless they clearly reduce complexity.
- Do not refactor unrelated learning/sandbox files unless explicitly asked.

## Music Theory Rules
- Use 12-tone equal temperament as the default pitch system.
- Separate pitch-class identity from display spelling where possible.
- Preserve enharmonic display labels for beginner-friendly UI, such as `A#/Bb`.
- Make intervals, scale formulas, chord formulas, tunings, and fret positions data-driven.
- When adding new scales or chords, extend central theory data instead of duplicating logic in components.

## UI Direction
- The fretboard is the main experience, not a marketing page.
- Keep controls compact, scannable, and useful for repeated practice.
- Preserve the existing dark neon visual direction unless a redesign is explicitly requested.

## Validation
- Run `npm run lint` after meaningful code changes when feasible.
- Run `npm run build` before larger handoffs when feasible.
- If validation fails because of unrelated sandbox files, report that clearly instead of fixing unrelated work.
