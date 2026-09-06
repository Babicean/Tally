/**
 * The top bar's opening line. A time-of-day greeting for a few seconds
 * after the app opens, then the weekday. Deterministic per period — a
 * randomised pool reads as a slot machine, and calm beats clever.
 */

export type DayPeriod = "morning" | "afternoon" | "evening" | "night";

export interface Greeting {
  period: DayPeriod;
  text: string;
}

/** Period for a local clock hour (0-23). */
export function periodFor(hour: number): DayPeriod {
  if (hour >= 5 && hour <= 11) return "morning";
  if (hour >= 12 && hour <= 16) return "afternoon";
  if (hour >= 17 && hour <= 22) return "evening";
  return "night";
}

const TEXT: Record<DayPeriod, string> = {
  morning: "Good morning",
  afternoon: "Good afternoon",
  evening: "Good evening",
  night: "Late night",
};

export function greetingFor(hour: number): Greeting {
  const period = periodFor(hour);
  return { period, text: TEXT[period] };
}
