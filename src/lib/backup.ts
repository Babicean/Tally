import type { Entry, MenuItem } from "../types";
import { isEntry } from "./store";
import { isMenuItem } from "./menu";
import { isWeightEntry, mergeWeights, type WeightEntry } from "./weight";
import type { Settings } from "./settings";

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
        dailyGoal:
          typeof goal === "number" && Number.isFinite(goal) && goal > 0
            ? Math.round(goal)
            : null,
        theme: theme === "light" || theme === "dark" ? theme : "system",
        trackProtein: typeof trackProtein === "boolean" ? trackProtein : false,
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
          accent === "emerald" || accent === "blush" || accent === "honey"
            ? accent
            : "azure",
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
  const haveEntry = new Set(currentEntries.map((e) => e.id));
  const newEntries = backup.entries.filter((e) => !haveEntry.has(e.id));

  const haveItem = new Set(currentMenu.map((m) => m.id));
  const newItems = backup.menu.filter((m) => !haveItem.has(m.id));

  return {
    entries: [...currentEntries, ...newEntries],
    menu: [...currentMenu, ...newItems],
    weights: mergeWeights(currentWeights, backup.weights ?? []),
    addedEntries: newEntries.length,
    addedItems: newItems.length,
  };
}
