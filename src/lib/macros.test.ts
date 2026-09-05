import { describe, expect, it } from "vitest";
import { carbsForDay, carbsForEntries, carbsOf } from "./macros";
import { createEntry } from "./store";

describe("carbsOf", () => {
  it("derives carbs from the calories protein and fat leave behind", () => {
    // 500 kcal, 30 g protein (120), 10 g fat (90) → 290 kcal → 72.5 g
    expect(carbsOf({ calories: 500, protein: 30, fat: 10 })).toBe(72.5);
  });

  it("is null without both protein and fat", () => {
    expect(carbsOf({ calories: 500 })).toBeNull();
    expect(carbsOf({ calories: 500, protein: 30 })).toBeNull();
    expect(carbsOf({ calories: 500, protein: 30, fat: null })).toBeNull();
    expect(carbsOf({ calories: 500, protein: null, fat: 10 })).toBeNull();
  });

  it("treats zero grams as real data, not missing", () => {
    // A protein shake: 120 kcal, 25 g protein, 0 g fat → 20 kcal → 5 g
    expect(carbsOf({ calories: 120, protein: 25, fat: 0 })).toBe(5);
  });

  it("never goes negative when label rounding overshoots", () => {
    // 100 kcal but 20 g protein + 3 g fat = 107 kcal on paper
    expect(carbsOf({ calories: 100, protein: 20, fat: 3 })).toBe(0);
  });
});

describe("carbsForEntries / carbsForDay", () => {
  const at = (hour: number) => new Date(2026, 8, 5, hour, 0);

  it("sums only the derivable entries and ignores the rest", () => {
    const entries = [
      createEntry(500, "Bowl", at(8), 30, 10), // 72.5
      createEntry(300, "Mystery", at(12)), // not derivable
      createEntry(200, "Shake", at(15), 25, 5), // (200-100-45)/4 = 13.75
    ];
    expect(carbsForEntries(entries)).toBeCloseTo(86.25, 5);
  });

  it("is null when no entry is derivable", () => {
    expect(carbsForEntries([createEntry(300, "Mystery", at(12))])).toBeNull();
    expect(carbsForEntries([])).toBeNull();
  });

  it("scopes to one tracking day", () => {
    const entries = [
      createEntry(500, "Bowl", new Date(2026, 8, 5, 8, 0), 30, 10),
      createEntry(500, "Bowl", new Date(2026, 8, 4, 8, 0), 30, 10),
    ];
    expect(carbsForDay(entries, "2026-09-05")).toBe(72.5);
    expect(carbsForDay(entries, "2026-09-03")).toBeNull();
  });
});
