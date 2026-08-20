import {useState } from "react";

import { useSound } from "../audio/AudioProvider";

import {
  Home,
  Trophy,
  Gamepad2,
  Settings,
  Volume2,
  VolumeX,
  Menu,
  X,
  LogOut,
} from "lucide-react";

export type NavTab = "home" | "leaderboard" | "howToPlay" | "settings";

interface NavbarProps {
  activeTab: NavTab;
  onNavigate: (tab: NavTab) => void;
  authUser?: string | null;
  onSignOut?: () => void;
}

const NAV_ITEMS: { id: NavTab; label: string; icon: typeof Home }[] = [
  { id: "home", label: "Home", icon: Home },
  { id: "leaderboard", label: "Leaderboard", icon: Trophy },
  { id: "howToPlay", label: "How to Play", icon: Gamepad2 },
  { id: "settings", label: "Settings", icon: Settings },
];

export default function Navbar({
  activeTab,
  onNavigate,
  authUser,
  onSignOut,
}: NavbarProps) {
  const { muted, toggleMute } = useSound();

  const [mobileOpen, setMobileOpen] = useState(false);

  // Close mobile menu whenever a tab is picked
  const handleNavigate = (tab: NavTab) => {
    onNavigate(tab);
    setMobileOpen(false);
  };

  return (
    <header
      className="sticky top-0 z-40 w-full bg-transparent border-b border-white/5"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <div className="mx-auto flex w-full max-w-[1200px] items-center justify-between gap-4 px-4 py-3 sm:px-6">
        {/* Brand */}
        <button
          onClick={() => handleNavigate("home")}
          className="flex items-center gap-3 shrink-0 group"
        >
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center text-[#1c0f24] font-black text-lg shadow-[0_10px_26px_rgba(255,120,73,0.35)] transition-transform group-hover:scale-105">
            R
          </div>

          <div className="hidden sm:block leading-none">
            <p className="rx-display text-xl text-white tracking-wide">
              RANGRIX
            </p>

            <p className="text-[9px] uppercase tracking-[0.35em] text-amber-200/70">
              Neon lane runner
            </p>
          </div>
        </button>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1 rounded-full border border-white/10 bg-transparent p-1 flex-nowrap overflow-x-auto">
          {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
            const active = activeTab === id;

            return (
              <button
                key={id}
                onClick={() => handleNavigate(id)}
                className={`relative flex items-center gap-2 whitespace-nowrap shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-all ${
                  active
                    ? "bg-gradient-to-r from-orange-400 to-pink-500 text-[#1c0f24] shadow-[0_8px_20px_rgba(255,46,109,0.3)]"
                    : "text-white/70 hover:text-white hover:bg-white/5"
                }`}
              >
                <Icon size={16} strokeWidth={2.4} />
                <span>{label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right cluster */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Desktop sound toggle */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleMute();
            }}
            aria-label={muted ? "Unmute sound" : "Mute sound"}
            className="hidden sm:flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/70 hover:text-white hover:bg-white/10 transition"
          >
            {muted ? <VolumeX size={17} /> : <Volume2 size={17} />}
          </button>

          {authUser ? (
            <div className="hidden sm:flex items-center gap-2 rounded-full border border-white/10 bg-white/5 py-1.5 pl-1.5 pr-3">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center text-[11px] font-bold text-[#1c0f24]">
                {authUser.slice(0, 1).toUpperCase()}
              </div>

              <span className="text-sm font-semibold text-white max-w-[100px] truncate">
                {authUser}
              </span>

              {onSignOut && (
                <button
                  onClick={onSignOut}
                  aria-label="Sign out"
                  className="ml-1 text-white/40 hover:text-pink-200 transition"
                >
                  <LogOut size={14} />
                </button>
              )}
            </div>
          ) : (
            <span className="hidden sm:inline-flex rounded-full border border-pink-400/20 bg-white/5 px-4 py-2 text-[11px] uppercase tracking-[0.28em] text-orange-100">
              Guest
            </span>
          )}

          {/* Mobile toggle */}
          <button
            onClick={() => setMobileOpen((v) => !v)}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            className="flex md:hidden h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white"
          >
            {mobileOpen ? <X size={19} /> : <Menu size={19} />}
          </button>
        </div>
      </div>

      {/* Mobile panel */}
      <div
        className={`md:hidden overflow-hidden transition-all duration-300 ease-out ${
          mobileOpen ? "max-h-[420px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="mx-4 mb-4 rounded-3xl border border-white/10 bg-[#1c0f24]/95 p-3">
          <nav className="flex flex-col gap-1">
            {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
              const active = activeTab === id;

              return (
                <button
                  key={id}
                  onClick={() => handleNavigate(id)}
                  className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-all ${
                    active
                      ? "bg-gradient-to-r from-orange-400 to-pink-500 text-[#1c0f24]"
                      : "text-white/70 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <Icon size={17} strokeWidth={2.4} />
                  {label}
                </button>
              );
            })}
          </nav>

          <div className="mt-2 flex items-center justify-between gap-2 border-t border-white/10 pt-3 px-1">
            {/* Mobile sound toggle */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleMute();
              }}
              aria-label={muted ? "Unmute sound" : "Mute sound"}
              className="flex items-center gap-2 text-sm text-white/70"
            >
              {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
              {muted ? "Sound off" : "Sound on"}
            </button>

            {authUser ? (
              <button
                onClick={onSignOut}
                className="flex items-center gap-2 text-sm text-pink-200/80"
              >
                <LogOut size={15} />
                Sign out ({authUser})
              </button>
            ) : (
              <span className="text-[11px] uppercase tracking-[0.28em] text-orange-100">
                Guest
              </span>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}