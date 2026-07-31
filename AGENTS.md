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

The application should use a single accent color defined through CSS variables.

Supported themes include:

- Cyan
- Purple
- Neon Green
- Orange

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

# Validation

After meaningful changes:

- run npm run lint when feasible
- run npm run build before major handoffs when feasible

If validation fails because of unrelated sandbox or experimental files, report the issue instead of modifying unrelated code.
