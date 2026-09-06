import { describe, expect, it } from "vitest";
import {
  backupFilename,
  buildBackup,
  mergeBackup,
  parseBackup,
} from "./backup";
import { createEntry } from "./store";
import { createMenuItem } from "./menu";

const entryA = createEntry(545, "Burrito", new Date(2026, 6, 1, 12, 0), 32, 21);
const entryB = createEntry(160, "Energy drink", new Date(2026, 6, 2, 9, 0));
const itemA = createMenuItem("Burrito", 545, 32, 21, "meat", 1000);

describe("backup round-trip", () => {
  it("serializes and parses back losslessly", () => {
    const payload = buildBackup(
      [entryA, entryB],
      [itemA],
      { dailyGoal: 2200, theme: "dark", trackProtein: true, trackWeight: false, proteinTarget: 140, fatTarget: 70, accent: "emerald", goalSeen: true, unit: "kcal" as const, unitHintSeen: true, trackMicros: false, microTargets: { sodium: 2000, potassium: 3800, magnesium: 400, calcium: 1000 }, showSteps: false },
      [{ day: "2026-07-03", kg: 82.5 }],
      new Date(2026, 6, 4, 10, 0),
    );
    const parsed = parseBackup(JSON.stringify(payload));
    expect(parsed).not.toBeNull();
    expect(parsed!.entries).toHaveLength(2);
    expect(parsed!.entries[0].protein).toBe(32);
    expect(parsed!.menu[0].category).toBe("meat");
    expect(parsed!.settings.dailyGoal).toBe(2200);
    expect(parsed!.settings.theme).toBe("dark");
    expect(parsed!.settings.trackProtein).toBe(true);
    expect(parsed!.settings.proteinTarget).toBe(140);
    expect(parsed!.settings.accent).toBe("emerald");
  });

  it("names the file after the export date", () => {
    expect(backupFilename(new Date(2026, 6, 4))).toBe(
      "tally-backup-2026-07-04.json",
    );
  });
});

describe("parseBackup validation", () => {
  it("rejects junk, other apps' files, and corrupt JSON", () => {
    expect(parseBackup("not json")).toBeNull();
    expect(parseBackup("{}")).toBeNull();
    expect(parseBackup('{"app":"other","entries":[]}')).toBeNull();
  });

  it("drops malformed records instead of failing the whole import", () => {
    const payload = {
      app: "tally",
      version: 1,
      entries: [entryA, { id: "bad" }, "garbage"],
      menu: [itemA, { name: "no id" }],
      settings: { dailyGoal: -5 },
    };
    const parsed = parseBackup(JSON.stringify(payload));
    expect(parsed!.entries).toHaveLength(1);
    expect(parsed!.menu).toHaveLength(1);
    expect(parsed!.settings.dailyGoal).toBeNull();
    // Pre-2.14 backups have no goalSeen: a restore is not a first run.
    expect(parsed!.settings.goalSeen).toBe(true);
  });
});

describe("mergeBackup", () => {
  it("unions by id — current data wins, gaps are filled", () => {
    const backup = buildBackup([entryA, entryB], [itemA], { dailyGoal: null, theme: "system", trackProtein: false, trackWeight: false, proteinTarget: null, fatTarget: null, accent: "azure", goalSeen: true, unit: "kcal" as const, unitHintSeen: true, trackMicros: false, microTargets: { sodium: 2000, potassium: 3800, magnesium: 400, calcium: 1000 }, showSteps: false });
    const result = mergeBackup([entryA], [], backup);
    expect(result.entries).toHaveLength(2);
    expect(result.addedEntries).toBe(1);
    expect(result.addedItems).toBe(1);
  });

  it("is idempotent — importing the same backup twice adds nothing", () => {
    const backup = buildBackup([entryA, entryB], [itemA], { dailyGoal: null, theme: "system", trackProtein: false, trackWeight: false, proteinTarget: null, fatTarget: null, accent: "azure", goalSeen: true, unit: "kcal" as const, unitHintSeen: true, trackMicros: false, microTargets: { sodium: 2000, potassium: 3800, magnesium: 400, calcium: 1000 }, showSteps: false });
    const once = mergeBackup([], [], backup);
    const twice = mergeBackup(once.entries, once.menu, backup);
    expect(twice.addedEntries).toBe(0);
    expect(twice.addedItems).toBe(0);
    expect(twice.entries).toHaveLength(2);
  });
});

describe("hardening regressions", () => {
  it("imports a duplicated id inside one backup only once", () => {
    const entry = {
      id: "dup",
      calories: 300,
      description: "twice",
      timestamp: 1e12,
      day: "2026-07-01",
    };
    const backup = parseBackup(
      JSON.stringify({ app: "tally", version: 1, entries: [entry, entry], menu: [] }),
    );
    expect(backup).not.toBeNull();
    const merged = mergeBackup([], [], backup!);
    expect(merged.entries).toHaveLength(1);
    expect(merged.addedEntries).toBe(1);
  });

  it("grandfathers missing trackProtein to on, matching loadSettings", () => {
    const backup = parseBackup(
      JSON.stringify({ app: "tally", version: 1, entries: [], menu: [], settings: {} }),
    );
    expect(backup!.settings.trackProtein).toBe(true);
  });
});
