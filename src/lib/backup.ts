import type { Entry, MenuItem } from "../types";
import { isEntry } from "./store";
import { isMenuItem } from "./menu";
import { isWeightEntry, mergeWeights, type WeightEntry } from "./weight";
import { loadMicroTargets, type Settings } from "./settings";

/**
 * Backup = one JSON file holding everything: entries, menu, settings.
 * Import merges by id, so restoring an old backup never duplicates data.
 */

export const BACKUP_VERSION = 1;

export interface BackupPayload {
  app: "tally";
  version: number;
  exportedAt: string;
  entries: Entry[];
  menu: MenuItem[];
  settings: Settings;
  /** Daily weigh-ins; absent in pre-2.7 backups. */
  weights?: WeightEntry[];
}

export function buildBackup(
  entries: Entry[],
  menu: MenuItem[],
  settings: Settings,
  weights: WeightEntry[] = [],
  now: Date = new Date(),
): BackupPayload {
  return {
    app: "tally",
    version: BACKUP_VERSION,
    exportedAt: now.toISOString(),
    entries,
    menu,
    settings,
    weights,
  };
}

/** Suggested filename, e.g. "tally-backup-2026-07-04.json". */
export function backupFilename(now: Date = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `tally-backup-${y}-${m}-${d}.json`;
}

/** Parse and validate a backup file. Returns null for anything unusable. */
export function parseBackup(json: string): BackupPayload | null {
  try {
    const raw = JSON.parse(json) as Partial<BackupPayload>;
    if (!raw || raw.app !== "tally" || !Array.isArray(raw.entries)) {
      return null;
    }
    const goal = raw.settings?.dailyGoal;
    const theme = raw.settings?.theme;
    const trackProtein = raw.settings?.trackProtein;
    const proteinTarget = raw.settings?.proteinTarget;
    const fatTarget = raw.settings?.fatTarget;
    const accent = raw.settings?.accent;
    const trackWeight = raw.settings?.trackWeight;
    return {
      app: "tally",
      version: typeof raw.version === "number" ? raw.version : 1,
      exportedAt: typeof raw.exportedAt === "string" ? raw.exportedAt : "",
      entries: raw.entries.filter(isEntry),
      menu: Array.isArray(raw.menu) ? raw.menu.filter(isMenuItem) : [],
      settings: {
        // Unrounded: a kilojoule goal stores its exact kcal equivalent.
        dailyGoal:
          typeof goal === "number" && Number.isFinite(goal) && goal > 0
            ? goal
            : null,
        theme: theme === "light" || theme === "dark" ? theme : "system",
        // Grandfather rule, matching loadSettings: backups from before
        // this switch existed were made by installs that had protein on.
        trackProtein: typeof trackProtein === "boolean" ? trackProtein : true,
        proteinTarget:
          typeof proteinTarget === "number" &&
          Number.isFinite(proteinTarget) &&
          proteinTarget > 0
            ? Math.round(proteinTarget)
            : null,
        fatTarget:
          typeof fatTarget === "number" &&
          Number.isFinite(fatTarget) &&
          fatTarget > 0
            ? Math.round(fatTarget)
            : null,
        trackWeight: trackWeight === true,
        accent:
          accent === "emerald" || accent === "blush" ? accent : "azure",
        // A restored install is not a first run: default to seen.
        goalSeen:
          typeof raw.settings?.goalSeen === "boolean"
            ? raw.settings.goalSeen
            : true,
        unit: raw.settings?.unit === "kj" ? "kj" : "kcal",
        unitHintSeen:
          typeof raw.settings?.unitHintSeen === "boolean"
            ? raw.settings.unitHintSeen
            : true,
        trackMicros: raw.settings?.trackMicros === true,
        microTargets: loadMicroTargets(raw.settings?.microTargets),
        showSteps: raw.settings?.showSteps === true,
      },
      weights: Array.isArray(raw.weights)
        ? raw.weights.filter(isWeightEntry)
        : [],
    };
  } catch {
    return null;
  }
}

export interface MergeResult {
  entries: Entry[];
  menu: MenuItem[];
  weights: WeightEntry[];
  addedEntries: number;
  addedItems: number;
}

/**
 * Merge a backup into current data. Union by id — current records always
 * win, imported records only fill gaps. Safe to run repeatedly.
 */
export function mergeBackup(
  currentEntries: Entry[],
  currentMenu: MenuItem[],
  backup: BackupPayload,
  currentWeights: WeightEntry[] = [],
): MergeResult {
  // The seen-sets grow as we take rows so duplicate ids *inside* the
  // backup file import once, not twice (delete removes every copy of an
  // id but undo restores only one).
  const haveEntry = new Set(currentEntries.map((e) => e.id));
  const newEntries: Entry[] = [];
  for (const e of backup.entries) {
    if (haveEntry.has(e.id)) continue;
    haveEntry.add(e.id);
    newEntries.push(e);
  }

  const haveItem = new Set(currentMenu.map((m) => m.id));
  const newItems: MenuItem[] = [];
  for (const m of backup.menu) {
    if (haveItem.has(m.id)) continue;
    haveItem.add(m.id);
    newItems.push(m);
  }

  return {
    entries: [...currentEntries, ...newEntries],
    menu: [...currentMenu, ...newItems],
    weights: mergeWeights(currentWeights, backup.weights ?? []),
    addedEntries: newEntries.length,
    addedItems: newItems.length,
  };
}
