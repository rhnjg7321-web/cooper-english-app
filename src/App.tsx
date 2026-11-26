import { useMemo, useState } from "react";
import FinalScreen from "./components/FinalScreen";
import InputScreen from "./components/InputScreen";
import SceneScreen from "./components/SceneScreen";
import StepHeader from "./components/StepHeader";
import StoryboardScreen from "./components/StoryboardScreen";
import VideoScreen from "./components/VideoScreen";
import {
  BEAT_IMAGES,
  DEFAULT_BEATS,
  DEFAULT_EXPRESSIONS,
  DEFAULT_SCENE,
  STYLE_OPTIONS,
} from "./data/defaults";
import {
  AnimationStyleId,
  BeatItem,
  ExpressionItem,
  SceneConfig,
  ScreenStep,
  VoicePreset,
} from "./types/story";
import { stopBrowserSpeech } from "./utils/audioUtils";

export default function App() {
  const [currentStep, setCurrentStep] = useState<ScreenStep>(1);
  const [expressions, setExpressions] =
    useState<ExpressionItem[]>(DEFAULT_EXPRESSIONS);
  const [scene, setScene] = useState<SceneConfig>(DEFAULT_SCENE);
  const [beats, setBeats] = useState<BeatItem[]>(DEFAULT_BEATS);

  const [isGeneratingStoryboard, setIsGeneratingStoryboard] = useState(false);
  const [storyboardError, setStoryboardError] = useState<string | null>(null);
  const [regeneratingIndex, setRegeneratingIndex] = useState<number | null>(
    null
  );

  const [voicePreset, setVoicePreset] = useState<VoicePreset>("expressive");
  const [voiceURI, setVoiceURI] = useState<string>("");
  const [showKoreanSubtitles, setShowKoreanSubtitles] = useState(false);
  const [bgmEnabled, setBgmEnabled] = useState(true);

  const validExpressions = useMemo(
    () =>
      expressions.filter(
        (e) => e.expression.trim() && e.meaning.trim() && e.movie.trim()
      ),
    [expressions]
  );

  const uniqueMoviesCount = useMemo(
    () =>
      new Set(
        validExpressions.map((e) => e.movie.trim().toLowerCase())
      ).size,
    [validExpressions]
  );

  const canLeaveInput = validExpressions.length >= 5 && uniqueMoviesCount >= 2;

  const expressionsModified = useMemo(() => {
    if (expressions.length !== DEFAULT_EXPRESSIONS.length) return true;
    return expressions.some(
      (e, i) =>
        e.expression.trim() !== DEFAULT_EXPRESSIONS[i].expression ||
        e.movie.trim() !== DEFAULT_EXPRESSIONS[i].movie
    );
  }, [expressions]);

  const handleResetDefaults = () => {
    stopBrowserSpeech();
    setExpressions(DEFAULT_EXPRESSIONS);
    setScene(DEFAULT_SCENE);
    setBeats(DEFAULT_BEATS);
    setStoryboardError(null);
    setCurrentStep(1);
  };

  const handleChangeStyle = (nextStyle: AnimationStyleId) => {
    setScene((prev) => ({ ...prev, styleId: nextStyle }));
  };

  const handleGenerateStoryboard = async () => {
    setIsGeneratingStoryboard(true);
    setStoryboardError(null);
    const styleObj =
      STYLE_OPTIONS.find((s) => s.id === scene.styleId) ?? STYLE_OPTIONS[0];

    try {
      const response = await fetch("/api/storyboard/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          expressions: validExpressions,
          scene: {
            place: scene.place,
            characters: scene.characters,
            situation: scene.situation,
            styleName: styleObj.name,
            styleDescription: styleObj.description,
          },
        }),
      });

      const data = (await response.json()) as {
        beats?: Omit<BeatItem, "imageUrl">[];
        error?: string;
      };

      if (!response.ok || !data.beats || data.beats.length < 4) {
        throw new Error(
          data.error || "Could not generate a 4-beat storyboard."
        );
      }

      setBeats(
        data.beats.slice(0, 4).map((b, i) => ({
          ...b,
          imageUrl: BEAT_IMAGES[i],
        }))
      );
      setCurrentStep(3);
    } catch (err) {
      setStoryboardError(
        err instanceof Error ? err.message : "Failed to generate storyboard."
      );
    } finally {
      setIsGeneratingStoryboard(false);
    }
  };

  const handleUpdateBeat = (beatIndex: number, updated: BeatItem) => {
    setBeats((prev) =>
      prev.map((b, i) => (i === beatIndex ? updated : b))
    );
  };

  const handleRegenerateBeat = async (beatIndex: number) => {
    setRegeneratingIndex(beatIndex);
    setStoryboardError(null);
    const styleObj =
      STYLE_OPTIONS.find((s) => s.id === scene.styleId) ?? STYLE_OPTIONS[0];

    try {
      const response = await fetch("/api/storyboard/regenerate-beat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          beatIndex,
          beats,
          expressions: validExpressions,
          scene: {
            place: scene.place,
            characters: scene.characters,
            situation: scene.situation,
            styleName: styleObj.name,
            styleDescription: styleObj.description,
          },
        }),
      });

      const data = (await response.json()) as {
        beat?: Omit<BeatItem, "imageUrl">;
        error?: string;
      };

      if (!response.ok || !data.beat) {
        throw new Error(data.error || "Could not regenerate this beat.");
      }

      setBeats((prev) =>
        prev.map((b, i) =>
          i === beatIndex ? { ...data.beat!, imageUrl: b.imageUrl } : b
        )
      );
    } catch (err) {
      setStoryboardError(
        err instanceof Error ? err.message : "Failed to regenerate beat."
      );
    } finally {
      setRegeneratingIndex(null);
    }
  };

  const handleNavigate = (step: ScreenStep) => {
    if (step > 1 && !canLeaveInput) return;
    stopBrowserSpeech();
    setCurrentStep(step);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-[#F6F7F4] text-[#1E2420]">
      <StepHeader
        currentStep={currentStep}
        onNavigate={handleNavigate}
        onResetDefaults={handleResetDefaults}
        canLeaveInput={canLeaveInput}
      />

      <main className="pb-16">
        {currentStep === 1 && (
          <InputScreen
            expressions={expressions}
            onChange={setExpressions}
            onNext={() => handleNavigate(2)}
          />
        )}

        {currentStep === 2 && (
          <SceneScreen
            scene={scene}
            onChange={setScene}
            onBack={() => handleNavigate(1)}
            onProceedWithCurrent={() => handleNavigate(3)}
            onGenerateWithAI={handleGenerateStoryboard}
            isGenerating={isGeneratingStoryboard}
            errorMessage={storyboardError}
            expressionsModified={expressionsModified}
          />
        )}

        {currentStep === 3 && (
          <StoryboardScreen
            beats={beats}
            expressions={expressions}
            styleId={scene.styleId}
            onChangeStyle={handleChangeStyle}
            onUpdateBeat={handleUpdateBeat}
            onRegenerateBeat={handleRegenerateBeat}
            regeneratingIndex={regeneratingIndex}
            errorMessage={storyboardError}
            onBack={() => handleNavigate(2)}
            onBuildVideo={() => handleNavigate(4)}
          />
        )}

        {currentStep === 4 && (
          <VideoScreen
            beats={beats}
            styleId={scene.styleId}
            onChangeStyle={handleChangeStyle}
            voicePreset={voicePreset}
            voiceURI={voiceURI}
            onChangeVoicePreset={setVoicePreset}
            onChangeVoiceURI={setVoiceURI}
            showKoreanSubtitles={showKoreanSubtitles}
            onToggleKoreanSubtitles={() => setShowKoreanSubtitles((v) => !v)}
            bgmEnabled={bgmEnabled}
            onToggleBgm={() => setBgmEnabled((v) => !v)}
            onBack={() => handleNavigate(3)}
            onNext={() => handleNavigate(5)}
          />
        )}

        {currentStep === 5 && (
          <FinalScreen
            beats={beats}
            expressions={expressions}
            styleId={scene.styleId}
            voicePreset={voicePreset}
            voiceURI={voiceURI}
            showKoreanSubtitles={showKoreanSubtitles}
            onToggleKoreanSubtitles={() => setShowKoreanSubtitles((v) => !v)}
            bgmEnabled={bgmEnabled}
            onToggleBgm={() => setBgmEnabled((v) => !v)}
            onBack={() => handleNavigate(4)}
            onStartOver={handleResetDefaults}
          />
        )}
      </main>
    </div>
  );
}
