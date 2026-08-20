import { useEffect, useState } from "react";

interface RangrixIntroProps {
  onFinish: () => void;
  title?: string;
}

export default function RangrixIntro({ onFinish, title = "RANGRIX" }: RangrixIntroProps) {
  const [ready, setReady] = useState(false); // true once "press start" is showing
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 2600);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!ready) return;
    const handleKey = () => start();
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [ready]);

  const start = () => {
    if (leaving) return;
    setLeaving(true);
    setTimeout(onFinish, 700);
  };

  return (
    <div
      onClick={ready ? start : undefined}
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden bg-black transition-opacity duration-700 ${
        leaving ? "opacity-0" : "opacity-100"
      } ${ready ? "cursor-pointer" : ""}`}
      style={{
        background: "radial-gradient(ellipse at center, #0a0e1a 0%, #000000 80%)",
      }}
    >
      {/* scanlines */}
      <div
        className="pointer-events-none absolute inset-0 z-[5]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(to bottom, rgba(255,255,255,0.03) 0px, rgba(255,255,255,0.03) 1px, transparent 1px, transparent 3px)",
        }}
      />

      {/* scan sweep */}
      <div
        className="pointer-events-none absolute inset-0 z-[4]"
        style={{
          height: "200%",
          background:
            "linear-gradient(to bottom, transparent 0%, rgba(0,255,200,0.06) 50%, transparent 100%)",
          animation: "rangrix-sweep 2.5s linear infinite",
        }}
      />

      {/* title */}
      <div className="relative z-10 flex">
        {title.split("").map((ch, i) => (
          <span
            key={i}
            className="text-6xl md:text-8xl font-extrabold tracking-wider text-white"
            style={{
              textShadow: "0 0 10px #00ffc8, 0 0 30px #00ffc8, 0 0 60px #0088ff",
              opacity: 0,
              animation: `rangrix-drop 0.6s cubic-bezier(.2,1.4,.4,1) forwards, rangrix-flicker 3.5s ease-in-out infinite`,
              animationDelay: `${i * 0.09}s, ${i * 0.09 + 0.8}s`,
            }}
          >
            {ch}
          </span>
        ))}
      </div>

      {/* underline */}
      <div
        className="relative z-10 mt-6 h-[2px]"
        style={{
          width: 0,
          background: "linear-gradient(90deg, transparent, #00ffc8, #0088ff, transparent)",
          boxShadow: "0 0 12px #00ffc8",
          animation: "rangrix-grow 1s ease-out forwards",
          animationDelay: "1.6s",
        }}
      />

      {/* subtitle */}
      <div
        className="relative z-10 mt-5 text-xs tracking-[6px] text-[#6fe3c8] opacity-0"
        style={{ animation: "rangrix-fadeup 0.8s ease forwards", animationDelay: "2.1s" }}
      >
        WELCOME TO THE ZONE
      </div>

      {/* press start */}
      {ready && (
        <div
          className="absolute bottom-16 z-10 text-sm tracking-[3px] text-white"
          style={{ animation: "rangrix-blink 1.2s ease-in-out infinite" }}
        >
          PRESS START
        </div>
      )}

      <style>{`
        @keyframes rangrix-drop {
          0% { opacity: 0; transform: translateY(-120px) scale(1.6) skewX(10deg); filter: blur(8px); }
          60% { opacity: 1; transform: translateY(6px) scale(0.96) skewX(0deg); filter: blur(0px); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes rangrix-flicker {
          0%, 92%, 100% { opacity: 1; }
          93% { opacity: 0.4; }
          94% { opacity: 1; }
          95% { opacity: 0.3; }
          96% { opacity: 1; }
        }
        @keyframes rangrix-sweep {
          from { transform: translateY(-50%); }
          to { transform: translateY(0%); }
        }
        @keyframes rangrix-grow {
          to { width: 420px; }
        }
        @keyframes rangrix-fadeup {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes rangrix-blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.2; }
        }
      `}</style>
    </div>
  );
}