interface GameOverModalProps {
  score: number;
  highScore: number;
  isNewHighScore: boolean;
  topScores: Array<{ rank: number; name: string; score: number; detail: string }>;
  submittedRank: number | null;
  submissionMessage: string | null;
  submissionError: string | null;
  isSubmittingScore: boolean;
  onSubmitScore: () => void;
  onRestart: () => void;
  onSelectDifficulty?: (level: "easy" | "medium" | "hard") => void;
  onCustomize?: () => void;
  onReturnHome?: () => void;
}

export default function GameOverModal({
  score,
  highScore,
  isNewHighScore,
  submittedRank,
  submissionMessage,
  submissionError,
  // unused props are prefixed with underscore to avoid TS warnings
  topScores: _topScores,
  isSubmittingScore: _isSubmittingScore,
  onSubmitScore: _onSubmitScore,
  onRestart: _onRestart,
  onSelectDifficulty,
  onCustomize,
  onReturnHome,
}: GameOverModalProps) {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="flex flex-col items-center gap-4 px-8 py-10 rounded-3xl border border-white/10 glass hud-glow">
        <span className="text-xs uppercase tracking-[0.3em] text-red-400/80">Game Over</span>

        <div className="flex flex-col items-center gap-1">
          <span className="text-5xl font-bold text-white drop-shadow-[0_0_16px_rgba(255,255,255,0.3)] tabular-nums">
            {score}
          </span>
          <span className="text-xs uppercase tracking-[0.2em] text-white/40">Final Score</span>
        </div>

        {isNewHighScore ? (
          <span className="text-sm font-medium text-yellow-300 animate-pulse-soft">
            New High Score!
          </span>
        ) : (
          <span className="text-sm text-white/50 tabular-nums"></span>
        )}

        <div className="w-full space-y-4">
          <div className="rounded-3xl bg-black/20 p-4 glass">
            {submissionMessage && (
              <p className="mt-3 text-sm text-emerald-300">{submissionMessage}</p>
            )}
            {submissionError && (
              <p className="mt-3 text-sm text-red-300">{submissionError}</p>
            )}
          </div>

          {submittedRank && submittedRank > 3 && (
            <div className="rounded-3xl bg-black/20 p-4 text-sm text-white/80 glass">
              Your score is ranked <span className="font-semibold text-white">#{submittedRank}</span>. Only the top 3 are shown here.
            </div>
          )}

          <div className="grid gap-3 w-full sm:grid-cols-2">
            <div className="rounded-3xl bg-black/20 p-3 text-center glass">
              <p className="text-xs uppercase tracking-[0.2em] text-white/40">Change Difficulty</p>
              <div className="mt-3 flex items-center justify-center gap-2">
                {['easy', 'medium', 'hard'].map((level) => (
                  <button
                    key={level}
                    onClick={() => onSelectDifficulty?.(level as "easy" | "medium" | "hard")}
                    className="px-3 py-1 rounded-full text-sm bg-white/5 text-white/80 hover:bg-white/10"
                  >
                    {level.charAt(0).toUpperCase() + level.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <div className="rounded-3xl bg-black/20 p-3 text-center glass">
              <p className="text-xs uppercase tracking-[0.2em] text-white/40">Customize again</p>
              <div className="mt-3 flex items-center justify-center gap-2">
                <button
                  onClick={onCustomize}
                  className="px-3 py-1 rounded-full text-sm bg-white/5 text-white/80 hover:bg-white/10"
                >
                  Rechoose
                </button>
              </div>
            </div>
          </div>

          <button
            onClick={onReturnHome}
            className="mt-1 w-full rounded-full bg-white/10 px-8 py-3 text-sm uppercase tracking-[0.22em] text-white/80 hover:bg-white/15 transition"
          >
            Return Home
          </button>
        </div>

        <span className="text-[11px] text-white/30 mt-1">Space / ↑ / Tap to jump · ← → to move</span>
      </div>
    </div>
  );
}
