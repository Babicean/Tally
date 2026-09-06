import type { DayKey } from "../types";
import { fromDayKey, trackingDayFor, addDays } from "./day";

const numberFormat = new Intl.NumberFormat();

export function formatCalories(value: number): string {
  return numberFormat.format(value);
}

export function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

/** "Today", "Yesterday", or e.g. "Tuesday, July 1" for this year's dates. */
export function formatDayLabel(day: DayKey, now: Date = new Date()): string {
  const today = trackingDayFor(now);
  if (day === today) return "Today";
  if (day === addDays(today, -1)) return "Yesterday";
  const date = fromDayKey(day);
  const sameYear = date.getFullYear() === now.getFullYear();
  return date.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    ...(sameYear ? {} : { year: "numeric" }),
  });
}

/** Short weekday letter for chart axis, e.g. "M". */
export function weekdayInitial(day: DayKey): string {
  return fromDayKey(day)
    .toLocaleDateString(undefined, { weekday: "narrow" });
}

/** e.g. "July 4" — the hero date on the Today screen. The weekday lives
    in the top bar since 2.18, so the hero doesn't repeat it. */
export function formatHeroDate(day: DayKey): string {
  return fromDayKey(day).toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
  });
}

/** e.g. "Sunday" — the top bar's resting label, for the tracking day. */
export function formatWeekday(day: DayKey): string {
  return fromDayKey(day).toLocaleDateString(undefined, { weekday: "long" });
}
