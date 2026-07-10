import { useEffect, useRef, useState } from "react";
import { haptic } from "../lib/fly";

interface Props {
  /** Dismiss for good; the caller records the flag. */
  onStart: () => void;
  /** Dismiss and jump straight to the account login form. */
  onLogIn: () => void;
}

/** When each stroke lands, in ms from the Start tap; the CSS mirrors this. */
const STROKE_TICKS = [240, 360, 480, 600];
const SLASH_TICK = 810;

/**
 * One-time landing page, rendered on a fresh install only (lib/welcome.ts
 * decides). One screen, no carousel: the name, the pitch, three facts,
 * one button. "Log in" is for people setting up a new phone.
 *
 * Tapping Start plays the delighter: the page clears and the app icon's
 * tally is drawn stroke by stroke, a haptic tick per stroke, then the
 * whole page fades into Today. Your first tally.
 */
export default function Welcome({ onStart, onLogIn }: Props) {
  const [striking, setStriking] = useState(false);
  const timers = useRef<number[]>([]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const start = () => {
    if (striking) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      onStart();
      return;
    }
    setStriking(true);
    for (const at of STROKE_TICKS) {
      timers.current.push(window.setTimeout(() => haptic(6), at));
    }
    timers.current.push(window.setTimeout(() => haptic(14), SLASH_TICK));
  };

  return (
    <div
      className={`welcome${striking ? " striking" : ""}`}
      role="dialog"
      aria-label="Welcome to Tally"
      onAnimationEnd={(e) => {
        if (
          striking &&
          e.target === e.currentTarget &&
          e.animationName === "welcome-out"
        ) {
          onStart();
        }
      }}
    >
      <div className="welcome-top">
        <img
          className="welcome-logo"
          src="/icons/icon-192.png"
          alt=""
          width="192"
          height="192"
        />
        <span className="welcome-mark">Tally</span>
      </div>
      <div className="welcome-body">
        <h1 className="welcome-title">A simple way to track calories.</h1>
        <p className="welcome-line">Log them in just a couple of taps.</p>
        <p className="welcome-line">
          Add meals and foods you frequently eat to the menu. Your eating
          history lives in the History tab.
        </p>
        <p className="welcome-line">
          Optionally track your weight and macros for a more complete
          picture.
        </p>
      </div>
      <div className="sheet-actions welcome-actions">
        <button
          type="button"
          className="add-submit"
          disabled={striking}
          onClick={start}
        >
          Start tallying
        </button>
        <button
          type="button"
          className="sheet-secondary quiet"
          disabled={striking}
          onClick={onLogIn}
        >
          Already have an account? Log in
        </button>
      </div>

      {striking && (
        <div className="welcome-strokes" aria-hidden="true">
          <div className="stroke-group">
            <span className="stroke s1" />
            <span className="stroke s2" />
            <span className="stroke s3" />
            <span className="stroke s4" />
            <span className="stroke-slash" />
          </div>
        </div>
      )}
    </div>
  );
}
