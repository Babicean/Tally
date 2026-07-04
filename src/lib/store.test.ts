import { describe, expect, it } from "vitest";
import {
  createEntry,
  entriesForDay,
  parseCalories,
  summarizeByDay,
  totalForDay,
} from "./store";

describe("parseCalories validation", () => {
  it("accepts plain positive integers", () => {
    expect(parseCalories("500")).toBe(500);
    expect(parseCalories(" 42 ")).toBe(42);
  });

  it("accepts a leading + and thousands separators", () => {
    expect(parseCalories("+350")).toBe(350);
    expect(parseCalories("1,200")).toBe(1200);
  });

  it("rounds decimals to whole calories", () => {
    expect(parseCalories("99.6")).toBe(100);
  });

  it("rejects zero, negatives, and junk", () => {
    expect(parseCalories("0")).toBeNull();
    expect(parseCalories("-200")).toBeNull();
    expect(parseCalories("abc")).toBeNull();
    expect(parseCalories("12abc")).toBeNull();
    expect(parseCalories("")).toBeNull();
    expect(parseCalories("1e6")).toBeNull();
  });

  it("rejects absurdly large values", () => {
    expect(parseCalories("999999")).toBeNull();
  });
});

describe("entry bucketing across the 2 AM boundary", () => {
  // A late Friday night: dinner at 8 PM, a snack at 1:30 AM, breakfast at 9 AM.
  const dinner = createEntry(700, "dinner", new Date(2026, 6, 3, 20, 0));
  const lateSnack = createEntry(300, "late snack", new Date(2026, 6, 4, 1, 30));
  const breakfast = createEntry(450, "breakfast", new Date(2026, 6, 4, 9, 0));
  const all = [dinner, lateSnack, breakfast];

  it("counts the 1:30 AM snack toward the previous tracking day", () => {
    expect(lateSnack.day).toBe("2026-07-03");
    expect(totalForDay(all, "2026-07-03")).toBe(1000);
    expect(totalForDay(all, "2026-07-04")).toBe(450);
  });

  it("lists a day's entries newest first", () => {
    const friday = entriesForDay(all, "2026-07-03");
    expect(friday.map((e) => e.description)).toEqual(["late snack", "dinner"]);
  });

  it("summarizes days newest first with correct totals", () => {
    const summaries = summarizeByDay(all);
    expect(summaries.map((s) => s.day)).toEqual(["2026-07-04", "2026-07-03"]);
    expect(summaries[1].total).toBe(1000);
  });
});

describe("createEntry", () => {
  it("trims descriptions and stamps the tracking day", () => {
    const e = createEntry(250, "  oatmeal  ", new Date(2026, 6, 4, 8, 0));
    expect(e.description).toBe("oatmeal");
    expect(e.day).toBe("2026-07-04");
    expect(e.calories).toBe(250);
    expect(e.id).toBeTruthy();
  });
});
