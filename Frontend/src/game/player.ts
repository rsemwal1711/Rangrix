export class Player {
  lane: number;
  laneCount: number;
  laneWidth: number;
  x: number;
  y = 0;
  velocityY = 0;
  radius = 16;
  hitFlashTime = 0;
  private targetX: number;
  private laneLerpSpeed = 12; // higher = snappier
  color = "#22d3ee";
  shape: "circle" | "square" | "triangle" = "circle";
  faceImage: HTMLImageElement | null = null;

  constructor(laneWidth: number, laneCount: number) {
    this.laneWidth = laneWidth;
    this.laneCount = laneCount;
    this.lane = Math.floor(laneCount / 2);
    this.x = this.laneCenterX(this.lane);
    this.targetX = this.x;
  }

  setLaneWidth(laneWidth: number) {
    this.laneWidth = laneWidth;
    this.targetX = this.laneCenterX(this.lane);
  }

  reset(canvasHeight: number) {
    this.lane = Math.floor(this.laneCount / 2);
    this.x = this.laneCenterX(this.lane);
    this.targetX = this.x;
    this.y = canvasHeight / 2;
    this.velocityY = 0;
    this.hitFlashTime = 0;
  }

  private laneCenterX(lane: number) {
    return lane * this.laneWidth + this.laneWidth / 2;
  }

  moveLeft() {
    if (this.lane > 0) {
      this.lane -= 1;
      this.targetX = this.laneCenterX(this.lane);
    }
  }

  moveRight() {
    if (this.lane < this.laneCount - 1) {
      this.lane += 1;
      this.targetX = this.laneCenterX(this.lane);
    }
  }

  updateLanePosition(dt: number) {
    const diff = this.targetX - this.x;
    this.x += diff * Math.min(this.laneLerpSpeed * dt, 1);
    if (this.hitFlashTime > 0) this.hitFlashTime -= dt;
  }

  flashHit() {
    this.hitFlashTime = 0.4;
  }

  draw(ctx: CanvasRenderingContext2D, time: number) {
    const pulse = 1 + Math.sin(time * 6) * 0.06;
    const r = this.radius * pulse;
    ctx.save();

    // Outer glow (use hit color when flashing)
    const glowColor = this.hitFlashTime > 0 ? "#ef4444" : this.color;
    const gradient = ctx.createRadialGradient(this.x, this.y, r * 0.2, this.x, this.y, r * 3.2);
    gradient.addColorStop(0, hexWithAlpha(glowColor, 0.55));
    gradient.addColorStop(1, hexWithAlpha(glowColor, 0));
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(this.x, this.y, r * 3.2, 0, Math.PI * 2);
    ctx.fill();

 
    // Core + shape
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = 24;
    ctx.fillStyle = this.color;

    if (this.faceImage) {
      const faceR = r * 2.3;
      ctx.beginPath();
      ctx.arc(this.x, this.y, faceR, 0, Math.PI * 2);
      ctx.save();
      ctx.clip();
      ctx.shadowBlur = 0;
      ctx.drawImage(this.faceImage, this.x - faceR, this.y - faceR, faceR * 2, faceR * 2);
      ctx.restore();
    } else if (this.shape === "circle") {
      ctx.beginPath();
      ctx.arc(this.x, this.y, r, 0, Math.PI * 2);
      ctx.fill();
    } else if (this.shape === "square") {
      const s = r * 1.6;
      ctx.beginPath();
      ctx.rect(this.x - s / 2, this.y - s / 2, s, s);
      ctx.fill();
    } else if (this.shape === "triangle") {
      const h = r * 1.9;
      ctx.beginPath();
      ctx.moveTo(this.x, this.y - h / 2);
      ctx.lineTo(this.x - h / 2, this.y + h / 2);
      ctx.lineTo(this.x + h / 2, this.y + h / 2);
      ctx.closePath();
      ctx.fill();
    }

    // Inner highlight
    if (!this.faceImage) {
      ctx.shadowBlur = 0;
      ctx.fillStyle = "rgba(255,255,255,0.85)";
      ctx.beginPath();
      ctx.arc(this.x - r * 0.3, this.y - r * 0.3, r * 0.35, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  setColor(hex: string) {
    this.color = hex;
  }

  setShape(s: "circle" | "square" | "triangle") {
    this.shape = s;
  }

  setFaceImage(url: string | null) {
    if (!url) {
      this.faceImage = null;
      return;
    }
    const img = new Image();
    img.onload = () => {
      this.faceImage = img;
    };
    img.src = url;
  }
}

function hexWithAlpha(hex: string, alpha: number) {
  const parsed = hex.replace("#", "");
  const bigint = parseInt(parsed, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r},${g},${b},${alpha})`;
}
