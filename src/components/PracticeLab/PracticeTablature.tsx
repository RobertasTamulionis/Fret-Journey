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
  getPracticeTabBeatSize,
  getPracticeTabCountLabels,
  getPracticeTabLegend,
  practiceTabSlotCount,
  practiceTabTunings,
} from "@/features/practice/tablature";

type PracticeTablatureProps = {
  activeSlot?: number;
  example: PracticeTabExample;
  showPlayhead?: boolean;
};

type GridRowProps = {
  children: (slot: number) => ReactNode;
  className?: string;
  currentSlot?: number;
  label: string;
  slots: number;
  style: CSSProperties;
  subdivision: PracticeTabExample["subdivision"];
};

function GridRow({
  children,
  className = "",
  currentSlot,
  label,
  slots,
  style,
  subdivision,
}: GridRowProps) {
  const beatSize = getPracticeTabBeatSize(subdivision);

  return (
    <div className={`practiceTab__row ${className}`.trim()} style={style}>
      <span className="practiceTab__rowLabel">{label}</span>
      {Array.from({ length: slots }, (_, slot) => (
        <span
          className={`practiceTab__cell ${slot % beatSize === 0 ? "isBeat" : ""} ${slot === currentSlot ? "isCurrent" : ""} ${currentSlot !== undefined && slot < currentSlot ? "isPast" : ""}`.trim()}
          // biome-ignore lint/suspicious/noArrayIndexKey: The slot number is the stable identity of a fixed musical grid position.
          key={`${label}-${slot}`}
        >
          {children(slot)}
        </span>
      ))}
    </div>
  );
}

export default function PracticeTablature({
  activeSlot,
  example,
  showPlayhead = false,
}: PracticeTablatureProps) {
  const tuning = practiceTabTunings[example.tuningId];
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
  const { eventBySlot, hasPalmMute, markerBySlot, restSlots } = useMemo(() => {
    const noteEvents = example.events.filter((event) => event.kind === "notes");
    const restEvents = example.events.filter((event) => event.kind === "rest");

    return {
      eventBySlot: new Map(noteEvents.map((event) => [event.at, event])),
      hasPalmMute: noteEvents.some(
        (event) => event.palmMuteDepth !== undefined,
      ),
      markerBySlot: new Map(
        example.markers?.map((marker) => [marker.at, marker.label]) ?? [],
      ),
      restSlots: new Set(
        restEvents.flatMap((event) =>
          Array.from(
            { length: event.duration },
            (_, index) => event.at + index,
          ),
        ),
      ),
    };
  }, [example]);
  const hasMarkers = markerBySlot.size > 0;
  const viewportRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!showPlayhead || activeSlot === undefined) {
      return;
    }

    const viewport = viewportRef.current;
    const currentCell = viewport?.querySelector<HTMLElement>(
      ".practiceTab__count .practiceTab__cell.isCurrent",
    );

    if (!viewport || !currentCell) {
      return;
    }

    const viewportBounds = viewport.getBoundingClientRect();
    const cellBounds = currentCell.getBoundingClientRect();
    const safeInset = 64;
    const isOutsideTrackingArea =
      cellBounds.left < viewportBounds.left + safeInset ||
      cellBounds.right > viewportBounds.right - safeInset;

    if (isOutsideTrackingArea) {
      currentCell.scrollIntoView({
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "auto"
          : "smooth",
        block: "nearest",
        inline: "center",
      });
    }
  }, [activeSlot, showPlayhead]);

  return (
    <figure
      className={`practiceTab ${showPlayhead ? "hasPlayhead" : ""}`.trim()}
    >
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
            <dt>Grid</dt>
            <dd>{example.subdivision}</dd>
          </div>
          <div>
            <dt>Loop</dt>
            <dd>×{example.repetitions}</dd>
          </div>
        </dl>
        <output className="practiceTab__playbackStatus">
          <span>{showPlayhead ? "Current step" : "Ready"}</span>
          <strong>
            {showPlayhead && activeSlot !== undefined
              ? `${activeSlot + 1} / ${slots}`
              : `${slots} steps`}
          </strong>
        </output>
      </header>

      <section
        aria-label={`Scrollable guitar tablature. ${example.accessibleDescription}`}
        className="practiceTab__viewport"
        // biome-ignore lint/a11y/noNoninteractiveTabindex: Keyboard users need to reach and horizontally scroll this score on narrow screens.
        tabIndex={0}
        ref={viewportRef}
      >
        <div aria-hidden="true" className="practiceTab__score">
          {hasMarkers && (
            <GridRow
              className="practiceTab__annotations practiceTab__markers"
              currentSlot={activeSlot}
              label=""
              slots={slots}
              style={gridStyle}
              subdivision={example.subdivision}
            >
              {(slot) => markerBySlot.get(slot) ?? null}
            </GridRow>
          )}

          <GridRow
            className="practiceTab__annotations practiceTab__picking"
            currentSlot={activeSlot}
            label="Pick"
            slots={slots}
            style={gridStyle}
            subdivision={example.subdivision}
          >
            {(slot) => {
              const event = eventBySlot.get(slot);

              if (restSlots.has(slot)) {
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
              className="practiceTab__annotations practiceTab__palmMute"
              currentSlot={activeSlot}
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
                className="practiceTab__string"
                currentSlot={activeSlot}
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
            currentSlot={activeSlot}
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
        <span className="practiceTab__tuning">{tuning.label}</span>
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
