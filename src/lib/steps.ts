import { Capacitor } from "@capacitor/core";
import { Health } from "@capgo/capacitor-health";

/**
 * Steps come from the phone, not from Tally: Health Connect on Android
 * (where Samsung Health, Fitbit and the phone's own counter all write),
 * Apple Health on iOS. Tally reads a daily total when it opens and
 * shows it. Nothing is stored, backed up, or synced; turn the switch
 * off and the app has never heard of steps.
 *
 * Step days are calendar days (midnight), not Tally's 2 AM tracking
 * days, so the number matches what the phone's own health app shows.
 */

export type StepsStatus =
  /** Switch is off. */
  | "off"
  /** No native health store here (browser, or Health Connect missing). */
  | "unavailable"
  /** The store exists but Tally wasn't allowed to read steps. */
  | "denied"
  /** Reading fine (a fresh read may still be in flight). */
  | "ok";

export interface DailySteps {
  /** Calendar day as YYYY-MM-DD in local time. */
  day: string;
  steps: number;
}

/** What the UI needs from a health store; native below, stubbed in tests. */
export interface StepsSource {
  availability(): Promise<{ available: boolean; reason?: string }>;
  /** Prompt for read access; true when granted (iOS always says yes). */
  request(): Promise<boolean>;
  /** Current read access without prompting. */
  check(): Promise<boolean>;
  /** Daily totals in [start, end), oldest first; days without data omitted. */
  dailyTotals(start: Date, end: Date): Promise<DailySteps[]>;
  /** Android: jump to the Health Connect permissions screen. */
  openSettings?(): Promise<void>;
}

export function localDayKey(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

/** Local midnight starting the calendar day `offsetDays` from `now`'s. */
export function calendarDayStart(now: Date, offsetDays = 0): Date {
  return new Date(now.getFullYear(), now.getMonth(), now.getDate() + offsetDays);
}

/**
 * The window a refresh reads: the seven completed days before today plus
 * today so far. One query serves both the hero number and the weekly
 * average.
 */
export function stepsWindow(now: Date): { start: Date; end: Date } {
  return { start: calendarDayStart(now, -7), end: now };
}

/** Today's total from a window of daily buckets; 0 when today has none. */
export function todaySteps(buckets: DailySteps[], now: Date): number {
  const key = localDayKey(now);
  return buckets.find((b) => b.day === key)?.steps ?? 0;
}

/**
 * Average over the seven completed days before today. Today is excluded
 * because it is always partial; days the store has nothing for are
 * skipped rather than counted as zero (a phone left on the desk is not
 * a day of no walking, it is a day of no data). Null when no day had data.
 */
export function weeklyAverageSteps(
  buckets: DailySteps[],
  now: Date,
): number | null {
  const today = localDayKey(now);
  const floor = localDayKey(calendarDayStart(now, -7));
  const days = buckets.filter((b) => b.day >= floor && b.day < today && b.steps >= 0);
  if (days.length === 0) return null;
  const sum = days.reduce((acc, b) => acc + b.steps, 0);
  return Math.round(sum / days.length);
}

export function formatSteps(steps: number): string {
  return `${Math.round(steps).toLocaleString()} steps`;
}

/** The store's name in copy, by platform. */
export function stepsSourceName(): string {
  const platform = Capacitor.getPlatform();
  if (platform === "ios") return "Apple Health";
  if (platform === "android") return "Health Connect";
  return "your phone";
}

const nativeSource: StepsSource = {
  async availability() {
    const r = await Health.isAvailable();
    return { available: r.available, reason: r.reason };
  },
  async request() {
    const status = await Health.requestAuthorization({ read: ["steps"], write: [] });
    return status.readAuthorized.includes("steps");
  },
  async check() {
    const status = await Health.checkAuthorization({ read: ["steps"], write: [] });
    return status.readAuthorized.includes("steps");
  },
  async dailyTotals(start, end) {
    const { samples } = await Health.queryAggregated({
      dataType: "steps",
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      bucket: "day",
      aggregation: "sum",
    });
    const byDay = new Map<string, number>();
    for (const s of samples) {
      const day = localDayKey(new Date(s.startDate));
      byDay.set(day, (byDay.get(day) ?? 0) + (Number.isFinite(s.value) ? s.value : 0));
    }
    return [...byDay.entries()]
      .map(([day, steps]) => ({ day, steps: Math.round(steps) }))
      .sort((a, b) => (a.day < b.day ? -1 : 1));
  },
  async openSettings() {
    if (Capacitor.getPlatform() === "android") {
      await Health.openHealthConnectSettings();
    }
  },
};

/**
 * The store to read from. A test harness may install its own on
 * `globalThis` before the app boots; everyone else gets the phone.
 */
export function stepsSource(): StepsSource {
  const override = (globalThis as { __tallyStepsSource?: StepsSource }).__tallyStepsSource;
  return override ?? nativeSource;
}
