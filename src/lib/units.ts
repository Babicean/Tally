import { MAX_CALORIES, parseCalories } from "./store";
import { formatCalories } from "./format";

/**
 * Energy units. Storage is ALWAYS plain calories (kcal) — backups, sync,
 * merging, and every derived number stay unit-blind. The unit only decides
 * how numbers are displayed and how typed input is interpreted, so an
 * Australian reading kilojoules off a packet types kilojoules.
 */

export type EnergyUnit = "kcal" | "kj";

export const KJ_PER_KCAL = 4.184;

/** Display cap in kilojoules, mirroring MAX_CALORIES. */
export const MAX_KILOJOULES = Math.round(MAX_CALORIES * KJ_PER_KCAL);

/** Stored kcal → the whole number the user should see. */
export function toDisplayEnergy(kcal: number, unit: EnergyUnit): number {
  // Rounding happens HERE, not at parse time: kilojoule entries store
  // their exact kcal equivalent (a float), so what you typed is exactly
  // what you see back. Sums stay floats too; display rounds once.
  return Math.round(unit === "kj" ? kcal * KJ_PER_KCAL : kcal);
}

/** Stored kcal → formatted display string ("8,368"). */
export function formatEnergy(kcal: number, unit: EnergyUnit): string {
  return formatCalories(toDisplayEnergy(kcal, unit));
}

/** The short unit that trails numbers: "cal" or "kJ". */
export function energyUnitLabel(unit: EnergyUnit): string {
  return unit === "kj" ? "kJ" : "cal";
}

/** The word for prose: "calories" or "kilojoules". */
export function energyNoun(unit: EnergyUnit): string {
  return unit === "kj" ? "kilojoules" : "calories";
}

/**
 * Parse energy typed in the user's unit; returns STORED calories or null.
 * Same tolerances as parseCalories (leading +, thousands separators,
 * decimals). Kilojoules store their exact kcal equivalent — unrounded —
 * so the typed number survives the round trip to the pixel.
 */
export function parseEnergy(raw: string, unit: EnergyUnit): number | null {
  if (unit === "kcal") return parseCalories(raw);
  const cleaned = raw.trim().replace(/^\+/, "").replace(/,/g, "");
  if (!/^\d+(\.\d+)?$/.test(cleaned)) return null;
  const kj = Number(cleaned);
  if (!Number.isFinite(kj) || kj <= 0 || Math.round(kj) > MAX_KILOJOULES) {
    return null;
  }
  return kj / KJ_PER_KCAL;
}
