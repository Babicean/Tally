import { useCallback, useEffect, useRef } from "react";
import type { BackupPayload } from "../lib/backup";
import { loadSession, pushBackup, rememberLastBackup } from "../lib/sync";

/** Quiet period after the last change before an auto-backup fires. */
const SETTLE_MS = 60_000;

/**
 * Invisible sync: when signed in, changes push themselves. A change
 * marks the data dirty and arms a one-minute timer (each further
 * change re-arms it, so a burst of logging becomes one push); leaving
 * the app (visibilitychange → hidden) flushes immediately, which on a
 * phone is the natural "done for now" moment. Failures stay silent
 * and leave the dirty flag set — the next change or app-leave retries,
 * and the manual Back up now button is always there.
 */
export function useAutoBackup(
  getBackup: () => BackupPayload,
  deps: unknown[],
): void {
  const dirty = useRef(false);
  const mounted = useRef(false);
  const timer = useRef<number | null>(null);
  const getRef = useRef(getBackup);
  getRef.current = getBackup;

  const flush = useCallback(async () => {
    if (timer.current !== null) {
      window.clearTimeout(timer.current);
      timer.current = null;
    }
    if (!dirty.current || loadSession() === null) return;
    dirty.current = false;
    const result = await pushBackup(getRef.current());
    if (result.ok) rememberLastBackup(result.updatedAt);
    else dirty.current = true;
  }, []);

  // Any data change: mark dirty, (re)arm the settle timer.
  useEffect(() => {
    if (!mounted.current) {
      // The initial load isn't a change.
      mounted.current = true;
      return;
    }
    dirty.current = true;
    if (timer.current !== null) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => void flush(), SETTLE_MS);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  // Leaving the app is the moment to make sure nothing is unsaved.
  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState === "hidden") void flush();
    };
    document.addEventListener("visibilitychange", onHide);
    return () => {
      document.removeEventListener("visibilitychange", onHide);
      if (timer.current !== null) window.clearTimeout(timer.current);
    };
  }, [flush]);
}
