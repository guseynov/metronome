import { useEffect, useRef, useState } from "react";
import click1 from "./sounds/click1.wav";
import click2 from "./sounds/click2.wav";

function createClickAudio(source) {
  const audio = new Audio(source);
  audio.preload = "auto";
  return audio;
}

function resetAudio(audio) {
  if (!audio) {
    return;
  }

  audio.pause();
  audio.currentTime = 0;
}

export function useMetronomePlayback({ bpm, beatsPerMeasure }) {
  const regularClickRef = useRef(null);
  const accentClickRef = useRef(null);
  const timeoutRef = useRef(null);
  const currentBeatRef = useRef(0);
  const playingRef = useRef(false);
  const bpmRef = useRef(bpm);
  const beatsPerMeasureRef = useRef(beatsPerMeasure);

  const [isPlaying, setIsPlaying] = useState(false);
  const [activeBeat, setActiveBeat] = useState(null);
  const [lastBeatType, setLastBeatType] = useState("accent");
  const [pulseTick, setPulseTick] = useState(0);

  const clearPlaybackTimer = () => {
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  const playSound = (isAccent) => {
    const audio = isAccent ? accentClickRef.current : regularClickRef.current;

    if (!audio) {
      return;
    }

    audio.currentTime = 0;
    const playback = audio.play();

    if (playback?.catch) {
      playback.catch(() => {});
    }
  };

  const scheduleNextBeat = () => {
    clearPlaybackTimer();

    if (!playingRef.current) {
      return;
    }

    timeoutRef.current = window.setTimeout(() => {
      const beatIndex = currentBeatRef.current;
      const isAccent = beatIndex === 0;
      const nextBeat = (beatIndex + 1) % beatsPerMeasureRef.current;

      setActiveBeat(beatIndex);
      setLastBeatType(isAccent ? "accent" : "regular");
      setPulseTick((currentValue) => currentValue + 1);
      playSound(isAccent);

      currentBeatRef.current = nextBeat;
      scheduleNextBeat();
    }, 60000 / bpmRef.current);
  };

  const restartPlayback = () => {
    clearPlaybackTimer();
    currentBeatRef.current = 0;
    setActiveBeat(0);
    setLastBeatType("accent");
    setPulseTick((currentValue) => currentValue + 1);
    playSound(true);

    currentBeatRef.current = 1 % beatsPerMeasureRef.current;
    scheduleNextBeat();
  };

  const stopPlayback = () => {
    if (!playingRef.current && !timeoutRef.current) {
      return;
    }

    playingRef.current = false;
    setIsPlaying(false);
    setActiveBeat(null);
    clearPlaybackTimer();
    resetAudio(regularClickRef.current);
    resetAudio(accentClickRef.current);
  };

  const startPlayback = () => {
    if (playingRef.current) {
      return;
    }

    playingRef.current = true;
    setIsPlaying(true);
    restartPlayback();
  };

  useEffect(() => {
    bpmRef.current = bpm;
  }, [bpm]);

  useEffect(() => {
    beatsPerMeasureRef.current = beatsPerMeasure;

    if (currentBeatRef.current >= beatsPerMeasure) {
      currentBeatRef.current = 0;
      setActiveBeat(playingRef.current ? 0 : null);
    }

    if (playingRef.current) {
      restartPlayback();
    }
  }, [beatsPerMeasure]);

  useEffect(() => {
    regularClickRef.current = createClickAudio(click1);
    accentClickRef.current = createClickAudio(click2);

    return () => {
      playingRef.current = false;
      clearPlaybackTimer();
      resetAudio(regularClickRef.current);
      resetAudio(accentClickRef.current);
    };
  }, []);

  useEffect(() => {
    if (!playingRef.current) {
      return;
    }

    scheduleNextBeat();
  }, [bpm]);

  const togglePlayback = () => {
    if (playingRef.current) {
      stopPlayback();
      return;
    }

    startPlayback();
  };

  return {
    activeBeat,
    isPlaying,
    lastBeatType,
    pulseTick,
    togglePlayback,
  };
}
