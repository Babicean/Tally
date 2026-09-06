import { describe, expect, it } from "vitest";
import { GOAL_GRACE, ringProgress, withinGoal } from "./goal";

describe("withinGoal", () => {
  it("is generous by a small fraction of the goal, not a fixed number", () => {
    expect(GOAL_GRACE).toBe(0.02);
    expect(withinGoal(2403, 2400)).toBe(true); // three calories is nothing
    expect(withinGoal(2448, 2400)).toBe(true); // exactly at the band
    expect(withinGoal(2449, 2400)).toBe(false);
    expect(withinGoal(2040, 2000)).toBe(true);
    expect(withinGoal(2041, 2000)).toBe(false);
  });

  it("scales with the goal so kilojoule-sized goals behave the same", () => {
    // 8,700 kJ ≈ 2,079 kcal; 2% of that is ~41.6 kcal either way.
    expect(withinGoal(2079.35 + 41, 2079.35)).toBe(true);
    expect(withinGoal(2079.35 + 42, 2079.35)).toBe(false);
  });
});

describe("ringProgress", () => {
  it("is the fraction of the goal, capped at a full ring", () => {
    expect(ringProgress(0, 2400)).toBe(0);
    expect(ringProgress(600, 2400)).toBe(0.25);
    expect(ringProgress(2400, 2400)).toBe(1);
    expect(ringProgress(3000, 2400)).toBe(1);
  });

  it("has nothing to say without a goal", () => {
    expect(ringProgress(900, null)).toBeNull();
    expect(ringProgress(900, 0)).toBeNull();
  });
});
