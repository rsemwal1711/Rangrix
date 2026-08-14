import { useEffect, useRef } from "react";

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  mode: "smoke" | "sparkler";
};

const IDLE_DELAY = 350; // ms of no movement before sparkler mode kicks in

export default function SparkleTrail() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const lastPosRef = useRef<{ x: number; y: number } | null>(null);
  const lastMoveTimeRef = useRef<number>(Date.now());
  const cursorPosRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const spawnSmoke = (x: number, y: number) => {
      for (let i = 0; i < 2; i++) {
        particlesRef.current.push({
          x,
          y,
          vx: (Math.random() - 0.5) * 1.2,
          vy: (Math.random() - 0.5) * 1.2 - 0.4,
          life: 0,
          maxLife: 40 + Math.random() * 20,
          size: 1.5 + Math.random() * 2.5,
          mode: "smoke",
        });
      }
    };

    const spawnSparkler = (x: number, y: number) => {
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.8 + Math.random() * 2.2;
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0,
        maxLife: 18 + Math.random() * 16,
        size: 0.8 + Math.random() * 1.4,
        mode: "sparkler",
      });
    };

    const handleMove = (e: MouseEvent) => {
      const last = lastPosRef.current;
      lastPosRef.current = { x: e.clientX, y: e.clientY };
      cursorPosRef.current = { x: e.clientX, y: e.clientY };
      lastMoveTimeRef.current = Date.now();
      if (last) {
        const dist = Math.hypot(e.clientX - last.x, e.clientY - last.y);
        if (dist > 6) spawnSmoke(e.clientX, e.clientY);
      } else {
        spawnSmoke(e.clientX, e.clientY);
      }
    };
    window.addEventListener("mousemove", handleMove);

    let raf: number;
    const tick = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const idle = Date.now() - lastMoveTimeRef.current > IDLE_DELAY;
      if (idle && cursorPosRef.current && Math.random() < 0.55) {
        spawnSparkler(cursorPosRef.current.x, cursorPosRef.current.y);
      }

      particlesRef.current = particlesRef.current.filter((p) => p.life < p.maxLife);
      for (const p of particlesRef.current) {
        p.life++;
        p.x += p.vx;
        p.y += p.vy;

        if (p.mode === "smoke") {
          p.vy += 0.01;
          const t = p.life / p.maxLife;
          const alpha = 1 - t;
          const size = p.size * (1 - t * 0.6);

          ctx.save();
          ctx.globalAlpha = alpha;
          ctx.fillStyle = "rgba(255,248,242,0.5)";
          ctx.shadowColor = "rgba(255,248,242,0.5)";
          ctx.shadowBlur = 8;
          ctx.beginPath();
          ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        } else {
          p.vx *= 0.94;
          p.vy *= 0.94;
          p.vy += 0.04;
          const t = p.life / p.maxLife;
          const alpha = (1 - t) * (0.6 + Math.random() * 0.4);
          const size = p.size * (1 - t * 0.5);

          ctx.save();
          ctx.globalAlpha = alpha;
          ctx.fillStyle = "#fff8f2";
          ctx.shadowColor = "rgba(255,248,242,0.9)";
          ctx.shadowBlur = 6;
          ctx.beginPath();
          ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }
      raf = requestAnimationFrame(tick);
    };
    tick();

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", handleMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        inset: 0,
        pointerEvents: "none",
        zIndex: 9999,
      }}
    />
  );
}