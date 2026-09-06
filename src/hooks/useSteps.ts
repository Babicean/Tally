import { useCallback, useEffect, useRef, useState } from "react";
import {
  stepsSource,
  stepsWindow,
  todaySteps,
  weeklyAverageSteps,
  type StepsStatus,
} from "../lib/steps";

/** How often to re-read while the app is on screen. The store itself
 *  batches steps about once a minute, so faster would be theatre. */
const REFRESH_MS = 60_000;

export interface StepsState {
  status: StepsStatus;
  /** Today's count, once a read has landed; null until then or when off. */
  today: number | null;
  /** Average of the seven completed days before today; null when unknown. */
  weekAvg: number | null;
  /** Prompt the store for access (the Settings switch calls this). */
  request: () => Promise<void>;
  /** Android only: open Health Connect's permission screen for Tally. */
  openSettings: () => Promise<void>;
}

/**
 * Reads step totals from the phone while `enabled`, on open, whenever
 * the app returns to the foreground, and once a minute in between.
 * Nothing here is persisted: the phone is the source of truth.
 */
export function useSteps(enabled: boolean): StepsState {
  const [status, setStatus] = useState<StepsStatus>(enabled ? "ok" : "off");
  const [today, setToday] = useState<number | null>(null);
  const [weekAvg, setWeekAvg] = useState<number | null>(null);
  const busy = useRef(false);
  const prompting = useRef(false);

  const refresh = useCallback(async () => {
    if (busy.current || prompting.current) return;
    busy.current = true;
    try {
      const source = stepsSource();
      const avail = await source.availability();
      if (!avail.available) {
        setStatus("unavailable");
        setToday(null);
        setWeekAvg(null);
        return;
      }
      if (!(await source.check())) {
        setStatus("denied");
        setToday(null);
        setWeekAvg(null);
        return;
      }
      const now = new Date();
      const { start, end } = stepsWindow(now);
      const buckets = await source.dailyTotals(start, end);
      setToday(todaySteps(buckets, now));
      setWeekAvg(weeklyAverageSteps(buckets, now));
      setStatus("ok");
    } catch {
      // A failed read is not worth a message; the next one may land.
    } finally {
      busy.current = false;
    }
  }, []);

  const request = useCallback(async () => {
    prompting.current = true;
    try {
      const source = stepsSource();
      const avail = await source.availability();
      if (!avail.available) {
        setStatus("unavailable");
        return;
      }
      const granted = await source.request();
      if (!granted) {
        setStatus("denied");
        return;
      }
      setStatus("ok");
    } catch {
      setStatus("unavailable");
      return;
    } finally {
      prompting.current = false;
    }
    await refresh();
  }, [refresh]);

  const openSettings = useCallback(async () => {
    try {
      await stepsSource().openSettings?.();
    } catch {
      // Nothing to do; the user can find it in system settings.
    }
  }, []);

  useEffect(() => {
    if (!enabled) {
      setStatus("off");
      setToday(null);
      setWeekAvg(null);
      return;
    }
    void refresh();
    const onVisible = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    document.addEventListener("visibilitychange", onVisible);
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") void refresh();
    }, REFRESH_MS);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.clearInterval(timer);
    };
  }, [enabled, refresh]);

  return { status, today, weekAvg, request, openSettings };
}
