import { ArrowLeft, ArrowRight, Volume2 } from "lucide-react";
import { useEffect, useState } from "react";
import { STYLE_OPTIONS } from "../data/defaults";
import {
  AnimationStyleId,
  BeatItem,
  BrowserVoiceOption,
  VoicePreset,
} from "../types/story";
import {
  getEnglishBrowserVoices,
  pickBestFemaleEnglishVoice,
  speakEnglishBeat,
  stopBrowserSpeech,
} from "../utils/audioUtils";
import CooperVideoPlayer from "./CooperVideoPlayer";
import StyleSwitcherBar from "./StyleSwitcherBar";

interface VideoScreenProps {
  beats: BeatItem[];
  styleId: AnimationStyleId;
  onChangeStyle: (nextStyle: AnimationStyleId) => void;
  voicePreset: VoicePreset;
  voiceURI: string;
  onChangeVoicePreset: (preset: VoicePreset) => void;
  onChangeVoiceURI: (uri: string) => void;
  showKoreanSubtitles: boolean;
  onToggleKoreanSubtitles: () => void;
  bgmEnabled: boolean;
  onToggleBgm: () => void;
  onBack: () => void;
  onNext: () => void;
}

export default function VideoScreen({
  beats,
  styleId,
  onChangeStyle,
  voicePreset,
  voiceURI,
  onChangeVoicePreset,
  onChangeVoiceURI,
  showKoreanSubtitles,
  onToggleKoreanSubtitles,
  bgmEnabled,
  onToggleBgm,
  onBack,
  onNext,
}: VideoScreenProps) {
  const [availableVoices, setAvailableVoices] = useState<BrowserVoiceOption[]>(
    []
  );

  useEffect(() => {
    const loadVoices = () => {
      const list = getEnglishBrowserVoices();
      setAvailableVoices(list);
      if (!voiceURI && list.length > 0) {
        const best = pickBestFemaleEnglishVoice();
        if (best) {
          onChangeVoiceURI(best.voiceURI);
        }
      }
    };

    loadVoices();
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.addEventListener("voiceschanged", loadVoices);
      return () => {
        window.speechSynthesis.removeEventListener(
          "voiceschanged",
          loadVoices
        );
      };
    }
  }, [onChangeVoiceURI, voiceURI]);

  const selectedStyle =
    STYLE_OPTIONS.find((s) => s.id === styleId) ?? STYLE_OPTIONS[0];

  const handleTestVoice = () => {
    speakEnglishBeat(beats[0]?.englishLine || "Seriously, Cooper?!", {
      voiceURI,
      preset: voicePreset,
      beatDurationSec: 7,
    });
  };

  return (
    <section className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-10">
      <div className="mb-6">
        <p className="text-sm font-medium text-[#5A635D]">
          Step 4 of 5 · {selectedStyle.name}
        </p>
        <h1 className="mt-2 font-serif text-3xl font-semibold tracking-tight text-[#1E2420] sm:text-4xl text-balance">
          30-Second Animated Clip
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-[#4B544E] sm:text-lg">
          All four animated beats play continuously in order with your browser’s built-in English voice, soft instrumental BGM, and toggleable Korean subtitles.
        </p>
      </div>

      {/* Bonus 1: Quick Style Switcher */}
      <StyleSwitcherBar styleId={styleId} onChangeStyle={onChangeStyle} />

      {/* Browser English Voice Selector */}
      <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-[#DCE1D8] bg-white p-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <Volume2 className="h-5 w-5 text-[#2F6F6D]" aria-hidden="true" />
          <span className="text-base font-semibold text-[#1E2420]">
            English Voice:
          </span>

          <div className="flex items-center gap-1 rounded-xl bg-[#EEF1EC] p-1">
            {(
              [
                { id: "expressive", label: "Expressive & Warm" },
                { id: "gentle", label: "Clear & Gentle" },
              ] as const
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => onChangeVoicePreset(opt.id)}
                className={`min-h-[40px] rounded-lg px-3.5 py-1.5 text-sm font-semibold transition-colors ${
                  voicePreset === opt.id
                    ? "bg-white text-[#1E2420] shadow-xs"
                    : "text-[#5A635D] hover:text-[#1E2420]"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {availableVoices.length > 0 && (
            <select
              aria-label="Choose browser English voice"
              value={voiceURI}
              onChange={(e) => onChangeVoiceURI(e.target.value)}
              className="min-h-[44px] max-w-[260px] rounded-xl border border-[#CFD7D0] bg-[#FAFBF9] px-3 py-2 text-sm font-medium text-[#1E2420] focus:border-[#2F6F6D] focus:outline-none"
            >
              {availableVoices.map((v) => (
                <option key={v.voiceURI} value={v.voiceURI}>
                  {v.name} ({v.lang})
                </option>
              ))}
            </select>
          )}

          <button
            type="button"
            onClick={handleTestVoice}
            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-[#C8D1CA] bg-white px-4 py-2 text-sm font-semibold text-[#2A332D] hover:bg-[#ECEFE9] active:scale-[0.98] transition-all whitespace-nowrap shrink-0"
          >
            <Volume2 className="h-4 w-4" aria-hidden="true" />
            <span>Test Voice</span>
          </button>
        </div>
      </div>

      <CooperVideoPlayer
        beats={beats}
        styleId={styleId}
        voicePreset={voicePreset}
        voiceURI={voiceURI}
        showKoreanSubtitles={showKoreanSubtitles}
        onToggleKoreanSubtitles={onToggleKoreanSubtitles}
        bgmEnabled={bgmEnabled}
        onToggleBgm={onToggleBgm}
      />

      {/* Beat Order Strip */}
      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {beats.map((beat, idx) => (
          <div
            key={beat.id}
            className="rounded-xl border border-[#DCE1D8] bg-white p-4"
          >
            <p className="text-xs font-semibold text-[#5A635D] tabular-nums">
              Beat {idx + 1} · {beat.timeRange}
            </p>
            <p className="mt-1.5 text-sm font-medium leading-snug text-[#1E2420]">
              {beat.englishLine}
            </p>
          </div>
        ))}
      </div>

      {/* Bottom Actions */}
      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={() => {
            stopBrowserSpeech();
            onBack();
          }}
          className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-2xl border border-[#C8D1CA] bg-white px-6 py-3 text-base font-semibold text-[#2A332D] hover:bg-[#ECEFE9] active:scale-[0.98] transition-all"
        >
          <ArrowLeft className="h-5 w-5" aria-hidden="true" />
          <span>Back to Storyboard</span>
        </button>

        <button
          type="button"
          onClick={() => {
            stopBrowserSpeech();
            onNext();
          }}
          className="inline-flex min-h-[54px] items-center justify-center gap-3 rounded-2xl bg-[#2F6F6D] px-8 py-3.5 text-lg font-semibold text-white shadow-sm hover:bg-[#265B59] active:scale-[0.98] transition-all"
        >
          <span>Finish, Quiz & Download</span>
          <ArrowRight className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>
    </section>
  );
}
