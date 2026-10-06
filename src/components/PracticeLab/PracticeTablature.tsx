import {
  type CSSProperties,
  type ReactNode,
  useEffect,
  useMemo,
  useRef,
} from "react";
import type { PracticeTabExample } from "@/features/practice/tablature";
import {
  formatPracticeTabNote,
  getPracticeExampleTuning,
  getPracticeScoreSlotCount,
  getPracticeSequenceEvents,
  getPracticeTabBeatSize,
  getPracticeTabCountLabels,
  getPracticeTabLegend,
} from "@/features/practice/tablature";

type PracticeTablatureProps = {
  activeEventIndex?: number | null;
  authoredSlot?: number;
  example: PracticeTabExample;
  showFollowAlong?: boolean;
};

type GridRowProps = {
  activeEventIndex?: number | null;
  authoredSlot?: number;
  children: (slot: number) => ReactNode;
  className?: string;
  eventIndexBySlot?: ReadonlyMap<number, number>;
  eventStartSlotByIndex?: ReadonlyMap<number, number>;
  label: string;
  slots: number;
  style: CSSProperties;
  subdivision: PracticeTabExample["subdivision"];
};

function GridRow({
  activeEventIndex,
  authoredSlot,
  children,
  className = "",
  eventIndexBySlot,
  eventStartSlotByIndex,
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
        const eventStartSlot =
          eventIndex === undefined
            ? undefined
            : eventStartSlotByIndex?.get(eventIndex);
        const eventState =
          eventIndex === undefined || activeEventIndex === undefined
            ? ""
            : eventIndex === activeEventIndex
              ? "isCurrent"
              : eventStartSlot !== undefined &&
                  authoredSlot !== undefined &&
                  eventStartSlot < authoredSlot
                ? "isPlayed"
                : "isUpcoming";

        return (
          <span
            className={`practiceTab__cell ${slot % beatSize === 0 ? "isBeat" : ""} ${eventState}`.trim()}
            data-practice-slot={slot}
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
  authoredSlot,
  example,
  showFollowAlong = false,
}: PracticeTablatureProps) {
  const viewportRef = useRef<HTMLElement>(null);
  const previousActiveEventIndexRef = useRef<number | null>(null);
  const previousExampleIdRef = useRef(example.id);
  const tuning = getPracticeExampleTuning(example);
  const slots = getPracticeScoreSlotCount(example);
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
    eventStartSlotByIndex,
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
      eventStartSlotByIndex: new Map(
        sequenceEvents.map((event, index) => [index, event.at]),
      ),
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
  const presentedAuthoredSlot = showFollowAlong ? authoredSlot : undefined;

  useEffect(() => {
    const viewport = viewportRef.current;
    const exerciseChanged = previousExampleIdRef.current !== example.id;
    previousExampleIdRef.current = example.id;

    if (exerciseChanged) {
      previousActiveEventIndexRef.current = null;
      viewport?.scrollTo({ left: 0 });
    }

    if (!viewport || !showFollowAlong || activeEventIndex == null) {
      previousActiveEventIndexRef.current = activeEventIndex ?? null;
      return;
    }

    const loopRestarted =
      previousActiveEventIndexRef.current !== null &&
      activeEventIndex < previousActiveEventIndexRef.current;
    previousActiveEventIndexRef.current = activeEventIndex;

    if (loopRestarted) {
      viewport.scrollTo({ left: 0 });
      return;
    }

    const lookAheadEventIndex = Math.min(
      activeEventIndex + 2,
      sequenceEventCount - 1,
    );
    const lookAheadSlot = eventStartSlotByIndex.get(lookAheadEventIndex);

    if (lookAheadSlot === undefined) {
      return;
    }

    const lookAheadCell = viewport.querySelector<HTMLElement>(
      `.practiceTab__picking [data-practice-slot="${lookAheadSlot}"]`,
    );

    if (!lookAheadCell) {
      return;
    }

    const rightSafeEdge = viewport.scrollLeft + viewport.clientWidth - 48;
    const lookAheadRight = lookAheadCell.offsetLeft + lookAheadCell.offsetWidth;

    if (lookAheadRight > rightSafeEdge) {
      viewport.scrollTo({
        left: Math.max(0, lookAheadRight - viewport.clientWidth + 48),
      });
    }
  }, [
    activeEventIndex,
    eventStartSlotByIndex,
    example.id,
    sequenceEventCount,
    showFollowAlong,
  ]);

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
              ? activeEventIndex === null
                ? "Silence"
                : `${activeEventIndex + 1} / ${sequenceEventCount}`
              : `${sequenceEventCount} events`}
          </strong>
        </output>
      </header>

      <section
        aria-label={`Scrollable guitar tablature. ${example.accessibleDescription}`}
        className="practiceTab__viewport"
        ref={viewportRef}
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
            authoredSlot={presentedAuthoredSlot}
            className="practiceTab__annotations practiceTab__picking"
            eventIndexBySlot={sequenceIndexByOccupiedSlot}
            eventStartSlotByIndex={eventStartSlotByIndex}
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
              authoredSlot={presentedAuthoredSlot}
              className="practiceTab__annotations practiceTab__palmMute"
              eventIndexBySlot={sequenceIndexByStartSlot}
              eventStartSlotByIndex={eventStartSlotByIndex}
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
                authoredSlot={presentedAuthoredSlot}
                className="practiceTab__string"
                eventIndexBySlot={sequenceIndexByStartSlot}
                eventStartSlotByIndex={eventStartSlotByIndex}
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
            {(slot) => countLabels[slot % countLabels.length]}
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
