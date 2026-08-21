import { ArrowLeft, Target, Keyboard, Gauge, Sparkles } from "lucide-react";

interface HowToPlayProps {
  onBack: () => void;
  onPlay?: () => void;
}

const CONTROLS = [
  { keys: "Space / ↑", action: "Jump" },
  { keys: "← →", action: "Move between lanes" },
];

const DIFFICULTIES = [
  { level: "Easy", desc: "Slower pace, wider gaps — good for learning the controls." },
  { level: "Medium", desc: "Balanced speed and obstacle density for a fair run." },
  { level: "Hard", desc: "Fast pace, tight gaps — for players chasing the top of the board." },
];

const TIPS = [
  "Watch the streak counter — consecutive clean passes build your multiplier.",
  "Customize your color, shape and photo before you launch a run.",
  "Your best score is saved automatically and compared on the leaderboard.",
];

export default function HowToPlay({ onBack, onPlay }: HowToPlayProps) {
  return (
    <div className="relative w-full flex items-center justify-center px-6 py-6 min-h-[calc(100vh-88px)] animate-fade-in">
      <div className="w-full max-w-2xl">
        <div className="mb-6 flex items-center justify-between gap-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70 hover:text-white hover:bg-white/10 transition"
          >
            <ArrowLeft size={16} />
            Back
          </button>
        </div>

        <div className="rounded-[32px] bg-[#1c0f24]/90 p-7">
          <div className="mb-6 flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center text-[#1c0f24] shadow-[0_10px_26px_rgba(255,120,73,0.35)]">
              <Target size={20} strokeWidth={2.4} />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.32em] text-amber-200/70">Guide</p>
              <h2 className="rx-display text-2xl text-white">How to Play</h2>
            </div>
          </div>

          <p className="text-sm leading-7 text-white/70 mb-6">
            Stay in your lane, dodge what's coming, and keep your streak alive. Rangrix rewards clean,
            consistent runs over risky sprints.
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-3xl bg-[#241530]/95 p-5">
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-white/40">
                <Keyboard size={14} />
                Controls
              </div>
              <div className="mt-4 space-y-3">
                {CONTROLS.map((c) => (
                  <div key={c.keys} className="flex items-center justify-between gap-3">
                    <span className="rx-mono text-sm text-white bg-white/5 rounded-full px-3 py-1">{c.keys}</span>
                    <span className="text-sm text-white/60">{c.action}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl bg-[#241530]/95 p-5">
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-white/40">
                <Sparkles size={14} />
                Tips
              </div>
              <div className="mt-4 space-y-3">
                {TIPS.map((tip) => (
                  <p key={tip} className="text-sm leading-6 text-white/60">
                    • {tip}
                  </p>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-4 rounded-3xl bg-[#241530]/95 p-5">
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-white/40">
              <Gauge size={14} />
              Difficulty
            </div>
            <div className="mt-4 space-y-3">
              {DIFFICULTIES.map((d) => (
                <div key={d.level} className="flex items-start gap-3">
                  <span className="mt-0.5 shrink-0 rounded-full bg-gradient-to-r from-orange-400 to-pink-500 px-3 py-1 text-[11px] font-semibold text-[#1c0f24]">
                    {d.level}
                  </span>
                  <p className="text-sm leading-6 text-white/60">{d.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {onPlay && (
            <button
              onClick={onPlay}
              className="mt-6 w-full rounded-full bg-gradient-to-r from-orange-400 to-pink-500 px-8 py-4 text-lg font-semibold tracking-wide text-[#1c0f24] btn-primary shadow-[0_18px_42px_rgba(255,46,109,0.3)]"
            >
              Got it — Let's Play
            </button>
          )}
        </div>
      </div>
    </div>
  );
}