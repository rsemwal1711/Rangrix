import { Player } from "./player";
import { Obstacle, LANE_COLORS } from "./obstacle";
import { checkCollision } from "./collision";
import { ParticleSystem } from "./particles";
import SoundManager from "./sound";

export type GameState = "idle" | "playing" | "gameover";

export interface EngineCallbacks {
  onScoreChange: (score: number) => void;
  onStateChange: (state: GameState) => void;
  onStreakChange: (streak: number) => void;
}

const LANE_COUNT = 4;
const BASE_OBSTACLE_SPEED = 140; // px/sec
const MAX_OBSTACLE_SPEED = 420;
const BASE_SPAWN_INTERVAL = 1.5; // seconds
const MIN_SPAWN_INTERVAL = 0.62;
const GRAVITY = 900; // px/sec^2
const BOOST_VELOCITY = -420; // px/sec (negative = up)

export class Engine {
  difficulty: "easy" | "medium" | "hard" = "medium";
  private speedMultiplier = 1;
  private spawnMultiplier = 1;
  width = 0;
  height = 0;
  laneWidth = 0;

  player: Player;
  obstacles: Obstacle[] = [];
  particles: ParticleSystem;

  state: GameState = "idle";
  score = 0;
  highScore = 0;
  streak = 0;
  elapsed = 0;
  timeSinceLastSpawn = 0;
  timeSinceLastBonus = 0;
  difficultyTime = 0;

  private callbacks: EngineCallbacks;
  private lastTimestamp = 0;
  private rafId = 0;
  private shakeTime = 0;
  private shakeMagnitude = 0;
  private sound: SoundManager;

  constructor(width: number, height: number, callbacks: EngineCallbacks) {
    this.width = width;
    this.height = height;
    this.laneWidth = width / LANE_COUNT;
    this.callbacks = callbacks;
    this.player = new Player(this.laneWidth, LANE_COUNT);
    this.particles = new ParticleSystem();
    this.highScore = Number(localStorage.getItem("rangrix_highscore") || 0);
    this.setDifficulty(this.difficulty);
    this.sound = new SoundManager();
  }

  resize(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.laneWidth = width / LANE_COUNT;
    this.player.setLaneWidth(this.laneWidth);
  }

  start() {
    this.state = "playing";
    this.score = 0;
    this.streak = 0;
    this.elapsed = 0;
    this.timeSinceLastSpawn = 0;
    this.timeSinceLastBonus = 0;
    this.difficultyTime = 0;
    this.obstacles = [];
    this.particles.clear();
    this.player.reset(this.height);
    this.callbacks.onScoreChange(0);
    this.callbacks.onStreakChange(0);
    this.callbacks.onStateChange("playing");
    this.lastTimestamp = performance.now();
    // resume audio context on user gesture and start background audio
    this.sound.resume();
    this.sound.startBackground();
    this.loop(this.lastTimestamp);
  }

  stop() {
    cancelAnimationFrame(this.rafId);
    this.sound.stopBackground();
  }

  moveLeft() {
    if (this.state === "playing") this.player.moveLeft();
  }

  moveRight() {
    if (this.state === "playing") this.player.moveRight();
  }

  boost() {
    if (this.state === "playing") this.player.velocityY = BOOST_VELOCITY;
  }

  private currentObstacleSpeed() {
    const t = Math.min(this.difficultyTime / 60, 1); // ramps over 60s
    const base = BASE_OBSTACLE_SPEED + (MAX_OBSTACLE_SPEED - BASE_OBSTACLE_SPEED) * t;
    return base * this.speedMultiplier;
  }

  private currentSpawnInterval() {
    const t = Math.min(this.difficultyTime / 60, 1);
    const base = BASE_SPAWN_INTERVAL - (BASE_SPAWN_INTERVAL - MIN_SPAWN_INTERVAL) * t;
    return base * this.spawnMultiplier;
  }

  setDifficulty(level: "easy" | "medium" | "hard") {
    this.difficulty = level;
    switch (level) {
      case "easy":
        this.speedMultiplier = 0.85;
        this.spawnMultiplier = 1.2;
        break;
      case "medium":
        this.speedMultiplier = 1;
        this.spawnMultiplier = 1;
        break;
      case "hard":
        this.speedMultiplier = 1.25;
        this.spawnMultiplier = 0.85;
        break;
    }
  }

  setPlayerAppearance(color: string, shape: "circle" | "square" | "triangle", faceUrl?: string | null) {
    this.player.setColor(color);
    this.player.setShape(shape);
    this.player.setFaceImage(faceUrl ?? null);
  }

  private spawnObstacle() {
    const safeLane = Math.floor(Math.random() * LANE_COUNT);
    this.obstacles.push(new Obstacle(this.height, this.laneWidth, LANE_COUNT, safeLane));
  }

  private loop = (timestamp: number) => {
    const dt = Math.min((timestamp - this.lastTimestamp) / 1000, 0.05);
    this.lastTimestamp = timestamp;

    if (this.state === "playing") {
      this.update(dt);
    }
    this.particles.update(dt);

    this.rafId = requestAnimationFrame(this.loop);
  };

  private update(dt: number) {
    this.elapsed += dt;
    this.difficultyTime += dt;
    this.timeSinceLastSpawn += dt;
    this.timeSinceLastBonus += dt;

    // Survival bonus every 10s
    if (this.timeSinceLastBonus >= 10) {
      this.timeSinceLastBonus -= 10;
      this.addScore(5);
      this.particles.burst(this.width / 2, 40, "#facc15", 18);
    }

    // Physics
    this.player.velocityY += GRAVITY * dt;
    this.player.y += this.player.velocityY * dt;
    this.player.updateLanePosition(dt);

    // Out of bounds = game over
    if (this.player.y < -this.player.radius || this.player.y > this.height + this.player.radius) {
      this.endGame();
      return;
    }

    // Spawn obstacles
    if (this.timeSinceLastSpawn >= this.currentSpawnInterval()) {
      this.timeSinceLastSpawn = 0;
      this.spawnObstacle();
    }

    const speed = this.currentObstacleSpeed();

    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const obstacle = this.obstacles[i];
      obstacle.update(dt, speed);

      if (!obstacle.scored && !obstacle.passedCheck) {
        const collision = checkCollision(this.player, obstacle);
        if (collision === "hit") {
          this.player.flashHit();
          this.triggerShake(0.35, 10);
          this.particles.burst(this.player.x, this.player.y, "#ef4444", 30);
          this.sound.playHit();
          this.endGame();
          return;
        } else if (collision === "pass") {
          obstacle.passedCheck = true;
          obstacle.scored = true;
          this.streak += 1;
          const multiplier = 1 + Math.floor(this.streak / 5) * 0.5;
          this.addScore(Math.round(1 * multiplier));
          this.callbacks.onStreakChange(this.streak);
          this.particles.burst(
            this.player.x,
            this.player.y,
            LANE_COLORS[obstacle.safeLane],
            14
          );
          this.sound.playPass();
        }
      }

      if (obstacle.y > this.height + 40) {
        this.obstacles.splice(i, 1);
      }
    }

    if (this.shakeTime > 0) {
      this.shakeTime -= dt;
    }
  }

  private addScore(points: number) {
    this.score += points;
    this.callbacks.onScoreChange(this.score);
  }

  setSoundEnabled(enabled: boolean) {
    this.sound.setEnabled(enabled);
    if (!enabled) this.sound.stopBackground();
  }

  setSoundVolume(v: number) {
    this.sound.setVolume(v);
  }

  private triggerShake(duration: number, magnitude: number) {
    this.shakeTime = duration;
    this.shakeMagnitude = magnitude;
  }

  getShakeOffset(): { x: number; y: number } {
    if (this.shakeTime <= 0) return { x: 0, y: 0 };
    const decay = this.shakeTime;
    return {
      x: (Math.random() - 0.5) * this.shakeMagnitude * decay,
      y: (Math.random() - 0.5) * this.shakeMagnitude * decay,
    };
  }

  private endGame() {
    this.state = "gameover";
    if (this.score > this.highScore) {
      this.highScore = this.score;
      localStorage.setItem("rangrix_highscore", String(this.highScore));
    }
    this.callbacks.onStateChange("gameover");
  }
}