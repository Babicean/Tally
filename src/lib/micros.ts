/**
 * Electrolytes ("micros"): sodium, potassium, magnesium, calcium, all in
 * milligrams. A fixed, small set on purpose. Entries and menu items carry
 * an optional `micros` map; anything logged from the Menu inherits it,
 * meals sum their components, and Today shows the day's totals against
 * targets on the hero's second page. Sodium is a stay-under limit; the
 * other three are goals to reach.
 */

export type MicroId = "sodium" | "potassium" | "magnesium" | "calcium";

export type Micros = Partial<Record<MicroId, number>>;

export interface MicroMeta {
  id: MicroId;
  label: string;
  /** Chemical shorthand for tight spaces. */
  symbol: string;
  /** "limit" fills toward a ceiling (amber past it); "goal" toward a floor. */
  kind: "limit" | "goal";
  /** Australian adult reference values; editable in Settings. */
  defaultTarget: number;
}

export const MICROS: readonly MicroMeta[] = [
  { id: "sodium", label: "sodium", symbol: "Na", kind: "limit", defaultTarget: 2000 },
  { id: "potassium", label: "potassium", symbol: "K", kind: "goal", defaultTarget: 3800 },
  { id: "magnesium", label: "magnesium", symbol: "Mg", kind: "goal", defaultTarget: 400 },
  { id: "calcium", label: "calcium", symbol: "Ca", kind: "goal", defaultTarget: 1000 },
];

export const MICRO_IDS: readonly MicroId[] = MICROS.map((m) => m.id);

export type MicroTargets = Record<MicroId, number | null>;

export const DEFAULT_MICRO_TARGETS: MicroTargets = Object.fromEntries(
  MICROS.map((m) => [m.id, m.defaultTarget]),
) as MicroTargets;

/** Per-food sanity cap in mg; nothing on a label comes close. */
export const MAX_MG = 50_000;

export function isMicroId(value: unknown): value is MicroId {
  return typeof value === "string" && (MICRO_IDS as readonly string[]).includes(value);
}

/** Strict validator for a stored micros map: only known keys, each a
    finite non-negative mg amount. */
export function isMicros(value: unknown): value is Micros {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }
  for (const [key, amount] of Object.entries(value)) {
    if (!isMicroId(key)) return false;
    if (typeof amount !== "number" || !Number.isFinite(amount)) return false;
    if (amount < 0 || amount > MAX_MG) return false;
  }
  return true;
}

/** True when at least one electrolyte is present. */
export function hasMicros(value: Micros | null | undefined): value is Micros {
  return !!value && MICRO_IDS.some((id) => typeof value[id] === "number");
}

/** Drop absent keys; undefined when nothing is left, so records stay lean. */
export function normalizeMicros(
  value: Micros | null | undefined,
): Micros | undefined {
  if (!value) return undefined;
  const out: Micros = {};
  for (const id of MICRO_IDS) {
    const amount = value[id];
    if (typeof amount === "number" && Number.isFinite(amount) && amount >= 0) {
      out[id] = amount;
    }
  }
  return hasMicros(out) ? out : undefined;
}

/**
 * Parse an optional milligram input. Blank means "not given" (null);
 * otherwise a whole number of mg within the cap, else undefined.
 * Mirrors parseProtein so form code reads the same.
 */
export function parseMg(raw: string): number | null | undefined {
  const cleaned = raw.trim().replace(/,/g, "");
  if (cleaned === "") return null;
  if (!/^\d+(\.\d+)?$/.test(cleaned)) return undefined;
  const value = Math.round(Number(cleaned));
  if (value < 0 || value > MAX_MG) return undefined;
  return value;
}

/** Sum each electrolyte across items; a key appears only if some item had it. */
export function sumMicros(items: readonly { micros?: Micros }[]): Micros {
  const out: Micros = {};
  for (const item of items) {
    if (!item.micros) continue;
    for (const id of MICRO_IDS) {
      const amount = item.micros[id];
      if (typeof amount === "number") out[id] = (out[id] ?? 0) + amount;
    }
  }
  return out;
}

/** Sodium ÷ potassium (mg/mg); null until both are known and positive. */
export function naKRatio(micros: Micros): number | null {
  const na = micros.sodium ?? 0;
  const k = micros.potassium ?? 0;
  return na > 0 && k > 0 ? na / k : null;
}
