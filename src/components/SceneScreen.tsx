import { ArrowLeft, ArrowRight, Check, Film, Loader2 } from "lucide-react";
import {
  BEAT_IMAGES,
  CHARACTER_SHEET_IMAGE,
  MASTER_ROOM_IMAGE,
  STYLE_OPTIONS,
} from "../data/defaults";
import { AnimationStyleId, SceneConfig } from "../types/story";

interface SceneScreenProps {
  scene: SceneConfig;
  onChange: (next: SceneConfig) => void;
  onBack: () => void;
  onProceedWithCurrent: () => void;
  onGenerateWithAI: () => void;
  isGenerating: boolean;
  errorMessage: string | null;
  expressionsModified: boolean;
}

export default function SceneScreen({
  scene,
  onChange,
  onBack,
  onProceedWithCurrent,
  onGenerateWithAI,
  isGenerating,
  errorMessage,
  expressionsModified,
}: SceneScreenProps) {
  const updateField = <K extends keyof SceneConfig>(
    key: K,
    value: SceneConfig[K]
  ) => {
    onChange({ ...scene, [key]: value });
  };

  return (
    <section className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-10">
      <div className="mb-8">
        <p className="text-sm font-medium text-[#5A635D]">
          Step 2 of 5 · Cast, Setting & Style
        </p>
        <h1 className="mt-2 font-serif text-3xl font-semibold tracking-tight text-[#1E2420] sm:text-4xl text-balance">
          Set the living room scene & animation style
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-[#4B544E] sm:text-lg">
          Locked living room layout and character models keep the background, faces, hairstyles, and outfits identical across all four beats.
        </p>
      </div>

      {/* Fixed Living Room Set, Character Sheet & Locked Beat Preview Strip */}
      <div className="mb-8 space-y-5 rounded-2xl border border-[#DCE1D8] bg-white p-5 sm:p-6">
        <div>
          <h2 className="text-lg font-semibold text-[#1E2420]">
            Locked Room Layout & Character Design Sheet
          </h2>
          <p className="mt-1 text-sm text-[#5A635D]">
            Window left, beige sofa center, wooden door right · Protagonist (yellow knit sweater, blue jeans; apron in Beat 3) · Cooper (beagle-mix, white stripe, red collar) · Mom (low bun, navy cardigan)
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <div className="overflow-hidden rounded-xl border border-[#E6EAE3] bg-[#FAF7EE]">
              <img
                src={MASTER_ROOM_IMAGE}
                alt="Locked cozy living room layout with sunlit window on the left, beige sofa in center, and wooden front door on the right"
                referrerPolicy="no-referrer"
                className="aspect-video w-full object-cover"
              />
            </div>
            <p className="text-xs font-medium text-[#5A635D]">
              Locked Living Room Set
            </p>
          </div>
          <div className="space-y-1.5">
            <div className="overflow-hidden rounded-xl border border-[#E6EAE3] bg-[#FAF7EE]">
              <img
                src={CHARACTER_SHEET_IMAGE}
                alt="Character Design Sheet showing the college student, Cooper the puppy, and Mom"
                referrerPolicy="no-referrer"
                className="aspect-video w-full object-cover"
              />
            </div>
            <p className="text-xs font-medium text-[#5A635D]">
              Locked Character Models
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          {[
            { src: BEAT_IMAGES[0], label: "Beat 1 · 0–7s" },
            { src: BEAT_IMAGES[1], label: "Beat 2 · 7–15s" },
            { src: BEAT_IMAGES[2], label: "Beat 3 · 15–23s (Apron)" },
            { src: BEAT_IMAGES[3], label: "Beat 4 · 23–30s" },
          ].map((preview) => (
            <div key={preview.label} className="space-y-2">
              <div className="aspect-video overflow-hidden rounded-xl bg-[#ECEFE9]">
                <img
                  src={preview.src}
                  alt={preview.label}
                  referrerPolicy="no-referrer"
                  className="animate-cel-preview h-full w-full object-cover"
                />
              </div>
              <p className="text-xs font-medium text-[#5A635D] sm:text-sm tabular-nums">
                {preview.label}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Scene Fields */}
      <div className="space-y-5 rounded-2xl border border-[#DCE1D8] bg-white p-5 sm:p-7">
        <div>
          <label
            htmlFor="scene-place"
            className="mb-2 block text-base font-semibold text-[#1E2420]"
          >
            Place
          </label>
          <textarea
            id="scene-place"
            rows={2}
            value={scene.place}
            onChange={(e) => updateField("place", e.target.value)}
            className="w-full rounded-xl border border-[#CFD7D0] bg-[#FAFBF9] px-4 py-3 text-base leading-relaxed text-[#1E2420] focus:border-[#2F6F6D] focus:bg-white focus:outline-none"
          />
        </div>

        <div>
          <label
            htmlFor="scene-characters"
            className="mb-2 block text-base font-semibold text-[#1E2420]"
          >
            Characters
          </label>
          <textarea
            id="scene-characters"
            rows={3}
            value={scene.characters}
            onChange={(e) => updateField("characters", e.target.value)}
            className="w-full rounded-xl border border-[#CFD7D0] bg-[#FAFBF9] px-4 py-3 text-base leading-relaxed text-[#1E2420] focus:border-[#2F6F6D] focus:bg-white focus:outline-none"
          />
        </div>

        <div>
          <label
            htmlFor="scene-situation"
            className="mb-2 block text-base font-semibold text-[#1E2420]"
          >
            Situation
          </label>
          <textarea
            id="scene-situation"
            rows={3}
            value={scene.situation}
            onChange={(e) => updateField("situation", e.target.value)}
            className="w-full rounded-xl border border-[#CFD7D0] bg-[#FAFBF9] px-4 py-3 text-base leading-relaxed text-[#1E2420] focus:border-[#2F6F6D] focus:bg-white focus:outline-none"
          />
        </div>
      </div>

      {/* Style Menu (5 Styles) */}
      <div className="mt-8">
        <h2 className="mb-4 text-xl font-semibold text-[#1E2420]">
          Style Selector
        </h2>
        <div
          role="radiogroup"
          aria-label="Animation style"
          className="grid grid-cols-1 gap-4 sm:grid-cols-2"
        >
          {STYLE_OPTIONS.map((style) => {
            const selected = scene.styleId === style.id;
            return (
              <button
                key={style.id}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => updateField("styleId", style.id as AnimationStyleId)}
                className={`flex min-h-[104px] flex-col justify-between rounded-2xl border p-5 text-left transition-all ${
                  selected
                    ? "border-[#2F6F6D] bg-[#EEF4F3] ring-2 ring-[#2F6F6D]/20"
                    : "border-[#DCE1D8] bg-white hover:border-[#B8C4BC]"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="text-lg font-semibold text-[#1E2420]">
                    {style.name}
                  </span>
                  <span
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${
                      selected
                        ? "border-[#2F6F6D] bg-[#2F6F6D] text-white"
                        : "border-[#C5CEC8] bg-white"
                    }`}
                  >
                    {selected && <Check className="h-4 w-4" aria-hidden="true" />}
                  </span>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-[#4B544E] sm:text-base">
                  {style.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {errorMessage && (
        <div
          role="alert"
          className="mt-6 rounded-2xl border border-[#DFB2B2] bg-[#FDF2F2] p-4 text-base text-[#7B2B2B]"
        >
          {errorMessage}
        </div>
      )}

      {/* Navigation & Storyboard Action */}
      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={onBack}
          disabled={isGenerating}
          className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-2xl border border-[#C8D1CA] bg-white px-6 py-3 text-base font-semibold text-[#2A332D] hover:bg-[#ECEFE9] active:scale-[0.98] transition-all"
        >
          <ArrowLeft className="h-5 w-5" aria-hidden="true" />
          <span>Back</span>
        </button>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {expressionsModified ? (
            <button
              type="button"
              onClick={onGenerateWithAI}
              disabled={isGenerating}
              className="inline-flex min-h-[54px] items-center justify-center gap-3 rounded-2xl bg-[#2F6F6D] px-8 py-3.5 text-lg font-semibold text-white shadow-sm hover:bg-[#265B59] disabled:opacity-60 active:scale-[0.98] transition-all"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
                  <span>Writing 4-Beat Storyboard...</span>
                </>
              ) : (
                <>
                  <Film className="h-5 w-5" aria-hidden="true" />
                  <span>Write Storyboard from My Expressions</span>
                </>
              )}
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={onGenerateWithAI}
                disabled={isGenerating}
                className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-2xl border border-[#C8D1CA] bg-white px-6 py-3 text-base font-semibold text-[#2A332D] hover:bg-[#ECEFE9] disabled:opacity-60 active:scale-[0.98] transition-all"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
                    <span>Rewriting...</span>
                  </>
                ) : (
                  <span>Rewrite Script with AI</span>
                )}
              </button>
              <button
                type="button"
                onClick={onProceedWithCurrent}
                disabled={isGenerating}
                className="inline-flex min-h-[54px] items-center justify-center gap-3 rounded-2xl bg-[#2F6F6D] px-8 py-3.5 text-lg font-semibold text-white shadow-sm hover:bg-[#265B59] disabled:opacity-60 active:scale-[0.98] transition-all"
              >
                <span>Next: 4-Beat Storyboard</span>
                <ArrowRight className="h-5 w-5" aria-hidden="true" />
              </button>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
