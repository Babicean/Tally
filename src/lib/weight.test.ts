import { describe, expect, it } from "vitest";
import { mergeWeights, parseKg, upsertWeight, latestWeight } from "./weight";

describe("weight", () => {
  it("parses kg with 0.1 precision and sane bounds", () => {
    expect(parseKg("72.46")).toBe(72.5);
    expect(parseKg("72,4")).toBe(72.4);
    expect(parseKg("12")).toBeUndefined();
    expect(parseKg("lots")).toBeUndefined();
  });
  it("upserts one entry per day, sorted", () => {
    let w = upsertWeight([], "2026-07-02", 80);
    w = upsertWeight(w, "2026-07-01", 81);
    w = upsertWeight(w, "2026-07-02", 79.5);
    expect(w).toEqual([
      { day: "2026-07-01", kg: 81 },
      { day: "2026-07-02", kg: 79.5 },
    ]);
  });
  it("merges by day, local wins", () => {
    const merged = mergeWeights(
      [{ day: "2026-07-02", kg: 80 }],
      [{ day: "2026-07-02", kg: 99 }, { day: "2026-07-01", kg: 81 }],
    );
    expect(merged).toEqual([
      { day: "2026-07-01", kg: 81 },
      { day: "2026-07-02", kg: 80 },
    ]);
  });
  it("prefers the latest weigh-in on or before a day", () => {
    const w = [{ day: "2026-07-01", kg: 81 }, { day: "2026-07-03", kg: 80 }];
    expect(latestWeight(w, "2026-07-02")).toBe(81);
    expect(latestWeight(w, "2026-07-04")).toBe(80);
  });
});
