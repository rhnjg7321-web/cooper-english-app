import { BrowserVoiceOption, VoicePreset } from "../types/story";

const FEMALE_VOICE_KEYWORDS = [
  "samantha",
  "jenny",
  "aria",
  "ava",
  "allison",
  "victoria",
  "karen",
  "serena",
  "zira",
  "susan",
  "hazel",
  "kate",
  "moira",
  "tessa",
  "fiona",
  "siri",
  "emma",
  "olivia",
  "female",
  "google us english",
  "google uk english female",
  "natural",
];

const MALE_VOICE_KEYWORDS = [
  "daniel",
  "david",
  "mark",
  "alex",
  "fred",
  "aaron",
  "rishi",
  "george",
  "ryan",
  "guy",
  "christopher",
  "eric",
  "male",
  "google uk english male",
];

function scoreEnglishVoice(voice: SpeechSynthesisVoice): number {
  const name = voice.name.toLowerCase();
  const lang = voice.lang.toLowerCase();
  if (!lang.startsWith("en")) return -1000;

  let score = 0;
  if (lang === "en-us") score += 20;
  else if (lang.startsWith("en-gb") || lang.startsWith("en-au") || lang.startsWith("en-ca")) {
    score += 10;
  }

  for (const kw of FEMALE_VOICE_KEYWORDS) {
    if (name.includes(kw)) score += 35;
  }
  for (const kw of MALE_VOICE_KEYWORDS) {
    if (name.includes(kw)) score -= 50;
  }
  if (name.includes("natural") || name.includes("neural") || name.includes("online")) {
    score += 25;
  }
  if (voice.localService) score += 5;

  return score;
}

export function getEnglishBrowserVoices(): BrowserVoiceOption[] {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    return [];
  }
  const voices = window.speechSynthesis.getVoices();
  return voices
    .filter((v) => v.lang.toLowerCase().startsWith("en"))
    .sort((a, b) => scoreEnglishVoice(b) - scoreEnglishVoice(a))
    .map((v) => ({
      voiceURI: v.voiceURI,
      name: v.name,
      lang: v.lang,
    }));
}

export function pickBestFemaleEnglishVoice(
  preferredURI?: string
): SpeechSynthesisVoice | null {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    return null;
  }
  const voices = window.speechSynthesis.getVoices();
  if (voices.length === 0) return null;

  if (preferredURI) {
    const exact = voices.find((v) => v.voiceURI === preferredURI);
    if (exact) return exact;
  }

  const englishVoices = voices.filter((v) => v.lang.toLowerCase().startsWith("en"));
  if (englishVoices.length === 0) return voices[0] ?? null;

  const sorted = [...englishVoices].sort(
    (a, b) => scoreEnglishVoice(b) - scoreEnglishVoice(a)
  );
  return sorted[0] ?? null;
}

export function stopBrowserSpeech(): void {
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
}

export interface SpeakBeatOptions {
  voiceURI?: string;
  preset: VoicePreset;
  beatDurationSec: number;
  onStart?: () => void;
  onEnd?: () => void;
}

export function speakEnglishBeat(
  text: string,
  options: SpeakBeatOptions
): void {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    options.onEnd?.();
    return;
  }

  const clean = text.trim();
  if (!clean) {
    options.onEnd?.();
    return;
  }

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(clean);
  const voice = pickBestFemaleEnglishVoice(options.voiceURI);
  if (voice) {
    utterance.voice = voice;
    utterance.lang = voice.lang;
  } else {
    utterance.lang = "en-US";
  }

  const wordCount = clean.split(/\s+/).filter(Boolean).length;
  // Base natural rate fitted comfortably inside the beat window
  const baseRate = options.preset === "expressive" ? 0.98 : 0.92;
  const estimatedSec = wordCount / 2.6;
  const maxSafeWindow = Math.max(2.5, options.beatDurationSec - 0.5);
  const fittedRate =
    estimatedSec > maxSafeWindow
      ? Math.min(1.18, baseRate * (estimatedSec / maxSafeWindow))
      : baseRate;

  utterance.rate = fittedRate;
  utterance.pitch = options.preset === "expressive" ? 1.1 : 1.04;
  utterance.volume = 1.0;

  utterance.onstart = () => {
    options.onStart?.();
  };
  utterance.onend = () => {
    options.onEnd?.();
  };
  utterance.onerror = () => {
    options.onEnd?.();
  };

  window.speechSynthesis.speak(utterance);
}
