import { CheckCircle2, HelpCircle, RotateCcw, XCircle } from "lucide-react";
import { useMemo, useState } from "react";
import { BeatItem, ExpressionItem } from "../types/story";

interface ExpressionQuizProps {
  expressions: ExpressionItem[];
  beats: BeatItem[];
}

interface QuizQuestion {
  id: string;
  expression: string;
  correctMeaning: string;
  movie: string;
  contextLine: string;
  options: string[];
}

const FALLBACK_MEANINGS = [
  "잠시 자리를 비우다",
  "마음을 놓다",
  "약속을 잊어버리다",
  "기분 좋게 웃어넘기다",
];

function shuffleArray<T>(items: T[], seedOffset = 0): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = (i * 7 + seedOffset * 3 + 5) % (i + 1);
    const tmp = copy[i];
    copy[i] = copy[j];
    copy[j] = tmp;
  }
  return copy;
}

export default function ExpressionQuiz({
  expressions,
  beats,
}: ExpressionQuizProps) {
  const [quizRound, setQuizRound] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<
    Record<string, string>
  >({});

  const questions: QuizQuestion[] = useMemo(() => {
    const valid = expressions.filter(
      (e) => e.expression.trim() && e.meaning.trim()
    );
    const rotated = shuffleArray(valid, quizRound + 1).slice(0, 3);

    return rotated.map((item, qIdx) => {
      const otherMeanings = valid
        .filter((other) => other.id !== item.id)
        .map((other) => other.meaning.trim());

      const pool = Array.from(
        new Set([...otherMeanings, ...FALLBACK_MEANINGS])
      ).filter((m) => m !== item.meaning.trim());

      const distractors = shuffleArray(pool, quizRound + qIdx + 2).slice(0, 3);
      const options = shuffleArray(
        [item.meaning.trim(), ...distractors],
        quizRound + qIdx + 4
      );

      const matchingBeat = beats.find((b) =>
        b.englishLine.toLowerCase().includes(item.expression.trim().toLowerCase())
      );

      return {
        id: `${item.id}-${quizRound}`,
        expression: item.expression.trim(),
        correctMeaning: item.meaning.trim(),
        movie: item.movie.trim(),
        contextLine: matchingBeat?.englishLine || "",
        options,
      };
    });
  }, [beats, expressions, quizRound]);

  const answeredCount = Object.keys(selectedAnswers).length;
  const correctCount = questions.filter(
    (q) => selectedAnswers[q.id] === q.correctMeaning
  ).length;
  const isFinished = questions.length > 0 && answeredCount === questions.length;

  const handleSelectOption = (questionId: string, option: string) => {
    if (selectedAnswers[questionId]) return;
    setSelectedAnswers((prev) => ({ ...prev, [questionId]: option }));
  };

  const handleRetake = () => {
    setSelectedAnswers({});
    setQuizRound((r) => r + 1);
  };

  if (questions.length === 0) return null;

  return (
    <section className="mt-6 rounded-2xl border border-[#DCE1D8] bg-white p-6">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-[#2F6F6D]">
            <HelpCircle className="h-5 w-5" aria-hidden="true" />
            <h2 className="text-xl font-semibold text-[#1E2420]">
              3-Question Expression Quiz
            </h2>
          </div>
          <p className="mt-1 text-base text-[#5A635D]">
            Test the movie English expressions you just watched in Cooper’s story.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {isFinished && (
            <span className="text-base font-bold text-[#1E2420] tabular-nums">
              Score: {correctCount} / {questions.length}
            </span>
          )}
          <button
            type="button"
            onClick={handleRetake}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-[#C8D1CA] bg-[#F6F7F4] px-4 py-2 text-sm font-semibold text-[#2A332D] hover:bg-[#ECEFE9] active:scale-[0.98] transition-all whitespace-nowrap shrink-0"
          >
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            <span>{isFinished ? "New 3 Questions" : "Shuffle Quiz"}</span>
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {questions.map((q, qIdx) => {
          const chosen = selectedAnswers[q.id];
          const hasAnswered = Boolean(chosen);
          const isCorrect = chosen === q.correctMeaning;

          return (
            <div
              key={q.id}
              className="rounded-xl border border-[#E6EAE3] bg-[#FAFBF9] p-5"
            >
              <p className="text-xs font-semibold text-[#5A635D] tabular-nums">
                Question {qIdx + 1} of {questions.length}
              </p>
              <p className="mt-1.5 text-xl font-bold text-[#1B5754]">
                “{q.expression}”
              </p>
              {q.contextLine && (
                <p className="mt-1 text-sm italic text-[#5A635D]">
                  In the clip: “{q.contextLine}”
                </p>
              )}

              <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {q.options.map((opt) => {
                  const isThisChosen = chosen === opt;
                  const isThisCorrect = opt === q.correctMeaning;

                  let stateStyle =
                    "border-[#D4DBD5] bg-white text-[#1E2420] hover:border-[#2F6F6D] hover:bg-[#F1F6F5]";
                  if (hasAnswered) {
                    if (isThisCorrect) {
                      stateStyle =
                        "border-[#2E6B4E] bg-[#EAF4EE] text-[#1D4B34] font-semibold";
                    } else if (isThisChosen) {
                      stateStyle =
                        "border-[#C14D4D] bg-[#FCEEEE] text-[#7B2B2B]";
                    } else {
                      stateStyle =
                        "border-[#E2E6E2] bg-white/70 text-[#7A827D]";
                    }
                  }

                  return (
                    <button
                      key={opt}
                      type="button"
                      disabled={hasAnswered}
                      onClick={() => handleSelectOption(q.id, opt)}
                      className={`min-h-[48px] rounded-xl border px-4 py-3 text-left text-base transition-colors ${stateStyle}`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>

              {hasAnswered && (
                <div
                  className={`mt-4 flex items-start gap-2.5 rounded-xl p-3.5 text-sm sm:text-base ${
                    isCorrect
                      ? "bg-[#EAF4EE] text-[#1D4B34]"
                      : "bg-[#FCEEEE] text-[#7B2B2B]"
                  }`}
                >
                  {isCorrect ? (
                    <CheckCircle2
                      className="mt-0.5 h-5 w-5 shrink-0"
                      aria-hidden="true"
                    />
                  ) : (
                    <XCircle
                      className="mt-0.5 h-5 w-5 shrink-0"
                      aria-hidden="true"
                    />
                  )}
                  <p>
                    {isCorrect ? "Correct! " : "Not quite — "}
                    <strong>“{q.expression}”</strong> means{" "}
                    <strong>{q.correctMeaning}</strong> (from{" "}
                    <em>{q.movie}</em>).
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {isFinished && (
        <div className="mt-6 flex flex-col items-center justify-between gap-4 rounded-xl border border-[#C6D8CC] bg-[#EEF4F0] p-5 sm:flex-row">
          <div>
            <p className="text-lg font-bold text-[#1D4B34] tabular-nums">
              Quiz Complete · You scored {correctCount} out of {questions.length}!
            </p>
            <p className="mt-0.5 text-sm text-[#2E6B4E]">
              {correctCount === 3
                ? "Perfect score! You mastered these movie expressions."
                : "Try another 3-question round to review all expressions."}
            </p>
          </div>
          <button
            type="button"
            onClick={handleRetake}
            className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-[#2F6F6D] px-5 py-2.5 text-base font-semibold text-white hover:bg-[#265B59] active:scale-[0.98] transition-all whitespace-nowrap shrink-0"
          >
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            <span>Take New 3-Question Quiz</span>
          </button>
        </div>
      )}
    </section>
  );
}
