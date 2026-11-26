import { AnimationStyleId, BeatItem } from "../types/story";
import { buildTimedSubtitlesForBeat, TimedSubtitleCue } from "./subtitleUtils";

export const VIDEO_WIDTH = 1280;
export const VIDEO_HEIGHT = 720;

interface FluffParticle {
  x: number;
  y: number;
  r: number;
  vx: number;
  vy: number;
  phase: number;
}

const FLUFF_PARTICLES: FluffParticle[] = Array.from({ length: 34 }, (_, i) => ({
  x: ((i * 197) % 1280) / 1280,
  y: ((i * 313) % 720) / 720,
  r: 4 + (i % 5) * 2.2,
  vx: ((i % 3) - 1) * 0.022,
  vy: 0.038 + (i % 4) * 0.015,
  phase: i * 0.85,
}));

let grainCanvas: HTMLCanvasElement | null = null;

function getGrainPatternCanvas(): HTMLCanvasElement {
  if (grainCanvas) return grainCanvas;
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 256;
  const gctx = c.getContext("2d");
  if (gctx) {
    const imgData = gctx.createImageData(256, 256);
    const data = imgData.data;
    for (let i = 0; i < data.length; i += 4) {
      const val = Math.floor(Math.random() * 255);
      data[i] = val;
      data[i + 1] = val;
      data[i + 2] = val;
      data[i + 3] = 22;
    }
    gctx.putImageData(imgData, 0, 0);
  }
  grainCanvas = c;
  return c;
}

export async function preloadBeatImages(
  beats: BeatItem[]
): Promise<Record<string, HTMLImageElement | null>> {
  const entries = await Promise.all(
    beats.map(
      (beat) =>
        new Promise<readonly [string, HTMLImageElement | null]>((resolve) => {
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.onload = () => resolve([beat.id, img]);
          img.onerror = () => resolve([beat.id, null]);
          img.src = beat.imageUrl;
        })
    )
  );
  return Object.fromEntries(entries);
}

export function buildCueTimeline(
  beats: BeatItem[]
): Record<string, TimedSubtitleCue[]> {
  const map: Record<string, TimedSubtitleCue[]> = {};
  for (const beat of beats) {
    const duration = beat.endSec - beat.startSec;
    const textForSubs = beat.englishLine.trim();
    map[beat.id] = buildTimedSubtitlesForBeat(
      textForSubs,
      duration,
      duration * 0.86
    );
  }
  return map;
}

function easeInOutSine(t: number): number {
  return -(Math.cos(Math.PI * t) - 1) / 2;
}

interface MotionTransform {
  zoom: number;
  panX: number;
  panY: number;
  tiltRad: number;
}

function getBeatMotionTransform(
  beatIndex: number,
  beatLocalSec: number,
  beatProgress: number
): MotionTransform {
  const eased = easeInOutSine(beatProgress);
  const bounceY = Math.sin(beatLocalSec * 3.1) * 4.5;
  const microSwayX = Math.sin(beatLocalSec * 1.9) * 3.0;
  const microTilt = Math.sin(beatLocalSec * 2.2) * 0.0055;

  if (beatIndex === 0) {
    return {
      zoom: 1.03 + eased * 0.11,
      panX: 28 - eased * 54 + microSwayX,
      panY: -8 + eased * 14 + bounceY,
      tiltRad: microTilt,
    };
  }
  if (beatIndex === 1) {
    const playfulBounce = Math.abs(Math.sin(beatLocalSec * 3.6)) * 5.0;
    return {
      zoom: 1.04 + eased * 0.12,
      panX: -18 + eased * 36 + Math.sin(beatLocalSec * 3.2) * 4,
      panY: 10 - eased * 18 - playfulBounce,
      tiltRad: Math.sin(beatLocalSec * 3.4) * 0.007,
    };
  }
  if (beatIndex === 2) {
    return {
      zoom: 1.15 - eased * 0.12,
      panX: -32 + eased * 64 + microSwayX,
      panY: -6 + eased * 10 + bounceY * 0.85,
      tiltRad: -microTilt * 0.8,
    };
  }
  return {
    zoom: 1.03 + eased * 0.1,
    panX: 22 - eased * 44 + microSwayX,
    panY: 8 - eased * 14 + bounceY,
    tiltRad: microTilt * 0.7,
  };
}

export function getStyleCssFilter(styleId: AnimationStyleId): string {
  switch (styleId) {
    case "1990s-cel":
      return "sepia(0.08) saturate(1.06) contrast(1.02)";
    case "2d-animation":
      return "saturate(1.24) contrast(1.1) brightness(1.03)";
    case "clay":
      return "sepia(0.14) saturate(0.92) contrast(1.12) brightness(0.97)";
    case "watercolor":
      return "sepia(0.08) brightness(1.08) saturate(0.84) contrast(0.9)";
    case "live-action":
      return "contrast(1.15) saturate(0.92) brightness(0.98) sepia(0.04)";
  }
}

function drawCoverImage(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement | null,
  transform: MotionTransform,
  alpha: number,
  styleId: AnimationStyleId
) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.filter = getStyleCssFilter(styleId);

  ctx.translate(VIDEO_WIDTH / 2 + transform.panX, VIDEO_HEIGHT / 2 + transform.panY);
  ctx.rotate(transform.tiltRad);

  if (img && img.naturalWidth > 0) {
    const scale =
      Math.max(VIDEO_WIDTH / img.naturalWidth, VIDEO_HEIGHT / img.naturalHeight) *
      transform.zoom;
    const drawW = img.naturalWidth * scale;
    const drawH = img.naturalHeight * scale;
    ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
  } else {
    const grad = ctx.createLinearGradient(
      -VIDEO_WIDTH / 2,
      -VIDEO_HEIGHT / 2,
      VIDEO_WIDTH / 2,
      VIDEO_HEIGHT / 2
    );
    grad.addColorStop(0, "#EFE8D8");
    grad.addColorStop(1, "#DFD4BE");
    ctx.fillStyle = grad;
    ctx.fillRect(-VIDEO_WIDTH / 2, -VIDEO_HEIGHT / 2, VIDEO_WIDTH, VIDEO_HEIGHT);
  }

  ctx.restore();
}

function drawBeatMotionEffects(
  ctx: CanvasRenderingContext2D,
  beatIndex: number,
  beatLocalSec: number,
  beatProgress: number
) {
  ctx.save();

  if (beatIndex === 0) {
    for (const p of FLUFF_PARTICLES) {
      const px =
        ((p.x + p.vx * beatLocalSec + Math.sin(beatLocalSec * 1.6 + p.phase) * 0.025 + 10) %
          1) *
        VIDEO_WIDTH;
      const py = ((p.y + p.vy * beatLocalSec) % 1) * VIDEO_HEIGHT;
      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(beatLocalSec * 1.1 + p.phase);
      ctx.fillStyle = "rgba(255, 253, 248, 0.78)";
      ctx.beginPath();
      ctx.ellipse(0, 0, p.r, p.r * 0.65, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  } else if (beatIndex === 1) {
    const pulse = 0.28 + 0.16 * Math.sin(beatLocalSec * 5);
    ctx.strokeStyle = `rgba(255, 238, 194, ${pulse.toFixed(2)})`;
    ctx.lineWidth = 3.5;
    for (let ring = 0; ring < 2; ring++) {
      ctx.beginPath();
      const baseAngle = beatLocalSec * 2.6 + ring * Math.PI;
      ctx.arc(
        VIDEO_WIDTH * 0.5,
        VIDEO_HEIGHT * 0.34,
        180 + ring * 28,
        baseAngle,
        baseAngle + 1.3
      );
      ctx.stroke();
    }
    for (let i = 0; i < 14; i++) {
      const p = FLUFF_PARTICLES[i];
      const px =
        ((p.x + p.vx * beatLocalSec + Math.sin(beatLocalSec * 1.4 + p.phase) * 0.02 + 10) %
          1) *
        VIDEO_WIDTH;
      const py = ((p.y + p.vy * beatLocalSec * 0.8) % 1) * VIDEO_HEIGHT;
      ctx.fillStyle = "rgba(255, 252, 244, 0.55)";
      ctx.beginPath();
      ctx.arc(px, py, p.r * 0.65, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (beatIndex === 2) {
    const sweepX = -200 + beatProgress * (VIDEO_WIDTH + 400);
    const sweepGrad = ctx.createLinearGradient(sweepX - 120, 0, sweepX + 120, VIDEO_HEIGHT);
    sweepGrad.addColorStop(0, "rgba(255, 252, 235, 0)");
    sweepGrad.addColorStop(0.5, "rgba(255, 252, 235, 0.14)");
    sweepGrad.addColorStop(1, "rgba(255, 252, 235, 0)");
    ctx.fillStyle = sweepGrad;
    ctx.fillRect(0, 0, VIDEO_WIDTH, VIDEO_HEIGHT);

    for (let i = 0; i < 10; i++) {
      const sparklePhase = (beatLocalSec * 1.8 + i * 0.65) % 2;
      const opacity = sparklePhase < 1 ? sparklePhase : 2 - sparklePhase;
      const sx = VIDEO_WIDTH * (0.1 + ((i * 0.09) % 0.82));
      const sy = VIDEO_HEIGHT * (0.18 + ((i * 0.17) % 0.54));
      const size = 6 + opacity * 8;
      ctx.fillStyle = `rgba(255, 250, 224, ${(opacity * 0.78).toFixed(2)})`;
      ctx.beginPath();
      ctx.moveTo(sx, sy - size);
      ctx.quadraticCurveTo(sx, sy, sx + size, sy);
      ctx.quadraticCurveTo(sx, sy, sx, sy + size);
      ctx.quadraticCurveTo(sx, sy, sx - size, sy);
      ctx.quadraticCurveTo(sx, sy, sx, sy - size);
      ctx.fill();
    }
  } else if (beatIndex === 3) {
    for (let i = 0; i < 18; i++) {
      const mx =
        VIDEO_WIDTH *
        ((0.08 + i * 0.055 + Math.sin(beatLocalSec * 0.9 + i) * 0.025 + 10) % 0.95);
      const my =
        VIDEO_HEIGHT * ((0.14 + i * 0.05 + beatLocalSec * 0.02) % 0.82);
      ctx.fillStyle = `rgba(255, 244, 212, ${(
        0.28 +
        0.18 * Math.sin(beatProgress * 7 + i)
      ).toFixed(2)})`;
      ctx.beginPath();
      ctx.arc(mx, my, 2.5 + (i % 3), 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.restore();
}

function drawStyleOverlay(
  ctx: CanvasRenderingContext2D,
  styleId: AnimationStyleId,
  timeSec: number
) {
  ctx.save();

  if (styleId === "1990s-cel") {
    const sunGrad = ctx.createRadialGradient(
      VIDEO_WIDTH * 0.72,
      VIDEO_HEIGHT * 0.18,
      20,
      VIDEO_WIDTH * 0.72,
      VIDEO_HEIGHT * 0.18,
      640
    );
    sunGrad.addColorStop(0, "rgba(255, 224, 165, 0.16)");
    sunGrad.addColorStop(1, "rgba(255, 224, 165, 0)");
    ctx.fillStyle = sunGrad;
    ctx.fillRect(0, 0, VIDEO_WIDTH, VIDEO_HEIGHT);

    const grain = getGrainPatternCanvas();
    const ox = Math.floor((timeSec * 24) % 7) * 19;
    const oy = Math.floor((timeSec * 24) % 5) * 23;
    ctx.globalAlpha = 0.24;
    const pattern = ctx.createPattern(grain, "repeat");
    if (pattern) {
      ctx.translate(-ox, -oy);
      ctx.fillStyle = pattern;
      ctx.fillRect(ox, oy, VIDEO_WIDTH + ox, VIDEO_HEIGHT + oy);
      ctx.translate(ox, oy);
    }

    ctx.globalAlpha = 1;
    const vig = ctx.createRadialGradient(
      VIDEO_WIDTH / 2,
      VIDEO_HEIGHT / 2,
      VIDEO_WIDTH * 0.36,
      VIDEO_WIDTH / 2,
      VIDEO_HEIGHT / 2,
      VIDEO_WIDTH * 0.7
    );
    vig.addColorStop(0, "rgba(20, 15, 10, 0)");
    vig.addColorStop(1, "rgba(28, 22, 16, 0.2)");
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, VIDEO_WIDTH, VIDEO_HEIGHT);
  } else if (styleId === "2d-animation") {
    const rim = ctx.createLinearGradient(0, 0, VIDEO_WIDTH, VIDEO_HEIGHT);
    rim.addColorStop(0, "rgba(235, 248, 255, 0.08)");
    rim.addColorStop(1, "rgba(255, 246, 224, 0.04)");
    ctx.fillStyle = rim;
    ctx.fillRect(0, 0, VIDEO_WIDTH, VIDEO_HEIGHT);
  } else if (styleId === "clay") {
    const grain = getGrainPatternCanvas();
    ctx.globalAlpha = 0.28;
    const pattern = ctx.createPattern(grain, "repeat");
    if (pattern) {
      ctx.fillStyle = pattern;
      ctx.fillRect(0, 0, VIDEO_WIDTH, VIDEO_HEIGHT);
    }
    ctx.globalAlpha = 1;
    const vig = ctx.createRadialGradient(
      VIDEO_WIDTH / 2,
      VIDEO_HEIGHT / 2,
      VIDEO_WIDTH * 0.25,
      VIDEO_WIDTH / 2,
      VIDEO_HEIGHT / 2,
      VIDEO_WIDTH * 0.65
    );
    vig.addColorStop(0, "rgba(255, 242, 215, 0.06)");
    vig.addColorStop(1, "rgba(28, 20, 14, 0.32)");
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, VIDEO_WIDTH, VIDEO_HEIGHT);
  } else if (styleId === "watercolor") {
    const grain = getGrainPatternCanvas();
    ctx.globalAlpha = 0.22;
    const pattern = ctx.createPattern(grain, "repeat");
    if (pattern) {
      ctx.fillStyle = pattern;
      ctx.fillRect(0, 0, VIDEO_WIDTH, VIDEO_HEIGHT);
    }
    ctx.globalAlpha = 1;
    const paperEdge = ctx.createRadialGradient(
      VIDEO_WIDTH / 2,
      VIDEO_HEIGHT / 2,
      VIDEO_WIDTH * 0.3,
      VIDEO_WIDTH / 2,
      VIDEO_HEIGHT / 2,
      VIDEO_WIDTH * 0.72
    );
    paperEdge.addColorStop(0, "rgba(255, 252, 245, 0.06)");
    paperEdge.addColorStop(1, "rgba(250, 245, 232, 0.28)");
    ctx.fillStyle = paperEdge;
    ctx.fillRect(0, 0, VIDEO_WIDTH, VIDEO_HEIGHT);
  } else if (styleId === "live-action") {
    ctx.fillStyle = "rgba(12, 14, 16, 0.9)";
    ctx.fillRect(0, 0, VIDEO_WIDTH, 24);
    ctx.fillRect(0, VIDEO_HEIGHT - 24, VIDEO_WIDTH, 24);
    const lensGlow = ctx.createRadialGradient(
      VIDEO_WIDTH * 0.78,
      VIDEO_HEIGHT * 0.16,
      10,
      VIDEO_WIDTH * 0.78,
      VIDEO_HEIGHT * 0.16,
      540
    );
    lensGlow.addColorStop(0, "rgba(255, 236, 196, 0.16)");
    lensGlow.addColorStop(1, "rgba(255, 236, 196, 0)");
    ctx.fillStyle = lensGlow;
    ctx.fillRect(0, 0, VIDEO_WIDTH, VIDEO_HEIGHT);
  }

  ctx.restore();
}

function drawBurnedInSubtitles(
  ctx: CanvasRenderingContext2D,
  lines: string[],
  koreanSubtitle?: string
) {
  if (lines.length === 0) return;

  ctx.save();

  const visibleLines = lines.slice(0, 2);
  ctx.font = '700 31px "Plus Jakarta Sans", "Noto Sans KR", sans-serif';
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  const engLineHeight = 40;
  let maxWidth = visibleLines.reduce(
    (max, line) => Math.max(max, ctx.measureText(line).width),
    0
  );

  const hasKorean = Boolean(koreanSubtitle && koreanSubtitle.trim());
  const korText = koreanSubtitle?.trim() || "";
  if (hasKorean) {
    ctx.font = '500 22px "Noto Sans KR", "Plus Jakarta Sans", sans-serif';
    maxWidth = Math.max(maxWidth, ctx.measureText(korText).width);
  }

  const korHeight = hasKorean ? 34 : 0;
  const boxWidth = Math.min(VIDEO_WIDTH - 64, maxWidth + 52);
  const boxHeight = visibleLines.length * engLineHeight + korHeight + 22;
  const boxX = (VIDEO_WIDTH - boxWidth) / 2;
  const boxY = VIDEO_HEIGHT - boxHeight - 26;

  // Semi-transparent dark background
  ctx.fillStyle = "rgba(14, 18, 17, 0.80)";
  ctx.beginPath();
  ctx.roundRect(boxX, boxY, boxWidth, boxHeight, 14);
  ctx.fill();

  ctx.font = '700 31px "Plus Jakarta Sans", "Noto Sans KR", sans-serif';
  const firstLineY = boxY + 11 + engLineHeight / 2;
  visibleLines.forEach((line, idx) => {
    const y = firstLineY + idx * engLineHeight;
    ctx.fillStyle = "#FFFFFF";
    ctx.fillText(line, VIDEO_WIDTH / 2, y);
  });

  if (hasKorean) {
    ctx.font = '500 22px "Noto Sans KR", "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = "#E6ECE8";
    const korY = firstLineY + visibleLines.length * engLineHeight + 2;
    ctx.fillText(korText, VIDEO_WIDTH / 2, korY);
  }

  ctx.restore();
}

function drawEndCreditOverlay(ctx: CanvasRenderingContext2D, alpha: number) {
  if (alpha <= 0) return;
  ctx.save();
  ctx.globalAlpha = alpha;

  ctx.fillStyle = "#1E2420";
  ctx.fillRect(0, 0, VIDEO_WIDTH, VIDEO_HEIGHT);

  const glow = ctx.createRadialGradient(
    VIDEO_WIDTH / 2,
    VIDEO_HEIGHT / 2,
    40,
    VIDEO_WIDTH / 2,
    VIDEO_HEIGHT / 2,
    560
  );
  glow.addColorStop(0, "rgba(47, 111, 109, 0.25)");
  glow.addColorStop(1, "rgba(30, 36, 32, 0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, VIDEO_WIDTH, VIDEO_HEIGHT);

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  ctx.font = '600 56px "Lora", Georgia, serif';
  ctx.fillStyle = "#F6F7F4";
  ctx.fillText("Cooper", VIDEO_WIDTH / 2, VIDEO_HEIGHT / 2 - 34);

  ctx.font = '600 28px "Plus Jakarta Sans", "Noto Sans KR", sans-serif';
  ctx.fillStyle = "#D8E2DC";
  ctx.fillText(
    "Made with Google AI Studio · Script by 정라현",
    VIDEO_WIDTH / 2,
    VIDEO_HEIGHT / 2 + 34
  );

  ctx.restore();
}

export function renderCoverThumbnailFrame(
  ctx: CanvasRenderingContext2D,
  coverImage: HTMLImageElement | null,
  styleId: AnimationStyleId,
  styleLabel: string
) {
  ctx.clearRect(0, 0, VIDEO_WIDTH, VIDEO_HEIGHT);

  drawCoverImage(
    ctx,
    coverImage,
    { zoom: 1.04, panX: 0, panY: 0, tiltRad: 0 },
    1,
    styleId
  );
  drawStyleOverlay(ctx, styleId, 0);

  // Subtle top & bottom framing scrim for crisp title typography
  const scrim = ctx.createLinearGradient(0, 0, 0, VIDEO_HEIGHT);
  scrim.addColorStop(0, "rgba(18, 22, 20, 0.45)");
  scrim.addColorStop(0.45, "rgba(18, 22, 20, 0.12)");
  scrim.addColorStop(1, "rgba(18, 22, 20, 0.78)");
  ctx.fillStyle = scrim;
  ctx.fillRect(0, 0, VIDEO_WIDTH, VIDEO_HEIGHT);

  // Clean unboxed top-left style kicker
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.font = '600 22px "Plus Jakarta Sans", "Noto Sans KR", sans-serif';
  ctx.fillStyle = "rgba(246, 247, 244, 0.92)";
  ctx.fillText(`30s Animated English Short · ${styleLabel}`, 48, 42);

  // Bottom Cover Title Card
  ctx.textBaseline = "alphabetic";
  ctx.font = '700 62px "Lora", Georgia, serif';
  ctx.fillStyle = "#FFFFFF";
  ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
  ctx.shadowBlur = 16;
  ctx.fillText("Cooper's 10-Minute Miracle", 48, VIDEO_HEIGHT - 84);

  ctx.shadowBlur = 0;
  ctx.font = '500 26px "Plus Jakarta Sans", "Noto Sans KR", sans-serif';
  ctx.fillStyle = "#E7ECE8";
  ctx.fillText(
    "Everyday Movie English Expressions · Script by 정라현",
    48,
    VIDEO_HEIGHT - 42
  );
}

export function renderVideoFrame(
  ctx: CanvasRenderingContext2D,
  timeSec: number,
  beats: BeatItem[],
  images: Record<string, HTMLImageElement | null>,
  cueTimeline: Record<string, TimedSubtitleCue[]>,
  styleId: AnimationStyleId,
  showKoreanSubtitles = false
) {
  const clampedTime = Math.max(0, Math.min(30, timeSec));
  let beatIdx = beats.findIndex(
    (b) => clampedTime >= b.startSec && clampedTime < b.endSec
  );
  if (beatIdx === -1) {
    beatIdx = beats.length - 1;
  }

  const currentBeat = beats[beatIdx];
  const beatDuration = Math.max(1, currentBeat.endSec - currentBeat.startSec);
  const beatLocalSec = Math.max(0, clampedTime - currentBeat.startSec);
  const beatProgress = Math.min(1, beatLocalSec / beatDuration);

  const currentTransform = getBeatMotionTransform(
    beatIdx,
    beatLocalSec,
    beatProgress
  );

  ctx.clearRect(0, 0, VIDEO_WIDTH, VIDEO_HEIGHT);

  const transitionDuration = 0.4;
  if (beatIdx > 0 && beatLocalSec < transitionDuration) {
    const prevBeat = beats[beatIdx - 1];
    const prevDuration = Math.max(1, prevBeat.endSec - prevBeat.startSec);
    const prevTransform = getBeatMotionTransform(beatIdx - 1, prevDuration, 1);
    drawCoverImage(ctx, images[prevBeat.id] ?? null, prevTransform, 1, styleId);
    const fadeIn = beatLocalSec / transitionDuration;
    drawCoverImage(
      ctx,
      images[currentBeat.id] ?? null,
      currentTransform,
      fadeIn,
      styleId
    );
  } else {
    drawCoverImage(
      ctx,
      images[currentBeat.id] ?? null,
      currentTransform,
      1,
      styleId
    );
  }

  drawBeatMotionEffects(ctx, beatIdx, beatLocalSec, beatProgress);
  drawStyleOverlay(ctx, styleId, clampedTime);

  const cues = cueTimeline[currentBeat.id] ?? [];
  const activeCue =
    cues.find(
      (c) => beatLocalSec >= c.startOffsetSec && beatLocalSec <= c.endOffsetSec
    ) ?? (beatLocalSec < beatDuration * 0.88 ? cues[cues.length - 1] : undefined);

  if (activeCue && clampedTime < 28.4) {
    drawBurnedInSubtitles(
      ctx,
      activeCue.lines,
      showKoreanSubtitles ? currentBeat.koreanSubtitle : undefined
    );
  }

  if (clampedTime >= 28.3) {
    const creditAlpha = Math.min(1, (clampedTime - 28.3) / 0.65);
    drawEndCreditOverlay(ctx, creditAlpha);
  }
}
