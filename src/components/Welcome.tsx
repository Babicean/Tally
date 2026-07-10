import { useState } from "react";

interface Props {
  /** Dismiss for good; the caller records the flag. */
  onStart: () => void;
  /** Dismiss and jump straight to the account login form. */
  onLogIn: () => void;
}

/**
 * One-time landing page, rendered on a fresh install only (lib/welcome.ts
 * decides). One screen, no carousel: the name, the pitch, three facts,
 * one button. "Log in" is for people setting up a new phone.
 */
export default function Welcome({ onStart, onLogIn }: Props) {
  const [leaving, setLeaving] = useState(false);

  const start = () => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      onStart();
    } else {
      setLeaving(true);
    }
  };

  return (
    <div
      className={`welcome${leaving ? " welcome-leaving" : ""}`}
      role="dialog"
      aria-label="Welcome to Tally"
      onAnimationEnd={(e) => {
        if (leaving && e.target === e.currentTarget) onStart();
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
        <button type="button" className="add-submit" onClick={start}>
          Start tallying
        </button>
        <button type="button" className="sheet-secondary quiet" onClick={onLogIn}>
          Already have an account? Log in
        </button>
      </div>
    </div>
  );
}
