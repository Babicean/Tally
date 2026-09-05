import type { DayKey, DaySummary, Entry } from "../types";
import { trackingDayFor } from "./day";
import { mirrorWrite } from "./mirror";
import { carbsForEntries } from "./macros";

/**
 * Persistence lives behind this tiny repository so the storage engine can be
 * swapped (IndexedDB, a synced backend, …) without touching UI code. The
 * payload is versioned for painless future migrations.
 */
const STORAGE_KEY = "tally.store";
const STORE_VERSION = 1;

interface StoreShape {
  version: number;
  entries: Entry[];
}

/** Optional gram fields must be absent, null, or a real number. */
function isOptionalGrams(value: unknown): boolean {
  return (
    value === undefined ||
    value === null ||
    (typeof value === "number" && Number.isFinite(value))
  );
}

export function isEntry(value: unknown): value is Entry {
  if (typeof value !== "object" || value === null) return false;
  const e = value as Record<string, unknown>;
  return (
    typeof e.id === "string" &&
    typeof e.calories === "number" &&
    Number.isFinite(e.calories) &&
    e.calories > 0 &&
    e.calories <= MAX_CALORIES &&
    typeof e.description === "string" &&
    typeof e.timestamp === "number" &&
    Number.isFinite(e.timestamp) &&
    typeof e.day === "string" &&
    isOptionalGrams(e.protein) &&
    isOptionalGrams(e.fat)
  );
}

export function loadEntries(): Entry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as StoreShape;
    if (!parsed || !Array.isArray(parsed.entries)) return [];
    return parsed.entries.filter(isEntry);
  } catch {
    // Corrupt or inaccessible storage: start clean rather than crash.
    return [];
  }
}

export function saveEntries(entries: Entry[]): void {
  try {
    const payload: StoreShape = { version: STORE_VERSION, entries };
    const json = JSON.stringify(payload);
    localStorage.setItem(STORAGE_KEY, json);
    mirrorWrite(STORAGE_KEY, json);
  } catch {
    // Storage full or unavailable — the in-memory state still works.
  }
}

/** Per-entry sanity cap; nobody logs a 100k-calorie burrito. */
export const MAX_CALORIES = 20000;

/**
 * Parse and validate raw calorie input.
 * Returns a positive integer, or null when the input is not usable.
 */
export function parseCalories(raw: string): number | null {
  const cleaned = raw.trim().replace(/^\+/, "").replace(/,/g, "");
  if (!/^\d+(\.\d+)?$/.test(cleaned)) return null;
  const value = Math.round(Number(cleaned));
  if (!Number.isFinite(value) || value <= 0 || value > MAX_CALORIES) {
    return null;
  }
  return value;
}

export function createEntry(
  calories: number,
  description: string,
  when: Date = new Date(),
  protein: number | null = null,
  fat: number | null = null,
): Entry {
  return {
    id:
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
    calories,
    description: description.trim(),
    timestamp: when.getTime(),
    day: trackingDayFor(when),
    protein,
    fat,
  };
}

export interface FrequentItem {
  description: string;
  calories: number;
  /** Grams of protein carried along when logging. */
  protein?: number | null;
  /** Grams of fat carried along when logging. */
  fat?: number | null;
}

/**
 * The user's habitual entries, for one-tap quick-add chips. An item qualifies
 * once the same description + calorie pair has been logged at least twice;
 * the most-used (then most recent) items win. Only one calorie variant per
 * description makes the cut — near-duplicates ("Chicken and rice" at 650
 * and 780) would crowd out other habits with identical-looking chips.
 *
 * Chips carry the macros their source entries carried (the most common
 * protein/fat pair, ties to the most recent) — a habit chip logging the
 * same food with no protein would quietly read the day low.
 */
export function frequentEntries(entries: Entry[], limit = 4): FrequentItem[] {
  interface MacroCombo {
    protein: number | null;
    fat: number | null;
    count: number;
    lastUsed: number;
  }
  const stats = new Map<
    string,
    {
      item: FrequentItem;
      count: number;
      lastUsed: number;
      combos: Map<string, MacroCombo>;
    }
  >();
  for (const e of entries) {
    const description = e.description.trim();
    if (!description) continue;
    const key = `${description.toLowerCase()}|${e.calories}`;
    const protein = typeof e.protein === "number" ? e.protein : null;
    const fat = typeof e.fat === "number" ? e.fat : null;
    const comboKey = `${protein}|${fat}`;
    let record = stats.get(key);
    if (!record) {
      record = {
        item: { description, calories: e.calories },
        count: 0,
        lastUsed: 0,
        combos: new Map(),
      };
      stats.set(key, record);
    }
    record.count += 1;
    record.lastUsed = Math.max(record.lastUsed, e.timestamp);
    const combo = record.combos.get(comboKey);
    if (combo) {
      combo.count += 1;
      combo.lastUsed = Math.max(combo.lastUsed, e.timestamp);
    } else {
      record.combos.set(comboKey, {
        protein,
        fat,
        count: 1,
        lastUsed: e.timestamp,
      });
    }
  }
  for (const record of stats.values()) {
    let best: MacroCombo | null = null;
    for (const combo of record.combos.values()) {
      if (
        !best ||
        combo.count > best.count ||
        (combo.count === best.count && combo.lastUsed > best.lastUsed)
      ) {
        best = combo;
      }
    }
    record.item.protein = best?.protein ?? null;
    record.item.fat = best?.fat ?? null;
  }
  const bestVariant = new Map<
    string,
    { item: FrequentItem; count: number; lastUsed: number }
  >();
  for (const s of stats.values()) {
    if (s.count < 2) continue;
    const key = s.item.description.toLowerCase();
    const current = bestVariant.get(key);
    if (
      !current ||
      s.count > current.count ||
      (s.count === current.count && s.lastUsed > current.lastUsed)
    ) {
      bestVariant.set(key, s);
    }
  }
  return [...bestVariant.values()]
    .sort((a, b) => b.count - a.count || b.lastUsed - a.lastUsed)
    .slice(0, limit)
    .map((s) => s.item);
}

/** Sum of entries belonging to one tracking day. */
export function totalForDay(entries: Entry[], day: DayKey): number {
  let total = 0;
  for (const e of entries) {
    if (e.day === day) total += e.calories;
  }
  return total;
}

export interface EntryGroup {
  /** Stable identity for the group across re-renders. */
  key: string;
  /** Instances, newest first. */
  items: Entry[];
  totalCalories: number;
  totalProtein: number;
  totalFat: number;
  /** Derived carbs across the instances; null when not derivable. */
  totalCarbs: number | null;
}

/**
 * Collapse identical entries (same note, calories, protein) into one display
 * group so "the second Pepsi" is a +1 on an existing row, not a new row.
 * Input is expected newest-first; groups keep that order by latest activity.
 */
export function groupEntries(entries: Entry[]): EntryGroup[] {
  const map = new Map<string, Entry[]>();
  for (const e of entries) {
    const key = `${e.description.trim().toLowerCase()}|${e.calories}|${e.protein ?? ""}`;
    const bucket = map.get(key);
    if (bucket) bucket.push(e);
    else map.set(key, [e]);
  }
  return [...map.entries()].map(([key, items]) => ({
    key,
    items,
    totalCalories: items.reduce((s, e) => s + e.calories, 0),
    totalProtein: items.reduce(
      (s, e) => s + (typeof e.protein === "number" ? e.protein : 0),
      0,
    ),
    totalFat: items.reduce(
      (s, e) => s + (typeof e.fat === "number" ? e.fat : 0),
      0,
    ),
    totalCarbs: carbsForEntries(items),
  }));
}

/** Grams of fat logged on one tracking day (entries without fat count 0). */
export function fatForDay(entries: Entry[], day: DayKey): number {
  let total = 0;
  for (const e of entries) {
    if (e.day === day && typeof e.fat === "number") total += e.fat;
  }
  return total;
}

/** Grams of protein logged on one tracking day (entries without protein count 0). */
export function proteinForDay(entries: Entry[], day: DayKey): number {
  let total = 0;
  for (const e of entries) {
    if (e.day === day && typeof e.protein === "number") total += e.protein;
  }
  return total;
}

/** Entries for one tracking day, newest first. */
export function entriesForDay(entries: Entry[], day: DayKey): Entry[] {
  return entries
    .filter((e) => e.day === day)
    .sort((a, b) => b.timestamp - a.timestamp);
}

/**
 * Group all entries into day summaries, newest day first.
 * Days without entries simply don't appear.
 */
export function summarizeByDay(entries: Entry[]): DaySummary[] {
  const byDay = new Map<DayKey, Entry[]>();
  for (const e of entries) {
    const bucket = byDay.get(e.day);
    if (bucket) bucket.push(e);
    else byDay.set(e.day, [e]);
  }
  return [...byDay.entries()]
    .map(([day, dayEntries]) => ({
      day,
      total: dayEntries.reduce((sum, e) => sum + e.calories, 0),
      entries: dayEntries.sort((a, b) => b.timestamp - a.timestamp),
    }))
    .sort((a, b) => (a.day < b.day ? 1 : -1));
}
