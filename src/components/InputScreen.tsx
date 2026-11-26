import { AlertTriangle, ArrowRight, CheckCircle2, Plus, Trash2 } from "lucide-react";
import { ExpressionItem } from "../types/story";

interface InputScreenProps {
  expressions: ExpressionItem[];
  onChange: (next: ExpressionItem[]) => void;
  onNext: () => void;
}

export default function InputScreen({
  expressions,
  onChange,
  onNext,
}: InputScreenProps) {
  const validExpressions = expressions.filter(
    (e) => e.expression.trim() && e.meaning.trim() && e.movie.trim()
  );

  const uniqueMovies = Array.from(
    new Set(
      expressions
        .map((e) => e.movie.trim())
        .filter((m) => m.length > 0)
        .map((m) => m.toLowerCase())
    )
  );

  const hasEnoughExpressions = validExpressions.length >= 5;
  const hasMultipleMovies = uniqueMovies.length >= 2;
  const isValid = hasEnoughExpressions && hasMultipleMovies;

  const updateRow = (
    id: string,
    field: keyof Omit<ExpressionItem, "id">,
    value: string
  ) => {
    onChange(
      expressions.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  };

  const addRow = () => {
    onChange([
      ...expressions,
      {
        id: `expr-${Date.now()}`,
        expression: "",
        meaning: "",
        movie: "",
      },
    ]);
  };

  const removeRow = (id: string) => {
    if (expressions.length <= 1) return;
    onChange(expressions.filter((item) => item.id !== id));
  };

  return (
    <section className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-10">
      <div className="mb-8">
        <p className="text-sm font-medium text-[#5A635D]">
          Step 1 of 5 · Movie English Notebook
        </p>
        <h1 className="mt-2 font-serif text-3xl font-semibold tracking-tight text-[#1E2420] sm:text-4xl text-balance">
          Collect your movie English expressions
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-[#4B544E] sm:text-lg">
          Enter at least 5 everyday expressions from 2 or more movies. We will weave every phrase word-for-word into a 30-second animated short film.
        </p>
      </div>

      {/* Live Validation Summary & Warning */}
      {!isValid ? (
        <div
          role="alert"
          className="mb-6 flex items-start gap-3 rounded-2xl border border-[#D8A85A] bg-[#FDF7EA] p-5 text-[#5D3F11]"
        >
          <AlertTriangle
            className="mt-0.5 h-6 w-6 shrink-0 text-[#B4741B]"
            aria-hidden="true"
          />
          <div className="space-y-1 text-base">
            <p className="font-semibold">
              More expressions or movies needed before continuing
            </p>
            <p className="text-sm leading-relaxed sm:text-base">
              {!hasEnoughExpressions && (
                <span>
                  Please complete at least 5 expressions (currently{" "}
                  <strong className="tabular-nums">{validExpressions.length}</strong>
                  /5).{" "}
                </span>
              )}
              {!hasMultipleMovies && (
                <span>
                  Please include expressions from at least 2 different movies (currently{" "}
                  <strong className="tabular-nums">{uniqueMovies.length}</strong>{" "}
                  movie).
                </span>
              )}
            </p>
          </div>
        </div>
      ) : (
        <div className="mb-6 flex items-center gap-3 rounded-2xl border border-[#C6D8CC] bg-[#EEF4F0] px-5 py-4 text-[#234836]">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-[#2E6B4E]" aria-hidden="true" />
          <p className="text-base font-medium">
            Ready to build ·{" "}
            <span className="tabular-nums">{validExpressions.length}</span>{" "}
            expressions ·{" "}
            <span className="tabular-nums">{uniqueMovies.length}</span> movies
          </p>
        </div>
      )}

      {/* Expression Rows */}
      <div className="space-y-4">
        {expressions.map((item, idx) => (
          <div
            key={item.id}
            className="rounded-2xl border border-[#DCE1D8] bg-white p-5 shadow-xs sm:p-6"
          >
            <div className="mb-4 flex items-center justify-between gap-4">
              <span className="text-sm font-semibold text-[#5A635D] tabular-nums">
                Expression {idx + 1}
              </span>
              <button
                type="button"
                onClick={() => removeRow(item.id)}
                disabled={expressions.length <= 1}
                aria-label={`Remove expression ${idx + 1}`}
                className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl text-[#6A736D] hover:bg-[#F3F5F2] hover:text-[#9C3D3D] disabled:opacity-40 transition-colors"
              >
                <Trash2 className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <label
                  htmlFor={`expr-${item.id}`}
                  className="mb-1.5 block text-sm font-semibold text-[#3B443E]"
                >
                  English Expression
                </label>
                <input
                  id={`expr-${item.id}`}
                  type="text"
                  value={item.expression}
                  onChange={(e) =>
                    updateRow(item.id, "expression", e.target.value)
                  }
                  placeholder="e.g. crossed the line"
                  className="min-h-[48px] w-full rounded-xl border border-[#CFD7D0] bg-[#FAFBF9] px-4 py-3 text-base font-medium text-[#1E2420] placeholder:text-[#96A09A] focus:border-[#2F6F6D] focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor={`meaning-${item.id}`}
                  className="mb-1.5 block text-sm font-semibold text-[#3B443E]"
                >
                  Korean Meaning
                </label>
                <input
                  id={`meaning-${item.id}`}
                  type="text"
                  value={item.meaning}
                  onChange={(e) =>
                    updateRow(item.id, "meaning", e.target.value)
                  }
                  placeholder="e.g. 선을 넘다"
                  className="min-h-[48px] w-full rounded-xl border border-[#CFD7D0] bg-[#FAFBF9] px-4 py-3 text-base text-[#1E2420] placeholder:text-[#96A09A] focus:border-[#2F6F6D] focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor={`movie-${item.id}`}
                  className="mb-1.5 block text-sm font-semibold text-[#3B443E]"
                >
                  Source Movie
                </label>
                <input
                  id={`movie-${item.id}`}
                  type="text"
                  value={item.movie}
                  onChange={(e) => updateRow(item.id, "movie", e.target.value)}
                  placeholder="e.g. Inside Out 2"
                  className="min-h-[48px] w-full rounded-xl border border-[#CFD7D0] bg-[#FAFBF9] px-4 py-3 text-base text-[#1E2420] placeholder:text-[#96A09A] focus:border-[#2F6F6D] focus:bg-white focus:outline-none"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Big Bottom Actions */}
      <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={addRow}
          className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-2xl border border-[#C8D1CA] bg-white px-6 py-3 text-base font-semibold text-[#2A332D] hover:bg-[#ECEFE9] active:scale-[0.98] transition-all"
        >
          <Plus className="h-5 w-5" aria-hidden="true" />
          <span>Add Expression</span>
        </button>

        <button
          type="button"
          onClick={onNext}
          disabled={!isValid}
          className="inline-flex min-h-[54px] items-center justify-center gap-3 rounded-2xl bg-[#2F6F6D] px-8 py-3.5 text-lg font-semibold text-white shadow-sm hover:bg-[#265B59] disabled:bg-[#B8C2BD] disabled:cursor-not-allowed active:scale-[0.98] transition-all"
        >
          <span>Next: Scene & Style</span>
          <ArrowRight className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>
    </section>
  );
}
