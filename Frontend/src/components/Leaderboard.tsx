import { ArrowLeft, Trophy, RefreshCw } from "lucide-react";
import { Medal } from "./Medal";
import { LeaderboardEntry } from "../leaderboard";

interface LeaderboardPageProps {
  entries: LeaderboardEntry[];
  loading?: boolean;
  limit: number;
  onLimitChange: (limit: number) => void;
  isLive: boolean;
  myRank?: number | null;
  onBack: () => void;
  onRefresh?: () => void;
}

export default function LeaderboardPage({
  entries,
  loading = false,
  limit,
  onLimitChange,
  isLive,
  myRank,
  onBack,
  onRefresh,
}: LeaderboardPageProps) {
  return (
    <div className="relative w-full flex items-center justify-center px-6 py-6 min-h-[calc(100vh-88px)] animate-fade-in">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between gap-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70 hover:text-white hover:bg-white/10 transition"
          >
            <ArrowLeft size={16} />
            Back
          </button>

          {myRank != null && (
            <div className="rounded-full border border-pink-400/20 bg-white/5 px-4 py-2 text-[11px] uppercase tracking-[0.3em] text-orange-100">
              Your rank #{myRank}
            </div>
          )}
        </div>

        <div className="rounded-[32px] bg-[#1c0f24]/90 p-7">
          <div className="mb-6 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center text-[#1c0f24] shadow-[0_10px_26px_rgba(255,120,73,0.35)]">
                <Trophy size={20} strokeWidth={2.4} />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-[0.32em] text-amber-200/70">Leaderboard</p>
                <h2 className="rx-display text-2xl text-white">Top {limit}</h2>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={String(limit)}
                onChange={(e) => onLimitChange(Number(e.target.value))}
                className="rounded-full bg-white/5 border border-white/10 px-3 py-1.5 text-sm text-white outline-none"
              >
                <option value="3">Top 3</option>
                <option value="5">Top 5</option>
                <option value="10">Top 10</option>
              </select>

              {onRefresh && (
                <button
                  onClick={onRefresh}
                  aria-label="Refresh leaderboard"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/60 hover:text-white hover:bg-white/10 transition"
                >
                  <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
                </button>
              )}

              <span className="rounded-full bg-pink-400/15 px-3 py-1.5 text-[11px] uppercase tracking-[0.3em] text-pink-100">
                {isLive ? "Live" : "Demo"}
              </span>
            </div>
          </div>

          <div className="space-y-3">
            {loading ? (
              [1, 2, 3, 4, 5].slice(0, limit).map((idx) => (
                <div key={idx} className="h-16 rounded-3xl bg-white/5 p-3 animate-pulse" />
              ))
            ) : entries.length === 0 ? (
              <div className="rounded-3xl bg-white/5 p-8 text-center">
                <p className="text-sm text-white/50">No scores yet — be the first to set a run.</p>
              </div>
            ) : (
              entries.map((entry) => (
                <div
                  key={entry.rank}
                  data-rank={entry.rank}
                  className="rx-lb-row flex items-center justify-between gap-3 rounded-3xl bg-white/5 p-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="rx-lb-badge flex h-11 w-11 shrink-0 items-center justify-center rounded-3xl bg-pink-400/15 text-sm font-semibold text-pink-100">
                      {entry.rank}
                    </div>
                    <div className="min-w-0">
                      <p className="text-lg font-bold text-white truncate">{entry.name}</p>
                      {entry.detail && (
                        <p className="text-xs text-amber-100/70 font-medium mt-0.5">{entry.detail}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <div className="text-right">
                      <p className="rx-mono text-sm font-semibold text-white">{entry.score}</p>
                      <p className="text-[10px] uppercase tracking-[0.3em] text-white/40">pts</p>
                    </div>
                    {entry.rank <= 3 && <Medal rank={entry.rank as 1 | 2 | 3} size={24} />}
                  </div>
                </div>
              ))
            )}
          </div>

          <p className="mt-6 text-[11px] uppercase tracking-[0.32em] text-white/30">
            {isLive
              ? "Live rankings — updates after every run you submit."
              : "Sign in to see live rankings and submit your own runs."}
          </p>
        </div>
      </div>
    </div>
  );
}