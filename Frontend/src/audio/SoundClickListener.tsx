import { useEffect } from "react";
import { useSound } from "./AudioProvider";

export function SoundClickListener() {
  const { playClick } = useSound();

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest("button, [role='button']")) {
        playClick();
      }
    };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [playClick]);

  return null;
}