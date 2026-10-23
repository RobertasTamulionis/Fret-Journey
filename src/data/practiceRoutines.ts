import type { PracticeTabExampleId } from "@/data/practiceTabExamples";

export type PracticeRoutineId =
  | "daily-mix"
  | "scales-modes"
  | "string-skipping"
  | "rhythm-chugs"
  | "alternate-picking"
  | "legato"
  | "metal-riff-forge"
  | "sweep-picking"
  | "bends-vibrato";

export type PracticeSourceId =
  | "bapam-warmup"
  | "berklee-ear"
  | "berklee-legato"
  | "berklee-scales"
  | "guitar-world-bends"
  | "guitar-world-palm-muting"
  | "music-radar-alternate"
  | "music-radar-sweep"
  | "open-music-theory-modes"
  | "premier-guitar-skipping"
  | "premier-guitar-vibrato";

export type PracticeStep = {
  coach: string;
  duration: string;
  exampleId: PracticeTabExampleId;
  instruction: string;
  isSharedReference?: boolean;
  pattern?: string;
  phase: string;
  success: string;
  title: string;
};

export type PracticeRoutine = {
  duration: string;
  eyebrow: string;
  id: PracticeRoutineId;
  musicalPrompt: string;
  objective: string;
  progressionRule: string;
  qualityChecks: string[];
  sourceIds: PracticeSourceId[];
  steps: PracticeStep[];
  summary: string;
  tabLabel: string;
  title: string;
};

export type PracticeSource = {
  id: PracticeSourceId;
  publisher: string;
  title: string;
  url: string;
};

export const practiceSources: PracticeSource[] = [
  {
    id: "bapam-warmup",
    publisher: "BAPAM",
    title: "Healthy warm-up guidance for musicians",
    url: "https://www.bapam.org.uk/dont-cramp-your-style/",
  },
  {
    id: "berklee-scales",
    publisher: "Berklee Online",
    title: "Guitar scale, mode, and tempo practice",
    url: "https://online.berklee.edu/takenote/how-to-start-learning-your-guitar-scales/",
  },
  {
    id: "open-music-theory-modes",
    publisher: "Open Music Theory",
    title: "Diatonic modes and tonal centers",
    url: "https://viva.pressbooks.pub/openmusictheory/chapter/diatonic-modes/",
  },
  {
    id: "music-radar-alternate",
    publisher: "MusicRadar",
    title: "Alternate-picking synchronization and string changes",
    url: "https://www.musicradar.com/tuition/guitars/30-day-guitar-challenge-day-24-an-alternate-picking-masterclass-626692",
  },
  {
    id: "premier-guitar-skipping",
    publisher: "Premier Guitar",
    title: "String-skipping movement and musical application",
    url: "https://www.premierguitar.com/lessons/cram-session-the-ups-and-downs-of-string-skipping",
  },
  {
    id: "guitar-world-palm-muting",
    publisher: "Guitar World",
    title: "Palm-mute depth, accents, and chug articulation",
    url: "https://www.guitarworld.com/lessons/techniques/palm-muting",
  },
  {
    id: "berklee-legato",
    publisher: "Berklee Online",
    title: "Hammer-on, pull-off, slide, and phrasing practice",
    url: "https://online.berklee.edu/takenote/guitar-techniques-hammer-ons-pull-offs-and-slides/",
  },
  {
    id: "music-radar-sweep",
    publisher: "MusicRadar",
    title: "Continuous sweep motion, separation, and muting",
    url: "https://www.musicradar.com/tuition/guitars/30-day-guitar-challenge-day-26-sweep-picking-masterclass-626700",
  },
  {
    id: "guitar-world-bends",
    publisher: "Guitar World",
    title: "Precision string-bending practice",
    url: "https://www.guitarworld.com/lessons/tips-precision-string-bending",
  },
  {
    id: "premier-guitar-vibrato",
    publisher: "Premier Guitar",
    title: "Controlled vibrato width and rhythm",
    url: "https://www.premierguitar.com/lessons/shake-it-off-everything-you-need-to-know-about-vibrato",
  },
  {
    id: "berklee-ear",
    publisher: "Berklee Online",
    title: "Relative hearing, singing, and musical function",
    url: "https://online.berklee.edu/takenote/ear-training-exercises-to-help-you-become-a-better-musician/",
  },
];

export const practiceRoutines: PracticeRoutine[] = [
  {
    duration: "30 min",
    eyebrow: "Anti-autopilot session",
    id: "daily-mix",
    musicalPrompt:
      "Use one idea from the mechanics block in a two-bar riff or solo. Leave at least one full beat of space in every phrase.",
    objective:
      "Touch timing, movement, hearing, and actual music without trying to train everything at once.",
    progressionRule:
      "Rotate the emphasis: A = precision, B = flow, C = groove. Keep one measurable goal for the whole session.",
    qualityChecks: [
      "You can name the one thing you are improving today.",
      "Your clean tempo stays free of escalating tension.",
      "The pulse continues internally through every rest.",
      "The trained movement appears in a real musical phrase.",
    ],
    sourceIds: ["bapam-warmup", "berklee-scales", "berklee-ear"],
    steps: [
      {
        coach:
          "Warm-up means easy motion and gentle playing, not forcing a cold stretch.",
        duration: "3 min",
        exampleId: "daily-reset",
        instruction:
          "Move away from the instrument, check posture, tune, then play easy chords or single notes at conversational effort.",
        pattern: "Move → tune → gentle notes",
        phase: "Arrive",
        success: "Hands feel warmer and freer than when you started.",
        title: "Reset the player",
      },
      {
        coach:
          "Use a small pick motion and listen for an unwanted accent when you move from low E to A, then from A to D.",
        duration: "7 min",
        exampleId: "daily-foundation",
        instruction: "",
        pattern: "3 notes · cross · 3 notes · cross · 2 notes",
        phase: "Foundation",
        success:
          "All eight notes stay even and both string changes pass without a pause or extra accent.",
        title: "Build the floor",
      },
      {
        coach:
          "Keep the fretting fragment small and listen for an accent or delay when the pick crosses between G and B.",
        duration: "7 min",
        exampleId: "alternate-cross",
        instruction:
          "Alternate pick C–D on G, E–F on B, then reverse through F–E–D–C without breaking the eighth-note pulse.",
        isSharedReference: true,
        pattern: "G 5–7 · B 5–6–6–5 · G 7–5",
        phase: "Mechanics",
        success:
          "Both string changes sound like the surrounding notes, with equal volume and no pulse wobble.",
        title: "Train one weak link",
      },
      {
        coach:
          "Listen to the complete call before the rest, then use the answer to check what you remembered instead of reading one note at a time.",
        duration: "5 min",
        exampleId: "daily-ear",
        instruction:
          "Play the displayed three-note call, preserve the eighth-note rest, then reproduce its four-note answer from memory.",
        pattern: "Three-note call · rest · four-note answer",
        phase: "Ear",
        success:
          "You can repeat the complete phrase from memory without shortening the rest or changing the note order.",
        title: "Connect sound to fretboard",
      },
      {
        coach:
          "Let open strings ring only for their written durations. Prepare fretted notes while they sound, mute cleanly before each rest, and keep the hook relaxed and musical. Do not turn it into a speed exercise; 128 BPM is an optional mastery challenge only after 112 stays clean.",
        duration: "8 min",
        exampleId: "daily-play",
        instruction:
          "Play E–G–A–B, preserve the first rest, and answer with A–G–E–D–B. In bar 2, repeat E–G–A, climb through D to high E, preserve the second rest, then descend D–B–A–G to a sustained E.",
        pattern: "E–G–A–B · rest · answer → variation · rest · resolve",
        phase: "Play",
        success:
          "The opening motif is recognizable, rests are silent, open strings stop cleanly, bar 2 sounds like a clear variation, and the sustained final E loops smoothly.",
        title: "Open Road Hook",
      },
    ],
    summary:
      "A compact rotation for days when another pentatonic-and-major-scale runway would make you put the guitar back down.",
    tabLabel: "Daily Mix",
    title: "Practice the player, not the pattern",
  },
  {
    duration: "20 min",
    eyebrow: "Metal rhythm progression",
    id: "metal-riff-forge",
    musicalPrompt:
      "Turn one rhythmic cell into a two-bar riff by changing only its accents, rests, or chord punctuation.",
    objective:
      "Build metal rhythm control through riffs that progress from steady attack to gallops, pedal tones, modal tension, and hard stops.",
    progressionRule:
      "Move up a level when three loops remain relaxed, silent in the rests, and even against the click.",
    qualityChecks: [
      "Pick motion stays compact as the note rate increases.",
      "Palm-muted pedals remain pitched and even.",
      "Ringing chords do not blur into the next muted attack.",
      "Rests and re-entries land exactly on the grid.",
    ],
    sourceIds: ["guitar-world-palm-muting", "music-radar-alternate"],
    steps: [
      {
        coach: "Keep the wrist loose and make every downstroke the same size.",
        duration: "2 min",
        exampleId: "metal-tight-chugs",
        instruction:
          "Anchor the displayed pedal with even, palm-muted eighth-note downstrokes.",
        phase: "Downpicking · Level 1",
        success: "The final loop sounds as even and relaxed as the first.",
        title: "Tight Chugs",
      },
      {
        coach: "Let the accent come from intent, not a larger tense motion.",
        duration: "3 min",
        exampleId: "metal-accent-shift",
        instruction:
          "Keep the displayed pedal's sixteenth notes even while the accent moves across the beat.",
        phase: "Downpicking · Level 2",
        success:
          "The accent moves without pulling the underlying grid with it.",
        title: "Accent Shift",
      },
      {
        coach:
          "Keep the pedal short and muted; let each power chord open up before returning to the pedal.",
        duration: "3 min",
        exampleId: "metal-pedal-assault",
        instruction:
          "Alternate the displayed tonal-center pedal with three ringing, scale-derived power-chord punches.",
        phase: "Pedal riffs · Level 1",
        success:
          "Muted notes and ringing chords have clearly different lengths.",
        title: "Pedal Point Assault",
      },
      {
        coach:
          "Keep all eighth notes perfectly even. Let the unmuted chord accents reveal three plus three plus two; 140 BPM is an optional mastery challenge only after 120 stays relaxed and clean.",
        duration: "3 min",
        exampleId: "metal-three-three-two-engine",
        instruction:
          "Downpick two bars of even eighth notes while muted tonal-center pedals and accented power chords create a three-plus-three-plus-two groove.",
        phase: "Rhythm accuracy · Level 2",
        success:
          "The grouping is unmistakable without bending the pulse, every chord stops cleanly before the next pedal, and the two-bar loop has no seam.",
        title: "Three-Three-Two Engine",
      },
      {
        coach:
          "Use shallow downstrokes and a relaxed wrist. Keep the displayed pedal medium-muted, release cleanly for every chord, silence the unused lower string, and reposition for the final two chord shapes rather than sliding. Practice in short intervals, stop if pain develops, and treat 140 BPM as an optional mastery challenge only after 124 stays controlled.",
        duration: "3 min",
        exampleId: "metal-iron-pulse",
        instruction:
          "Downpick the tonal-center pedal into two contrasting chord accents, then make the exact sixteenth-note cutoff before the final two-chord turnaround loops home.",
        phase: "Downpicking · Level 3",
        success:
          "Pick depth and attack remain consistent, every chord opens without unused-string noise, the short pedal and rest stay exact, and the final two-chord turnaround returns cleanly to the muted pedal.",
        title: "Iron Pulse",
      },
      {
        coach:
          "Keep the sixteenth-note grid running through both stops. Use compact alternate strokes inside each gallop burst, downpick every power chord, and treat 125 BPM as an optional mastery challenge only after the string changes stay clean at 110.",
        duration: "3 min",
        exampleId: "metal-gallop-relay",
        instruction:
          "Relay forward and reverse gallops between the tonal center and fifth, then use the sixth-to-seventh-degree chord rise and final seventh-degree pickup to turn the two-bar riff home.",
        phase: "Gallops · Level 3",
        success:
          "Both gallop shapes remain distinct, every rest is fully silent, the upper-string transitions stay in time, and the final seventh-degree chord returns to the tonal center without an extra gap.",
        title: "Gallop Relay",
      },
      {
        coach:
          "Count every sixteenth. The empty slot is what makes the gallop speak.",
        duration: "3 min",
        exampleId: "metal-gallop-control",
        instruction:
          "Shape two gallops, a full beat of space, and a power-chord re-entry.",
        phase: "Gallops · Level 1",
        success:
          "The two short attacks stay even and the chord lands after complete silence.",
        title: "Gallop Control",
      },
      {
        coach:
          "Let the upper voice stay open against the muted tonic pedal. Shift the hand freely between its displayed positions instead of forcing a fixed stretch; 116 BPM is an optional mastery challenge only after the flat-second-to-major-third color remains clear at 100.",
        duration: "3 min",
        exampleId: "metal-phrygian-gravity",
        instruction:
          "Alternate the tonic pedal with its flat-second upper voice, reveal the held major third, and sustain the final flat second so the loop resolves back toward the tonic.",
        phase: "Pedal riffs · Level 3",
        success:
          "The pedal stays tight, the flat second pulls clearly against the tonic, the major third changes the modal color, and the held flat second reaches the returning tonic without an extra gap.",
        title: "Phrygian Gravity",
      },
      {
        coach:
          "Make the low pedal automatic so the fretted notes can define the mode.",
        duration: "3 min",
        exampleId: "metal-phrygian-tension",
        instruction:
          "Cross between the tonic pedal and the flat second, then introduce the major third before resolving to the tonic.",
        phase: "Pedal riffs · Level 2",
        success:
          "The adjacent-string notes ring clearly without loosening the pedal pulse.",
        title: "Phrygian Tension",
      },
      {
        coach:
          "Keep alternate strokes shallow and make the string change part of the same motion.",
        duration: "2 min",
        exampleId: "metal-tremolo-horizon",
        instruction:
          "Carry the displayed scale melody through a tremolo-picked string and position change.",
        phase: "Tremolo · Level 1",
        success: "The melody remains audible inside an even stream of attacks.",
        title: "Tremolo Horizon",
      },
      {
        coach:
          "Release pressure with both hands together; gain should expose clean silence, not hide it.",
        duration: "2 min",
        exampleId: "metal-syncopated-stops",
        instruction:
          "Combine chugs, dead notes, offbeat chord stabs, and exact stops.",
        phase: "Rhythm accuracy · Level 2",
        success:
          "Every gap is silent and each offbeat attack arrives without rushing.",
        title: "Stop-Start Chugs",
      },
      {
        coach:
          "Keep the fretting hand relaxed on scratches and make the chord stabs short.",
        duration: "2 min",
        exampleId: "funk-pocket-stabs",
        instruction:
          "Use muted scratches, rests, and syncopated chord stabs to hold a sixteenth-note pocket.",
        phase: "Groove transfer",
        success: "The rests feel as precise as the chord attacks.",
        title: "Pocket Stabs",
      },
    ],
    summary:
      "An original riff-first path through downpicking, chugs, gallops, pedal tones, modal color, tremolo, and stop-start precision.",
    tabLabel: "Metal Riff Forge",
    title: "Build weight from timing, contrast, and silence",
  },
  {
    duration: "12 min",
    eyebrow: "Navigation + phrasing",
    id: "scales-modes",
    musicalPrompt:
      "Play a two-bar question and a two-bar answer. Land once on the tonic and once on the mode or scale's defining color.",
    objective:
      "Turn memorized boxes into connected fretboard routes with a clear tonal center.",
    progressionRule:
      "After three clean loops, change only one variable: subdivision, accent, direction, position, or key.",
    qualityChecks: [
      "The tonic sounds like home rather than just the first note.",
      "Position seams do not create a pause or accent.",
      "Scale degrees stay clear at the chosen subdivision.",
      "The final phrase contains rests and an intentional landing.",
    ],
    sourceIds: ["berklee-scales", "open-music-theory-modes"],
    steps: [
      {
        coach:
          "For modal work, a new starting note is not enough; keep the intended tonic sounding and emphasize its characteristic degree.",
        duration: "2 min",
        exampleId: "scales-center",
        instruction:
          "Play the displayed tonic–third–fifth–tonic contour, then descend through the seventh, fifth, and third back to the tonic.",
        pattern: "1 – 3 – 5 – 1 – 7 – 5 – 3 – 1",
        phase: "Center",
        success: "You can hear the tonal center before running the shape.",
        title: "Establish home",
      },
      {
        coach:
          "Hear each two-note leap as one unit and keep the fret-5-to-13 movement relaxed instead of rushing the second note of each pair.",
        duration: "3 min",
        exampleId: "scales-sequence",
        instruction:
          "Alternate pick four rising scale-tone pairs on one string, skipping one intervening scale tone in each pair and accenting every lower note.",
        pattern: "Tone 1–3 · 2–4 · 3–5 · 4–6",
        phase: "Sequence",
        success:
          "Each pair has the same spacing and the accents stay on A, B, C, and D without disturbing the eighth-note pulse.",
        title: "Break the runway",
      },
      {
        coach:
          "On the return, use the index finger as a guide between the three displayed positions: release pressure before each move and keep the fingertip near the string without dragging a fretted note. In the destination area, prepare the upper finger before the final two-note resolution. Treat 112 BPM as an optional mastery challenge.",
        duration: "4 min",
        exampleId: "scales-connect",
        instruction:
          "Play the displayed four-note motif in the starting position. Sustain its return note, shift into the higher neighboring position, and develop the motif there. Descend through three guide notes before resolving scale degree two to the tonic in the starting area.",
        pattern: "Starting motif → higher position → guided return → 2–1",
        phase: "Connect",
        success:
          "The motif stays recognizable, both shifts land on time without scraping, the destination phrase feels secure, and the final E loops cleanly to the opening.",
        title: "Carry the Motif",
      },
      {
        coach:
          "Limit the note count. Rhythm, target notes, and silence should carry the idea.",
        duration: "3 min",
        exampleId: "scales-phrase",
        instruction:
          "Play the authored call, preserve its rest, then answer with the displayed descending phrase and final vibrato instead of turning the notes into a continuous scale run.",
        phase: "Transfer",
        success: "A listener would hear phrases, not scale practice.",
        title: "Turn the map into language",
      },
    ],
    summary:
      "Keep the major scale and pentatonic vocabulary, but change the route, rhythm, interval order, and musical destination.",
    tabLabel: "Scales & Modes",
    title: "Stop proving that you know the shape",
  },
  {
    duration: "12 min",
    eyebrow: "Wide intervals + muting",
    id: "string-skipping",
    musicalPrompt:
      "Build a wide-interval question, leave a beat of space, then answer on the skipped string pair in reverse.",
    objective:
      "Land cleanly across non-adjacent strings without losing pulse or waking the strings between them.",
    progressionRule:
      "Change the starting stroke before increasing speed. Both down-led and up-led skips should feel dependable.",
    qualityChecks: [
      "The skipped string stays silent.",
      "The pick takes a small, direct path to the destination.",
      "Inside and outside landings keep the same pulse.",
      "The reverse direction is as clean as the outbound route.",
    ],
    sourceIds: ["premier-guitar-skipping", "music-radar-alternate"],
    steps: [
      {
        coach:
          "Watch the landing string, not the pick's whole journey. Release unnecessary grip pressure.",
        duration: "2 min",
        exampleId: "skipping-landing",
        instruction:
          "Mute the strings with the fretting hand and pick pairs 6–4, 5–3, 4–2, and 3–1. Repeat starting down, then up.",
        pattern: "6–4 · 5–3 · 4–2 · 3–1",
        phase: "Land",
        success:
          "Every destination stroke arrives on time with no middle-string click.",
        title: "Calibrate the jump",
      },
      {
        coach:
          "Keep the unused strings muted with both hands as available; distortion will expose what clean tone hides.",
        duration: "4 min",
        exampleId: "skipping-pentatonic",
        instruction:
          "Alternate pick two notes on the first displayed string, skip one string for the next pair, then repeat that relationship one string set higher.",
        pattern: "String 6 → 4 · string 5 → 3",
        phase: "Coordinate",
        success:
          "Every skipped-string landing arrives on time, with equal note volume and no sound from the intervening string.",
        title: "Move a known vocabulary",
      },
      {
        coach:
          "Treat this as a melodic arpeggio: each note is separate, not a held chord grip.",
        duration: "3 min",
        exampleId: "skipping-arpeggio",
        instruction:
          "Play the displayed tonic-triad arpeggio across non-adjacent strings, keeping every note separate and the unused middle string silent.",
        pattern: "Root → third → fifth → third",
        phase: "Apply",
        success:
          "The interval shape is clear and every unused string is quiet.",
        title: "Outline harmony at a distance",
      },
      {
        coach:
          "Clean landings and silent skipped strings come first. Practice each string pair separately with whichever starting stroke feels most controlled, then work toward the authored alternate picking. Treat 108 BPM as an optional mastery challenge.",
        duration: "3 min",
        exampleId: "skipping-phrase",
        instruction:
          "Accent the opening note and alternate between the D and B strings without sounding G. Use the rest to separate question and answer. Repeat the motif in bar 2, cross between high E and G, then finish with the sustained fifth–third–tonic cadence.",
        pattern: "D ↔ B motif · high E ↔ G · 5–b3–1",
        phase: "Transfer",
        success:
          "The motif is recognizable, skipped strings and the rest stay silent, durations remain exact, the final vibrato is controlled, and the loop stays smooth; use consistent alternate picking in the complete version.",
        title: "Across the Wire",
      },
    ],
    summary:
      "A landing-and-muting workout that moves from silent mechanics to pentatonic fragments, arpeggios, and a real phrase.",
    tabLabel: "String Skipping",
    title: "Make the empty string part of the technique",
  },
  {
    duration: "12 min",
    eyebrow: "Attack + silence",
    id: "rhythm-chugs",
    musicalPrompt:
      "Write a two-bar low-string riff with one pedal tone, two power-chord accents, and at least two rests that feel intentional.",
    objective:
      "Control mute depth, subdivision, accents, and silence so the chug has shape instead of becoming a typewriter.",
    progressionRule:
      "Add syncopation only after the mute and unmuted accents stay consistent for three loops.",
    qualityChecks: [
      "Muted notes keep a defined pitch and consistent length.",
      "Accents get louder without rushing.",
      "Both hands agree on every stop.",
      "Rests are silent rather than filled with string wash.",
    ],
    sourceIds: ["guitar-world-palm-muting", "bapam-warmup"],
    steps: [
      {
        coach:
          "Move only a few millimeters around the bridge. More pressure is not automatically a heavier sound.",
        duration: "2 min",
        exampleId: "chugs-mute-depth",
        instruction:
          "On the lowest string, find light, medium, and deep palm mute while keeping the note's pitch recognizable.",
        pattern: "Open → light → medium → deep → open",
        phase: "Tone",
        success:
          "You can choose the mute depth instead of landing there by accident.",
        title: "Find the bridge sweet spot",
      },
      {
        coach:
          "Use shallow downstrokes and enough gain to expose uneven attacks without letting compression hide them.",
        duration: "4 min",
        exampleId: "metal-tight-chugs",
        instruction:
          "Downpick eight medium-muted attacks on the displayed pedal, keeping the accents on beats one and three without changing the pulse.",
        isSharedReference: true,
        pattern: "Eight downstrokes · accents on 1 and 3",
        phase: "Grid",
        success:
          "The two accents speak clearly while every unaccented stroke keeps the same length and useful volume.",
        title: "Lock the picking hand",
      },
      {
        coach:
          "The silence is a note. Use the fretting hand and picking hand together to close it cleanly.",
        duration: "3 min",
        exampleId: "chugs-gallop",
        instruction:
          "Alternate forward gallops, reverse gallops, and full-beat rests. Re-enter without leaning ahead of the click.",
        pattern: "Gallop · reverse · rest · re-entry",
        phase: "Control",
        success: "Every stop and re-entry lands exactly in the grid.",
        title: "Practice the gaps",
      },
      {
        coach:
          "Keep the displayed pedal medium-muted, release cleanly for each chord, and reposition rather than sliding between the final two chord shapes.",
        duration: "3 min",
        exampleId: "metal-iron-pulse",
        instruction:
          "Downpick the tonal-center pedal into two contrasting chord accents, then make the short pedal cutoff before the final two-chord turnaround.",
        isSharedReference: true,
        phase: "Transfer",
        success:
          "Muted pedals stay even, chords open without string noise, and the final two-chord turnaround returns cleanly to the tonal center.",
        title: "Build a chug with a point of view",
      },
    ],
    summary:
      "Chuga chugs, but trained as rhythm: controlled palm placement, tight subdivisions, hard stops, and a riff at the end.",
    tabLabel: "Rhythm & Chugs",
    title: "Heavy is mostly timing and silence",
  },
  {
    duration: "12 min",
    eyebrow: "Synchronization + escape",
    id: "alternate-picking",
    musicalPrompt:
      "Use the two-string cell in a one-bar lick. Move one accent, leave one rest, and land the last note on purpose.",
    objective:
      "Make down-up motion dependable through string changes instead of chasing a one-string speed number.",
    progressionRule:
      "Earn a small tempo increase with three clean, relaxed loops. If noise or tension rises, return to the last clean tempo.",
    qualityChecks: [
      "Downstrokes and upstrokes match in volume.",
      "The pick motion stays compact as the tempo rises.",
      "Both hands arrive together on the string change.",
      "Starting on an upstroke does not break the phrase.",
    ],
    sourceIds: ["music-radar-alternate", "bapam-warmup"],
    steps: [
      {
        coach:
          "Use the smallest comfortable motion. The goal is identical sound, not maximum speed.",
        duration: "2 min",
        exampleId: "alternate-balance",
        instruction:
          "Alternate on one string at an easy subdivision. Lead one loop with a downstroke and the next with an upstroke.",
        pattern: "D U D U  /  U D U D",
        phase: "Balance",
        success: "You cannot hear which stroke started the loop.",
        title: "Equalize both sides",
      },
      {
        coach:
          "Keep the fretting fragment tiny so the string-change motion is the only real problem.",
        duration: "4 min",
        exampleId: "alternate-cross",
        instruction:
          "Move a four-note cell across two adjacent strings. Change the starting stroke to expose both inside and outside changes.",
        pattern: "2 strings · 4 notes · both starting strokes",
        phase: "Cross",
        success: "The change sounds like the notes around it, not a seam.",
        title: "Own the string change",
      },
      {
        coach:
          "A burst should feel like the same motion compressed, not a new tense technique.",
        duration: "3 min",
        exampleId: "alternate-burst",
        instruction:
          "Play three beats at the clean subdivision, one short double-time burst, then rest and release the hand.",
        pattern: "Steady · steady · steady · burst · rest",
        phase: "Speed",
        success: "The burst begins and ends in time with no grip spike.",
        title: "Borrow speed in short bursts",
      },
      {
        coach:
          "Keep strict alternation, but let the rhythm sound like a phrase rather than a demonstration.",
        duration: "3 min",
        exampleId: "alternate-phrase",
        instruction:
          "Put the same motion into a scale fragment or lick with one displaced accent and a clean ending.",
        phase: "Transfer",
        success: "Picking serves the phrase and stays mechanically consistent.",
        title: "Hide the exercise inside music",
      },
      {
        coach:
          "Keep the pick motion compact as the rhythm accelerates, release tension in both rests, and treat 126 BPM as an optional mastery challenge only after both destination notes land cleanly at 108.",
        duration: "3 min",
        exampleId: "metal-burst-and-resolve",
        instruction:
          "Shape the displayed lead phrase through a descending burst to its first target, then vary the contour and resolve the second burst to the tonal center before the final pickup turns the loop home.",
        phase: "Alternate picking · Level 5",
        success:
          "Both bursts enter in time, every string crossing stays synchronized, both target notes sound like deliberate arrivals, and the rests release tension without resetting the stroke cycle.",
        title: "Burst and Resolve",
      },
    ],
    summary:
      "A short routine for the part that usually breaks first: the moment synchronized hands cross a string.",
    tabLabel: "Alternate Picking",
    title: "Train the change, not just the top speed",
  },
  {
    duration: "12 min",
    eyebrow: "Even dynamics + flow",
    id: "legato",
    musicalPrompt:
      "Improvise with one pick attack per string, then repeat the phrase with a slide or rest changing the emphasis.",
    objective:
      "Match hammer-ons, pull-offs, and picked notes in time and volume while keeping unused strings quiet.",
    progressionRule:
      "Add a string or finger pair only while every note stays audible at relaxed fretting pressure.",
    qualityChecks: [
      "Hammered and pulled notes match the picked note's useful volume.",
      "Pull-offs move across the string rather than simply lifting away.",
      "Unused strings stay muted during transitions.",
      "Fingers remain close to the fretboard without forced stretches.",
    ],
    sourceIds: ["berklee-legato", "bapam-warmup"],
    steps: [
      {
        coach:
          "Keep the index finger at fret 5 and use a relaxed hammer and pull for frets 6, 7, and 8. Stop if the movement causes pain.",
        duration: "3 min",
        exampleId: "legato-pairs",
        instruction:
          "Pick high-E fret 5 once, then play 5h6p5, 5h7p5, and 5h8p5 before the final rest.",
        pattern: "5h6p5 · 5h7p5 · 5h8p5 · rest",
        phase: "Balance",
        success:
          "Each hammer and pull matches the picked A closely enough in timing and useful volume to keep the eighth notes even.",
        title: "Equalize the finger pairs",
      },
      {
        coach:
          "Listen for the weakest finger rather than letting the strongest finger set the volume.",
        duration: "3 min",
        exampleId: "legato-flow",
        instruction:
          "Use a three-note-per-string cell: pick once, hammer twice ascending, then pick once and pull twice descending.",
        pattern: "Pick–H–H  /  Pick–P–P",
        phase: "Flow",
        success:
          "All three notes sit at the same subdivision and usable volume.",
        title: "Build one-pick-per-string flow",
      },
      {
        coach:
          "Reduce speed until the destination string is silent before the new phrase begins.",
        duration: "3 min",
        exampleId: "legato-connect",
        instruction:
          "Move the legato cell across two strings, then add one slide to change position without restarting the line.",
        phase: "Connect",
        success: "String transitions stay clean and the slide remains in time.",
        title: "Control the handoff",
      },
      {
        coach:
          "Prepare the lower fingers before the displayed B-string descent; shift the hand instead of forcing one static position. Treat 112 BPM as an optional mastery challenge only after the phrase stays controlled at 96.",
        duration: "3 min",
        exampleId: "legato-phrase",
        instruction:
          "Pick the opening B-string note and shape its five-note neighbor motif with legato. Answer on high E, slide down, and use the full-beat rest to reset. Repeat the motif, prepare the descending pull-offs, and resolve to the tonic with controlled vibrato.",
        pattern: "Five-note motif · answer · rest · develop · tonic",
        phase: "Transfer",
        success:
          "The motif is clear in both bars, legato volume and rhythm stay even, string changes and the slide are clean, the rest is silent, and the final E sustains into a natural loop.",
        title: "Answer the Climb",
      },
    ],
    summary:
      "Finger-pair control, one-pick-per-string flow, clean transitions, and phrasing that does more than pour notes downhill.",
    tabLabel: "Legato",
    title: "Smooth does not mean blurred",
  },
  {
    duration: "12 min",
    eyebrow: "Separation + continuous motion",
    id: "sweep-picking",
    musicalPrompt:
      "Outline one chord per bar in a simple loop, then exit each arpeggio into a held melodic target instead of turning around forever.",
    objective:
      "Coordinate one continuous pick path with fretting-hand release so an arpeggio never collapses into a brushed chord.",
    progressionRule:
      "Expand from two to three strings before adding larger shapes. Add the turn only after every note is isolated.",
    qualityChecks: [
      "The pick glides in one motion instead of making separate pecks.",
      "Only one fretted note rings at a time.",
      "The direction change does not rush or stall.",
      "Unused strings and open-string wash remain silent.",
    ],
    sourceIds: ["music-radar-sweep", "bapam-warmup"],
    steps: [
      {
        coach:
          "This is a motion rehearsal, not a speed test. Let the pick fall through the strings.",
        duration: "2 min",
        exampleId: "sweep-rake",
        instruction:
          "Mute the strings and move one continuous downstroke across two, then three adjacent strings. Return with one upstroke.",
        pattern: "One down path ↓ · one up path ↑",
        phase: "Motion",
        success: "The pick path feels continuous in both directions.",
        title: "Learn the rake without notes",
      },
      {
        coach:
          "Release fret pressure after each note without lifting so far that the hand loses the shape.",
        duration: "4 min",
        exampleId: "sweep-triad",
        instruction:
          "Apply the motion to a familiar three-string major or minor triad arpeggio at a slow, even subdivision.",
        phase: "Separate",
        success: "A recording would reveal single notes, never a chord ring.",
        title: "Synchronize the fretting release",
      },
      {
        coach:
          "Pause briefly at the top if needed, then shrink the pause without changing the hand motion.",
        duration: "3 min",
        exampleId: "sweep-turn",
        instruction:
          "Isolate the top-note turnaround, then connect down-sweep and up-sweep while preserving the subdivision.",
        pattern: "Sweep → turn → sweep",
        phase: "Turn",
        success:
          "The highest note keeps its full value and the return lands in time.",
        title: "Own the direction change",
      },
      {
        coach:
          "Finish on a melody note. The arpeggio is a route into the phrase, not the whole phrase.",
        duration: "3 min",
        exampleId: "sweep-progression",
        instruction:
          "Move through the three displayed triad arpeggios and make each top note sound like a melodic destination.",
        phase: "Transfer",
        success:
          "The harmony is audible and the sweep has a musical destination.",
        title: "Outline a progression",
      },
    ],
    summary:
      "Start with the continuous pick path, add three-string triads, solve the turnaround, then make the arpeggio follow harmony.",
    tabLabel: "Sweep Picking",
    title: "Separate the notes inside one motion",
  },
  {
    duration: "12 min",
    eyebrow: "Intonation + expression",
    id: "bends-vibrato",
    musicalPrompt:
      "Create a four-note phrase whose emotional peak is one in-tune bend or one controlled vibrato, not the number of notes.",
    objective:
      "Make pitch, width, speed, hold, and release deliberate instead of decorating every long note the same way.",
    progressionRule:
      "Center the pitch first. Add vibrato to a bend only after you can arrive, hold, and release in tune.",
    qualityChecks: [
      "The bend arrives at the reference pitch rather than near it.",
      "The held bend does not drift sharp or flat.",
      "Vibrato returns repeatedly to a clear pitch center.",
      "Width and speed change by choice without squeezing harder.",
    ],
    sourceIds: ["guitar-world-bends", "premier-guitar-vibrato"],
    steps: [
      {
        coach:
          "Use your ear before a tuner display. Stop if the motion causes pain or unusual strain.",
        duration: "3 min",
        exampleId: "bends-reference",
        instruction:
          "Play the destination note normally, hear it, then bend to the same pitch from a half step or whole step below.",
        pattern: "Reference → silence → bend to reference",
        phase: "Pitch",
        success:
          "The bent note matches the remembered reference without hunting.",
        title: "Calibrate the destination",
      },
      {
        coach:
          "Keep the bend at its target pitch through the hold, then control the return to the starting pitch instead of letting the string drop suddenly.",
        duration: "3 min",
        exampleId: "bends-control",
        instruction:
          "Bend the displayed B-string note up a whole step, sustain the target through beat three, then release to the starting pitch on beat four.",
        pattern: "Arrive · hold · release",
        phase: "Control",
        success:
          "The bend stays in tune during the hold and the release returns smoothly to its starting pitch exactly on beat four.",
        title: "Own the whole bend",
      },
      {
        coach:
          "The TAB shows two equal holds of the same displayed pitch; you choose the width. Keep each oscillation centered instead of only pushing sharp.",
        duration: "3 min",
        exampleId: "vibrato-pulse",
        instruction:
          "Hold the displayed pitch with vibrato for two beats, then attack and hold it again for two beats. Make the first hold narrow and the second wider as a practice variation.",
        pattern: "Two-beat hold · two-beat hold",
        phase: "Vibrato",
        success:
          "Both holds remain centered on the displayed pitch, and the width you choose stays consistent for the full two beats.",
        title: "Separate width from speed",
      },
      {
        coach:
          "Make the flat-seven-to-tonic bend the phrase peak, preserve the eighth-note rest, then let the final tonic settle with controlled vibrato.",
        duration: "3 min",
        exampleId: "bends-phrase",
        instruction:
          "Play scale degrees flat three, four, and five; bend flat seven up to the tonic, leave one eighth-note rest, then hold the tonic with vibrato for the final three eighth notes.",
        pattern: "b3–4–5 · b7 bend to 1 · rest · tonic vibrato",
        phase: "Transfer",
        success:
          "The bend reaches the tonic, the rest is fully silent, and the final vibrato stays centered as the note decays.",
        title: "Make one note carry the phrase",
      },
    ],
    summary:
      "The missing counterpart to speed work: reference-pitch bends, controlled releases, rhythmic vibrato, and a phrase that exposes both.",
    tabLabel: "Bends & Vibrato",
    title: "Train the notes between the frets",
  },
];
