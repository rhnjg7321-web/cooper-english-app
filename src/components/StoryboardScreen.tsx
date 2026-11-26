import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Loader2,
  Pencil,
  RefreshCw,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { AnimationStyleId, BeatItem, ExpressionItem } from "../types/story";
import {
  countEnglishWords,
  countTotalBeatWords,
  findExactMatchedExpressions,
  formatTwoLineSubtitle,
  splitHighlightedText,
} from "../utils/subtitleUtils";
import { getStyleCssFilter } from "../utils/videoCanvasRenderer";
import StyleSwitcherBar from "./StyleSwitcherBar";

interface StoryboardScreenProps {
  beats: BeatItem[];
  expressions: ExpressionItem[];
  styleId: AnimationStyleId;
  onChangeStyle: (nextStyle: AnimationStyleId) => void;
  onUpdateBeat: (beatIndex: number, updated: BeatItem) => void;
  onRegenerateBeat: (beatIndex: number) => Promise<void>;
  regeneratingIndex: number | null;
  errorMessage: string | null;
  onBack: () => void;
  onBuildVideo: () => void;
}

interface ActivePopup {
  beatId: string;
  expression: string;
  meaning: string;
  movie: string;
}

export default function StoryboardScreen({
  beats,
  expressions,
  styleId,
  onChangeStyle,
  onUpdateBeat,
  onRegenerateBeat,
  regeneratingIndex,
  errorMessage,
  onBack,
  onBuildVideo,
}: StoryboardScreenProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [activePopup, setActivePopup] = useState<ActivePopup | null>(null);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setActivePopup(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const totalWords = countTotalBeatWords(beats);
  const allEnglishText = beats.map((b) => b.englishLine).join(" ");
  const matchedExprs = findExactMatchedExpressions(allEnglishText, expressions);
  const validExpressions = expressions.filter((e) => e.expression.trim().length > 0);
  const allMatched = matchedExprs.length === validExpressions.length;
  const wordCountOk = totalWords >= 60 && totalWords <= 70;
  const expressionStrings = validExpressions.map((e) => e.expression);

  const handleExpressionTap = (beatId: string, exprText: string) => {
    const found = validExpressions.find(
      (e) => e.expression.trim() === exprText.trim()
    );
    if (!found) return;
    setActivePopup((prev) =>
      prev && prev.beatId === beatId && prev.expression === found.expression
        ? null
        : {
            beatId,
            expression: found.expression,
            meaning: found.meaning,
            movie: found.movie,
          }
    );
  };

  const renderInteractiveLine = (beat: BeatItem) => {
    const segments = splitHighlightedText(beat.englishLine, expressionStrings);
    return (
      <div className="relative">
        <p className="text-base font-medium leading-relaxed text-[#1E2420]">
          {segments.map((seg, i) =>
            seg.highlighted ? (
              <button
                key={i}
                type="button"
                onClick={() => handleExpressionTap(beat.id, seg.text)}
                aria-label={`View meaning of ${seg.text}`}
                className="mx-0.5 inline rounded-md bg-[#FFF1BD] px-1.5 py-0.5 font-bold text-[#1B5754] underline decoration-[#C88A1E] decoration-2 underline-offset-2 hover:bg-[#FCE48E] active:scale-[0.98] transition-colors cursor-pointer"
              >
                {seg.text}
              </button>
            ) : (
              <span key={i}>{seg.text}</span>
            )
          )}
        </p>

        {activePopup && activePopup.beatId === beat.id && (
          <div
            role="dialog"
            aria-label={`Expression details for ${activePopup.expression}`}
            className="mt-3 rounded-xl border border-[#2F6F6D]/30 bg-[#EEF4F3] p-4 shadow-md"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-base font-bold text-[#1B5754]">
                  {activePopup.expression}
                </p>
                <p className="mt-1 text-base font-medium text-[#1E2420]">
                  {activePopup.meaning}
                </p>
                <p className="mt-1 text-sm text-[#5A635D]">
                  Movie: {activePopup.movie}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActivePopup(null)}
                aria-label="Close expression tooltip"
                className="flex min-h-[36px] min-w-[36px] items-center justify-center rounded-lg text-[#4B544E] hover:bg-white/70"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <section className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
      <div className="mb-6">
        <p className="text-sm font-medium text-[#5A635D]">
          Step 3 of 5 · 30-Second Script & Beats
        </p>
        <h1 className="mt-2 font-serif text-3xl font-semibold tracking-tight text-[#1E2420] sm:text-4xl text-balance">
          4-Beat Storyboard Table
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-[#4B544E] sm:text-lg">
          Tap any bold colored expression to see its Korean meaning and source movie. Edit any beat directly or regenerate a single beat.
        </p>
      </div>

      {/* Bonus 1: Quick Style Switcher */}
      <StyleSwitcherBar styleId={styleId} onChangeStyle={onChangeStyle} />

      {/* Script Budget & Expression Coverage Bar */}
      <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-[#DCE1D8] bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          {wordCountOk && allMatched ? (
            <CheckCircle2 className="h-5 w-5 shrink-0 text-[#2E6B4E]" aria-hidden="true" />
          ) : (
            <AlertTriangle className="h-5 w-5 shrink-0 text-[#B4741B]" aria-hidden="true" />
          )}
          <div className="text-base text-[#1E2420]">
            <span className="font-semibold tabular-nums">
              {totalWords} total words
            </span>
            <span className="text-[#5A635D]"> · Target 60–70 words · </span>
            <span className="font-semibold tabular-nums">
              {matchedExprs.length}/{validExpressions.length} expressions used exactly
            </span>
          </div>
        </div>
        <span className="text-sm font-medium text-[#5A635D]">
          30 seconds · 4 beats
        </span>
      </div>

      {errorMessage && (
        <div
          role="alert"
          className="mb-6 rounded-2xl border border-[#DFB2B2] bg-[#FDF2F2] p-4 text-base text-[#7B2B2B]"
        >
          {errorMessage}
        </div>
      )}

      {/* Desktop/Tablet Structured 4-Beat Storyboard Table (F3) */}
      <div className="hidden overflow-hidden rounded-2xl border border-[#DCE1D8] bg-white shadow-xs md:block">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-[#DCE1D8] bg-[#F3F5F1] text-sm font-semibold text-[#3B443E]">
              <th className="w-48 px-4 py-3.5">Beat & Time</th>
              <th className="w-64 px-4 py-3.5">Scene Description</th>
              <th className="px-4 py-3.5">English Lines</th>
              <th className="w-64 px-4 py-3.5">Subtitles (Max 2 Lines)</th>
              <th className="w-44 px-4 py-3.5">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E6EAE3]">
            {beats.map((beat, index) => {
              const isEditing = editingIndex === index;
              const isRegenerating = regeneratingIndex === index;
              const beatMatched = findExactMatchedExpressions(
                beat.englishLine,
                validExpressions
              );
              const beatMovies = Array.from(
                new Set(
                  beatMatched.length > 0
                    ? beatMatched.map((m) => m.movie)
                    : beat.sourceMovies
                )
              );
              const beatWords = countEnglishWords(beat.englishLine);
              const subtitleLines = formatTwoLineSubtitle(
                beat.subtitles?.trim() || beat.englishLine,
                38
              );

              return (
                <tr key={beat.id} className="align-top">
                  <td className="px-4 py-5">
                    <p className="text-sm font-semibold text-[#1E2420] tabular-nums">
                      Beat {index + 1} · {beat.timeRange}
                    </p>
                    <p className="mt-1 text-xs text-[#5A635D] tabular-nums">
                      {beatWords} words
                      {beatMovies.length > 0 && ` · ${beatMovies.join(" / ")}`}
                    </p>
                    <div className="mt-3 aspect-video overflow-hidden rounded-xl bg-[#ECEFE9]">
                      <img
                        src={beat.imageUrl}
                        alt={`Beat ${index + 1} (${beat.timeRange}) preview`}
                        referrerPolicy="no-referrer"
                        style={{ filter: getStyleCssFilter(styleId) }}
                        className="animate-cel-preview h-full w-full object-cover"
                      />
                    </div>
                  </td>

                  <td className="px-4 py-5">
                    {isEditing ? (
                      <textarea
                        aria-label={`Beat ${index + 1} scene description`}
                        rows={5}
                        value={beat.sceneDescription}
                        onChange={(e) =>
                          onUpdateBeat(index, {
                            ...beat,
                            sceneDescription: e.target.value,
                          })
                        }
                        className="w-full rounded-xl border border-[#CFD7D0] bg-[#FAFBF9] px-3 py-2 text-sm leading-relaxed text-[#1E2420] focus:border-[#2F6F6D] focus:bg-white focus:outline-none"
                      />
                    ) : (
                      <p className="text-sm leading-relaxed text-[#343D37]">
                        {beat.sceneDescription}
                      </p>
                    )}
                  </td>

                  <td className="px-4 py-5">
                    {isEditing ? (
                      <textarea
                        aria-label={`Beat ${index + 1} English line`}
                        rows={5}
                        value={beat.englishLine}
                        onChange={(e) => {
                          const nextLine = e.target.value;
                          const nextMatched = findExactMatchedExpressions(
                            nextLine,
                            validExpressions
                          );
                          onUpdateBeat(index, {
                            ...beat,
                            englishLine: nextLine,
                            subtitles: formatTwoLineSubtitle(nextLine, 38).join("\n"),
                            usedExpressions: nextMatched.map(
                              (m) => m.expression
                            ),
                            sourceMovies: Array.from(
                              new Set(nextMatched.map((m) => m.movie))
                            ),
                          });
                        }}
                        className="w-full rounded-xl border border-[#CFD7D0] bg-[#FAFBF9] px-3 py-2 text-base font-medium leading-relaxed text-[#1E2420] focus:border-[#2F6F6D] focus:bg-white focus:outline-none"
                      />
                    ) : (
                      renderInteractiveLine(beat)
                    )}
                  </td>

                  <td className="px-4 py-5">
                    {isEditing ? (
                      <textarea
                        aria-label={`Beat ${index + 1} subtitles`}
                        rows={4}
                        value={beat.subtitles ?? subtitleLines.join("\n")}
                        onChange={(e) =>
                          onUpdateBeat(index, {
                            ...beat,
                            subtitles: e.target.value,
                          })
                        }
                        className="w-full rounded-xl border border-[#CFD7D0] bg-[#FAFBF9] px-3 py-2 text-sm leading-relaxed text-[#1E2420] focus:border-[#2F6F6D] focus:bg-white focus:outline-none"
                      />
                    ) : (
                      <div className="rounded-xl bg-[#1E2420] px-3.5 py-2.5 text-center text-sm font-bold leading-snug text-white">
                        {subtitleLines.map((line, i) => (
                          <div key={i}>{line}</div>
                        ))}
                      </div>
                    )}
                  </td>

                  <td className="px-4 py-5">
                    <div className="flex flex-col gap-2.5">
                      <button
                        type="button"
                        onClick={() =>
                          setEditingIndex(isEditing ? null : index)
                        }
                        className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-[#C8D1CA] bg-white px-3 py-2 text-sm font-semibold text-[#2A332D] hover:bg-[#ECEFE9] active:scale-[0.98] transition-all whitespace-nowrap"
                      >
                        <Pencil className="h-4 w-4" aria-hidden="true" />
                        <span>{isEditing ? "Save Beat" : "Edit Beat"}</span>
                      </button>

                      <button
                        type="button"
                        disabled={regeneratingIndex !== null}
                        onClick={() => onRegenerateBeat(index)}
                        className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-[#C8D1CA] bg-white px-3 py-2 text-sm font-semibold text-[#2A332D] hover:bg-[#ECEFE9] disabled:opacity-50 active:scale-[0.98] transition-all whitespace-nowrap"
                      >
                        {isRegenerating ? (
                          <>
                            <Loader2
                              className="h-4 w-4 animate-spin"
                              aria-hidden="true"
                            />
                            <span>Regenerating...</span>
                          </>
                        ) : (
                          <>
                            <RefreshCw className="h-4 w-4" aria-hidden="true" />
                            <span>Regenerate This Beat</span>
                          </>
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Structured Beat View (< md) */}
      <div className="space-y-5 md:hidden">
        {beats.map((beat, index) => {
          const isEditing = editingIndex === index;
          const isRegenerating = regeneratingIndex === index;
          const beatMatched = findExactMatchedExpressions(
            beat.englishLine,
            validExpressions
          );
          const beatMovies = Array.from(
            new Set(
              beatMatched.length > 0
                ? beatMatched.map((m) => m.movie)
                : beat.sourceMovies
            )
          );
          const beatWords = countEnglishWords(beat.englishLine);
          const subtitleLines = formatTwoLineSubtitle(
            beat.subtitles?.trim() || beat.englishLine,
            38
          );

          return (
            <article
              key={beat.id}
              className="overflow-hidden rounded-2xl border border-[#DCE1D8] bg-white shadow-xs"
            >
              <div className="aspect-video overflow-hidden bg-[#ECEFE9]">
                <img
                  src={beat.imageUrl}
                  alt={`Beat ${index + 1} (${beat.timeRange}) preview`}
                  referrerPolicy="no-referrer"
                  style={{ filter: getStyleCssFilter(styleId) }}
                  className="animate-cel-preview h-full w-full object-cover"
                />
              </div>

              <div className="space-y-4 p-5">
                <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-[#5A635D]">
                  <span className="font-semibold text-[#1E2420] tabular-nums">
                    Beat {index + 1} · {beat.timeRange}
                  </span>
                  <span className="tabular-nums">
                    {beatWords} words
                    {beatMovies.length > 0 && ` · ${beatMovies.join(" / ")}`}
                  </span>
                </div>

                {isEditing ? (
                  <div className="space-y-3">
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-[#5A635D]">
                        Scene Description
                      </label>
                      <textarea
                        rows={3}
                        value={beat.sceneDescription}
                        onChange={(e) =>
                          onUpdateBeat(index, {
                            ...beat,
                            sceneDescription: e.target.value,
                          })
                        }
                        className="w-full rounded-xl border border-[#CFD7D0] bg-[#FAFBF9] px-3 py-2 text-base text-[#1E2420]"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-[#5A635D]">
                        English Lines
                      </label>
                      <textarea
                        rows={3}
                        value={beat.englishLine}
                        onChange={(e) => {
                          const nextLine = e.target.value;
                          const nextMatched = findExactMatchedExpressions(
                            nextLine,
                            validExpressions
                          );
                          onUpdateBeat(index, {
                            ...beat,
                            englishLine: nextLine,
                            subtitles: formatTwoLineSubtitle(nextLine, 38).join("\n"),
                            usedExpressions: nextMatched.map(
                              (m) => m.expression
                            ),
                            sourceMovies: Array.from(
                              new Set(nextMatched.map((m) => m.movie))
                            ),
                          });
                        }}
                        className="w-full rounded-xl border border-[#CFD7D0] bg-[#FAFBF9] px-3 py-2 text-base font-medium text-[#1E2420]"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs font-semibold text-[#5A635D]">
                        Scene Description
                      </p>
                      <p className="mt-1 text-base leading-relaxed text-[#343D37]">
                        {beat.sceneDescription}
                      </p>
                    </div>
                    <div className="rounded-xl bg-[#F6F7F4] p-4">
                      <p className="mb-1 text-xs font-semibold text-[#5A635D]">
                        English Lines (tap highlighted words)
                      </p>
                      {renderInteractiveLine(beat)}
                    </div>
                    <div>
                      <p className="mb-1 text-xs font-semibold text-[#5A635D]">
                        Subtitles
                      </p>
                      <div className="rounded-xl bg-[#1E2420] px-3.5 py-2.5 text-center text-sm font-bold text-white">
                        {subtitleLines.map((line, i) => (
                          <div key={i}>{line}</div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap gap-2.5 border-t border-[#ECEFE9] pt-4">
                  <button
                    type="button"
                    onClick={() => setEditingIndex(isEditing ? null : index)}
                    className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-xl border border-[#C8D1CA] bg-white px-4 py-2 text-sm font-semibold text-[#2A332D]"
                  >
                    <Pencil className="h-4 w-4" aria-hidden="true" />
                    <span>{isEditing ? "Save Beat" : "Edit Beat"}</span>
                  </button>
                  <button
                    type="button"
                    disabled={regeneratingIndex !== null}
                    onClick={() => onRegenerateBeat(index)}
                    className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-xl border border-[#C8D1CA] bg-white px-4 py-2 text-sm font-semibold text-[#2A332D] disabled:opacity-50"
                  >
                    {isRegenerating ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                        <span>Regenerating...</span>
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-4 w-4" aria-hidden="true" />
                        <span>Regenerate This Beat</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {/* Bottom Actions */}
      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-2xl border border-[#C8D1CA] bg-white px-6 py-3 text-base font-semibold text-[#2A332D] hover:bg-[#ECEFE9] active:scale-[0.98] transition-all"
        >
          <ArrowLeft className="h-5 w-5" aria-hidden="true" />
          <span>Back to Scene</span>
        </button>

        <button
          type="button"
          onClick={onBuildVideo}
          className="inline-flex min-h-[54px] items-center justify-center gap-3 rounded-2xl bg-[#2F6F6D] px-8 py-3.5 text-lg font-semibold text-white shadow-sm hover:bg-[#265B59] active:scale-[0.98] transition-all"
        >
          <span>Watch 30s Animated Video</span>
          <ArrowRight className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>
    </section>
  );
}
