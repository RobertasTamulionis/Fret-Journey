import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";
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
import {
  type FretJourneyMotionCustom,
  getMotionTransition,
  motionDurations,
  practiceCountInVariants,
  practiceDisclosureVariants,
  practiceRevealContainerVariants,
  practiceRevealVariants,
  practiceSwapVariants,
} from "@/lib/motion";
import PracticeDisclosure from "./PracticeDisclosure";
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

type AnimatedReadoutValueProps = {
  children: ReactNode;
  motionCustom: FretJourneyMotionCustom;
  value: string;
};

function AnimatedReadoutValue({
  children,
  motionCustom,
  value,
}: AnimatedReadoutValueProps) {
  return (
    <AnimatePresence initial={false} mode="popLayout">
      <motion.strong
        animate="animate"
        aria-hidden="true"
        className="positionReadout__value"
        custom={motionCustom}
        exit="exit"
        initial="initial"
        key={value}
        variants={practiceSwapVariants}
      >
        {children}
      </motion.strong>
    </AnimatePresence>
  );
}

type PracticeToggleProps = {
  label: string;
  motionCustom: FretJourneyMotionCustom;
  onToggle: () => void;
  pressed: boolean;
};

function PracticeToggle({
  label,
  motionCustom,
  onToggle,
  pressed,
}: PracticeToggleProps) {
  return (
    <motion.button
      aria-pressed={pressed}
      onClick={onToggle}
      transition={getMotionTransition(
        motionCustom.reducedMotion,
        motionDurations.fast,
      )}
      type="button"
      whileTap={motionCustom.reducedMotion ? undefined : { scale: 0.985 }}
    >
      <span>{label}</span>
      <AnimatePresence initial={false} mode="popLayout">
        <motion.strong
          animate="animate"
          aria-hidden="true"
          custom={motionCustom}
          exit="exit"
          initial="initial"
          key={pressed ? "on" : "off"}
          variants={practiceSwapVariants}
        >
          {pressed ? "On" : "Off"}
        </motion.strong>
      </AnimatePresence>
    </motion.button>
  );
}

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
  const primaryActionLabel = getPrimaryActionLabel(transportStatus);
  const primaryActionIcon =
    transportStatus === "playing" || transportStatus === "counting-in"
      ? "Ⅱ"
      : "▶";
  const motionCustom: FretJourneyMotionCustom = {
    reducedMotion: Boolean(useReducedMotion()),
  };

  return (
    <motion.div
      animate="visible"
      className="practiceSession"
      custom={motionCustom}
      initial="hidden"
      variants={practiceRevealContainerVariants}
    >
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
          <motion.header
            className="practiceSession__intro"
            custom={motionCustom}
            variants={practiceRevealVariants}
          >
            <div className="practiceSession__exerciseCopy">
              <span>{step.phase}</span>
              <h1 data-practice-screen-heading tabIndex={-1}>
                {step.title}
              </h1>
              <p>{step.instruction}</p>
            </div>
            <div className="practiceTransportAction">
              <button
                aria-label={primaryActionLabel}
                className="practicePrimaryAction"
                data-status={transportStatus}
                onClick={onPrimaryAction}
                type="button"
              >
                <AnimatePresence initial={false} mode="popLayout">
                  <motion.span
                    animate="animate"
                    aria-hidden="true"
                    className="practicePrimaryAction__content"
                    custom={motionCustom}
                    exit="exit"
                    initial="initial"
                    key={primaryActionLabel}
                    variants={practiceSwapVariants}
                  >
                    <span
                      aria-hidden="true"
                      className="practicePrimaryAction__icon"
                    >
                      {primaryActionIcon}
                    </span>
                    <span>{primaryActionLabel}</span>
                  </motion.span>
                </AnimatePresence>
              </button>
              <AnimatePresence initial={false}>
                {transportStatus === "counting-in" && (
                  <motion.output
                    animate="animate"
                    aria-live="polite"
                    className="practiceCountInStatus"
                    custom={motionCustom}
                    exit="exit"
                    initial="initial"
                    key="count-in"
                    variants={practiceSwapVariants}
                  >
                    <span className="practiceVisuallyHidden">
                      Count-in {countInBeatsRemaining}
                    </span>
                    <span aria-hidden="true">
                      Count-in ·{" "}
                      <AnimatePresence initial={false} mode="popLayout">
                        <motion.strong
                          animate="animate"
                          custom={motionCustom}
                          exit="exit"
                          initial="initial"
                          key={countInBeatsRemaining}
                          variants={practiceCountInVariants}
                        >
                          {countInBeatsRemaining}
                        </motion.strong>
                      </AnimatePresence>
                    </span>
                  </motion.output>
                )}
              </AnimatePresence>
              <AnimatePresence initial={false}>
                {audioError && (
                  <motion.p
                    animate="animate"
                    className="practiceAudioError"
                    custom={motionCustom}
                    exit="exit"
                    initial="initial"
                    key="audio-error"
                    role="alert"
                    variants={practiceSwapVariants}
                  >
                    {audioError}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
          </motion.header>

          <motion.div custom={motionCustom} variants={practiceRevealVariants}>
            <PracticeTablature
              activeSlot={activeSlot}
              example={example}
              showPlayhead={transportStatus !== "idle"}
            />
          </motion.div>

          <motion.section
            aria-label="Current playing position"
            className="positionReadout"
            custom={motionCustom}
            variants={practiceRevealVariants}
          >
            <div className="positionReadout__pattern">
              <span className="practiceVisuallyHidden">
                Current pattern: {position.pattern}
              </span>
              <span aria-hidden="true">Current pattern</span>
              <AnimatedReadoutValue
                motionCustom={motionCustom}
                value={position.pattern}
              >
                {position.pattern}
              </AnimatedReadoutValue>
            </div>
            {position.fret && (
              <div>
                <span className="practiceVisuallyHidden">
                  Position: {position.fret}
                </span>
                <span aria-hidden="true">Position</span>
                <AnimatedReadoutValue
                  motionCustom={motionCustom}
                  value={position.fret}
                >
                  <span aria-hidden="true" className="positionReadout__icon">
                    ⌖
                  </span>
                  {position.fret}
                </AnimatedReadoutValue>
              </div>
            )}
            {position.direction && (
              <div>
                <span className="practiceVisuallyHidden">
                  Direction: {position.direction}
                </span>
                <span aria-hidden="true">Direction</span>
                <AnimatedReadoutValue
                  motionCustom={motionCustom}
                  value={position.direction}
                >
                  <span aria-hidden="true" className="positionReadout__icon">
                    {position.direction === "Downstroke" ? "↓" : "↑"}
                  </span>
                  {position.direction}
                </AnimatedReadoutValue>
              </div>
            )}
          </motion.section>

          <motion.div
            className="practiceSession__guidance"
            custom={motionCustom}
            variants={practiceRevealVariants}
          >
            <p>
              <span>Pass when</span>
              {step.success}
            </p>
            <PracticeDisclosure label="Technique note">
              <p>{step.coach}</p>
            </PracticeDisclosure>
          </motion.div>
        </main>

        <motion.aside
          aria-label="Practice controls"
          className="sessionControls"
          custom={motionCustom}
          variants={practiceRevealVariants}
        >
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
            <PracticeToggle
              label="Count-in"
              motionCustom={motionCustom}
              onToggle={onToggleCountIn}
              pressed={countInEnabled}
            />
            <PracticeToggle
              label="Metronome"
              motionCustom={motionCustom}
              onToggle={onToggleMetronome}
              pressed={metronomeEnabled}
            />
            <PracticeToggle
              label="Instrument playback"
              motionCustom={motionCustom}
              onToggle={onToggleInstrumentPlayback}
              pressed={instrumentPlaybackEnabled}
            />
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

          <AnimatePresence initial={false}>
            {instrumentPlaybackEnabled && (
              <motion.div
                animate="animate"
                className="sessionInstrumentSettings"
                custom={motionCustom}
                exit="exit"
                initial="initial"
                key="instrument-settings"
                variants={practiceDisclosureVariants}
              >
                <div className="sessionControlGroup">
                  <label htmlFor="practice-instrument">Instrument</label>
                  <select
                    id="practice-instrument"
                    onChange={(event) =>
                      onInstrumentChange(
                        event.target.value as PracticeInstrument,
                      )
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
              </motion.div>
            )}
          </AnimatePresence>

          <button
            className="practiceCompleteAction"
            onClick={onComplete}
            type="button"
          >
            Complete exercise
          </button>
        </motion.aside>
      </div>
    </motion.div>
  );
}
