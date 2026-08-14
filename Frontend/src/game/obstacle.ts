export const LANE_COLORS = ["#ef4444", "#22d3ee", "#4ade80", "#facc15"]; // red, cyan, green, yellow

export class Obstacle {
  y: number;
  laneWidth: number;
  laneCount: number;
  safeLane: number;
  height = 22;
  scored = false;
  passedCheck = false;

  constructor(canvasHeight: number, laneWidth: number, laneCount: number, safeLane: number) {
    this.y = canvasHeight + this.height;
    this.laneWidth = laneWidth;
    this.laneCount = laneCount;
    this.safeLane = safeLane;
  }

  update(dt: number, speed: number) {
    this.y -= speed * dt;
  }

  draw(ctx: CanvasRenderingContext2D) {
    for (let lane = 0; lane < this.laneCount; lane++) {
      const x = lane * this.laneWidth;
      const isSafe = lane === this.safeLane;

      ctx.save();
      if (isSafe) {
        // Safe gap: faint outline only, no fill, so it reads as "open"
        ctx.strokeStyle = "rgba(255,255,255,0.25)";
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 6]);
        ctx.strokeRect(x + 4, this.y - this.height / 2, this.laneWidth - 8, this.height);
      } else {
        const color = LANE_COLORS[lane];
        ctx.shadowColor = color;
        ctx.shadowBlur = 16;
        ctx.fillStyle = color;
        ctx.fillRect(x + 2, this.y - this.height / 2, this.laneWidth - 4, this.height);
      }
      ctx.restore();
    }
  }
}
