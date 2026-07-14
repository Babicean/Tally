import { mirrorWrite } from "./mirror";
import type { EnergyUnit } from "./units";

/**
 * User preferences, stored separately from entries so either can evolve
 * independently. Versioned like the entry store.
 */
const SETTINGS_KEY = "tally.settings";
const SETTINGS_VERSION = 1;

export interface Settings {
  /**
   * Daily calorie target. Fresh installs start at 2,000 so the ring is
   * there from the first open; an explicit "remove" stores null.
   */
  dailyGoal: number | null;
  /** Appearance override; "system" follows the OS. */
  theme: "system" | "light" | "dark";
  /**
   * Protein tracking is opt-in — off, the app is pure calories.
   * Installs that predate this switch keep it on (they may have data).
   */
  trackProtein: boolean;
  /** Optional daily protein target in grams; only meaningful when tracking. */
  proteinTarget: number | null;
  /** Optional daily fat target in grams; only meaningful when tracking. */
  fatTarget: number | null;
  /** Daily weigh-ins are opt-in; off, the app is pure calories. */
  trackWeight: boolean;
  /** Accent color family. */
  accent: "azure" | "emerald" | "blush";
  /**
   * Whether the goal sheet has ever been opened. Until then the goal
   * pill hints that the default 2,000 is theirs to change. Installs
   * predating this key count as seen — no hint for existing users.
   */
  goalSeen: boolean;
  /**
   * Display/input unit for energy. Storage stays kcal regardless; this
   * only converts what's shown and how typed numbers are read.
   */
  unit: EnergyUnit;
  /** Whether the hero's one-time unit teach-flip has played. */
  unitHintSeen: boolean;
}

const DEFAULTS: Settings = {
  dailyGoal: 2000,
  theme: "system",
  trackProtein: false,
  proteinTarget: null,
  fatTarget: null,
  trackWeight: false,
  accent: "azure",
  goalSeen: false,
  unit: "kcal",
  unitHintSeen: false,
};

interface SettingsShape {
  version: number;
  settings: Partial<Settings>;
}

function asTarget(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) && value > 0
    ? Math.round(value)
    : null;
}

/** Like asTarget but unrounded: a goal typed in kilojoules stores its
    exact kcal equivalent so it displays back as typed. */
function asEnergyTarget(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) && value > 0
    ? value
    : null;
}

export function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return { ...DEFAULTS };
    const parsed = JSON.parse(raw) as SettingsShape;
    const s = parsed?.settings ?? {};
    return {
      dailyGoal: asEnergyTarget(s.dailyGoal),
      theme: s.theme === "light" || s.theme === "dark" ? s.theme : "system",
      // Grandfather rule: settings saved before this key existed → on.
      trackProtein:
        typeof s.trackProtein === "boolean" ? s.trackProtein : true,
      proteinTarget: asTarget(s.proteinTarget),
      fatTarget: asTarget(s.fatTarget),
      trackWeight: s.trackWeight === true,
      accent:
        s.accent === "emerald" || s.accent === "blush" ? s.accent : "azure",
      // Grandfather rule: any settings payload predates first-run hints.
      goalSeen: typeof s.goalSeen === "boolean" ? s.goalSeen : true,
      unit: s.unit === "kj" ? "kj" : "kcal",
      // The unit teach-flip plays once for everyone, old installs too —
      // discovering kilojoules is the whole point of it.
      unitHintSeen: s.unitHintSeen === true,
    };
  } catch {
    return { ...DEFAULTS };
  }
}

export function saveSettings(settings: Settings): void {
  try {
    const payload: SettingsShape = { version: SETTINGS_VERSION, settings };
    const json = JSON.stringify(payload);
    localStorage.setItem(SETTINGS_KEY, json);
    mirrorWrite(SETTINGS_KEY, json);
  } catch {
    // Storage unavailable — settings just won't persist.
  }
}
