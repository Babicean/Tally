import { describe, expect, it } from "vitest";
import { greetingFor, periodFor } from "./greeting";

describe("greeting periods", () => {
  it("splits the day at sensible hours", () => {
    expect(periodFor(5)).toBe("morning");
    expect(periodFor(11)).toBe("morning");
    expect(periodFor(12)).toBe("afternoon");
    expect(periodFor(16)).toBe("afternoon");
    expect(periodFor(17)).toBe("evening");
    expect(periodFor(22)).toBe("evening");
    expect(periodFor(23)).toBe("night");
    expect(periodFor(0)).toBe("night");
    expect(periodFor(4)).toBe("night");
  });

  it("maps each period to one calm line", () => {
    expect(greetingFor(8).text).toBe("Good morning");
    expect(greetingFor(14).text).toBe("Good afternoon");
    expect(greetingFor(19).text).toBe("Good evening");
    expect(greetingFor(1)).toEqual({ period: "night", text: "Late night" });
  });
});
