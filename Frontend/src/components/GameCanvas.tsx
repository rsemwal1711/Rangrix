import { useEffect, useRef, useCallback } from "react";
import { Engine, GameState } from "../game/engine";
import { LANE_COLORS } from "../game/obstacle";

interface GameCanvasProps {
  onScoreChange: (score: number) => void;
  onStateChange: (state: GameState) => void;
  onStreakChange: (streak: number) => void;
  engineRef: React.MutableRefObject<Engine | null>;
  onEngineReady?: () => void;
}

export default function GameCanvas({
  onScoreChange,
  onStateChange,
  onStreakChange,
  engineRef,
  onEngineReady,
}: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const drawRafRef = useRef(0);

  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = container.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;

    const ctx = canvas.getContext("2d");
    ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);

    if (engineRef.current) {
      engineRef.current.resize(rect.width, rect.height);
    }
  }, [engineRef]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const rect = container.getBoundingClientRect();
    const engine = new Engine(rect.width, rect.height, {
      onScoreChange,
      onStateChange,
      onStreakChange,
    });
    engineRef.current = engine;
    resizeCanvas();
    onEngineReady?.();

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let startTime = performance.now();

    const render = (timestamp: number) => {
      const t = (timestamp - startTime) / 1000;
      const dpr = window.devicePixelRatio || 1;
      const width = canvas.width / dpr;
      const height = canvas.height / dpr;

      ctx.clearRect(0, 0, width, height);

      // Background
      const bgGradient = ctx.createLinearGradient(0, 0, 0, height);
      bgGradient.addColorStop(0, "#050508");
      bgGradient.addColorStop(1, "#0a0a12");
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, width, height);

      // Faint lane divider lines
      ctx.save();
      ctx.strokeStyle = "rgba(255,255,255,0.05)";
      ctx.lineWidth = 1;
      const laneWidth = width / 4;
      for (let i = 1; i < 4; i++) {
        ctx.beginPath();
        ctx.moveTo(i * laneWidth, 0);
        ctx.lineTo(i * laneWidth, height);
        ctx.stroke();
      }
      ctx.restore();

      const shake = engine.getShakeOffset();
      ctx.save();
      ctx.translate(shake.x, shake.y);

      engine.obstacles.forEach((o) => o.draw(ctx));
      engine.particles.draw(ctx);
      engine.player.draw(ctx, t);

      ctx.restore();

      drawRafRef.current = requestAnimationFrame(render);
    };

    drawRafRef.current = requestAnimationFrame(render);

    const resizeObserver = new ResizeObserver(resizeCanvas);
    resizeObserver.observe(container);

    return () => {
      cancelAnimationFrame(drawRafRef.current);
      engine.stop();
      engineRef.current = null;
      resizeObserver.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const engine = engineRef.current;
      if (!engine) return;
      if (e.code === "Space" || e.code === "ArrowUp") {
        e.preventDefault();
        if (engine.state === "playing") {
          engine.boost();
        } else {
          engine.start();
        }
      } else if (e.code === "ArrowLeft") {
        engine.moveLeft();
      } else if (e.code === "ArrowRight") {
        engine.moveRight();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [engineRef]);

  const handleTap = (e: React.PointerEvent<HTMLDivElement>) => {
    const engine = engineRef.current;
    if (!engine) return;

    if (engine.state !== "playing") {
      engine.start();
      return;
    }

    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const relativeX = e.clientX - rect.left;
    const half = rect.width / 2;

    if (relativeX < half) {
      engine.moveLeft();
    } else {
      engine.moveRight();
    }
    engine.boost();
  };

  return (
    <div
      ref={containerRef}
      onPointerDown={handleTap}
      className={`relative w-full h-full touch-none select-none overflow-hidden rounded-2xl border border-white/10`}
    >
      <canvas ref={canvasRef} className="absolute inset-0 block" />
      {/* Lane color hints at the bottom */}
      <div className="absolute bottom-0 left-0 right-0 flex h-1.5 pointer-events-none">
        {LANE_COLORS.map((color, i) => (
          <div
            key={i}
            className="flex-1"
            style={{ backgroundColor: color, boxShadow: `0 0 8px ${color}` }}
          />
        ))}
      </div>
    </div>
  );
}
