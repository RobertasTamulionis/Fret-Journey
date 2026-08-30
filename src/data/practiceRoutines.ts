import type { PracticeTabExampleId } from "@/data/practiceTabExamples";

export type PracticeRoutineId =
  | "daily-mix"
  | "scales-modes"
  | "string-skipping"
  | "rhythm-chugs"
  | "alternate-picking"
  | "legato"
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
          "Alternate the choice each session so a familiar scale never becomes background noise.",
        duration: "7 min",
        exampleId: "daily-foundation",
        instruction:
          "Choose scale navigation or time: connect two positions, or play one muted note as quarters, eighths, triplets, and sixteenths.",
        pattern: "Day A: scale map · Day B: subdivision grid",
        phase: "Foundation",
        success:
          "Position changes or subdivision changes happen without a pulse wobble.",
        title: "Build the floor",
      },
      {
        coach:
          "Work for about 30 seconds, release the hands, then repeat. Rest is part of the rep.",
        duration: "7 min",
        exampleId: "daily-mechanics",
        instruction:
          "Choose one mechanics tab and one failure to fix: noise, timing, note volume, pick path, or unwanted tension.",
        pattern: "One technique · one failure · clean repeats",
        phase: "Mechanics",
        success:
          "The chosen failure becomes less frequent without extra effort.",
        title: "Train one weak link",
      },
      {
        coach:
          "If you cannot sing the phrase yet, make it shorter rather than hunting randomly on the neck.",
        duration: "5 min",
        exampleId: "daily-ear",
        instruction:
          "Sing a three-to-five-note idea, find it on the guitar, move it to a second position or octave, then answer it.",
        pattern: "Sing → find → move → answer",
        phase: "Ear",
        success: "The guitar follows an idea you heard first.",
        title: "Connect sound to fretboard",
      },
      {
        coach:
          "Keep the first take. Notice one rhythm issue and one tone issue; do not turn this into another drill.",
        duration: "8 min",
        exampleId: "daily-play",
        instruction:
          "Create a riff, improvise over a vamp, or play against a track using today's movement and a deliberate amount of silence.",
        pattern: "Constraint → take → listen → one adjustment",
        phase: "Play",
        success: "The final minutes sound like music, not an exercise.",
        title: "Make the work audible",
      },
    ],
    summary:
      "A compact rotation for days when another pentatonic-and-major-scale runway would make you put the guitar back down.",
    tabLabel: "Daily Mix",
    title: "Practice the player, not the pattern",
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
          "Play or sing tonic, third, fifth, and tonic again. If studying a mode, add its characteristic color tone over a tonic drone or vamp.",
        pattern: "1 – 3 – 5 – 1 – color tone",
        phase: "Center",
        success: "You can hear the tonal center before running the shape.",
        title: "Establish home",
      },
      {
        coach:
          "Say the degrees when the fingering starts to take over your attention.",
        duration: "3 min",
        exampleId: "scales-sequence",
        instruction:
          "Replace straight ascent with diatonic thirds, then four-note cells. Move the accent without changing the notes.",
        pattern: "1–3, 2–4…  /  1234, 2345…",
        phase: "Sequence",
        success: "The pattern remains even when the accent shifts.",
        title: "Break the runway",
      },
      {
        coach:
          "Change direction at the seam on the next pass so one route does not become a new autopilot pattern.",
        duration: "4 min",
        exampleId: "scales-connect",
        instruction:
          "Ascend through one position, cross into its neighbor, and descend there. Reverse the route on the next loop.",
        pattern: "Position A ↗ seam ↘ Position B",
        phase: "Connect",
        success: "The position change is rhythmically invisible.",
        title: "Join two shapes",
      },
      {
        coach:
          "Limit the note count. Rhythm, target notes, and silence should carry the idea.",
        duration: "3 min",
        exampleId: "scales-phrase",
        instruction:
          "Improvise short call-and-response phrases using the same route instead of running it end to end.",
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
          "Apply the same skip pairs to a familiar two-note-per-string pentatonic fragment, then reverse without pausing.",
        phase: "Coordinate",
        success: "Fretting and picking arrive together on every change.",
        title: "Move a known vocabulary",
      },
      {
        coach:
          "Treat this as a melodic arpeggio: each note is separate, not a held chord grip.",
        duration: "3 min",
        exampleId: "skipping-arpeggio",
        instruction:
          "Map a familiar three-note major or minor arpeggio across non-adjacent strings and sequence it through one key.",
        pattern: "Root → third → fifth → third",
        phase: "Apply",
        success:
          "The interval shape is clear and every unused string is quiet.",
        title: "Outline harmony at a distance",
      },
      {
        coach:
          "Keep one imperfect take and fix only the noisiest transition on the second pass.",
        duration: "3 min",
        exampleId: "skipping-phrase",
        instruction:
          "Create a two-bar phrase with one large skip, one repeated note, and one deliberate rest.",
        phase: "Transfer",
        success:
          "The skip serves the melody instead of announcing the exercise.",
        title: "Make the interval matter",
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
          "Use enough gain to hear noise, but not so much that compression hides uneven attack.",
        duration: "4 min",
        exampleId: "chugs-grid",
        instruction:
          "Play downpicked eighths, then alternate-picked sixteenths. Move the accent through the bar without changing tempo.",
        pattern: "8ths → 16ths → displaced accent",
        phase: "Grid",
        success: "The accent moves while every unaccented stroke stays even.",
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
          "Keep the fretting-hand part simple enough that the picking-hand articulation remains the focus.",
        duration: "3 min",
        exampleId: "chugs-riff",
        instruction:
          "Combine muted pedal tones, unmuted power-chord punches, and one syncopated rest into a compact riff.",
        phase: "Transfer",
        success:
          "The riff grooves at a clean tempo before it sounds aggressive.",
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
          "Use only a comfortable fret span. Independence grows from control, not pain.",
        duration: "3 min",
        exampleId: "legato-pairs",
        instruction:
          "On one string, alternate hammer-ons and pull-offs with finger pairs 1–2, 1–3, 1–4, 2–3, 2–4, and 3–4.",
        pattern: "12 · 13 · 14 · 23 · 24 · 34",
        phase: "Balance",
        success: "Every pair produces two clear, rhythmically equal notes.",
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
          "Repeat one phrase with a different rhythm before adding more notes.",
        duration: "3 min",
        exampleId: "legato-phrase",
        instruction:
          "Create a compact legato phrase with one held note and one rest so the smooth articulation has contrast.",
        phase: "Transfer",
        success: "Legato changes the expression, not only the note count.",
        title: "Shape a line that breathes",
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
          "Move the triad arpeggio through three chords you already know and vary the note where each sweep exits.",
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
        coach: "Do not let the release become an uncontrolled extra lick.",
        duration: "3 min",
        exampleId: "bends-control",
        instruction:
          "Arrive at the target, hold it for two beats, then release in time. Repeat on more than one string.",
        pattern: "Arrive · hold · release",
        phase: "Control",
        success: "Pitch remains centered through the hold and release.",
        title: "Own the whole bend",
      },
      {
        coach:
          "Start on a normal fretted note. Keep the oscillation around a pitch center rather than only pushing sharp.",
        duration: "3 min",
        exampleId: "vibrato-pulse",
        instruction:
          "Practice narrow and wide vibrato at slow pulses, then repeat with eighth-note and triplet pulses.",
        pattern: "Narrow ↔ wide · slow ↔ faster",
        phase: "Vibrato",
        success: "The pulse stays rhythmic while width remains consistent.",
        title: "Separate width from speed",
      },
      {
        coach:
          "Leave space after the expressive note so its pitch and shape are exposed.",
        duration: "3 min",
        exampleId: "bends-phrase",
        instruction:
          "Play the same four-note phrase three ways: straight, with a bend, and with vibrato. Choose the version that says the most.",
        phase: "Transfer",
        success:
          "Expression changes the meaning without changing the vocabulary.",
        title: "Make one note carry the phrase",
      },
    ],
    summary:
      "The missing counterpart to speed work: reference-pitch bends, controlled releases, rhythmic vibrato, and a phrase that exposes both.",
    tabLabel: "Bends & Vibrato",
    title: "Train the notes between the frets",
  },
];
