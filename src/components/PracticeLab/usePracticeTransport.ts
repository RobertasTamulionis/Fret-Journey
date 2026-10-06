"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  type PracticeMetronomeConfig,
  PracticeMetronomeEngine,
  type PracticeTransportSnapshot,
} from "@/features/practice/audio/PracticeMetronomeEngine";

type UsePracticeTransportOptions = PracticeMetronomeConfig & {
  countInBeats: number;
};

const initialSnapshot: PracticeTransportSnapshot = {
  activeEventIndex: 0,
  authoredSlot: 0,
  countInBeatsRemaining: 0,
  elapsedExerciseSeconds: 0,
  exerciseBeat: 0,
  phase: "idle",
};

const snapshotsMatchForPresentation = (
  current: PracticeTransportSnapshot,
  next: PracticeTransportSnapshot,
): boolean =>
  current.activeEventIndex === next.activeEventIndex &&
  current.authoredSlot === next.authoredSlot &&
  current.countInBeatsRemaining === next.countInBeatsRemaining &&
  Math.floor(current.elapsedExerciseSeconds) ===
    Math.floor(next.elapsedExerciseSeconds) &&
  current.phase === next.phase;

export default function usePracticeTransport({
  authoredScore,
  clickSubdivision,
  countInBeats,
  countInEnabled,
  metronomeEnabled,
  tempo,
  volume,
}: UsePracticeTransportOptions) {
  const engineRef = useRef<PracticeMetronomeEngine | null>(null);
  const mountedRef = useRef(false);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [snapshot, setSnapshot] =
    useState<PracticeTransportSnapshot>(initialSnapshot);
  const config = useMemo<PracticeMetronomeConfig>(
    () => ({
      authoredScore,
      clickSubdivision,
      countInEnabled,
      metronomeEnabled,
      tempo,
      volume,
    }),
    [
      authoredScore,
      clickSubdivision,
      countInEnabled,
      metronomeEnabled,
      tempo,
      volume,
    ],
  );
  const initialConfigRef = useRef(config);

  const sampleSnapshot = useCallback(() => {
    if (!mountedRef.current) {
      return;
    }

    const next = engineRef.current?.getSnapshot() ?? initialSnapshot;
    setSnapshot((current) =>
      snapshotsMatchForPresentation(current, next) ? current : next,
    );
  }, []);

  useEffect(() => {
    const engine = new PracticeMetronomeEngine(initialConfigRef.current);
    mountedRef.current = true;
    engineRef.current = engine;

    return () => {
      mountedRef.current = false;

      if (engineRef.current === engine) {
        engineRef.current = null;
      }

      void engine.dispose();
    };
  }, []);

  useEffect(() => {
    engineRef.current?.configure(config);
  }, [config]);

  useEffect(() => {
    if (snapshot.phase !== "counting-in" && snapshot.phase !== "playing") {
      return;
    }

    let animationFrameId: number;

    const sampleFrame = () => {
      sampleSnapshot();
      animationFrameId = window.requestAnimationFrame(sampleFrame);
    };

    animationFrameId = window.requestAnimationFrame(sampleFrame);

    return () => window.cancelAnimationFrame(animationFrameId);
  }, [sampleSnapshot, snapshot.phase]);

  const configure = useCallback((nextConfig: PracticeMetronomeConfig) => {
    engineRef.current?.configure(nextConfig);
  }, []);

  const start = useCallback(async () => {
    try {
      setAudioError(null);
      await engineRef.current?.start({ countInBeats, fromExerciseBeat: 0 });
      sampleSnapshot();
    } catch (error) {
      if (!mountedRef.current) {
        return;
      }

      setAudioError(
        error instanceof Error
          ? error.message
          : "Practice audio could not start.",
      );
      sampleSnapshot();
    }
  }, [countInBeats, sampleSnapshot]);

  const pause = useCallback(() => {
    engineRef.current?.pause();
    sampleSnapshot();
  }, [sampleSnapshot]);

  const resume = useCallback(async () => {
    try {
      setAudioError(null);
      await engineRef.current?.resume({ countInBeats });
      sampleSnapshot();
    } catch (error) {
      if (!mountedRef.current) {
        return;
      }

      setAudioError(
        error instanceof Error
          ? error.message
          : "Practice audio could not resume.",
      );
      sampleSnapshot();
    }
  }, [countInBeats, sampleSnapshot]);

  const stop = useCallback(() => {
    engineRef.current?.stop();
    setAudioError(null);
    setSnapshot(initialSnapshot);
  }, []);

  return {
    audioError,
    configure,
    pause,
    resume,
    snapshot,
    start,
    stop,
  };
}
