import { Player } from "./player";
import { Obstacle } from "./obstacle";

export type CollisionResult = "hit" | "pass" | "none";

/**
 * Checks whether the player's ball overlaps an obstacle bar vertically.
 * If it overlaps and the player is NOT in the safe lane -> "hit".
 * If the bar has fully crossed the player's y position without overlap
 * having been flagged as a hit -> "pass" (awards score).
 */
export function checkCollision(player: Player, obstacle: Obstacle): CollisionResult {
  const barTop = obstacle.y - obstacle.height / 2;
  const barBottom = obstacle.y + obstacle.height / 2;

  const overlapsVertically =
    player.y + player.radius >= barTop && player.y - player.radius <= barBottom;

  if (overlapsVertically) {
    if (player.lane !== obstacle.safeLane) {
      return "hit";
    }
    return "none"; // currently passing safely through the gap
  }

  // Bar has moved above the player without a recorded overlap this frame
  if (barBottom < player.y - player.radius) {
    return "pass";
  }

  return "none";
}
