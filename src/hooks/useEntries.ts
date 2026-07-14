import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { DayKey, Entry, MenuItem } from "../types";
import { msUntilNextBoundary, trackingDayFor } from "../lib/day";
import {
  createEntry,
  entriesForDay,
  fatForDay,
  loadEntries,
  proteinForDay,
  saveEntries,
  summarizeByDay,
  totalForDay,
} from "../lib/store";
import { loadSettings, saveSettings, type Settings } from "../lib/settings";
import type { EnergyUnit } from "../lib/units";
import {
  buildQuickAdds,
  createMenuItem,
  loadMenu,
  saveMenu,
  sortMenu,
} from "../lib/menu";
import { mergeBackup, type BackupPayload } from "../lib/backup";
import {
  loadWeights,
  removeWeight,
  saveWeights,
  upsertWeight,
  weightOn,
  latestWeight,
  type WeightEntry,
} from "../lib/weight";
import { computeStreak } from "../lib/streak";
import { applyAccent, applyTheme, type AccentPref, type ThemePref } from "../lib/theme";

/**
 * Single source of truth for entries, menu, and settings. Persists on every
 * change and rolls the "today" key over automatically when the 2 AM boundary
 * passes while the app is open.
 */
export function useEntries() {
  const [entries, setEntries] = useState<Entry[]>(() => loadEntries());
  const [today, setToday] = useState<DayKey>(() => trackingDayFor(new Date()));
  const [settings, setSettings] = useState<Settings>(() => loadSettings());
  const [menu, setMenu] = useState<MenuItem[]>(() => loadMenu());
  const [weights, setWeights] = useState<WeightEntry[]>(() => loadWeights());

  // Persist only after a real change: the mount runs would write the
  // just-loaded state straight back, and if that load was lossy (corrupt
  // payload, filtered rows) it would overwrite the mirror's good copy.
  const booted = useRef({ weights: false, menu: false, entries: false });

  useEffect(() => {
    if (!booted.current.weights) {
      booted.current.weights = true;
      return;
    }
    saveWeights(weights);
  }, [weights]);

  useEffect(() => {
    if (!booted.current.menu) {
      booted.current.menu = true;
      return;
    }
    saveMenu(menu);
  }, [menu]);

  useEffect(() => {
    if (!booted.current.entries) {
      booted.current.entries = true;
      return;
    }
    saveEntries(entries);
  }, [entries]);

  // Re-evaluate "today" exactly when the next 2 AM boundary passes.
  useEffect(() => {
    const timer = setTimeout(
      () => setToday(trackingDayFor(new Date())),
      msUntilNextBoundary(new Date()) + 1000,
    );
    return () => clearTimeout(timer);
  }, [today]);

  // Keep multiple open tabs in sync.
  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === "tally.store") setEntries(loadEntries());
      if (event.key === "tally.settings") {
        const next = loadSettings();
        setSettings(next);
        applyTheme(next.theme);
        applyAccent(next.accent);
      }
      if (event.key === "tally.menu") setMenu(loadMenu());
      if (event.key === "tally.weights") setWeights(loadWeights());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const updateSettings = useCallback((patch: Partial<Settings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      saveSettings(next);
      if (patch.theme !== undefined) applyTheme(next.theme);
      if (patch.accent !== undefined) applyAccent(next.accent);
      return next;
    });
  }, []);

  const setDailyGoal = useCallback(
    (goal: number | null) => updateSettings({ dailyGoal: goal }),
    [updateSettings],
  );
  /** First open of the goal sheet retires the "set your own" hint. */
  const markGoalSeen = useCallback(() => {
    setSettings((prev) => {
      if (prev.goalSeen) return prev;
      const next = { ...prev, goalSeen: true };
      saveSettings(next);
      return next;
    });
  }, []);
  /** Choosing a unit (either path) also counts as seeing the hint. */
  const setUnit = useCallback(
    (unit: EnergyUnit) => updateSettings({ unit, unitHintSeen: true }),
    [updateSettings],
  );
  const markUnitHintSeen = useCallback(() => {
    setSettings((prev) => {
      if (prev.unitHintSeen) return prev;
      const next = { ...prev, unitHintSeen: true };
      saveSettings(next);
      return next;
    });
  }, []);
  const setTheme = useCallback(
    (theme: ThemePref) => updateSettings({ theme }),
    [updateSettings],
  );
  const setTrackProtein = useCallback(
    (trackProtein: boolean) => updateSettings({ trackProtein }),
    [updateSettings],
  );
  const setProteinTarget = useCallback(
    (proteinTarget: number | null) => updateSettings({ proteinTarget }),
    [updateSettings],
  );
  const setFatTarget = useCallback(
    (fatTarget: number | null) => updateSettings({ fatTarget }),
    [updateSettings],
  );
  const setTrackWeight = useCallback(
    (trackWeight: boolean) => updateSettings({ trackWeight }),
    [updateSettings],
  );
  const setAccent = useCallback(
    (accent: AccentPref) => updateSettings({ accent }),
    [updateSettings],
  );

  const addEntry = useCallback(
    (
      calories: number,
      description: string,
      protein: number | null = null,
      fat: number | null = null,
      when: Date = new Date(),
    ) => {
      const entry = createEntry(calories, description, when, protein, fat);
      // If the 2 AM boundary passed but the rollover timer hasn't fired
      // yet, roll now so the new entry is visible on the screen it
      // belongs to.
      setToday(trackingDayFor(new Date()));
      setEntries((prev) => [...prev, entry]);
      return entry;
    },
    [],
  );

  const updateEntry = useCallback(
    (
      id: string,
      calories: number,
      description: string,
      protein: number | null = null,
      fat: number | null = null,
      timestamp?: number,
    ) => {
      setEntries((prev) =>
        prev.map((e) => {
          if (e.id !== id) return e;
          const ts = timestamp ?? e.timestamp;
          return {
            ...e,
            calories,
            description: description.trim(),
            protein,
            fat,
            timestamp: ts,
            // Moving an entry in time moves it to the right tracking day;
            // an unmoved entry keeps the day stamped when it was logged
            // (re-deriving would shift it in a new timezone).
            day:
              timestamp !== undefined
                ? trackingDayFor(new Date(ts))
                : e.day,
          };
        }),
      );
    },
    [],
  );

  // Latest entries for callbacks that must read at call time (a delete
  // fired from a timer would otherwise see a stale copy and report a
  // second delete of the same entry as successful).
  const entriesRef = useRef(entries);
  entriesRef.current = entries;

  /** Delete an entry, returning it so the caller can offer undo. */
  const deleteEntry = useCallback((id: string): Entry | null => {
    const entry = entriesRef.current.find((e) => e.id === id) ?? null;
    if (!entry) return null;
    setEntries((prev) => prev.filter((e) => e.id !== id));
    return entry;
  }, []);

  /** Put a previously deleted entry back exactly as it was. */
  const restoreEntry = useCallback((entry: Entry) => {
    setEntries((prev) =>
      prev.some((e) => e.id === entry.id) ? prev : [...prev, entry],
    );
  }, []);

  const addMenuItem = useCallback(
    (
      name: string,
      calories: number,
      protein: number | null,
      fat: number | null,
      category: string | null,
    ) => {
      setMenu((prev) => [
        ...prev,
        createMenuItem(name, calories, protein, fat, category),
      ]);
    },
    [],
  );

  /** Sum a meal's components from the live menu. */
  const mealTotals = useCallback(
    (componentIds: string[]) => {
      let calories = 0;
      let protein = 0;
      let fat = 0;
      for (const id of componentIds) {
        const f = menu.find((m) => m.id === id);
        if (!f) continue;
        calories += f.calories;
        protein += f.protein ?? 0;
        fat += f.fat ?? 0;
      }
      return { calories, protein: protein || null, fat: fat || null };
    },
    [menu],
  );

  const addMeal = useCallback(
    (name: string, componentIds: string[]) => {
      const t = mealTotals(componentIds);
      const item = {
        ...createMenuItem(name, t.calories, t.protein, t.fat, null),
        componentIds,
      };
      setMenu((prev) => [...prev, item]);
      return item;
    },
    [mealTotals],
  );

  const updateMeal = useCallback(
    (id: string, name: string, componentIds: string[]) => {
      const t = mealTotals(componentIds);
      setMenu((prev) =>
        prev.map((m) =>
          m.id === id
            ? {
                ...m,
                name: name.trim(),
                calories: t.calories,
                protein: t.protein,
                fat: t.fat,
                componentIds,
              }
            : m,
        ),
      );
    },
    [mealTotals],
  );

  /** Refresh meal snapshots after their component foods changed: drop
      ids that no longer exist, re-sum totals, and remove meals with no
      foods left. */
  const reconcileMeals = (items: MenuItem[]): MenuItem[] => {
    const byId = new Map(items.map((m) => [m.id, m]));
    const out: MenuItem[] = [];
    for (const m of items) {
      if (!m.componentIds) {
        out.push(m);
        continue;
      }
      const ids = m.componentIds.filter((cid) => byId.has(cid));
      if (ids.length === 0) continue; // every food in the meal is gone
      let calories = 0;
      let protein = 0;
      let fat = 0;
      for (const cid of ids) {
        const f = byId.get(cid)!;
        calories += f.calories;
        protein += f.protein ?? 0;
        fat += f.fat ?? 0;
      }
      out.push({
        ...m,
        componentIds: ids,
        calories,
        protein: protein || null,
        fat: fat || null,
      });
    }
    return out;
  };

  const updateMenuItem = useCallback(
    (
      id: string,
      name: string,
      calories: number,
      protein: number | null,
      fat: number | null,
      category: string | null,
    ) => {
      setMenu((prev) =>
        reconcileMeals(
          prev.map((m) =>
            m.id === id
              ? { ...m, name: name.trim(), calories, protein, fat, category }
              : m,
          ),
        ),
      );
    },
    [],
  );

  const deleteMenuItem = useCallback((id: string) => {
    setMenu((prev) => reconcileMeals(prev.filter((m) => m.id !== id)));
  }, []);

  const togglePinned = useCallback((id: string) => {
    setMenu((prev) =>
      prev.map((m) => (m.id === id ? { ...m, pinned: !m.pinned } : m)),
    );
  }, []);

  /**
   * Merge an imported backup (union by id) and report what was added.
   * File imports stay conservative with settings (the file might be
   * someone else's); an account restore passes applySettings, because
   * that backup IS your setup — theme, accent, goals, all of it.
   */
  const importBackup = useCallback(
    (backup: BackupPayload, opts: { applySettings?: boolean } = {}) => {
      const result = mergeBackup(entries, menu, backup, weights);
      setEntries(result.entries);
      setMenu(result.menu);
      setWeights(result.weights);
      if (opts.applySettings) {
        updateSettings(backup.settings);
      } else if (
        settings.dailyGoal === null &&
        backup.settings.dailyGoal !== null
      ) {
        updateSettings({ dailyGoal: backup.settings.dailyGoal });
      }
      return result;
    },
    [entries, menu, weights, settings.dailyGoal, updateSettings],
  );

  /** Log (or correct) today's weigh-in. */
  const logWeight = useCallback(
    (kg: number) => setWeights((prev) => upsertWeight(prev, today, kg)),
    [today],
  );
  const removeTodayWeight = useCallback(
    () => setWeights((prev) => removeWeight(prev, today)),
    [today],
  );

  const todayEntries = useMemo(
    () => entriesForDay(entries, today),
    [entries, today],
  );
  const todayTotal = useMemo(
    () => totalForDay(entries, today),
    [entries, today],
  );
  const todayProtein = useMemo(
    () => proteinForDay(entries, today),
    [entries, today],
  );
  const todayFat = useMemo(
    () => fatForDay(entries, today),
    [entries, today],
  );
  const history = useMemo(() => summarizeByDay(entries), [entries]);
  const quickAdds = useMemo(
    () => buildQuickAdds(menu, entries),
    [menu, entries],
  );
  const sortedMenu = useMemo(() => sortMenu(menu), [menu]);
  const streak = useMemo(
    () => computeStreak(entries, today),
    [entries, today],
  );

  return {
    today,
    entries,
    todayEntries,
    todayTotal,
    todayProtein,
    todayFat,
    history,
    quickAdds,
    menu: sortedMenu,
    streak,
    importBackup,
    dailyGoal: settings.dailyGoal,
    setDailyGoal,
    goalSeen: settings.goalSeen,
    markGoalSeen,
    unit: settings.unit,
    setUnit,
    unitHintSeen: settings.unitHintSeen,
    markUnitHintSeen,
    theme: settings.theme,
    setTheme,
    trackProtein: settings.trackProtein,
    setTrackProtein,
    proteinTarget: settings.proteinTarget,
    setProteinTarget,
    fatTarget: settings.fatTarget,
    setFatTarget,
    accent: settings.accent,
    setAccent,
    addEntry,
    updateEntry,
    deleteEntry,
    restoreEntry,
    addMenuItem,
    updateMenuItem,
    deleteMenuItem,
    togglePinned,
    addMeal,
    updateMeal,
    weights,
    todayWeight: weightOn(weights, today),
    lastWeight: latestWeight(weights, today),
    trackWeight: settings.trackWeight,
    setTrackWeight,
    logWeight,
    removeTodayWeight,
  };
}
