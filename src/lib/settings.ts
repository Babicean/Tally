import { mirrorWrite } from "./mirror";

/**
 * User preferences, stored separately from entries so either can evolve
 * independently. Versioned like the entry store.
 */
const SETTINGS_KEY = "tally.settings";
const SETTINGS_VERSION = 1;

export interface Settings {
  /** Daily calorie target, or null when the user hasn't set one. */
  dailyGoal: number | null;
}

const DEFAULTS: Settings = { dailyGoal: null };

interface SettingsShape {
  version: number;
  settings: Settings;
}

export function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return { ...DEFAULTS };
    const parsed = JSON.parse(raw) as SettingsShape;
    const goal = parsed?.settings?.dailyGoal;
    return {
      ...DEFAULTS,
      dailyGoal:
        typeof goal === "number" && Number.isFinite(goal) && goal > 0
          ? Math.round(goal)
          : null,
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
