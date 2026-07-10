import { mirrorWrite } from "./mirror";

/**
 * The one-time landing page. Shown on a genuinely fresh install only:
 * anyone with existing data (an update, a restored mirror) is marked as
 * welcomed without ever seeing it.
 */
const WELCOME_KEY = "tally.welcomed";

/** Keys whose presence means this install has been used before. */
const DATA_KEYS = [
  "tally.store",
  "tally.menu",
  "tally.settings",
  "tally.weights",
  "tally.session",
];

export type WelcomeDecision = "show" | "skip" | "mark-and-skip";

/** Pure decision, split out for tests. */
export function welcomeDecision(
  read: (key: string) => string | null,
): WelcomeDecision {
  if (read(WELCOME_KEY) !== null) return "skip";
  if (DATA_KEYS.some((key) => read(key) !== null)) return "mark-and-skip";
  return "show";
}

/**
 * True when the landing page should render. Call before anything writes
 * to storage (a useState initializer is early enough; effects are not).
 */
export function shouldShowWelcome(): boolean {
  try {
    const decision = welcomeDecision((key) => localStorage.getItem(key));
    if (decision === "mark-and-skip") markWelcomed();
    return decision === "show";
  } catch {
    return false;
  }
}

/** Never show the landing page again, on this install or after recovery. */
export function markWelcomed(): void {
  try {
    localStorage.setItem(WELCOME_KEY, "1");
  } catch {
    // Storage refusing writes shouldn't block dismissing the page.
  }
  mirrorWrite(WELCOME_KEY, "1");
}
