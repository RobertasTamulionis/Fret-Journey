import { type CSSProperties, type ReactNode, useMemo } from "react";
import type { PracticeTabExample } from "@/features/practice/tablature";
import {
  formatPracticeTabNote,
  getPracticeExampleTuning,
  getPracticeSequenceEvents,
  getPracticeTabBeatSize,
  getPracticeTabCountLabels,
  getPracticeTabLegend,
  practiceTabSlotCount,
} from "@/features/practice/tablature";

type PracticeTablatureProps = {
  activeEventIndex?: number;
  example: PracticeTabExample;
  showFollowAlong?: boolean;
};

type GridRowProps = {
  activeEventIndex?: number;
  children: (slot: number) => ReactNode;
  className?: string;
  eventIndexBySlot?: ReadonlyMap<number, number>;
  label: string;
  slots: number;
  style: CSSProperties;
  subdivision: PracticeTabExample["subdivision"];
};

function GridRow({
  activeEventIndex,
  children,
  className = "",
  eventIndexBySlot,
  label,
  slots,
  style,
  subdivision,
}: GridRowProps) {
  const beatSize = getPracticeTabBeatSize(subdivision);

  return (
    <div className={`practiceTab__row ${className}`.trim()} style={style}>
      <span className="practiceTab__rowLabel">{label}</span>
      {Array.from({ length: slots }, (_, slot) => {
        const eventIndex = eventIndexBySlot?.get(slot);
        const eventState =
          eventIndex === undefined || activeEventIndex === undefined
            ? ""
            : eventIndex === activeEventIndex
              ? "isCurrent"
              : eventIndex < activeEventIndex
                ? "isPlayed"
                : "isUpcoming";

        return (
          <span
            className={`practiceTab__cell ${slot % beatSize === 0 ? "isBeat" : ""} ${eventState}`.trim()}
            // biome-ignore lint/suspicious/noArrayIndexKey: The slot number is the stable identity of a fixed musical grid position.
            key={`${label}-${slot}`}
          >
            {children(slot)}
          </span>
        );
      })}
    </div>
  );
}

export default function PracticeTablature({
  activeEventIndex,
  example,
  showFollowAlong = false,
}: PracticeTablatureProps) {
  const tuning = getPracticeExampleTuning(example);
  const slots = practiceTabSlotCount[example.subdivision];
  const countLabels = getPracticeTabCountLabels(example.subdivision);
  const legend = useMemo(() => getPracticeTabLegend(example), [example]);
  const gridStyle = useMemo(
    () =>
      ({
        "--practice-tab-slots": slots,
      }) as CSSProperties,
    [slots],
  );
  const {
    eventBySlot,
    hasPalmMute,
    markerBySlot,
    restEventIndexBySlot,
    sequenceEventCount,
    sequenceIndexByOccupiedSlot,
    sequenceIndexByStartSlot,
  } = useMemo(() => {
    const sequenceEvents = getPracticeSequenceEvents(example);
    const noteEvents = sequenceEvents.filter((event) => event.kind === "notes");
    const restEvents = sequenceEvents.filter((event) => event.kind === "rest");
    const sequenceIndexes = new Map(
      sequenceEvents.map((event, index) => [event.at, index]),
    );
    const restIndexes = new Map(
      restEvents.flatMap((event) =>
        Array.from(
          { length: event.duration },
          (_, index) =>
            [event.at + index, sequenceIndexes.get(event.at) ?? 0] as const,
        ),
      ),
    );

    return {
      eventBySlot: new Map(noteEvents.map((event) => [event.at, event])),
      hasPalmMute: noteEvents.some(
        (event) => event.palmMuteDepth !== undefined,
      ),
      markerBySlot: new Map(
        example.markers?.map((marker) => [marker.at, marker.label]) ?? [],
      ),
      restEventIndexBySlot: restIndexes,
      sequenceEventCount: sequenceEvents.length,
      sequenceIndexByOccupiedSlot: new Map([
        ...sequenceIndexes,
        ...restIndexes,
      ]),
      sequenceIndexByStartSlot: sequenceIndexes,
    };
  }, [example]);
  const hasMarkers = markerBySlot.size > 0;
  const presentedActiveEventIndex = showFollowAlong
    ? activeEventIndex
    : undefined;

  return (
    <figure className="practiceTab">
      <header className="practiceTab__header">
        <div>
          <span>Playable example</span>
          <strong>{example.pitchScope.label}</strong>
        </div>
        <dl className="practiceTab__metrics">
          <div>
            <dt>Tempo</dt>
            <dd>{example.bpm} BPM</dd>
          </div>
          <div>
            <dt>TAB</dt>
            <dd>Static sequence</dd>
          </div>
          <div>
            <dt>Loop</dt>
            <dd>×{example.repetitions}</dd>
          </div>
        </dl>
        <output className="practiceTab__playbackStatus">
          <span>{showFollowAlong ? "Current event" : "Ready"}</span>
          <strong>
            {showFollowAlong && activeEventIndex !== undefined
              ? `${activeEventIndex + 1} / ${sequenceEventCount}`
              : `${sequenceEventCount} events`}
          </strong>
        </output>
      </header>

      <section
        aria-label={`Scrollable guitar tablature. ${example.accessibleDescription}`}
        className="practiceTab__viewport"
        // biome-ignore lint/a11y/noNoninteractiveTabindex: Keyboard users need to reach and horizontally scroll this score on narrow screens.
        tabIndex={0}
      >
        <div aria-hidden="true" className="practiceTab__score">
          {hasMarkers && (
            <GridRow
              className="practiceTab__annotations practiceTab__markers"
              label=""
              slots={slots}
              style={gridStyle}
              subdivision={example.subdivision}
            >
              {(slot) => markerBySlot.get(slot) ?? null}
            </GridRow>
          )}

          <GridRow
            activeEventIndex={presentedActiveEventIndex}
            className="practiceTab__annotations practiceTab__picking"
            eventIndexBySlot={sequenceIndexByOccupiedSlot}
            label="Pick"
            slots={slots}
            style={gridStyle}
            subdivision={example.subdivision}
          >
            {(slot) => {
              const event = eventBySlot.get(slot);

              if (restEventIndexBySlot.has(slot)) {
                return <span className="practiceTab__rest">REST</span>;
              }

              if (!event) {
                return null;
              }

              return (
                <span className="practiceTab__attack">
                  {event.accent && <b>&gt;</b>}
                  {event.stroke === "down"
                    ? "↓"
                    : event.stroke === "up"
                      ? "↑"
                      : null}
                </span>
              );
            }}
          </GridRow>

          {hasPalmMute && (
            <GridRow
              activeEventIndex={presentedActiveEventIndex}
              className="practiceTab__annotations practiceTab__palmMute"
              eventIndexBySlot={sequenceIndexByStartSlot}
              label="Mute"
              slots={slots}
              style={gridStyle}
              subdivision={example.subdivision}
            >
              {(slot) => {
                const depth = eventBySlot.get(slot)?.palmMuteDepth;

                return depth ? `PM·${depth[0].toUpperCase()}` : null;
              }}
            </GridRow>
          )}

          <div className="practiceTab__staff">
            {tuning.stringLabelsHighToLow.map((label, stringIndex) => (
              <GridRow
                activeEventIndex={presentedActiveEventIndex}
                className="practiceTab__string"
                eventIndexBySlot={sequenceIndexByStartSlot}
                key={`${example.id}-${label}-${stringIndex}`}
                label={label}
                slots={slots}
                style={gridStyle}
                subdivision={example.subdivision}
              >
                {(slot) => {
                  const event = eventBySlot.get(slot);
                  const note = event?.notes.find(
                    ({ string }) => string === stringIndex + 1,
                  );

                  if (!event || !note) {
                    return null;
                  }

                  return (
                    <span
                      className={`practiceTab__note ${event.accent ? "isAccent" : ""}`.trim()}
                    >
                      {formatPracticeTabNote(note, event.duration)}
                    </span>
                  );
                }}
              </GridRow>
            ))}
          </div>

          <GridRow
            className="practiceTab__annotations practiceTab__count"
            label="Count"
            slots={slots}
            style={gridStyle}
            subdivision={example.subdivision}
          >
            {(slot) => countLabels[slot]}
          </GridRow>
        </div>
      </section>

      <figcaption className="practiceTab__caption">
        <span className="practiceTab__tuning">
          {tuning.label}
          {tuning.registerStatus === "unregistered" && (
            <small>Pitch classes exact · octave register unverified</small>
          )}
        </span>
        {legend.length > 0 && (
          <ul aria-label="Tablature notation">
            {legend.map((item) => (
              <li key={`${item.symbol}-${item.label}`}>
                <code>{item.symbol}</code>
                {item.label}
              </li>
            ))}
          </ul>
        )}
      </figcaption>
    </figure>
  );
}
