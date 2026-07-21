export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function getTempoValidationMessage(
  value: string,
  minBpm: number,
  maxBpm: number,
): string {
  if (value.trim() === "") {
    return `Enter a tempo from ${minBpm} to ${maxBpm} BPM.`;
  }

  const numericValue = Number(value);

  if (!Number.isFinite(numericValue) || !Number.isInteger(numericValue)) {
    return "Enter a whole number of beats per minute.";
  }

  if (numericValue < minBpm || numericValue > maxBpm) {
    return `Tempo must be from ${minBpm} to ${maxBpm} BPM.`;
  }

  return "";
}

export function parseTempo(
  value: string,
  minBpm: number,
  maxBpm: number,
): number | null {
  return getTempoValidationMessage(value, minBpm, maxBpm)
    ? null
    : Number(value);
}

export function getTappedTempo(
  tapTimes: readonly number[],
  minBpm: number,
  maxBpm: number,
): number | null {
  if (tapTimes.length < 2) {
    return null;
  }

  const intervals: number[] = [];

  for (let index = 1; index < tapTimes.length; index += 1) {
    const currentTap = tapTimes[index];
    const previousTap = tapTimes[index - 1];

    if (currentTap !== undefined && previousTap !== undefined) {
      intervals.push(currentTap - previousTap);
    }
  }

  if (intervals.length === 0) {
    return null;
  }
  const averageInterval =
    intervals.reduce((total, interval) => total + interval, 0) /
    intervals.length;

  if (!Number.isFinite(averageInterval) || averageInterval <= 0) {
    return null;
  }

  return clamp(Math.round(60000 / averageInterval), minBpm, maxBpm);
}
