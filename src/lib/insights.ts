import type { DayKey, Entry } from "../types";
import { addDays } from "./day";

/**
 * Insights: what you actually ate over a period, derived entirely from
 * existing entries. Observations, never judgments; nothing here scolds.
 *
 * "Week" is the rolling 7 tracking days ending today, matching the trend
 * card's recap. "Month" is the current calendar month, up to today.
 */

export type InsightsRange = "week" | "month";

export interface TopFood {
  /** Display name, as the user most recently typed it. */
  name: string;
  /** Times it was logged in the range. */
  count: number;
  /** Total calories across those logs. */
  calories: number;
}

export interface TimeSplit {
  label: "Morning" | "Afternoon" | "Evening";
  /** Human hour range, shown small next to the label. */
  hours: string;
  calories: number;
  /** 0..1 share of the range's calories (0 when nothing logged). */
  share: number;
}

export interface Insights {
  /** Days with at least one entry in the range. */
  daysLogged: number;
  /** Days the range spans so far (7, or the day of the month). */
  spanDays: number;
  /** Average calories per logged day, or null when nothing was logged. */
  avgCalories: number | null;
  /** Completed logged days (today excluded — it isn't over yet) at or
      under the goal; null when no goal is set or no completed day exists. */
  goalDays: number | null;
  /** Average grams of protein per logged day, or null when none tracked. */
  proteinAvg: number | null;
  /** Average grams of fat per logged day, or null when none tracked. */
  fatAvg: number | null;
  /** Every named food in the range, most-logged first. */
  foods: TopFood[];
  split: [TimeSplit, TimeSplit, TimeSplit];
  totalCalories: number;
}

/** Which third of the eating day a timestamp falls in, 2 AM boundary aware:
    the evening runs past midnight until the day flips at 2 AM. */
function bucketOf(timestamp: number): 0 | 1 | 2 {
  const hour = new Date(timestamp).getHours();
  if (hour >= 2 && hour < 11) return 0; // morning
  if (hour >= 11 && hour < 16) return 1; // afternoon
  return 2; // evening: 4 pm through 1:59 am
}

export function insightsFor(
  entries: Entry[],
  today: DayKey,
  range: InsightsRange,
  dailyGoal: number | null,
): Insights {
  let inRange: (day: DayKey) => boolean;
  let spanDays: number;
  if (range === "week") {
    const days = new Set<DayKey>();
    for (let i = 0; i < 7; i++) days.add(addDays(today, -i));
    inRange = (day) => days.has(day);
    spanDays = 7;
  } else {
    const prefix = today.slice(0, 7);
    inRange = (day) => day.slice(0, 7) === prefix && day <= today;
    spanDays = parseInt(today.slice(8), 10);
  }

  const byDay = new Map<DayKey, number>();
  const foods = new Map<string, TopFood & { lastUsed: number }>();
  const bucketCalories: [number, number, number] = [0, 0, 0];
  let totalCalories = 0;
  let protein = 0;
  let fat = 0;

  for (const e of entries) {
    if (!inRange(e.day)) continue;
    totalCalories += e.calories;
    byDay.set(e.day, (byDay.get(e.day) ?? 0) + e.calories);
    if (typeof e.protein === "number") protein += e.protein;
    if (typeof e.fat === "number") fat += e.fat;
    bucketCalories[bucketOf(e.timestamp)] += e.calories;

    const name = e.description.trim();
    if (name) {
      const key = name.toLowerCase();
      const existing = foods.get(key);
      if (existing) {
        existing.count += 1;
        existing.calories += e.calories;
        if (e.timestamp > existing.lastUsed) {
          existing.lastUsed = e.timestamp;
          existing.name = name;
        }
      } else {
        foods.set(key, {
          name,
          count: 1,
          calories: e.calories,
          lastUsed: e.timestamp,
        });
      }
    }
  }

  const daysLogged = byDay.size;
  const avgCalories =
    daysLogged > 0 ? Math.round(totalCalories / daysLogged) : null;
  // Today is still in progress, so it can't be judged against the goal
  // yet — counting it would congratulate an unfinished day.
  const completedDays = [...byDay.entries()].filter(([day]) => day !== today);
  const goalDays =
    dailyGoal !== null && dailyGoal > 0 && completedDays.length > 0
      ? completedDays.filter(([, total]) => total <= dailyGoal).length
      : null;
  const proteinAvg =
    daysLogged > 0 && protein > 0 ? Math.round(protein / daysLogged) : null;
  const fatAvg =
    daysLogged > 0 && fat > 0 ? Math.round(fat / daysLogged) : null;

  const ranked = [...foods.values()]
    .sort((a, b) => b.count - a.count || b.calories - a.calories)
    .map(({ name, count, calories }) => ({ name, count, calories }));

  const split = (
    [
      ["Morning", "before 11 am"],
      ["Afternoon", "11 am to 4 pm"],
      ["Evening", "after 4 pm"],
    ] as const
  ).map(([label, hours], i) => ({
    label,
    hours,
    calories: bucketCalories[i],
    share: totalCalories > 0 ? bucketCalories[i] / totalCalories : 0,
  })) as [TimeSplit, TimeSplit, TimeSplit];

  return {
    daysLogged,
    spanDays,
    avgCalories,
    goalDays,
    proteinAvg,
    fatAvg,
    foods: ranked,
    split,
    totalCalories,
  };
}
