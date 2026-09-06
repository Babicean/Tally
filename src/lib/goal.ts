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
