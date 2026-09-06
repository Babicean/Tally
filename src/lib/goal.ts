/**
 * The calorie goal's grace band. A day three calories past the goal is
 * not an "over" day in any sense that matters, and turning the ring
 * amber for it reads as judgement. Within this fraction of the goal
 * the ring and pill stay calm and the day still counts as under goal;
 * the numbers themselves are never softened.
 */
export const GOAL_GRACE = 0.02;

/** True while `total` is at or within the grace band of `goal`. */
export function withinGoal(total: number, goal: number): boolean {
  return total <= goal * (1 + GOAL_GRACE);
}

/**
 * How full a progress ring should be for `total` against `goal`, 0..1.
 * Null when there is no goal to measure against, so the caller can fall
 * back to a resting shape instead of an empty ring that would read as
 * "nothing logged".
 */
export function ringProgress(total: number, goal: number | null): number | null {
  if (goal === null || !(goal > 0)) return null;
  return Math.min(Math.max(total, 0) / goal, 1);
}
