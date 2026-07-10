import { describe, expect, it } from "vitest";
import { welcomeDecision } from "./welcome";

const readFrom = (data: Record<string, string>) => (key: string) =>
  key in data ? data[key] : null;

describe("welcomeDecision", () => {
  it("shows on a completely fresh install", () => {
    expect(welcomeDecision(readFrom({}))).toBe("show");
  });

  it("skips once the flag is set", () => {
    expect(welcomeDecision(readFrom({ "tally.welcomed": "1" }))).toBe("skip");
  });

  it("marks existing installs as welcomed without showing", () => {
    for (const key of [
      "tally.store",
      "tally.menu",
      "tally.settings",
      "tally.weights",
      "tally.session",
    ]) {
      expect(welcomeDecision(readFrom({ [key]: "{}" }))).toBe("mark-and-skip");
    }
  });

  it("prefers the flag over re-detecting data", () => {
    expect(
      welcomeDecision(
        readFrom({ "tally.welcomed": "1", "tally.store": "{}" }),
      ),
    ).toBe("skip");
  });
});
