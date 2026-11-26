export type ScreenStep = 1 | 2 | 3 | 4 | 5;

export interface ExpressionItem {
  id: string;
  expression: string;
  meaning: string;
  movie: string;
}

export type AnimationStyleId =
  | "1990s-cel"
  | "2d-animation"
  | "clay"
  | "watercolor"
  | "live-action";

export interface StyleOption {
  id: AnimationStyleId;
  name: string;
  description: string;
}

export interface SceneConfig {
  place: string;
  characters: string;
  situation: string;
  styleId: AnimationStyleId;
}

export interface BeatItem {
  id: string;
  timeRange: string;
  startSec: number;
  endSec: number;
  sceneDescription: string;
  englishLine: string;
  subtitles?: string;
  koreanSubtitle?: string;
  usedExpressions: string[];
  sourceMovies: string[];
  imageUrl: string;
}

export type VoicePreset = "expressive" | "gentle";

export interface BrowserVoiceOption {
  voiceURI: string;
  name: string;
  lang: string;
}
