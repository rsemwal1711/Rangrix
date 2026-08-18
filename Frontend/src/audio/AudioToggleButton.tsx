import { Volume2, VolumeX } from "lucide-react";
import { useSound } from "./AudioProvider";

export function AudioToggleButton() {
  const { muted, toggleMute } = useSound();

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        toggleMute();
      }}
      aria-label={muted ? "Unmute sound" : "Mute sound"}
      style={{ position: "fixed", top: "1.25rem", right: "1.25rem", zIndex: 999, touchAction: "manipulation" }}
      className={`
        flex items-center justify-center
        w-12 h-12 rounded-full
        border backdrop-blur-md
        transition-all duration-300 ease-out
        hover:scale-110 active:scale-95
        ${muted
          ? "bg-white/5 border-white/15 text-white/50 hover:bg-white/10 hover:text-white/80"
          : "bg-gradient-to-br from-orange-400 to-pink-500 border-transparent text-[#1c0f24] shadow-[0_0_20px_rgba(255,46,109,0.5)]"
        }
      `}
    >
      {muted ? <VolumeX size={20} /> : <Volume2 size={20} />}
    </button>
  );
}