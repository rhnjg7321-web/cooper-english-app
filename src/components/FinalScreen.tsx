import {
  ArrowLeft,
  CheckCircle2,
  Download,
  FileText,
  Loader2,
  RotateCcw,
} from "lucide-react";
import { useState } from "react";
import {
  AnimationStyleId,
  BeatItem,
  ExpressionItem,
  VoicePreset,
} from "../types/story";
import { stopBrowserSpeech } from "../utils/audioUtils";
import { scheduleBgmOnAudioContext } from "../utils/bgmEngine";
import {
  buildCueTimeline,
  preloadBeatImages,
  renderVideoFrame,
  VIDEO_HEIGHT,
  VIDEO_WIDTH,
} from "../utils/videoCanvasRenderer";
import CooperVideoPlayer from "./CooperVideoPlayer";
import CoverThumbnailCard from "./CoverThumbnailCard";
import ExpressionQuiz from "./ExpressionQuiz";

interface FinalScreenProps {
  beats: BeatItem[];
  expressions: ExpressionItem[];
  styleId: AnimationStyleId;
  voicePreset: VoicePreset;
  voiceURI: string;
  showKoreanSubtitles: boolean;
  onToggleKoreanSubtitles: () => void;
  bgmEnabled: boolean;
  onToggleBgm: () => void;
  onBack: () => void;
  onStartOver: () => void;
}

export default function FinalScreen({
  beats,
  expressions,
  styleId,
  voicePreset,
  voiceURI,
  showKoreanSubtitles,
  onToggleKoreanSubtitles,
  bgmEnabled,
  onToggleBgm,
  onBack,
  onStartOver,
}: FinalScreenProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [exportSec, setExportSec] = useState(0);
  const [exportDone, setExportDone] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const handleDownloadVideo = async () => {
    if (isExporting) return;
    setIsExporting(true);
    setExportSec(0);
    setExportDone(false);
    setExportError(null);

    let intervalId: number | null = null;
    let audioCtx: AudioContext | null = null;
    let stopBgmSchedule: (() => void) | null = null;

    try {
      const exportCanvas = document.createElement("canvas");
      exportCanvas.width = VIDEO_WIDTH;
      exportCanvas.height = VIDEO_HEIGHT;
      const ctx = exportCanvas.getContext("2d");
      if (!ctx) throw new Error("Canvas context unavailable.");

      const images = await preloadBeatImages(beats);
      const cueTimeline = buildCueTimeline(beats);

      const canvasStream = exportCanvas.captureStream(30);
      const tracks: MediaStreamTrack[] = [...canvasStream.getVideoTracks()];

      // Include the synthesized soft Web Audio BGM track when BGM is ON
      if (bgmEnabled) {
        const AudioCtx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext })
            .webkitAudioContext;
        if (AudioCtx) {
          audioCtx = new AudioCtx();
          if (audioCtx.state === "suspended") {
            await audioCtx.resume();
          }
          const dest = audioCtx.createMediaStreamDestination();
          stopBgmSchedule = scheduleBgmOnAudioContext(
            audioCtx,
            dest,
            audioCtx.currentTime + 0.05,
            30.2,
            0.16
          );
          tracks.push(...dest.stream.getAudioTracks());
        }
      }

      const combinedStream = new MediaStream(tracks);

      const candidates = bgmEnabled
        ? [
            "video/mp4;codecs=avc1,mp4a.40.2",
            "video/webm;codecs=vp9,opus",
            "video/webm;codecs=vp8,opus",
            "video/webm",
          ]
        : ["video/mp4;codecs=avc1", "video/webm;codecs=vp9", "video/webm"];

      const mimeType =
        candidates.find((t) => MediaRecorder.isTypeSupported(t)) || "";

      const recorder = mimeType
        ? new MediaRecorder(combinedStream, {
            mimeType,
            videoBitsPerSecond: 3_500_000,
          })
        : new MediaRecorder(combinedStream);

      const chunks: BlobPart[] = [];
      recorder.ondataavailable = (ev) => {
        if (ev.data.size > 0) chunks.push(ev.data);
      };

      const recordingFinished = new Promise<Blob>((resolve) => {
        recorder.onstop = () => {
          const outType = mimeType || "video/webm";
          resolve(new Blob(chunks, { type: outType }));
        };
      });

      renderVideoFrame(
        ctx,
        0,
        beats,
        images,
        cueTimeline,
        styleId,
        showKoreanSubtitles
      );
      recorder.start(250);

      const perfStart = performance.now();
      await new Promise<void>((resolve) => {
        intervalId = window.setInterval(() => {
          const elapsed = (performance.now() - perfStart) / 1000;
          setExportSec(Math.min(30, elapsed));
          renderVideoFrame(
            ctx,
            Math.min(30, elapsed),
            beats,
            images,
            cueTimeline,
            styleId,
            showKoreanSubtitles
          );
          if (elapsed >= 30.1) {
            if (intervalId !== null) clearInterval(intervalId);
            resolve();
          }
        }, 33);
      });

      recorder.stop();
      stopBgmSchedule?.();
      const videoBlob = await recordingFinished;

      const ext = videoBlob.type.includes("mp4") ? "mp4" : "webm";
      const url = URL.createObjectURL(videoBlob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `cooper-30s-film.${ext}`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
      setExportDone(true);
    } catch (err) {
      setExportError(
        err instanceof Error ? err.message : "Could not export video file."
      );
    } finally {
      if (intervalId !== null) clearInterval(intervalId);
      stopBgmSchedule?.();
      if (audioCtx) {
        audioCtx.close().catch(() => {});
      }
      setIsExporting(false);
    }
  };

  const handleDownloadStudySheet = () => {
    const lines = [
      "Cooper — 30-Second Movie English Short Film",
      "Made with Google AI Studio · Script by 정라현",
      "",
      "=== EXPRESSIONS ===",
      ...expressions
        .filter((e) => e.expression.trim())
        .map((e, i) => `${i + 1}. ${e.expression} (${e.meaning}) — ${e.movie}`),
      "",
      "=== 4-BEAT STORYBOARD ===",
      ...beats.flatMap((b, i) => [
        `Beat ${i + 1} (${b.timeRange})`,
        `Scene: ${b.sceneDescription}`,
        `Line: ${b.englishLine}`,
        b.koreanSubtitle ? `Korean: ${b.koreanSubtitle}` : "",
        "",
      ]),
    ];

    const blob = new Blob([lines.join("\n")], {
      type: "text/plain;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "cooper-study-script.txt";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-10">
      <div className="mb-6">
        <p className="text-sm font-medium text-[#5A635D]">
          Step 5 of 5 · Watch, Quiz & Download
        </p>
        <h1 className="mt-2 font-serif text-3xl font-semibold tracking-tight text-[#1E2420] sm:text-4xl text-balance">
          Your 30-second film is ready
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-[#4B544E] sm:text-lg">
          Replay your clip with English voice and subtitles, test yourself with the 3-question quiz, and download your video, thumbnail, or script.
        </p>
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

      {/* Download & Study Actions */}
      <div className="mt-8 rounded-2xl border border-[#DCE1D8] bg-white p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-[#1E2420]">
              Save Your Film & Study Script
            </h2>
            <p className="mt-1 text-base text-[#5A635D]">
              Exports all 4 animated beats with motion, burned-in subtitles, end credit{bgmEnabled ? ", and soft BGM" : ""}.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={handleDownloadStudySheet}
              className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-2xl border border-[#C8D1CA] bg-white px-5 py-3 text-base font-semibold text-[#2A332D] hover:bg-[#ECEFE9] active:scale-[0.98] transition-all"
            >
              <FileText className="h-5 w-5" aria-hidden="true" />
              <span>Download Script</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadVideo}
              disabled={isExporting}
              className="inline-flex min-h-[54px] items-center justify-center gap-2.5 rounded-2xl bg-[#2F6F6D] px-7 py-3.5 text-lg font-semibold text-white shadow-sm hover:bg-[#265B59] disabled:opacity-70 active:scale-[0.98] transition-all"
            >
              {isExporting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
                  <span className="tabular-nums">
                    Rendering Video ({Math.round(exportSec)}s / 30s)...
                  </span>
                </>
              ) : (
                <>
                  <Download className="h-5 w-5" aria-hidden="true" />
                  <span>Download Video</span>
                </>
              )}
            </button>
          </div>
        </div>

        {isExporting && (
          <div className="mt-4">
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-[#ECEFE9]">
              <div
                className="h-full bg-[#2F6F6D] transition-all duration-150"
                style={{ width: `${Math.min(100, (exportSec / 30) * 100)}%` }}
              />
            </div>
          </div>
        )}

        {exportDone && (
          <div className="mt-4 flex items-center gap-2 text-base font-medium text-[#234836]">
            <CheckCircle2 className="h-5 w-5 text-[#2E6B4E]" aria-hidden="true" />
            <span>Video downloaded with animated motion and burned-in subtitles.</span>
          </div>
        )}

        {exportError && (
          <p role="alert" className="mt-4 text-base text-[#7B2B2B]">
            {exportError}
          </p>
        )}
      </div>

      {/* Bonus 5: Video Cover Thumbnail & Download */}
      <CoverThumbnailCard
        coverImageUrl={beats[0]?.imageUrl || ""}
        styleId={styleId}
      />

      {/* Bonus 3: Interactive 3-Question Expression Quiz */}
      <ExpressionQuiz expressions={expressions} beats={beats} />

      {/* Expression Review List */}
      <div className="mt-6 rounded-2xl border border-[#DCE1D8] bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold text-[#1E2420]">
          Expressions Featured in This Clip
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {expressions
            .filter((e) => e.expression.trim())
            .map((item) => (
              <div
                key={item.id}
                className="rounded-xl border border-[#E6EAE3] bg-[#FAFBF9] p-4"
              >
                <p className="text-base font-semibold text-[#1E2420]">
                  {item.expression}
                </p>
                <p className="mt-1 text-sm text-[#4B544E]">{item.meaning}</p>
                <p className="mt-1 text-xs font-medium text-[#6B746E]">
                  {item.movie}
                </p>
              </div>
            ))}
        </div>
      </div>

      {/* Credit & Navigation */}
      <footer className="mt-8 flex flex-col items-center justify-between gap-4 rounded-2xl border border-[#DCE1D8] bg-[#EEF2ED] px-6 py-6 text-center sm:flex-row sm:text-left">
        <p className="font-serif text-lg font-medium text-[#1E2420]">
          Made with Google AI Studio · Script by 정라현
        </p>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => {
              stopBrowserSpeech();
              onBack();
            }}
            className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl border border-[#C8D1CA] bg-white px-5 py-2.5 text-base font-semibold text-[#2A332D] hover:bg-[#ECEFE9] active:scale-[0.98] transition-all"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            <span>Back to Video</span>
          </button>
          <button
            type="button"
            onClick={() => {
              stopBrowserSpeech();
              onStartOver();
            }}
            className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl border border-[#C8D1CA] bg-white px-5 py-2.5 text-base font-semibold text-[#2A332D] hover:bg-[#ECEFE9] active:scale-[0.98] transition-all"
          >
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            <span>New Film</span>
          </button>
        </div>
      </footer>
    </section>
  );
}
