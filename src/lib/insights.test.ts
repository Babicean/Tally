import { describe, expect, it } from "vitest";
import type { Entry } from "../types";
import { insightsFor } from "./insights";

let nextId = 0;
/** Entry on `day` at local `hour`; hours 0-1 land on the next calendar
    date, the way a real 1 am snack would. */
function mk(
  day: string,
  hour: number,
  calories: number,
  description: string,
  protein: number | null = null,
): Entry {
  const date = new Date(`${day}T12:00:00`);
  if (hour < 2) date.setDate(date.getDate() + 1);
  date.setHours(hour, 30, 0, 0);
  return {
    id: `t${nextId++}`,
    calories,
    description,
    timestamp: date.getTime(),
    day,
    protein,
    fat: null,
  };
}

const TODAY = "2026-07-10";

describe("insightsFor ranges", () => {
  it("keeps the rolling week to 7 tracking days", () => {
    const entries = [
      mk("2026-07-10", 12, 500, "in"),
      mk("2026-07-04", 12, 500, "edge in"),
      mk("2026-07-03", 12, 500, "out"),
    ];
    const r = insightsFor(entries, TODAY, "week", null);
    expect(r.daysLogged).toBe(2);
    expect(r.spanDays).toBe(7);
    expect(r.totalCalories).toBe(1000);
  });

  it("limits month to the current calendar month up to today", () => {
    const entries = [
      mk("2026-07-01", 12, 400, "in"),
      mk("2026-06-30", 12, 400, "prev month"),
    ];
    const r = insightsFor(entries, TODAY, "month", null);
    expect(r.daysLogged).toBe(1);
    expect(r.spanDays).toBe(10);
  });
});

describe("insightsFor foods", () => {
  it("groups by name, case-insensitive, keeping the latest spelling", () => {
    const entries = [
      mk("2026-07-08", 12, 600, "chicken and rice"),
      mk("2026-07-09", 12, 620, "Chicken and Rice"),
      mk("2026-07-10", 12, 610, "Chicken and Rice"),
      mk("2026-07-10", 9, 90, "banana"),
    ];
    const r = insightsFor(entries, TODAY, "week", null);
    expect(r.foods[0]).toEqual({
      name: "Chicken and Rice",
      count: 3,
      calories: 1830,
    });
    expect(r.foods[1].name).toBe("banana");
    expect(r.foods).toHaveLength(2);
  });

  it("skips unnamed entries and ranks every named one", () => {
    const entries = [
      mk("2026-07-10", 12, 100, ""),
      ...["a", "b", "c", "d", "e", "f", "g"].map((n, i) =>
        mk("2026-07-10", 12, 100 + i, n),
      ),
    ];
    const r = insightsFor(entries, TODAY, "week", null);
    expect(r.foods).toHaveLength(7);
  });
});

describe("insightsFor time split", () => {
  it("buckets by hour with the 2 am boundary", () => {
    const entries = [
      mk("2026-07-10", 2, 100, "early"), // morning edge
      mk("2026-07-10", 10, 100, "brunch"), // morning
      mk("2026-07-10", 11, 200, "lunch"), // afternoon edge
      mk("2026-07-10", 15, 200, "late lunch"), // afternoon
      mk("2026-07-10", 16, 300, "dinner"), // evening edge
      mk("2026-07-10", 1, 300, "midnight snack"), // evening, past midnight
    ];
    const r = insightsFor(entries, TODAY, "week", null);
    expect(r.split.map((s) => s.calories)).toEqual([200, 400, 600]);
    expect(r.split[2].share).toBeCloseTo(0.5);
  });
});

describe("insightsFor numbers", () => {
  it("averages per logged day and counts goal days only with a goal", () => {
    const entries = [
      mk("2026-07-09", 12, 1800, "day one", 30),
      mk("2026-07-10", 12, 2400, "day two", 50),
    ];
    const withGoal = insightsFor(entries, TODAY, "week", 2000);
    expect(withGoal.avgCalories).toBe(2100);
    expect(withGoal.goalDays).toBe(1);
    expect(withGoal.proteinAvg).toBe(40);
    const noGoal = insightsFor(entries, TODAY, "week", null);
    expect(noGoal.goalDays).toBeNull();
  });

  it("never judges the in-progress day against the goal", () => {
    // Today is under goal so far, but the day isn't over — it must not
    // count as a success yet.
    const entries = [
      mk("2026-07-09", 12, 1800, "day one"),
      mk("2026-07-10", 12, 350, "so far today"),
    ];
    expect(insightsFor(entries, TODAY, "week", 2000).goalDays).toBe(1);
    // Day one of using the app: nothing to judge at all.
    const dayOne = [mk("2026-07-10", 9, 350, "first entry")];
    expect(insightsFor(dayOne, TODAY, "week", 2000).goalDays).toBeNull();
  });

  it("gives a day the same 2% grace the ring does", () => {
    const entries = [
      mk("2026-07-08", 12, 2030, "a whisker over"), // within grace
      mk("2026-07-09", 12, 2100, "actually over"),
    ];
    expect(insightsFor(entries, TODAY, "week", 2000).goalDays).toBe(1);
  });

  it("averages fat per logged day when entries carry it", () => {
    const withFat = [
      { ...mk("2026-07-09", 12, 1800, "day one"), fat: 60 },
      { ...mk("2026-07-10", 12, 2400, "day two"), fat: 90 },
    ];
    expect(insightsFor(withFat, TODAY, "week", null).fatAvg).toBe(75);
    const noFat = [mk("2026-07-10", 12, 500, "plain")];
    expect(insightsFor(noFat, TODAY, "week", null).fatAvg).toBeNull();
  });

  it("returns nulls on an empty range", () => {
    const r = insightsFor([], TODAY, "week", 2000);
    expect(r.daysLogged).toBe(0);
    expect(r.avgCalories).toBeNull();
    expect(r.split.every((s) => s.share === 0)).toBe(true);
  });
});
