import { Preferences } from "@capacitor/preferences";

/**
 * Durability layer. localStorage stays the synchronous source of truth the
 * UI reads at startup, but every write is mirrored to Capacitor Preferences
 * (SharedPreferences on Android). Two things that makes survivable:
 *
 *  - Android occasionally clears WebView storage (updates, corruption);
 *    native preferences are untouched, and we restore from them on launch.
 *  - Android's auto-backup includes SharedPreferences (WebView data is
 *    excluded), so reinstalls and phone transfers recover data too.
 *
 * On the plain web build Preferences falls back to a localStorage shim,
 * which makes the mirror a harmless no-op copy.
 */

export const MIRRORED_KEYS = [
  "tally.store",
  "tally.menu",
  "tally.settings",
  "tally.session",
  "tally.weights",
  "tally.welcomed",
] as const;

/** Fire-and-forget mirror write; storage failures must never break the UI. */
export function mirrorWrite(key: string, value: string): void {
  Preferences.set({ key, value }).catch(() => {});
}

export function mirrorRemove(key: string): void {
  Preferences.remove({ key }).catch(() => {});
}

/** A stored value is usable when it's empty or parses as JSON. */
function usable(value: string): boolean {
  if (value === "") return true;
  try {
    JSON.parse(value);
    return true;
  } catch {
    return false;
  }
}

/**
 * Called once before the app renders. For any key missing from localStorage
 * (or present but corrupt) whose mirror copy is intact, copy the mirror
 * back — this is the "WebView data was wiped" recovery path.
 */
export async function restoreFromMirror(): Promise<void> {
  try {
    await Promise.all(
      MIRRORED_KEYS.map(async (key) => {
        // A present-but-corrupt value (interrupted write) must not block
        // recovery, or the boot save would overwrite the good mirror copy
        // with the empty state the corrupt load produced.
        const current = localStorage.getItem(key);
        if (current !== null && usable(current)) return;
        const { value } = await Preferences.get({ key });
        if (value !== null && usable(value)) {
          localStorage.setItem(key, value);
        }
      }),
    );
  } catch {
    // Recovery is best-effort; the app still works from localStorage.
  }
}
