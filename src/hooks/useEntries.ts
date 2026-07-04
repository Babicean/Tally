import { useCallback, useEffect, useMemo, useState } from "react";
import type { DayKey, Entry } from "../types";
import { msUntilNextBoundary, trackingDayFor } from "../lib/day";
import {
  createEntry,
  entriesForDay,
  loadEntries,
  saveEntries,
  summarizeByDay,
  totalForDay,
} from "../lib/store";

/**
 * Single source of truth for entries. Persists on every change and rolls the
 * "today" key over automatically when the 2 AM boundary passes while the app
 * is open.
 */
export function useEntries() {
  const [entries, setEntries] = useState<Entry[]>(() => loadEntries());
  const [today, setToday] = useState<DayKey>(() => trackingDayFor(new Date()));

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
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const addEntry = useCallback((calories: number, description: string) => {
    const entry = createEntry(calories, description);
    setEntries((prev) => [...prev, entry]);
    return entry;
  }, []);

  const deleteEntry = useCallback((id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
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

  return {
    today,
    todayEntries,
    todayTotal,
    history,
    addEntry,
    deleteEntry,
  };
}
