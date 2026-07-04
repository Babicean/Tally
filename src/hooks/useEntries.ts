import { useCallback, useEffect, useMemo, useState } from "react";
import type { DayKey, Entry } from "../types";
import { msUntilNextBoundary, trackingDayFor } from "../lib/day";
import {
  createEntry,
  entriesForDay,
  frequentEntries,
  loadEntries,
  saveEntries,
  summarizeByDay,
  totalForDay,
} from "../lib/store";
import { loadSettings, saveSettings } from "../lib/settings";

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
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const addEntry = useCallback((calories: number, description: string) => {
    const entry = createEntry(calories, description);
    setEntries((prev) => [...prev, entry]);
    return entry;
  }, []);

  const updateEntry = useCallback(
    (id: string, calories: number, description: string) => {
      setEntries((prev) =>
        prev.map((e) =>
          e.id === id
            ? { ...e, calories, description: description.trim() }
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

  const todayEntries = useMemo(
    () => entriesForDay(entries, today),
    [entries, today],
  );
  const todayTotal = useMemo(
    () => totalForDay(entries, today),
    [entries, today],
  );
  const history = useMemo(() => summarizeByDay(entries), [entries]);
  const quickAdds = useMemo(() => frequentEntries(entries), [entries]);

  return {
    today,
    todayEntries,
    todayTotal,
    history,
    quickAdds,
    dailyGoal,
    setDailyGoal,
    addEntry,
    updateEntry,
    deleteEntry,
    restoreEntry,
  };
}
