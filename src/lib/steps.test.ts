import { describe, expect, it } from "vitest";
import {
  calendarDayStart,
  formatSteps,
  localDayKey,
  stepsWindow,
  todaySteps,
  weeklyAverageSteps,
} from "./steps";

// A Sunday afternoon.
const now = new Date(2026, 8, 6, 15, 30);

describe("calendar days for steps", () => {
  it("keys and starts days at local midnight, not 2 AM", () => {
    expect(localDayKey(now)).toBe("2026-09-06");
    expect(calendarDayStart(now).getHours()).toBe(0);
    expect(localDayKey(calendarDayStart(now, -1))).toBe("2026-09-05");
    // 1 a.m. is still today's calendar day, matching the phone's own count.
    expect(localDayKey(new Date(2026, 8, 6, 1, 0))).toBe("2026-09-06");
  });

  it("reads one window: seven completed days plus today so far", () => {
    const { start, end } = stepsWindow(now);
    expect(localDayKey(start)).toBe("2026-08-30");
    expect(end).toBe(now);
  });
});

describe("todaySteps", () => {
  it("picks today's bucket and treats a missing one as zero", () => {
    expect(todaySteps([{ day: "2026-09-05", steps: 8000 }, { day: "2026-09-06", steps: 4210 }], now)).toBe(4210);
    expect(todaySteps([{ day: "2026-09-05", steps: 8000 }], now)).toBe(0);
  });
});

describe("weeklyAverageSteps", () => {
  it("averages the seven days before today, skipping today and days without data", () => {
    const buckets = [
      { day: "2026-08-29", steps: 99999 }, // outside the window
      { day: "2026-08-30", steps: 6000 },
      { day: "2026-08-31", steps: 8000 },
      { day: "2026-09-02", steps: 7000 }, // Sept 1 missing: skipped, not zero
      { day: "2026-09-06", steps: 400 }, // today, partial: excluded
    ];
    expect(weeklyAverageSteps(buckets, now)).toBe(7000);
  });

  it("is null with nothing to average", () => {
    expect(weeklyAverageSteps([], now)).toBeNull();
    expect(weeklyAverageSteps([{ day: "2026-09-06", steps: 400 }], now)).toBeNull();
  });

  it("rounds to whole steps", () => {
    expect(weeklyAverageSteps([{ day: "2026-09-04", steps: 1 }, { day: "2026-09-05", steps: 2 }], now)).toBe(2);
  });
});

describe("formatSteps", () => {
  it("groups thousands and says steps", () => {
    expect(formatSteps(4210)).toBe("4,210 steps");
    expect(formatSteps(0)).toBe("0 steps");
  });
});
