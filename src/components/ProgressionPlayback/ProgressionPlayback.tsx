"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { guitarPresets } from "@/features/audio/guitarPresets";
import type { GuitarPresetId } from "@/features/audio/types";
import {
  type ProgressionAudioPlan,
  type ProgressionPlaybackConfig,
  ProgressionPlaybackEngine,
  type ProgressionPlaybackSnapshot,
} from "@/features/progression-audio";
import "./progressionPlayback.scss";
import Select from "@/components/ui/Select/Select";

type Props = {
  onActiveStepChange: (index: number) => void;
  onSnapshotChange?: (snapshot: ProgressionPlaybackSnapshot) => void;
  plan: ProgressionAudioPlan;
};

const initialSnapshot: ProgressionPlaybackSnapshot = {
  activeStepIndex: null,
  beat: 0,
  error: null,
  instrumentStatus: "idle",
  phase: "idle",
};

export default function ProgressionPlayback({
  onActiveStepChange,
  onSnapshotChange,
  plan,
}: Props) {
  const [bpm, setBpm] = useState(90);
  const [loop, setLoop] = useState(true);
  const [preset, setPreset] = useState<GuitarPresetId>("clean-electric");
  const [volume, setVolume] = useState(72);
  const [snapshot, setSnapshot] = useState(initialSnapshot);
  const [activationError, setActivationError] = useState<string | null>(null);
  const engineRef = useRef<ProgressionPlaybackEngine | null>(null);
  const mountedRef = useRef(false);
  const lastStepRef = useRef<number | null>(null);
  const presentedSnapshotRef = useRef(initialSnapshot);
  const config = useMemo<ProgressionPlaybackConfig>(
    () => ({ bpm, loop, plan, preset, volume }),
    [bpm, loop, plan, preset, volume],
  );
  const initialConfig = useRef(config);

  const sample = useCallback(() => {
    if (!mountedRef.current) return;
    const next = engineRef.current?.getSnapshot() ?? initialSnapshot;
    const current = presentedSnapshotRef.current;
    const presentationChanged =
      current.activeStepIndex !== next.activeStepIndex ||
      current.error !== next.error ||
      current.instrumentStatus !== next.instrumentStatus ||
      current.phase !== next.phase;
    if (presentationChanged) {
      presentedSnapshotRef.current = next;
      setSnapshot(next);
      onSnapshotChange?.(next);
    }
    if (
      next.activeStepIndex !== null &&
      next.activeStepIndex !== lastStepRef.current
    ) {
      lastStepRef.current = next.activeStepIndex;
      onActiveStepChange(next.activeStepIndex);
    }
  }, [onActiveStepChange, onSnapshotChange]);

  useEffect(() => {
    const engine = new ProgressionPlaybackEngine(initialConfig.current);
    mountedRef.current = true;
    engineRef.current = engine;
    return () => {
      mountedRef.current = false;
      if (engineRef.current === engine) engineRef.current = null;
      void engine.dispose();
    };
  }, []);

  useEffect(() => {
    engineRef.current?.configure(config);
    sample();
  }, [config, sample]);

  useEffect(() => {
    if (snapshot.phase !== "playing") return;
    let id = 0;
    const frame = () => {
      sample();
      id = window.requestAnimationFrame(frame);
    };
    id = window.requestAnimationFrame(frame);
    return () => window.cancelAnimationFrame(id);
  }, [sample, snapshot.phase]);

  const activate = async (action: "resume" | "start") => {
    try {
      setActivationError(null);
      await engineRef.current?.[action]();
      sample();
    } catch (error) {
      if (!mountedRef.current) return;
      setActivationError(
        error instanceof Error
          ? error.message
          : "Progression audio could not start.",
      );
      sample();
    }
  };
  const stop = () => {
    engineRef.current?.stop();
    lastStepRef.current = null;
    setActivationError(null);
    sample();
  };
  const status =
    activationError ?? snapshot.error ?? (!plan.available ? plan.reason : null);

  return (
    <section aria-label="Progression playback" className="progressionPlayback">
      <div className="progressionPlayback__transport">
        {snapshot.phase === "playing" ? (
          <button
            onClick={() => {
              engineRef.current?.pause();
              sample();
            }}
            type="button"
          >
            Pause
          </button>
        ) : (
          <button
            disabled={!plan.available}
            onClick={() =>
              void activate(snapshot.phase === "paused" ? "resume" : "start")
            }
            type="button"
          >
            {snapshot.phase === "paused" ? "Resume" : "Play"}
          </button>
        )}
        <button
          disabled={snapshot.phase === "idle"}
          onClick={stop}
          type="button"
        >
          Stop
        </button>
        <button
          aria-pressed={loop}
          onClick={() => setLoop((value) => !value)}
          type="button"
        >
          Loop
        </button>
      </div>
      <label>
        BPM
        <input
          aria-label="Progression tempo in beats per minute"
          max={240}
          min={30}
          onChange={(event) => setBpm(Number(event.target.value))}
          type="number"
          value={bpm}
        />
      </label>
      <Select
        label="Guitar sound"
        onChange={(next) => setPreset(next as GuitarPresetId)}
        options={Object.values(guitarPresets).map((option) => ({
          value: option.id,
          label: option.label,
        }))}
        value={preset}
      />
      <label className="progressionPlayback__volume">
        Volume <span>{volume}%</span>
        <input
          aria-label="Progression guitar volume"
          max={100}
          min={0}
          onChange={(event) => setVolume(Number(event.target.value))}
          type="range"
          value={volume}
        />
      </label>
      <p aria-live="polite" className="progressionPlayback__status">
        {status ??
          (snapshot.instrumentStatus === "loading"
            ? `Loading ${guitarPresets[preset].label}…`
            : snapshot.instrumentStatus === "ready"
              ? `${guitarPresets[preset].label} ready`
              : "Choose Play to load the selected guitar.")}
      </p>
    </section>
  );
}
