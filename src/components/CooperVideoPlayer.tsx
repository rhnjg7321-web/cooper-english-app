import {
  Captions,
  Music,
  Pause,
  Play,
  RotateCcw,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { STYLE_OPTIONS } from "../data/defaults";
import { AnimationStyleId, BeatItem, VoicePreset } from "../types/story";
import { speakEnglishBeat, stopBrowserSpeech } from "../utils/audioUtils";
import { BgmController } from "../utils/bgmEngine";
import {
  buildCueTimeline,
  preloadBeatImages,
  renderCoverThumbnailFrame,
  renderVideoFrame,
  VIDEO_HEIGHT,
  VIDEO_WIDTH,
} from "../utils/videoCanvasRenderer";

interface CooperVideoPlayerProps {
  beats: BeatItem[];
  styleId: AnimationStyleId;
  voicePreset: VoicePreset;
  voiceURI?: string;
  showKoreanSubtitles: boolean;
  onToggleKoreanSubtitles: () => void;
  bgmEnabled: boolean;
  onToggleBgm: () => void;
}

export default function CooperVideoPlayer({
  beats,
  styleId,
  voicePreset,
  voiceURI,
  showKoreanSubtitles,
  onToggleKoreanSubtitles,
  bgmEnabled,
  onToggleBgm,
}: CooperVideoPlayerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imagesRef = useRef<Record<string, HTMLImageElement | null>>({});
  const bgmRef = useRef<BgmController | null>(null);
  const rafRef = useRef<number | null>(null);
  const playStartPerfRef = useRef<number>(0);
  const playOffsetRef = useRef<number>(0);
  const lastSpokenBeatRef = useRef<number>(-1);

  const [isPlaying, setIsPlaying] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [assetsReady, setAssetsReady] = useState(false);

  const cueTimeline = useMemo(() => buildCueTimeline(beats), [beats]);
  const styleLabel =
    STYLE_OPTIONS.find((s) => s.id === styleId)?.name ?? STYLE_OPTIONS[0].name;

  // Initialize BGM controller once
  useEffect(() => {
    const controller = new BgmController();
    bgmRef.current = controller;
    return () => {
      controller.destroy();
      bgmRef.current = null;
    };
  }, []);

  // Sync BGM mute state
  useEffect(() => {
    bgmRef.current?.setEnabled(bgmEnabled);
  }, [bgmEnabled]);

  const drawCurrentView = useCallback(
    (timeSec: number, started: boolean) => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (!ctx) return;

      if (!started && timeSec === 0) {
        const coverImg = imagesRef.current[beats[0]?.id] ?? null;
        renderCoverThumbnailFrame(ctx, coverImg, styleId, styleLabel);
      } else {
        renderVideoFrame(
          ctx,
          timeSec,
          beats,
          imagesRef.current,
          cueTimeline,
          styleId,
          showKoreanSubtitles
        );
      }
    },
    [beats, cueTimeline, showKoreanSubtitles, styleId, styleLabel]
  );

  // Preload all 4 beat images when beats change
  useEffect(() => {
    let cancelled = false;
    preloadBeatImages(beats).then((loaded) => {
      if (cancelled) return;
      imagesRef.current = loaded;
      setAssetsReady(true);
      drawCurrentView(playOffsetRef.current, hasStarted);
    });
    return () => {
      cancelled = true;
    };
  }, [beats, drawCurrentView, hasStarted]);

  const speakBeatByIndex = useCallback(
    (beatIndex: number) => {
      if (isMuted) {
        stopBrowserSpeech();
        setIsSpeaking(false);
        return;
      }
      const beat = beats[beatIndex];
      if (!beat) return;

      lastSpokenBeatRef.current = beatIndex;
      speakEnglishBeat(beat.englishLine, {
        voiceURI,
        preset: voicePreset,
        beatDurationSec: beat.endSec - beat.startSec,
        onStart: () => setIsSpeaking(true),
        onEnd: () => setIsSpeaking(false),
      });
    },
    [beats, isMuted, voicePreset, voiceURI]
  );

  useEffect(() => {
    if (isMuted) {
      stopBrowserSpeech();
      setIsSpeaking(false);
    }
  }, [isMuted]);

  // Animation + synced speech trigger loop while playing
  useEffect(() => {
    if (!isPlaying) {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      return;
    }

    const tick = () => {
      const elapsed =
        playOffsetRef.current +
        (performance.now() - playStartPerfRef.current) / 1000;

      if (elapsed >= 30) {
        setCurrentTime(30);
        playOffsetRef.current = 30;
        lastSpokenBeatRef.current = -1;
        setIsPlaying(false);
        setIsSpeaking(false);
        stopBrowserSpeech();
        bgmRef.current?.stop();
        drawCurrentView(30, true);
        return;
      }

      setCurrentTime(elapsed);

      const beatIdx = beats.findIndex(
        (b) => elapsed >= b.startSec && elapsed < b.endSec
      );
      if (beatIdx !== -1 && beatIdx !== lastSpokenBeatRef.current) {
        speakBeatByIndex(beatIdx);
      }

      drawCurrentView(elapsed, true);
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [beats, drawCurrentView, isPlaying, speakBeatByIndex]);

  // Redraw when paused and style / Korean subtitles toggle changes
  useEffect(() => {
    if (isPlaying || !assetsReady) return;
    drawCurrentView(currentTime, hasStarted);
  }, [assetsReady, currentTime, drawCurrentView, hasStarted, isPlaying]);

  useEffect(() => {
    return () => {
      stopBrowserSpeech();
      bgmRef.current?.stop();
    };
  }, []);

  const startPlaybackFrom = (startSec: number) => {
    const clamped = startSec >= 29.8 ? 0 : Math.max(0, startSec);
    setHasStarted(true);
    playOffsetRef.current = clamped;
    playStartPerfRef.current = performance.now();
    lastSpokenBeatRef.current = -1;
    setCurrentTime(clamped);

    const beatIdx = beats.findIndex(
      (b) => clamped >= b.startSec && clamped < b.endSec
    );
    if (beatIdx !== -1) {
      speakBeatByIndex(beatIdx);
    }

    bgmRef.current?.start(clamped === 0);
    setIsPlaying(true);
  };

  const pausePlayback = () => {
    const elapsed =
      playOffsetRef.current +
      (performance.now() - playStartPerfRef.current) / 1000;
    playOffsetRef.current = Math.min(30, elapsed);
    setCurrentTime(playOffsetRef.current);
    stopBrowserSpeech();
    bgmRef.current?.stop();
    lastSpokenBeatRef.current = -1;
    setIsSpeaking(false);
    setIsPlaying(false);
  };

  const handleTogglePlay = () => {
    if (isPlaying) {
      pausePlayback();
    } else {
      startPlaybackFrom(playOffsetRef.current);
    }
  };

  const handleSeek = (nextSec: number) => {
    const clamped = Math.max(0, Math.min(30, nextSec));
    setHasStarted(true);
    playOffsetRef.current = clamped;
    playStartPerfRef.current = performance.now();
    lastSpokenBeatRef.current = -1;
    setCurrentTime(clamped);

    drawCurrentView(clamped, true);

    if (isPlaying) {
      const beatIdx = beats.findIndex(
        (b) => clamped >= b.startSec && clamped < b.endSec
      );
      if (beatIdx !== -1) {
        speakBeatByIndex(beatIdx);
      }
    } else {
      stopBrowserSpeech();
    }
  };

  const activeBeatIndex = Math.max(
    0,
    beats.findIndex((b) => currentTime >= b.startSec && currentTime < b.endSec)
  );
  const currentBeatIdx =
    currentTime >= 30 ? beats.length - 1 : activeBeatIndex;

  return (
    <div className="overflow-hidden rounded-2xl border border-[#DCE1D8] bg-white shadow-sm">
      {/* 16:9 Canvas Film Stage (shows Cover Thumbnail at 0s before Play) */}
      <div className="relative aspect-video w-full bg-[#1C211E]">
        <canvas
          ref={canvasRef}
          width={VIDEO_WIDTH}
          height={VIDEO_HEIGHT}
          className="h-full w-full object-contain"
        />
        {!hasStarted && !isPlaying && (
          <button
            type="button"
            onClick={() => startPlaybackFrom(0)}
            aria-label="Play 30-second animated film"
            className="absolute inset-0 flex items-center justify-center bg-black/15 transition-colors hover:bg-black/25"
          >
            <span className="flex h-20 w-20 items-center justify-center rounded-full bg-[#2F6F6D] text-white shadow-xl ring-4 ring-white/85 transition-transform hover:scale-105 active:scale-95">
              <Play className="ml-1 h-9 w-9 fill-current" aria-hidden="true" />
            </span>
          </button>
        )}
      </div>

      {/* Player Controls */}
      <div className="space-y-4 p-4 sm:p-6">
        {/* Timeline Scrubber */}
        <div className="space-y-2">
          <input
            type="range"
            min={0}
            max={30}
            step={0.1}
            value={currentTime}
            aria-label="Video timeline"
            onChange={(e) => handleSeek(Number(e.target.value))}
            className="h-3 w-full cursor-pointer accent-[#2F6F6D]"
          />
          <div className="flex items-center justify-between text-sm font-medium text-[#5A635D] tabular-nums">
            <span>{currentTime.toFixed(1)}s</span>
            <span>
              {!hasStarted
                ? "Cover Thumbnail · Ready to play"
                : `Beat ${currentBeatIdx + 1} · ${beats[currentBeatIdx]?.timeRange}${
                    isSpeaking ? " · Voice speaking" : ""
                  }`}
            </span>
            <span>30.0s</span>
          </div>
        </div>

        {/* Big Playback + Bonus Toggles (Korean Subtitles & BGM) */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={handleTogglePlay}
              className="inline-flex min-h-[52px] min-w-[136px] items-center justify-center gap-2.5 rounded-2xl bg-[#2F6F6D] px-6 py-3 text-base font-semibold text-white hover:bg-[#265B59] active:scale-[0.98] transition-all"
            >
              {isPlaying ? (
                <>
                  <Pause className="h-5 w-5" aria-hidden="true" />
                  <span>Pause</span>
                </>
              ) : (
                <>
                  <Play className="h-5 w-5" aria-hidden="true" />
                  <span>{currentTime >= 29.8 ? "Replay" : "Play 30s"}</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => startPlaybackFrom(0)}
              aria-label="Restart from beginning"
              className="inline-flex min-h-[52px] min-w-[52px] items-center justify-center rounded-2xl border border-[#C8D1CA] bg-white px-4 text-[#2A332D] hover:bg-[#ECEFE9] active:scale-[0.98] transition-all"
            >
              <RotateCcw className="h-5 w-5" aria-hidden="true" />
            </button>

            <button
              type="button"
              onClick={() => setIsMuted((m) => !m)}
              aria-label={isMuted ? "Unmute English voice" : "Mute English voice"}
              className="inline-flex min-h-[52px] min-w-[52px] items-center justify-center rounded-2xl border border-[#C8D1CA] bg-white px-4 text-[#2A332D] hover:bg-[#ECEFE9] active:scale-[0.98] transition-all"
            >
              {isMuted ? (
                <VolumeX className="h-5 w-5" aria-hidden="true" />
              ) : (
                <Volume2 className="h-5 w-5" aria-hidden="true" />
              )}
            </button>

            {/* Bonus 2: Korean Subtitle Toggle */}
            <button
              type="button"
              onClick={onToggleKoreanSubtitles}
              aria-pressed={showKoreanSubtitles}
              className={`inline-flex min-h-[52px] items-center gap-2 rounded-2xl border px-4 py-2.5 text-sm font-semibold transition-all whitespace-nowrap ${
                showKoreanSubtitles
                  ? "border-[#2F6F6D] bg-[#EEF4F3] text-[#1B5754]"
                  : "border-[#C8D1CA] bg-white text-[#4B544E] hover:bg-[#ECEFE9]"
              }`}
            >
              <Captions className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>Korean Subtitles: {showKoreanSubtitles ? "ON" : "OFF"}</span>
            </button>

            {/* Bonus 4: Soft Instrumental BGM Toggle */}
            <button
              type="button"
              onClick={onToggleBgm}
              aria-pressed={bgmEnabled}
              className={`inline-flex min-h-[52px] items-center gap-2 rounded-2xl border px-4 py-2.5 text-sm font-semibold transition-all whitespace-nowrap ${
                bgmEnabled
                  ? "border-[#2F6F6D] bg-[#EEF4F3] text-[#1B5754]"
                  : "border-[#C8D1CA] bg-white text-[#4B544E] hover:bg-[#ECEFE9]"
              }`}
            >
              <Music className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>BGM: {bgmEnabled ? "ON" : "OFF"}</span>
            </button>
          </div>

          {/* Jump to Beat Segmented Controls */}
          <div className="flex flex-wrap items-center gap-1.5 rounded-xl bg-[#EEF1EC] p-1">
            {beats.map((beat, idx) => {
              const active = hasStarted && idx === currentBeatIdx;
              return (
                <button
                  key={beat.id}
                  type="button"
                  onClick={() => startPlaybackFrom(beat.startSec)}
                  className={`min-h-[40px] rounded-lg px-3 py-1.5 text-sm font-semibold tabular-nums transition-colors ${
                    active
                      ? "bg-white text-[#1E2420] shadow-xs"
                      : "text-[#5A635D] hover:text-[#1E2420]"
                  }`}
                >
                  {beat.timeRange}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
