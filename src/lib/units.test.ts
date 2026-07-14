import { describe, expect, it } from "vitest";
import {
  MAX_KILOJOULES,
  energyNoun,
  energyUnitLabel,
  formatEnergy,
  parseEnergy,
  toDisplayEnergy,
} from "./units";

describe("energy display", () => {
  it("leaves calories untouched and converts kilojoules", () => {
    expect(toDisplayEnergy(2000, "kcal")).toBe(2000);
    expect(toDisplayEnergy(2000, "kj")).toBe(8368);
    expect(formatEnergy(2000, "kj")).toBe("8,368");
    expect(energyUnitLabel("kcal")).toBe("cal");
    expect(energyUnitLabel("kj")).toBe("kJ");
    expect(energyNoun("kj")).toBe("kilojoules");
  });

  it("round-trips ANY typed kilojoule value exactly", () => {
    // Stored kcal is the exact float; display rounds back to what was
    // typed. 500 kJ must never come back as 502.
    for (const kj of [1, 2, 435, 500, 900, 1675, 8700, 83680]) {
      const stored = parseEnergy(String(kj), "kj")!;
      expect(toDisplayEnergy(stored, "kj")).toBe(kj);
    }
    expect(parseEnergy("900", "kj")).toBeCloseTo(215.105, 2);
  });

  it("shows kilojoule entries honestly in calorie mode", () => {
    // 900 kJ ≈ 215.1 kcal → "215".
    expect(toDisplayEnergy(parseEnergy("900", "kj")!, "kcal")).toBe(215);
  });
});

describe("parseEnergy", () => {
  it("parses calories exactly like parseCalories", () => {
    expect(parseEnergy("500", "kcal")).toBe(500);
    expect(parseEnergy("+1,200", "kcal")).toBe(1200);
    expect(parseEnergy("nah", "kcal")).toBeNull();
  });

  it("accepts kilojoule bounds and rejects past them", () => {
    expect(parseEnergy(String(MAX_KILOJOULES), "kj")).toBe(20000);
    expect(parseEnergy(String(MAX_KILOJOULES + 1), "kj")).toBeNull();
    expect(parseEnergy("0", "kj")).toBeNull();
    expect(parseEnergy("-5", "kj")).toBeNull();
  });

  it("keeps tiny-but-real kilojoule entries positive", () => {
    const one = parseEnergy("1", "kj")!;
    expect(one).toBeGreaterThan(0);
    expect(toDisplayEnergy(one, "kj")).toBe(1);
  });

  it("tolerates separators and decimals in kilojoules", () => {
    expect(parseEnergy("8,700", "kj")).toBeCloseTo(2079.35, 1);
    expect(parseEnergy("900.5", "kj")).toBeCloseTo(215.22, 1);
  });
});
