import type { PracticeRoutine, PracticeStep } from "@/data/practiceRoutines";
import {
  formatPracticeDurationAsClock,
  getPracticePositionSnapshot,
  type PracticeInstrument,
  type PracticeTransportStatus,
  practiceInstrumentOptions,
  practiceSubdivisionOptions,
} from "@/features/practice/session";
import type {
  PracticeTabExample,
  PracticeTabSubdivision,
} from "@/features/practice/tablature";
import PracticeTablature from "./PracticeTablature";

type PracticeSessionProps = {
  activeSlot: number;
  audioError: string | null;
  clickSubdivision: PracticeTabSubdivision;
  countInBeatsRemaining: number;
  countInEnabled: boolean;
  example: PracticeTabExample;
  instrument: PracticeInstrument;
  instrumentPlaybackEnabled: boolean;
  metronomeEnabled: boolean;
  metronomeVolume: number;
  onBack: () => void;
  onComplete: () => void;
  onInstrumentChange: (instrument: PracticeInstrument) => void;
  onMetronomeVolumeChange: (volume: number) => void;
  onPrimaryAction: () => void | Promise<void>;
  onSubdivisionChange: (subdivision: PracticeTabSubdivision) => void;
  onTempoChange: (tempo: number) => void;
  onToggleCountIn: () => void;
  onToggleInstrumentPlayback: () => void;
  onToggleMetronome: () => void;
  onVolumeChange: (volume: number) => void;
  routine: PracticeRoutine;
  step: PracticeStep;
  stepIndex: number;
  tempo: number;
  transportStatus: PracticeTransportStatus;
  volume: number;
};

const getPrimaryActionLabel = (status: PracticeTransportStatus) => {
  if (status === "playing" || status === "counting-in") {
    return "Pause";
  }

  if (status === "paused") {
    return "Resume";
  }

  return "Start exercise";
};

export default function PracticeSession({
  activeSlot,
  audioError,
  clickSubdivision,
  countInBeatsRemaining,
  countInEnabled,
  example,
  instrument,
  instrumentPlaybackEnabled,
  metronomeEnabled,
  metronomeVolume,
  onBack,
  onComplete,
  onInstrumentChange,
  onMetronomeVolumeChange,
  onPrimaryAction,
  onSubdivisionChange,
  onTempoChange,
  onToggleCountIn,
  onToggleInstrumentPlayback,
  onToggleMetronome,
  onVolumeChange,
  routine,
  step,
  stepIndex,
  tempo,
  transportStatus,
  volume,
}: PracticeSessionProps) {
  const position = getPracticePositionSnapshot(example, activeSlot);

  return (
    <div className="practiceSession">
      <header className="practiceSession__topbar">
        <button className="practiceTextButton" onClick={onBack} type="button">
          ← Practice Library
        </button>
        <span>
          {routine.tabLabel} · Exercise {stepIndex + 1} of{" "}
          {routine.steps.length}
        </span>
      </header>

      <div className="practiceSession__layout">
        <main className="practiceSession__main">
          <header className="practiceSession__intro">
            <div className="practiceSession__exerciseCopy">
              <span>{step.phase}</span>
              <h1 data-practice-screen-heading tabIndex={-1}>
                {step.title}
              </h1>
              <p>{step.instruction}</p>
            </div>
            <div className="practiceTransportAction">
              <button
                className="practicePrimaryAction"
                data-status={transportStatus}
                onClick={onPrimaryAction}
                type="button"
              >
                <span aria-hidden="true">
                  {transportStatus === "playing" ||
                  transportStatus === "counting-in"
                    ? "Ⅱ"
                    : "▶"}
                </span>
                {getPrimaryActionLabel(transportStatus)}
              </button>
              {transportStatus === "counting-in" && (
                <output aria-live="polite" className="practiceCountInStatus">
                  Count-in · {countInBeatsRemaining}
                </output>
              )}
              {audioError && (
                <p className="practiceAudioError" role="alert">
                  {audioError}
                </p>
              )}
            </div>
          </header>

          <PracticeTablature
            activeSlot={activeSlot}
            example={example}
            showPlayhead={transportStatus !== "idle"}
          />

          <section
            aria-label="Current playing position"
            className="positionReadout"
          >
            <div className="positionReadout__pattern">
              <span>Current pattern</span>
              <strong className="positionReadout__value" key={position.pattern}>
                {position.pattern}
              </strong>
            </div>
            {position.fret && (
              <div>
                <span>Position</span>
                <strong className="positionReadout__value" key={position.fret}>
                  <span aria-hidden="true" className="positionReadout__icon">
                    ⌖
                  </span>
                  {position.fret}
                </strong>
              </div>
            )}
            {position.direction && (
              <div>
                <span>Direction</span>
                <strong
                  className="positionReadout__value"
                  key={position.direction}
                >
                  <span aria-hidden="true" className="positionReadout__icon">
                    {position.direction === "Downstroke" ? "↓" : "↑"}
                  </span>
                  {position.direction}
                </strong>
              </div>
            )}
          </section>

          <div className="practiceSession__guidance">
            <p>
              <span>Pass when</span>
              {step.success}
            </p>
            <details>
              <summary>Technique note</summary>
              <p>{step.coach}</p>
            </details>
          </div>
        </main>

        <aside aria-label="Practice controls" className="sessionControls">
          <section className="sessionControls__time">
            <span>Exercise time remaining</span>
            <strong>{formatPracticeDurationAsClock(step.duration)}</strong>
            <small>Default exercise window</small>
          </section>

          <section className="sessionControlGroup">
            <label htmlFor="practice-tempo">Tempo · BPM</label>
            <div className="tempoControl">
              <button
                aria-label="Decrease tempo by 5 BPM"
                onClick={() => onTempoChange(tempo - 5)}
                type="button"
              >
                −
              </button>
              <output id="practice-tempo">{tempo}</output>
              <button
                aria-label="Increase tempo by 5 BPM"
                onClick={() => onTempoChange(tempo + 5)}
                type="button"
              >
                +
              </button>
            </div>
          </section>

          <section className="sessionControlGroup">
            <label htmlFor="practice-subdivision">Click subdivision</label>
            <select
              id="practice-subdivision"
              onChange={(event) =>
                onSubdivisionChange(
                  event.target.value as PracticeTabSubdivision,
                )
              }
              value={clickSubdivision}
            >
              {practiceSubdivisionOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </section>

          <div className="sessionToggles">
            <button
              aria-pressed={countInEnabled}
              onClick={onToggleCountIn}
              type="button"
            >
              <span>Count-in</span>
              <strong>{countInEnabled ? "On" : "Off"}</strong>
            </button>
            <button
              aria-pressed={metronomeEnabled}
              onClick={onToggleMetronome}
              type="button"
            >
              <span>Metronome</span>
              <strong>{metronomeEnabled ? "On" : "Off"}</strong>
            </button>
            <button
              aria-pressed={instrumentPlaybackEnabled}
              onClick={onToggleInstrumentPlayback}
              type="button"
            >
              <span>Instrument playback</span>
              <strong>{instrumentPlaybackEnabled ? "On" : "Off"}</strong>
            </button>
          </div>

          <div className="volumeControl">
            <label htmlFor="practice-metronome-volume">
              Click volume <span>{metronomeVolume}%</span>
            </label>
            <input
              id="practice-metronome-volume"
              max="100"
              min="0"
              onChange={(event) =>
                onMetronomeVolumeChange(Number(event.target.value))
              }
              type="range"
              value={metronomeVolume}
            />
          </div>

          {instrumentPlaybackEnabled && (
            <div className="sessionInstrumentSettings">
              <div className="sessionControlGroup">
                <label htmlFor="practice-instrument">Instrument</label>
                <select
                  id="practice-instrument"
                  onChange={(event) =>
                    onInstrumentChange(event.target.value as PracticeInstrument)
                  }
                  value={instrument}
                >
                  {practiceInstrumentOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="volumeControl">
                <label htmlFor="practice-volume">
                  Instrument volume <span>{volume}%</span>
                </label>
                <input
                  id="practice-volume"
                  max="100"
                  min="0"
                  onChange={(event) =>
                    onVolumeChange(Number(event.target.value))
                  }
                  type="range"
                  value={volume}
                />
              </div>
            </div>
          )}

          <button
            className="practiceCompleteAction"
            onClick={onComplete}
            type="button"
          >
            Complete exercise
          </button>
        </aside>
      </div>
    </div>
  );
}
