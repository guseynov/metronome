import { useCallback, useEffect, useRef, useState } from "react";
import click1 from "./sounds/click1.wav";
import click2 from "./sounds/click2.wav";

const LOOKAHEAD_INTERVAL_MS = 25;
const SCHEDULE_AHEAD_SECONDS = 0.12;
const START_DELAY_SECONDS = 0.025;
// Let the arm visibly settle for one display frame before the escapement click.
const ENDPOINT_SETTLE_MS = 16;
const MAX_CATCH_UP_BEATS = 32;

function getAudioContextClass() {
  return window.AudioContext || window.webkitAudioContext;
}

async function decodeAudioBuffer(context, source) {
  const response = await fetch(source);

  if (!response.ok) {
    throw new Error(`Unable to load metronome sound: ${response.status}`);
  }

  return context.decodeAudioData(await response.arrayBuffer());
}

export function useMetronomePlayback({ bpm, beatsPerMeasure }) {
  const audioContextRef = useRef(null);
  const audioBuffersPromiseRef = useRef(null);
  const schedulerIntervalRef = useRef(null);
  const scheduledSourcesRef = useRef(new Map());
  const visualTimersRef = useRef(new Set());
  const currentBeatRef = useRef(0);
  const nextBeatTimeRef = useRef(0);
  const playingRef = useRef(false);
  const startingRef = useRef(false);
  const bpmRef = useRef(bpm);
  const beatsPerMeasureRef = useRef(beatsPerMeasure);
  const scheduleGenerationRef = useRef(0);

  const [isPlaying, setIsPlaying] = useState(false);
  const [activeBeat, setActiveBeat] = useState(null);
  const [lastBeatType, setLastBeatType] = useState("accent");
  const [pulseTick, setPulseTick] = useState(0);
  const [pendulumDurationMs, setPendulumDurationMs] = useState(500);
  const [playbackError, setPlaybackError] = useState(null);

  const getSecondsPerBeat = () => 60 / bpmRef.current;

  const clearScheduler = () => {
    if (schedulerIntervalRef.current !== null) {
      window.clearInterval(schedulerIntervalRef.current);
      schedulerIntervalRef.current = null;
    }
  };

  const clearVisualTimers = () => {
    visualTimersRef.current.forEach((timerId) => window.clearTimeout(timerId));
    visualTimersRef.current.clear();
  };

  const stopScheduledSources = ({ includePlaying = false } = {}) => {
    const context = audioContextRef.current;
    const now = context?.currentTime ?? 0;

    scheduledSourcesRef.current.forEach((scheduledTime, source) => {
      if (!includePlaying && scheduledTime <= now + 0.005) {
        return;
      }

      try {
        source.stop();
      } catch {
        // A source may already have ended between the time check and stop call.
      }

      scheduledSourcesRef.current.delete(source);
    });
  };

  const cancelPendingBeats = ({ includePlaying = false } = {}) => {
    scheduleGenerationRef.current += 1;
    clearScheduler();
    clearVisualTimers();
    stopScheduledSources({ includePlaying });
  };

  const ensureAudioReady = async () => {
    let context = audioContextRef.current;

    if (!context) {
      const AudioContextClass = getAudioContextClass();

      if (!AudioContextClass) {
        throw new Error("Web Audio is not supported in this browser.");
      }

      context = new AudioContextClass({ latencyHint: "interactive" });
      audioContextRef.current = context;
      audioBuffersPromiseRef.current = Promise.all([
        decodeAudioBuffer(context, click1),
        decodeAudioBuffer(context, click2),
      ]).then(([regular, accent]) => ({ regular, accent }));
    }

    if (context.state !== "running" && context.state !== "closed") {
      await context.resume();
    }

    if (context.state !== "running") {
      throw new Error("Audio playback could not be started.");
    }

    const buffers = await audioBuffersPromiseRef.current;
    return { buffers, context };
  };

  const startPendulumTravel = (travelSeconds) => {
    setPendulumDurationMs(
      Math.max(80, travelSeconds * 1000 - ENDPOINT_SETTLE_MS),
    );
    setPulseTick((currentValue) => currentValue + 1);
  };

  const updateVisualBeat = (beatIndex, isAccent) => {
    setActiveBeat(beatIndex);
    setLastBeatType(isAccent ? "accent" : "regular");
    startPendulumTravel(getSecondsPerBeat());
  };

  const scheduleVisualBeat = (context, beatIndex, isAccent, scheduledTime) => {
    const generation = scheduleGenerationRef.current;
    const delay = Math.max(0, (scheduledTime - context.currentTime) * 1000);
    let timerId = null;

    timerId = window.setTimeout(() => {
      visualTimersRef.current.delete(timerId);

      if (
        !playingRef.current ||
        generation !== scheduleGenerationRef.current
      ) {
        return;
      }

      updateVisualBeat(beatIndex, isAccent);
    }, delay);

    visualTimersRef.current.add(timerId);
  };

  const scheduleBeat = (context, buffers, beatIndex, scheduledTime) => {
    const isAccent = beatIndex === 0;
    const source = context.createBufferSource();
    source.buffer = isAccent ? buffers.accent : buffers.regular;
    source.connect(context.destination);
    scheduledSourcesRef.current.set(source, scheduledTime);
    source.addEventListener(
      "ended",
      () => scheduledSourcesRef.current.delete(source),
      { once: true },
    );
    source.start(scheduledTime);
    scheduleVisualBeat(context, beatIndex, isAccent, scheduledTime);
  };

  const scheduleWindow = () => {
    const context = audioContextRef.current;

    if (!playingRef.current || !context || context.state !== "running") {
      return;
    }

    const secondsPerBeat = getSecondsPerBeat();

    if (nextBeatTimeRef.current < context.currentTime - secondsPerBeat) {
      const missedBeats = Math.min(
        MAX_CATCH_UP_BEATS,
        Math.floor(
          (context.currentTime - nextBeatTimeRef.current) / secondsPerBeat,
        ) + 1,
      );

      currentBeatRef.current =
        (currentBeatRef.current + missedBeats) % beatsPerMeasureRef.current;
      nextBeatTimeRef.current += missedBeats * secondsPerBeat;

      if (nextBeatTimeRef.current < context.currentTime) {
        nextBeatTimeRef.current = context.currentTime + START_DELAY_SECONDS;
      }
    }

    audioBuffersPromiseRef.current?.then((buffers) => {
      while (
        playingRef.current &&
        nextBeatTimeRef.current <
          context.currentTime + SCHEDULE_AHEAD_SECONDS
      ) {
        const beatIndex = currentBeatRef.current;
        scheduleBeat(context, buffers, beatIndex, nextBeatTimeRef.current);
        currentBeatRef.current =
          (beatIndex + 1) % beatsPerMeasureRef.current;
        nextBeatTimeRef.current += getSecondsPerBeat();
      }
    });
  };

  const startScheduler = () => {
    clearScheduler();
    scheduleWindow();
    schedulerIntervalRef.current = window.setInterval(
      scheduleWindow,
      LOOKAHEAD_INTERVAL_MS,
    );
  };

  const scheduleFirstBeat = (context, buffers) => {
    const firstTravelSeconds = START_DELAY_SECONDS + getSecondsPerBeat() / 2;
    const firstBeatTime = context.currentTime + firstTravelSeconds;
    currentBeatRef.current = 0;
    startPendulumTravel(firstTravelSeconds);
    scheduleBeat(context, buffers, 0, firstBeatTime);
    currentBeatRef.current = 1 % beatsPerMeasureRef.current;
    nextBeatTimeRef.current = firstBeatTime + getSecondsPerBeat();
  };

  const reschedulePlayback = ({ restartMeasure }) => {
    const context = audioContextRef.current;

    if (!playingRef.current || !context || context.state !== "running") {
      return;
    }

    cancelPendingBeats({ includePlaying: restartMeasure });

    audioBuffersPromiseRef.current?.then((buffers) => {
      if (!playingRef.current) {
        return;
      }

      if (restartMeasure) {
        scheduleFirstBeat(context, buffers);
      } else {
        const travelSeconds = getSecondsPerBeat();
        nextBeatTimeRef.current = context.currentTime + travelSeconds;
        startPendulumTravel(travelSeconds);
      }

      startScheduler();
    });
  };

  const stopPlayback = () => {
    if (!playingRef.current && !startingRef.current) {
      return;
    }

    startingRef.current = false;
    playingRef.current = false;
    setIsPlaying(false);
    setActiveBeat(null);
    cancelPendingBeats({ includePlaying: true });
  };

  const startPlayback = async () => {
    if (playingRef.current || startingRef.current) {
      return;
    }

    startingRef.current = true;
    setPlaybackError(null);

    try {
      const { buffers, context } = await ensureAudioReady();

      if (!startingRef.current) {
        return;
      }

      scheduleGenerationRef.current += 1;
      playingRef.current = true;
      startingRef.current = false;
      setIsPlaying(true);
      scheduleFirstBeat(context, buffers);
      startScheduler();
    } catch (error) {
      startingRef.current = false;
      playingRef.current = false;
      setIsPlaying(false);
      setActiveBeat(null);
      setPlaybackError(
        error instanceof Error ? error.message : "Audio playback failed.",
      );
    }
  };

  useEffect(() => {
    bpmRef.current = bpm;

    if (playingRef.current) {
      reschedulePlayback({ restartMeasure: false });
    }
  }, [bpm]);

  useEffect(() => {
    beatsPerMeasureRef.current = beatsPerMeasure;

    if (playingRef.current) {
      reschedulePlayback({ restartMeasure: true });
    }
  }, [beatsPerMeasure]);

  useEffect(() => {
    return () => {
      playingRef.current = false;
      startingRef.current = false;
      cancelPendingBeats({ includePlaying: true });

      const context = audioContextRef.current;
      audioContextRef.current = null;

      if (context && context.state !== "closed") {
        context.close().catch(() => {});
      }
    };
  }, []);

  const togglePlayback = useCallback(() => {
    if (playingRef.current || startingRef.current) {
      stopPlayback();
      return;
    }

    void startPlayback();
  }, []);

  return {
    activeBeat,
    isPlaying,
    lastBeatType,
    playbackError,
    pendulumDurationMs,
    pulseTick,
    togglePlayback,
  };
}
