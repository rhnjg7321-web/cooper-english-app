import { Download, Image as ImageIcon } from "lucide-react";
import { useEffect, useRef } from "react";
import { STYLE_OPTIONS } from "../data/defaults";
import { AnimationStyleId } from "../types/story";
import {
  renderCoverThumbnailFrame,
  VIDEO_HEIGHT,
  VIDEO_WIDTH,
} from "../utils/videoCanvasRenderer";

interface CoverThumbnailCardProps {
  coverImageUrl: string;
  styleId: AnimationStyleId;
}

export default function CoverThumbnailCard({
  coverImageUrl,
  styleId,
}: CoverThumbnailCardProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const styleLabel =
    STYLE_OPTIONS.find((s) => s.id === styleId)?.name ?? STYLE_OPTIONS[0].name;

  useEffect(() => {
    let cancelled = false;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      if (cancelled) return;
      const ctx = canvasRef.current?.getContext("2d");
      if (ctx) {
        renderCoverThumbnailFrame(ctx, img, styleId, styleLabel);
      }
    };
    img.onerror = () => {
      if (cancelled) return;
      const ctx = canvasRef.current?.getContext("2d");
      if (ctx) {
        renderCoverThumbnailFrame(ctx, null, styleId, styleLabel);
      }
    };
    img.src = coverImageUrl;
    return () => {
      cancelled = true;
    };
  }, [coverImageUrl, styleId, styleLabel]);

  const handleDownloadThumbnail = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = "cooper-cover-thumbnail.png";
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  return (
    <div className="mt-6 rounded-2xl border border-[#DCE1D8] bg-white p-6">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-[#2F6F6D]">
            <ImageIcon className="h-5 w-5" aria-hidden="true" />
            <h2 className="text-xl font-semibold text-[#1E2420]">
              Video Cover Thumbnail
            </h2>
          </div>
          <p className="mt-1 text-base text-[#5A635D]">
            Custom title artwork featuring Cooper and the protagonist in your chosen style.
          </p>
        </div>

        <button
          type="button"
          onClick={handleDownloadThumbnail}
          className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl border border-[#C8D1CA] bg-[#F6F7F4] px-5 py-2.5 text-base font-semibold text-[#1E2420] hover:bg-[#ECEFE9] active:scale-[0.98] transition-all whitespace-nowrap shrink-0"
        >
          <Download className="h-5 w-5 text-[#2F6F6D]" aria-hidden="true" />
          <span>Download Thumbnail</span>
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-[#E6EAE3] bg-[#1C211E]">
        <canvas
          ref={canvasRef}
          width={VIDEO_WIDTH}
          height={VIDEO_HEIGHT}
          className="aspect-video w-full object-contain"
        />
      </div>
    </div>
  );
}
