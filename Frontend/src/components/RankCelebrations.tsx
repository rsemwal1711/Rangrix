import { useEffect, useMemo, useState } from "react";
import { Medal } from "./Medal";

interface RankCelebrationProps {
  rank: 1 | 2 | 3;
  onDone: () => void;
}

const RANK_COPY = {
  1: { title: "GOLD!", subtitle: "You're #1 on the leaderboard", color: "text-yellow-300" },
  2: { title: "SILVER!", subtitle: "You made #2 on the leaderboard", color: "text-slate-200" },
  3: { title: "BRONZE!", subtitle: "You made #3 on the leaderboard", color: "text-orange-300" },
} as const;

const CONFETTI_COLORS = ["#ff7849", "#ffcc4d", "#ff2e6d", "#8b5cf6", "#38bdf8", "#facc15"];

function useConfettiPieces(count: number) {
  return useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        size: 6 + Math.random() * 8,
        color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
        delay: Math.random() * 0.6,
        duration: 2.2 + Math.random() * 1.4,
        rotate: Math.random() * 360,
      })),
    [count]
  );
}

export function RankCelebration({ rank, onDone }: RankCelebrationProps) {
  const confetti = useConfettiPieces(70);
  const [visible, setVisible] = useState(true);
  const copy = RANK_COPY[rank];

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onDone, 400);
    }, 3200);
    return () => clearTimeout(timer);
  }, [onDone]);

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden pointer-events-none"
      style={{ animation: "celebration-fade-out 3.2s ease forwards" }}
    >
      {/* dim backdrop */}
      <div className="absolute inset-0 bg-black/40" />

      {/* confetti layer */}
      {confetti.map((p) => (
        <span
          key={p.id}
          className="absolute top-0 rounded-sm"
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.size * 0.4,
            backgroundColor: p.color,
            animation: `confetti-fall ${p.duration}s ease-in ${p.delay}s forwards`,
            transform: `rotate(${p.rotate}deg)`,
          }}
        />
      ))}

      {/* medal + text */}
      <div className="relative flex flex-col items-center gap-4">
        <div style={{ animation: "medal-rise 1s cubic-bezier(0.34, 1.56, 0.64, 1) forwards" }}>
          <Medal rank={rank} size={96} />
        </div>
        <div
          className="text-center"
          style={{ animation: "celebration-text-pop 0.6s ease 0.5s both" }}
        >
          <p className={`text-4xl font-black tracking-wide ${copy.color}`}>{copy.title}</p>
          <p className="mt-1 text-sm text-white/80">{copy.subtitle}</p>
        </div>
      </div>
    </div>
  );
}