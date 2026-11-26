import { BeatItem, ExpressionItem } from "../types/story";

export function countEnglishWords(text: string): number {
  const cleaned = text.trim();
  if (!cleaned) return 0;
  return cleaned.split(/\s+/).filter(Boolean).length;
}

export function countTotalBeatWords(beats: BeatItem[]): number {
  return beats.reduce((sum, beat) => sum + countEnglishWords(beat.englishLine), 0);
}

export function findExactMatchedExpressions(
  text: string,
  expressions: ExpressionItem[]
): ExpressionItem[] {
  return expressions.filter((item) => {
    const target = item.expression.trim();
    if (!target) return false;
    return text.includes(target);
  });
}

export interface TextSegment {
  text: string;
  highlighted: boolean;
}

export function splitHighlightedText(
  text: string,
  expressions: string[]
): TextSegment[] {
  const valid = expressions
    .map((e) => e.trim())
    .filter(Boolean)
    .sort((a, b) => b.length - a.length);

  if (valid.length === 0 || !text) {
    return [{ text, highlighted: false }];
  }

  const escaped = valid.map((e) => e.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const regex = new RegExp(`(${escaped.join("|")})`, "g");

  const parts = text.split(regex);
  return parts
    .filter((part) => part.length > 0)
    .map((part) => ({
      text: part,
      highlighted: valid.includes(part),
    }));
}

/**
 * Formats a subtitle cue into at most 2 balanced lines without breaking words.
 */
export function formatTwoLineSubtitle(text: string, maxCharsPerLine = 42): string[] {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];

  const full = words.join(" ");
  if (full.length <= maxCharsPerLine) {
    return [full];
  }

  // Find the split index that best balances two lines
  let bestSplit = Math.ceil(words.length / 2);
  let bestDiff = Infinity;

  for (let i = 1; i < words.length; i++) {
    const line1 = words.slice(0, i).join(" ");
    const line2 = words.slice(i).join(" ");
    const diff = Math.abs(line1.length - line2.length);
    const penalty =
      (line1.length > maxCharsPerLine + 8 ? 100 : 0) +
      (line2.length > maxCharsPerLine + 8 ? 100 : 0);
    if (diff + penalty < bestDiff) {
      bestDiff = diff + penalty;
      bestSplit = i;
    }
  }

  return [
    words.slice(0, bestSplit).join(" "),
    words.slice(bestSplit).join(" "),
  ];
}

export interface TimedSubtitleCue {
  lines: string[];
  rawText: string;
  startOffsetSec: number;
  endOffsetSec: number;
}

/**
 * Splits a beat's spoken English line into 1 or 2 natural chunks synced proportionally
 * to the beat's voice duration so subtitles stay max 2 lines and match word-for-word.
 */
export function buildTimedSubtitlesForBeat(
  englishLine: string,
  beatDurationSec: number,
  voiceDurationSec?: number
): TimedSubtitleCue[] {
  const clean = englishLine.trim();
  if (!clean) return [];

  const activeDuration = Math.min(
    beatDurationSec,
    Math.max(1.8, voiceDurationSec ?? beatDurationSec * 0.88)
  );
  const leadIn = Math.min(0.25, Math.max(0, (beatDurationSec - activeDuration) * 0.3));

  const words = clean.split(/\s+/).filter(Boolean);
  if (clean.length <= 74 || words.length <= 12) {
    return [
      {
        lines: formatTwoLineSubtitle(clean, 40),
        rawText: clean,
        startOffsetSec: leadIn,
        endOffsetSec: Math.min(beatDurationSec, leadIn + activeDuration),
      },
    ];
  }

  // Split at punctuation or midpoint so each cue fits neatly in max 2 lines
  const midWord = Math.ceil(words.length / 2);
  let splitIdx = midWord;

  for (let i = Math.max(3, midWord - 3); i <= Math.min(words.length - 3, midWord + 3); i++) {
    if (/[.!?,—\-]$/.test(words[i - 1])) {
      splitIdx = i;
      break;
    }
  }

  const chunk1 = words.slice(0, splitIdx).join(" ");
  const chunk2 = words.slice(splitIdx).join(" ");
  const ratio = chunk1.length / (chunk1.length + chunk2.length);
  const splitTime = leadIn + activeDuration * ratio;

  return [
    {
      lines: formatTwoLineSubtitle(chunk1, 40),
      rawText: chunk1,
      startOffsetSec: leadIn,
      endOffsetSec: splitTime,
    },
    {
      lines: formatTwoLineSubtitle(chunk2, 40),
      rawText: chunk2,
      startOffsetSec: splitTime,
      endOffsetSec: Math.min(beatDurationSec, leadIn + activeDuration),
    },
  ];
}
