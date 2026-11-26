import { Palette, RefreshCw } from "lucide-react";
import { useState } from "react";
import { STYLE_OPTIONS } from "../data/defaults";
import { AnimationStyleId } from "../types/story";

interface StyleSwitcherBarProps {
  styleId: AnimationStyleId;
  onChangeStyle: (nextStyle: AnimationStyleId) => void;
}

export default function StyleSwitcherBar({
  styleId,
  onChangeStyle,
}: StyleSwitcherBarProps) {
  const [draftStyle, setDraftStyle] = useState<AnimationStyleId>(styleId);
  const [justApplied, setJustApplied] = useState(false);

  const handleApply = () => {
    onChangeStyle(draftStyle);
    setJustApplied(true);
    window.setTimeout(() => setJustApplied(false), 1800);
  };

  return (
    <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-[#DCE1D8] bg-white p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
      <div className="flex flex-wrap items-center gap-3">
        <Palette className="h-5 w-5 shrink-0 text-[#2F6F6D]" aria-hidden="true" />
        <label
          htmlFor="quick-style-select"
          className="text-sm font-semibold text-[#1E2420] sm:text-base whitespace-nowrap"
        >
          Art Style:
        </label>
        <select
          id="quick-style-select"
          value={draftStyle}
          onChange={(e) => {
            const next = e.target.value as AnimationStyleId;
            setDraftStyle(next);
            onChangeStyle(next);
          }}
          className="min-h-[44px] rounded-xl border border-[#CFD7D0] bg-[#FAFBF9] px-3.5 py-2 text-sm font-medium text-[#1E2420] focus:border-[#2F6F6D] focus:outline-none sm:text-base"
        >
          {STYLE_OPTIONS.map((opt) => (
            <option key={opt.id} value={opt.id}>
              {opt.name}
            </option>
          ))}
        </select>
      </div>

      <button
        type="button"
        onClick={handleApply}
        className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-[#C8D1CA] bg-[#F6F7F4] px-4 py-2 text-sm font-semibold text-[#1E2420] hover:bg-[#ECEFE9] active:scale-[0.98] transition-all whitespace-nowrap shrink-0"
      >
        <RefreshCw className="h-4 w-4 text-[#2F6F6D]" aria-hidden="true" />
        <span>
          {justApplied ? "Style Updated!" : "Change Style & Regenerate"}
        </span>
      </button>
    </div>
  );
}
