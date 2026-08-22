import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Target, Keyboard, Gauge, Sparkles, Play, Pause, Maximize2 } from "lucide-react";

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

// TODO: point this at your actual trailer file/URL (e.g. "/videos/trailer.mp4")
const TRAILER_SRC = "/sounds/trailer.mp4";
const TRAILER_POSTER = "/trailer-poster.jpg"; // optional, remove the prop below if you don't have one

export default function HowToPlay({ onBack, onPlay }: HowToPlayProps) {
  const previewVideoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);

  // Real fullscreen, same as YouTube — asks the browser to fullscreen the video element itself
  const openFullscreen = () => {
    const video = previewVideoRef.current;
    if (!video) return;
    if (video.requestFullscreen) {
      video.requestFullscreen();
    } else if ((video as any).webkitRequestFullscreen) {
      (video as any).webkitRequestFullscreen(); // Safari
    } else if ((video as any).webkitEnterFullscreen) {
      (video as any).webkitEnterFullscreen(); // iOS Safari
    }
    video.muted = false;
    video.play();
  };

  // On phones/tablets, force landscape while the video is fullscreen
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isFullscreen = !!document.fullscreenElement;
      const orientation = screen.orientation as any;
      if (isFullscreen && orientation?.lock) {
        orientation.lock("landscape").catch(() => {
          // Some browsers (e.g. desktop, or without user gesture) reject this silently — safe to ignore
        });
      } else if (!isFullscreen && orientation?.unlock) {
        orientation.unlock();
      }
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
    };
  }, []);

  const togglePlay = () => {
    const video = previewVideoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play();
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };

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

          {/* Gameplay trailer */}
          <div className="mb-6 relative rounded-[28px] p-[1.5px] bg-gradient-to-br from-orange-400/70 via-pink-500/50 to-transparent shadow-[0_20px_50px_rgba(255,46,109,0.18)]">
            <div className="relative rounded-[27px] bg-black overflow-hidden">
              <div className="relative h-44 sm:h-52 w-full">
                <video
                  ref={previewVideoRef}
                  src={TRAILER_SRC}
                  poster={TRAILER_POSTER}
                  className="absolute inset-0 h-full w-full object-cover"
                  muted
                  loop
                  playsInline
                  autoPlay
                  onClick={togglePlay}
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                />

                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

                <div className="absolute left-4 top-4 flex items-center gap-1.5 rounded-full bg-black/40 px-3 py-1 backdrop-blur-sm">
                  <span className="h-1.5 w-1.5 rounded-full bg-pink-400 animate-pulse" />
                  <span className="text-[10px] uppercase tracking-[0.25em] text-white/70">Gameplay Preview</span>
                </div>

                <button
                  onClick={openFullscreen}
                  className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white/80 hover:text-white hover:bg-black/60 backdrop-blur-sm transition"
                  aria-label="Expand preview to fullscreen"
                >
                  <Maximize2 size={14} />
                </button>

                <button
                  onClick={togglePlay}
                  className="group absolute inset-0 flex items-center justify-center"
                  aria-label={isPlaying ? "Pause preview" : "Play preview"}
                >
                  <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/10 backdrop-blur-md border border-white/20 group-hover:scale-105 group-hover:bg-white/20 transition">
                    {isPlaying ? (
                      <Pause size={22} className="text-white" fill="white" />
                    ) : (
                      <Play size={22} className="ml-0.5 text-white" fill="white" />
                    )}
                  </span>
                </button>
              </div>

              <div className="flex items-center justify-between gap-3 px-5 py-3 border-t border-white/5">
                <p className="text-xs text-white/50">Dash between lanes, time your jumps, keep the streak alive.</p>
                <button
                  onClick={openFullscreen}
                  className="shrink-0 text-xs font-medium text-amber-200/80 hover:text-amber-100 transition"
                >
                  View fullscreen
                </button>
              </div>
            </div>
          </div>

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