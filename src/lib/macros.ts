import type { DayKey, Entry } from "../types";

/**
 * Carbohydrates are never typed in; they're derived from what is. Every
 * gram of protein and carbohydrate is 4 kcal, every gram of fat is 9, so
 * whatever calories are left after protein and fat must be carbs.
 *
 * Derivation only makes sense for an entry that carries BOTH protein and
 * fat: an entry with neither can't be assumed to be all carbs, and one
 * with protein but no fat would count its fat calories as carbs. Such
 * entries contribute nothing, and a day with no derivable entry has no
 * carb figure at all (null), never a misleading zero.
 */
export const KCAL_PER_G_PROTEIN = 4;
export const KCAL_PER_G_FAT = 9;
export const KCAL_PER_G_CARB = 4;

type MacroBearing = Pick<Entry, "calories"> &
  Partial<Pick<Entry, "protein" | "fat">>;

/** Derived carbs (grams, unrounded) for one entry; null when not derivable.
    Never negative: label rounding can leave protein + fat calories a
    touch above the total, and "-2 g carbs" helps nobody. */
export function carbsOf(entry: MacroBearing): number | null {
  if (typeof entry.protein !== "number" || typeof entry.fat !== "number") {
    return null;
  }
  const remainder =
    entry.calories -
    entry.protein * KCAL_PER_G_PROTEIN -
    entry.fat * KCAL_PER_G_FAT;
  return Math.max(0, remainder / KCAL_PER_G_CARB);
}

/** Sum of derivable carbs across entries; null when none is derivable. */
export function carbsForEntries(entries: readonly MacroBearing[]): number | null {
  let total = 0;
  let any = false;
  for (const e of entries) {
    const c = carbsOf(e);
    if (c === null) continue;
    total += c;
    any = true;
  }
  return any ? total : null;
}

/** Derived carbs for one tracking day; null when nothing that day is derivable. */
export function carbsForDay(entries: readonly Entry[], day: DayKey): number | null {
  return carbsForEntries(entries.filter((e) => e.day === day));
}
