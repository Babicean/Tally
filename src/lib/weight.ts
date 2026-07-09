import type { DayKey } from "../types";
import { mirrorWrite } from "./mirror";

/**
 * Daily weigh-ins: one number per tracking day, opt-in via Settings.
 * Same storage discipline as everything else — versioned, validated,
 * mirrored, carried inside backups.
 */
const WEIGHTS_KEY = "tally.weights";
const WEIGHTS_VERSION = 1;

export interface WeightEntry {
  day: DayKey;
  kg: number;
}

export function isWeightEntry(value: unknown): value is WeightEntry {
  if (typeof value !== "object" || value === null) return false;
  const w = value as Record<string, unknown>;
  return (
    typeof w.day === "string" &&
    typeof w.kg === "number" &&
    Number.isFinite(w.kg) &&
    w.kg > 0
  );
}

export function loadWeights(): WeightEntry[] {
  try {
    const raw = localStorage.getItem(WEIGHTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as { weights?: unknown };
    if (!Array.isArray(parsed?.weights)) return [];
    return parsed.weights.filter(isWeightEntry);
  } catch {
    return [];
  }
}

export function saveWeights(weights: WeightEntry[]): void {
  try {
    const json = JSON.stringify({ version: WEIGHTS_VERSION, weights });
    localStorage.setItem(WEIGHTS_KEY, json);
    mirrorWrite(WEIGHTS_KEY, json);
  } catch {
    // Storage unavailable — today's weigh-in just won't persist.
  }
}

/** Parse a body-weight field: kg with 0.1 precision, 20–500. */
export function parseKg(raw: string): number | undefined {
  const value = Number(raw.trim().replace(",", "."));
  if (!Number.isFinite(value) || value < 20 || value > 500) return undefined;
  return Math.round(value * 10) / 10;
}

/** One entry per day: logging again replaces that day's number. */
export function upsertWeight(
  weights: WeightEntry[],
  day: DayKey,
  kg: number,
): WeightEntry[] {
  const rest = weights.filter((w) => w.day !== day);
  return [...rest, { day, kg }].sort((a, b) => a.day.localeCompare(b.day));
}

export function removeWeight(
  weights: WeightEntry[],
  day: DayKey,
): WeightEntry[] {
  return weights.filter((w) => w.day !== day);
}

export function weightOn(
  weights: WeightEntry[],
  day: DayKey,
): number | null {
  return weights.find((w) => w.day === day)?.kg ?? null;
}

/** Most recent weigh-in on or before `day` (prefill for the sheet). */
export function latestWeight(
  weights: WeightEntry[],
  day: DayKey,
): number | null {
  const prior = weights.filter((w) => w.day <= day);
  return prior.length ? prior[prior.length - 1].kg : null;
}

/** Union by day; current device wins where both logged the same day. */
export function mergeWeights(
  current: WeightEntry[],
  imported: WeightEntry[],
): WeightEntry[] {
  const have = new Set(current.map((w) => w.day));
  return [...current, ...imported.filter((w) => !have.has(w.day))].sort(
    (a, b) => a.day.localeCompare(b.day),
  );
}
