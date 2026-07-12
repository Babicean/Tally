import { describe, expect, it } from "vitest";
import { hapticStyleFor } from "./fly";

describe("hapticStyleFor", () => {
  it("maps the tuned Android durations onto iOS impact weights", () => {
    expect(hapticStyleFor(6)).toBe("LIGHT"); // stroke ticks, macro flip
    expect(hapticStyleFor(8)).toBe("MEDIUM"); // wordmark spin
    expect(hapticStyleFor(10)).toBe("MEDIUM"); // logging default
    expect(hapticStyleFor(14)).toBe("MEDIUM"); // tally slash
    expect(hapticStyleFor(20)).toBe("HEAVY"); // celebrations
    expect(hapticStyleFor(24)).toBe("HEAVY");
  });
});
