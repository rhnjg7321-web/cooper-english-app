import "dotenv/config";
import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI, ThinkingLevel, Type } from "@google/genai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;

function getAiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured in environment secrets.");
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

interface ExpressionPayload {
  expression: string;
  meaning: string;
  movie: string;
}

interface ScenePayload {
  place: string;
  characters: string;
  situation: string;
  styleName: string;
  styleDescription: string;
}

interface BeatPayload {
  id: string;
  timeRange: string;
  startSec: number;
  endSec: number;
  sceneDescription: string;
  englishLine: string;
  koreanSubtitle?: string;
  usedExpressions: string[];
  sourceMovies: string[];
}

function getErrorStatus(err: unknown): { status: number; message: string } {
  const msg = err instanceof Error ? err.message : "Unexpected server error";
  if (msg.includes("API_KEY_INVALID") || msg.includes("400")) {
    return {
      status: 400,
      message: "Invalid Gemini API key. Please check Settings > Secrets.",
    };
  }
  if (msg.includes("PERMISSION_DENIED") || msg.includes("403")) {
    return {
      status: 403,
      message: "Gemini API permission denied. Please check your API key in Settings > Secrets.",
    };
  }
  if (msg.includes("RESOURCE_EXHAUSTED") || msg.includes("429")) {
    return {
      status: 429,
      message: "Gemini API rate limit reached. Please try again in a few moments.",
    };
  }
  return { status: 500, message: msg };
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: "4mb" }));

  app.post("/api/storyboard/generate", async (req, res) => {
    try {
      const { expressions, scene } = req.body as {
        expressions: ExpressionPayload[];
        scene: ScenePayload;
      };

      if (!Array.isArray(expressions) || expressions.length < 5) {
        res.status(400).json({ error: "Please provide at least 5 English expressions." });
        return;
      }

      const uniqueMovies = new Set(
        expressions.map((e) => e.movie.trim().toLowerCase()).filter(Boolean)
      );
      if (uniqueMovies.size < 2) {
        res.status(400).json({ error: "Please include expressions from at least 2 different movies." });
        return;
      }

      const ai = getAiClient();
      const exprSummary = expressions
        .map((e, i) => `${i + 1}. "${e.expression}" (Korean: ${e.meaning}, Movie: ${e.movie})`)
        .join("\n");

      const prompt = `Write a 4-beat 30-second animated short-film storyboard for Korean university students learning everyday English.

SCENE CONTEXT:
- Place: ${scene.place}
- Characters: ${scene.characters}
- Situation: ${scene.situation}
- Visual Style: ${scene.styleName} (${scene.styleDescription})

TARGET EXPRESSIONS (EVERY SINGLE ONE MUST APPEAR VERBATIM — EXACT WORDS AND SPELLING — IN THE ENGLISH LINES):
${exprSummary}

REQUIREMENTS:
1. Split the 30-second story into exactly 4 beats with these fixed time ranges:
   - Beat 1: "0~7s" (Opening discovery of the mess)
   - Beat 2: "7~15s" (Rising panic and reaction)
   - Beat 3: "15~23s" (Super-speed cleaning and Mom arriving while Cooper acts innocent)
   - Beat 4: "23~30s" (Mom blaming the student and comedic ending)
2. Keep the TOTAL English word count across all 4 beats' "englishLine" fields strictly between 60 and 70 words (aim for ~65 words).
3. Every single target expression above must be included verbatim (exact phrase) in at least one beat's "englishLine".
4. Write "sceneDescription" in natural, vivid Korean (2-3 sentences per beat) keeping the exact same characters, yellow sweater, navy cardigan, brown-and-white puppy Cooper, beige sofa, and wooden floor.
5. Family-friendly, warm comedic tone. No real people, celebrities, movie character names, or brand logos.`;

      const response = await ai.models.generateContent({
        model: "gemini-4-hydrogen",
        contents: prompt,
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              beats: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    timeRange: { type: Type.STRING },
                    sceneDescription: { type: Type.STRING },
                    englishLine: { type: Type.STRING },
                    koreanSubtitle: { type: Type.STRING },
                    usedExpressions: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                    },
                    sourceMovies: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                    },
                  },
                  required: [
                    "timeRange",
                    "sceneDescription",
                    "englishLine",
                    "koreanSubtitle",
                    "usedExpressions",
                    "sourceMovies",
                  ],
                },
              },
            },
            required: ["beats"],
          },
        },
      });

      const rawText = (response.text ?? "{}").trim();
      const parsed = JSON.parse(rawText) as { beats?: Omit<BeatPayload, "id" | "startSec" | "endSec">[] };
      const timings = [
        { timeRange: "0~7s", startSec: 0, endSec: 7 },
        { timeRange: "7~15s", startSec: 7, endSec: 15 },
        { timeRange: "15~23s", startSec: 15, endSec: 23 },
        { timeRange: "23~30s", startSec: 23, endSec: 30 },
      ];

      const beats = (parsed.beats ?? []).slice(0, 4).map((beat, index) => ({
        id: `beat-${index + 1}`,
        timeRange: timings[index].timeRange,
        startSec: timings[index].startSec,
        endSec: timings[index].endSec,
        sceneDescription: beat.sceneDescription,
        englishLine: beat.englishLine,
        koreanSubtitle: beat.koreanSubtitle ?? "",
        usedExpressions: beat.usedExpressions ?? [],
        sourceMovies: beat.sourceMovies ?? [],
      }));

      res.json({ beats });
    } catch (err) {
      const { status, message } = getErrorStatus(err);
      res.status(status).json({ error: message });
    }
  });

  app.post("/api/storyboard/regenerate-beat", async (req, res) => {
    try {
      const { beatIndex, beats, expressions, scene } = req.body as {
        beatIndex: number;
        beats: BeatPayload[];
        expressions: ExpressionPayload[];
        scene: ScenePayload;
      };

      if (typeof beatIndex !== "number" || beatIndex < 0 || beatIndex > 3 || !Array.isArray(beats)) {
        res.status(400).json({ error: "Invalid beat index or storyboard data." });
        return;
      }

      const targetBeat = beats[beatIndex];
      const otherWords = beats.reduce((sum, b, idx) => {
        if (idx === beatIndex) return sum;
        const count = b.englishLine.trim().split(/\s+/).filter(Boolean).length;
        return sum + count;
      }, 0);

      const minWordsForBeat = Math.max(10, 60 - otherWords);
      const maxWordsForBeat = Math.max(minWordsForBeat + 3, 70 - otherWords);

      const targetExprNames = targetBeat.usedExpressions.length
        ? targetBeat.usedExpressions
        : [expressions[beatIndex]?.expression].filter(Boolean);

      const matchedExprObjects = expressions.filter((e) =>
        targetExprNames.some((name) => name.toLowerCase() === e.expression.toLowerCase())
      );

      const exprListText = matchedExprObjects
        .map((e) => `- "${e.expression}" (Korean: ${e.meaning}, Movie: ${e.movie})`)
        .join("\n");

      const neighborContext = beats
        .map((b, idx) =>
          idx === beatIndex
            ? `[BEAT ${idx + 1} (${b.timeRange}) — REWRITE THIS BEAT]`
            : `[BEAT ${idx + 1} (${b.timeRange})]: Scene: ${b.sceneDescription} | Line: "${b.englishLine}"`
        )
        .join("\n");

      const ai = getAiClient();
      const prompt = `Rewrite ONLY Beat ${beatIndex + 1} (${targetBeat.timeRange}) of this 30-second English learning short film so it flows smoothly with the other 3 beats.

SCENE CONTEXT:
- Place: ${scene.place}
- Characters: ${scene.characters}
- Situation: ${scene.situation}

FULL STORYBOARD CONTEXT:
${neighborContext}

REQUIRED EXPRESSIONS FOR BEAT ${beatIndex + 1} (MUST APPEAR VERBATIM IN englishLine):
${exprListText || targetExprNames.join(", ")}

WORD COUNT BUDGET:
- The other 3 beats currently use ${otherWords} English words.
- Write this beat's "englishLine" with ${minWordsForBeat} to ${maxWordsForBeat} words so the whole 4-beat script stays within 60-70 words.
- Write "sceneDescription" in vivid Korean (2-3 sentences) keeping consistent characters, yellow sweater, navy cardigan, and Cooper.
- Keep it family-friendly and natural for spoken English voice acting.`;

      const response = await ai.models.generateContent({
        model: "gemini-4-hydrogen",
        contents: prompt,
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              sceneDescription: { type: Type.STRING },
              englishLine: { type: Type.STRING },
              koreanSubtitle: { type: Type.STRING },
              usedExpressions: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              sourceMovies: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
            },
            required: [
              "sceneDescription",
              "englishLine",
              "koreanSubtitle",
              "usedExpressions",
              "sourceMovies",
            ],
          },
        },
      });

      const rawText = (response.text ?? "{}").trim();
      const parsed = JSON.parse(rawText) as {
        sceneDescription: string;
        englishLine: string;
        koreanSubtitle: string;
        usedExpressions: string[];
        sourceMovies: string[];
      };

      res.json({
        beat: {
          ...targetBeat,
          sceneDescription: parsed.sceneDescription,
          englishLine: parsed.englishLine,
          koreanSubtitle: parsed.koreanSubtitle ?? targetBeat.koreanSubtitle,
          usedExpressions: parsed.usedExpressions ?? targetBeat.usedExpressions,
          sourceMovies: parsed.sourceMovies ?? targetBeat.sourceMovies,
        },
      });
    } catch (err) {
      const { status, message } = getErrorStatus(err);
      res.status(status).json({ error: message });
    }
  });

  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, "dist");
    if (fs.existsSync(distDir)) {
      app.use(express.static(distDir));
      app.get("*", (_req, res) => {
        res.sendFile(path.join(distDir, "index.html"));
      });
    }
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Cooper server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
