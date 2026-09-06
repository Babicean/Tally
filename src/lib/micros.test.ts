import { describe, expect, it } from "vitest";
import {
  DEFAULT_MICRO_TARGETS,
  hasMicros,
  isMicros,
  naKRatio,
  normalizeMicros,
  parseMg,
  sumMicros,
} from "./micros";

describe("micros validation", () => {
  it("accepts known keys with sane mg amounts", () => {
    expect(isMicros({ sodium: 820, potassium: 410 })).toBe(true);
    expect(isMicros({})).toBe(true);
  });

  it("rejects unknown keys, negatives, absurd amounts, and non-objects", () => {
    expect(isMicros({ iron: 5 })).toBe(false);
    expect(isMicros({ sodium: -1 })).toBe(false);
    expect(isMicros({ sodium: 1e9 })).toBe(false);
    expect(isMicros({ sodium: "820" })).toBe(false);
    expect(isMicros(null)).toBe(false);
    expect(isMicros([820])).toBe(false);
  });

  it("normalizes to undefined when empty so records stay lean", () => {
    expect(normalizeMicros({})).toBeUndefined();
    expect(normalizeMicros(null)).toBeUndefined();
    expect(normalizeMicros({ sodium: 820 })).toEqual({ sodium: 820 });
    expect(hasMicros({ calcium: 0 })).toBe(true);
    expect(hasMicros(undefined)).toBe(false);
  });
});

describe("parseMg", () => {
  it("blank is absent, digits parse, junk is invalid", () => {
    expect(parseMg("")).toBeNull();
    expect(parseMg("  ")).toBeNull();
    expect(parseMg("820")).toBe(820);
    expect(parseMg("1,200")).toBe(1200);
    expect(parseMg("12.6")).toBe(13);
    expect(parseMg("lots")).toBeUndefined();
    expect(parseMg("-5")).toBeUndefined();
    expect(parseMg("99999")).toBeUndefined();
  });
});

describe("sumMicros and the sodium : potassium ratio", () => {
  it("sums per key and only surfaces keys something carried", () => {
    const total = sumMicros([
      { micros: { sodium: 800, potassium: 400 } },
      { micros: { sodium: 300, magnesium: 120 } },
      {},
    ]);
    expect(total).toEqual({ sodium: 1100, potassium: 400, magnesium: 120 });
    expect("calcium" in total).toBe(false);
  });

  it("ratio needs both sides", () => {
    expect(naKRatio({ sodium: 1100, potassium: 400 })).toBeCloseTo(2.75);
    expect(naKRatio({ sodium: 1100 })).toBeNull();
    expect(naKRatio({ sodium: 0, potassium: 400 })).toBeNull();
    expect(naKRatio({})).toBeNull();
  });

  it("ships Australian adult defaults", () => {
    expect(DEFAULT_MICRO_TARGETS.sodium).toBe(2000);
    expect(DEFAULT_MICRO_TARGETS.potassium).toBe(3800);
  });
});
