import { useCallback, useEffect, useMemo, useState } from "react";
import type { DayKey, Entry, MenuItem } from "../types";
import { msUntilNextBoundary, trackingDayFor } from "../lib/day";
import {
  createEntry,
  entriesForDay,
  loadEntries,
  proteinForDay,
  saveEntries,
  summarizeByDay,
  totalForDay,
} from "../lib/store";
import { loadSettings, saveSettings } from "../lib/settings";
import {
  buildQuickAdds,
  createMenuItem,
  loadMenu,
  saveMenu,
  sortMenu,
} from "../lib/menu";
import { mergeBackup, type BackupPayload } from "../lib/backup";

/**
 * Single source of truth for entries and settings. Persists on every change
 * and rolls the "today" key over automatically when the 2 AM boundary passes
 * while the app is open.
 */
export function useEntries() {
  const [entries, setEntries] = useState<Entry[]>(() => loadEntries());
  const [today, setToday] = useState<DayKey>(() => trackingDayFor(new Date()));
  const [dailyGoal, setDailyGoalState] = useState<number | null>(
    () => loadSettings().dailyGoal,
  );
  const [menu, setMenu] = useState<MenuItem[]>(() => loadMenu());

  useEffect(() => {
    saveMenu(menu);
  }, [menu]);

  useEffect(() => {
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
        setDailyGoalState(loadSettings().dailyGoal);
      }
      if (event.key === "tally.menu") setMenu(loadMenu());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const addEntry = useCallback(
    (calories: number, description: string, protein: number | null = null) => {
      const entry = createEntry(calories, description, new Date(), protein);
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
    ) => {
      setEntries((prev) =>
        prev.map((e) =>
          e.id === id
            ? { ...e, calories, description: description.trim(), protein }
            : e,
        ),
      );
    },
    [],
  );

  /** Delete an entry, returning it so the caller can offer undo. */
  const deleteEntry = useCallback(
    (id: string): Entry | null => {
      const entry = entries.find((e) => e.id === id) ?? null;
      setEntries((prev) => prev.filter((e) => e.id !== id));
      return entry;
    },
    [entries],
  );

  /** Put a previously deleted entry back exactly as it was. */
  const restoreEntry = useCallback((entry: Entry) => {
    setEntries((prev) =>
      prev.some((e) => e.id === entry.id) ? prev : [...prev, entry],
    );
  }, []);

  const setDailyGoal = useCallback((goal: number | null) => {
    setDailyGoalState(goal);
    saveSettings({ dailyGoal: goal });
  }, []);

  const addMenuItem = useCallback(
    (
      name: string,
      calories: number,
      protein: number | null,
      category: string | null,
    ) => {
      setMenu((prev) => [
        ...prev,
        createMenuItem(name, calories, protein, category),
      ]);
    },
    [],
  );

  const updateMenuItem = useCallback(
    (
      id: string,
      name: string,
      calories: number,
      protein: number | null,
      category: string | null,
    ) => {
      setMenu((prev) =>
        prev.map((m) =>
          m.id === id
            ? { ...m, name: name.trim(), calories, protein, category }
            : m,
        ),
      );
    },
    [],
  );

  const deleteMenuItem = useCallback((id: string) => {
    setMenu((prev) => prev.filter((m) => m.id !== id));
  }, []);

  const togglePinned = useCallback((id: string) => {
    setMenu((prev) =>
      prev.map((m) => (m.id === id ? { ...m, pinned: !m.pinned } : m)),
    );
  }, []);

  /** Merge an imported backup (union by id) and report what was added. */
  const importBackup = useCallback(
    (backup: BackupPayload) => {
      const result = mergeBackup(entries, menu, backup);
      setEntries(result.entries);
      setMenu(result.menu);
      if (dailyGoal === null && backup.settings.dailyGoal !== null) {
        setDailyGoal(backup.settings.dailyGoal);
      }
      return result;
    },
    [entries, menu, dailyGoal, setDailyGoal],
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
  const history = useMemo(() => summarizeByDay(entries), [entries]);
  const quickAdds = useMemo(
    () => buildQuickAdds(menu, entries),
    [menu, entries],
  );
  const sortedMenu = useMemo(() => sortMenu(menu), [menu]);

  return {
    today,
    entries,
    todayEntries,
    todayTotal,
    todayProtein,
    history,
    quickAdds,
    menu: sortedMenu,
    importBackup,
    dailyGoal,
    setDailyGoal,
    addEntry,
    updateEntry,
    deleteEntry,
    restoreEntry,
    addMenuItem,
    updateMenuItem,
    deleteMenuItem,
    togglePinned,
  };
}
