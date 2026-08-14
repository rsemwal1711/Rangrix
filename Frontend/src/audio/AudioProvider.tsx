import { createContext, useContext, useRef, useState, useCallback, useEffect, ReactNode } from "react";

interface SoundContextValue {
  muted: boolean;
  toggleMute: () => void;
  playClick: () => void;
}

const SoundContext = createContext<SoundContextValue | null>(null);

const BG_MUSIC_URL = "/sounds/ambient-loop.mp3";
const CLICK_SOUND_URL = "/sounds/click.mp3";

export function AudioProvider({ children }: { children: ReactNode }) {
  const [muted, setMuted] = useState(true);
  const bgRef = useRef<HTMLAudioElement | null>(null);
  const clickRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const bg = new Audio(BG_MUSIC_URL);
    bg.loop = true;
    bg.volume = 0.35;
    bgRef.current = bg;

    const click = new Audio(CLICK_SOUND_URL);
    click.volume = 0.5;
    clickRef.current = click;

    return () => {
      bg.pause();
      bg.src = "";
    };
  }, []);

  const toggleMute = useCallback(() => {
    setMuted((prev) => {
      const next = !prev;
      const bg = bgRef.current;
      if (bg) {
        if (next) {
          bg.pause();
        } else {
          bg.play().catch(() => {});
        }
      }
      return next;
    });
  }, []);

  const playClick = useCallback(() => {
    if (muted) return;
    const click = clickRef.current;
    if (!click) return;
    click.currentTime = 0;
    click.play().catch(() => {});
  }, [muted]);

  return (
    <SoundContext.Provider value={{ muted, toggleMute, playClick }}>
      {children}
    </SoundContext.Provider>
  );
}

export function useSound() {
  const ctx = useContext(SoundContext);
  if (!ctx) throw new Error("useSound must be used inside <AudioProvider>");
  return ctx;
}