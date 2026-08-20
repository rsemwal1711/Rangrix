interface ScoreBoardProps {
  score: number;
  highScore: number;
  streak: number;
}

export default function ScoreBoard({ score, highScore, streak }: ScoreBoardProps) {
  const multiplier = 1 + Math.floor(streak / 5) * 0.5;
  console.log(highScore);

  return (
    <div className="absolute top-4 left-0 right-0 flex items-start justify-between px-5 pointer-events-none">
      <div className="flex flex-col items-start bg-black/30 px-3 py-2 rounded-xl glass">
        <span className="text-[11px] uppercase tracking-[0.2em] text-white/40">Score</span>
        <span
          key={score}
          className="text-4xl font-extrabold text-cyan-300 drop-shadow-[0_0_18px_rgba(34,211,238,0.6)] animate-score-pop tabular-nums"
        >
          {score}
        </span>
      </div>

      {streak >= 3 && (
        <div className="flex flex-col items-center animate-fade-in px-3 py-2 rounded-xl bg-black/20 glass">
          <span className="text-[11px] uppercase tracking-[0.2em] text-yellow-300/80">Streak</span>
          <span className="text-lg font-semibold text-yellow-300 drop-shadow-[0_0_12px_rgba(250,204,21,0.7)]">
            x{multiplier.toFixed(1)}
          </span>
        </div>
      )}

    </div>
  );
}
