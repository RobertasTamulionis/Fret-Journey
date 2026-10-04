import type { CSSProperties } from "react";
import {
  formatPracticeTabNote,
  getPracticeExampleTuning,
  getPracticeSequenceEvents,
  getPracticeTabCountLabels,
  type PracticeTabExample,
  type PracticeTabNoteEvent,
  practiceTabSlotCount,
} from "@/features/practice/tablature";

type CompactPracticeTabPreviewProps = {
  example: PracticeTabExample;
};

const strokeLabels = { down: "↓", up: "↑" } as const;

export default function CompactPracticeTabPreview({
  example,
}: CompactPracticeTabPreviewProps) {
  const tuning = getPracticeExampleTuning(example);
  const events = getPracticeSequenceEvents(example);
  const slotCount = practiceTabSlotCount[example.subdivision];
  const slots = Array.from({ length: slotCount }, (_, index) => index);
  const occupiedStrings = [
    ...new Set(
      events.flatMap((event) =>
        event.kind === "notes" ? event.notes.map((note) => note.string) : [],
      ),
    ),
  ].sort((first, second) => first - second);
  const noteEvents = new Map<number, PracticeTabNoteEvent[]>();

  events.forEach((event) => {
    if (event.kind !== "notes") return;
    noteEvents.set(event.at, [...(noteEvents.get(event.at) ?? []), event]);
  });

  const restSlots = new Set(
    events.flatMap((event) =>
      event.kind === "rest"
        ? Array.from({ length: event.duration }, (_, index) => event.at + index)
        : [],
    ),
  );
  const countLabels = getPracticeTabCountLabels(example.subdivision);

  return (
    <div
      aria-label={example.accessibleDescription}
      className="compactTab"
      role="img"
      style={{ "--compact-tab-slots": slotCount } as CSSProperties}
    >
      <div aria-hidden="true" className="compactTab__annotations">
        <span />
        {slots.map((slot) => {
          const slotEvents = noteEvents.get(slot) ?? [];
          const event = slotEvents[0];
          const isPalmMuted = slotEvents.some(
            ({ palmMuteDepth }) => palmMuteDepth,
          );
          return (
            <span className={event?.accent ? "isAccent" : undefined} key={slot}>
              {isPalmMuted ? "PM" : ""}
              {event?.stroke ? strokeLabels[event.stroke] : ""}
            </span>
          );
        })}
      </div>

      <div aria-hidden="true" className="compactTab__staff">
        {occupiedStrings.map((stringNumber) => (
          <div className="compactTab__row" key={stringNumber}>
            <span className="compactTab__stringLabel">
              {tuning.stringLabelsHighToLow[stringNumber - 1]}
            </span>
            {slots.map((slot) => {
              const notes = (noteEvents.get(slot) ?? []).flatMap((event) =>
                event.notes
                  .filter((note) => note.string === stringNumber)
                  .map((note) => ({ event, note })),
              );
              return (
                <span className="compactTab__cell" key={slot}>
                  {notes.map(({ event, note }) => (
                    <b
                      className={event.accent ? "isAccent" : undefined}
                      key={`${event.at}-${note.string}-${note.fret}-${note.articulation ?? "plain"}`}
                    >
                      {formatPracticeTabNote(note, event.duration)}
                    </b>
                  ))}
                  {notes.length === 0 &&
                    restSlots.has(slot) &&
                    stringNumber === occupiedStrings[0] && <i>—</i>}
                </span>
              );
            })}
          </div>
        ))}
      </div>

      <div aria-hidden="true" className="compactTab__count">
        <span />
        {slots.map((slot) => (
          <span
            className={slot % (slotCount / 4) === 0 ? "isBeat" : undefined}
            key={slot}
          >
            {countLabels[slot]}
          </span>
        ))}
      </div>
    </div>
  );
}
