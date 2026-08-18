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

  // Swipe-to-move, tap-to-jump (pointer events cover touch, mouse, and pen)
  const pointerStart = useRef({ x: 0, y: 0, time: 0, id: -1 });

  const SWIPE_THRESHOLD = 40; // px — min distance to count as a swipe
  const TAP_MAX_DURATION = 250; // ms — max time for a "tap"
  const TAP_MAX_MOVEMENT = 15; // px — max drift to still count as a tap

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const engine = engineRef.current;
    if (!engine) return;

    if (engine.state !== "playing") {
      engine.start();
      return;
    }

    pointerStart.current = {
      x: e.clientX,
      y: e.clientY,
      time: Date.now(),
      id: e.pointerId,
    };
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const engine = engineRef.current;
    if (!engine) return;
    if (engine.state !== "playing") return;
    if (e.pointerId !== pointerStart.current.id) return;

    const dx = e.clientX - pointerStart.current.x;
    const dy = e.clientY - pointerStart.current.y;
    const dt = Date.now() - pointerStart.current.time;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    // Short tap with minimal movement -> jump
    if (dt < TAP_MAX_DURATION && absDx < TAP_MAX_MOVEMENT && absDy < TAP_MAX_MOVEMENT) {
      engine.boost();
      return;
    }

    // Dominant horizontal movement -> lane swipe
    if (absDx > absDy) {
      if (absDx > SWIPE_THRESHOLD) {
        if (dx > 0) engine.moveRight();
        else engine.moveLeft();
      }
    } else {
      // Swipe up -> also jump
      if (dy < -SWIPE_THRESHOLD) {
        engine.boost();
      }
    }
  };

  return (
    <div
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
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