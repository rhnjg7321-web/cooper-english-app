import { RotateCcw } from "lucide-react";
import { ScreenStep } from "../types/story";

interface StepHeaderProps {
  currentStep: ScreenStep;
  onNavigate: (step: ScreenStep) => void;
  onResetDefaults: () => void;
  canLeaveInput: boolean;
}

const STEPS: { step: ScreenStep; label: string }[] = [
  { step: 1, label: "Expressions" },
  { step: 2, label: "Scene" },
  { step: 3, label: "Storyboard" },
  { step: 4, label: "Video" },
  { step: 5, label: "Final" },
];

export default function StepHeader({
  currentStep,
  onNavigate,
  onResetDefaults,
  canLeaveInput,
}: StepHeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-[#DCE1D8] bg-[#F6F7F4]/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:gap-8 sm:px-6">
        <button
          type="button"
          onClick={() => onNavigate(1)}
          className="min-h-[44px] whitespace-nowrap shrink-0 text-left font-serif text-2xl font-semibold tracking-tight text-[#1E2420] hover:text-[#2F6F6D] transition-colors"
        >
          Cooper
        </button>

        <nav
          aria-label="Creation steps"
          className="hidden md:flex items-center gap-6 text-[15px] font-medium"
        >
          {STEPS.map(({ step, label }) => {
            const isActive = currentStep === step;
            const isDisabled = step > 1 && !canLeaveInput;
            return (
              <button
                key={step}
                type="button"
                disabled={isDisabled}
                onClick={() => onNavigate(step)}
                className={`min-h-[44px] whitespace-nowrap shrink-0 border-b-2 px-1 transition-colors ${
                  isActive
                    ? "border-[#2F6F6D] text-[#1E2420] font-semibold"
                    : isDisabled
                      ? "border-transparent text-[#A1ABA5] cursor-not-allowed"
                      : "border-transparent text-[#5A635D] hover:text-[#1E2420] hover:border-[#C5CEC8]"
                }`}
              >
                <span className="tabular-nums">{step}.</span> {label}
              </button>
            );
          })}
        </nav>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={onResetDefaults}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-[#D4DBD5] bg-white px-4 py-2 text-sm font-semibold text-[#333C36] hover:bg-[#ECEFE9] active:scale-[0.98] transition-all whitespace-nowrap shrink-0"
          >
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Compact single-row mobile step switcher */}
      <nav
        aria-label="Mobile steps"
        className="flex md:hidden items-center justify-between gap-1 overflow-x-auto border-t border-[#E6EAE3] px-3 py-1.5"
      >
        {STEPS.map(({ step, label }) => {
          const isActive = currentStep === step;
          const isDisabled = step > 1 && !canLeaveInput;
          return (
            <button
              key={step}
              type="button"
              disabled={isDisabled}
              onClick={() => onNavigate(step)}
              className={`min-h-[40px] flex-1 whitespace-nowrap shrink-0 rounded-lg px-2 text-xs font-semibold transition-colors ${
                isActive
                  ? "bg-[#2F6F6D] text-white"
                  : isDisabled
                    ? "text-[#A1ABA5] cursor-not-allowed"
                    : "text-[#5A635D] hover:bg-[#ECEFE9]"
              }`}
            >
              <span className="tabular-nums">{step}.</span> {label}
            </button>
          );
        })}
      </nav>
    </header>
  );
}
