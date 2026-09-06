import { useEffect, useRef, useState } from "react";
import type { DayKey } from "../types";
import { formatWeekday } from "../lib/format";
import { greetingFor, type DayPeriod, type Greeting } from "../lib/greeting";
import { haptic } from "../lib/fly";

/** How long the greeting lingers before the weekday takes over. */
const GREET_MS = 3800;
/** Away this long and coming back earns a fresh greeting. */
const REPLAY_AFTER_MS = 5 * 60_000;

function PeriodIcon({ period }: { period: DayPeriod }) {
  const common = {
    width: 14,
    height: 14,
    viewBox: "0 0 16 16",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.5,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className: "period-icon",
    "aria-hidden": true,
  };
  switch (period) {
    case "morning":
      // Sunrise: half a sun on the horizon, rays above.
      return (
        <svg {...common}>
          <path d="M2 12h12M4.5 12a3.5 3.5 0 0 1 7 0" />
          <path d="M8 3.5v2M3.6 6l1.4 1.4M12.4 6 11 7.4" />
        </svg>
      );
    case "afternoon":
      return (
        <svg {...common}>
          <circle cx="8" cy="8" r="2.75" />
          <path d="M8 1.5v2M8 12.5v2M1.5 8h2M12.5 8h2M3.4 3.4l1.4 1.4M11.2 11.2l1.4 1.4M3.4 12.6l1.4-1.4M11.2 4.8l1.4-1.4" />
        </svg>
      );
    case "evening":
      return (
        <svg {...common}>
          <path d="M11.5 10.2A5 5 0 0 1 5.8 4.5a5 5 0 1 0 5.7 5.7z" />
        </svg>
      );
    default:
      return (
        <svg {...common}>
          <path d="M10.5 10.7A4.5 4.5 0 0 1 5.3 5.5a4.5 4.5 0 1 0 5.2 5.2z" />
          <path d="M12.5 2.5v2M11.5 3.5h2" />
        </svg>
      );
  }
}

/**
 * The line at the very top. Opens with a time-of-day greeting and a tiny
 * accent icon that rises in beside it, then settles into the weekday
 * after a few seconds. Coming back after a while away replays it. The
 * whole thing is still the wordmark button: tap it and it takes a spin.
 */
export default function TopBar({ today }: { today: DayKey }) {
  const [phase, setPhase] = useState<"greeting" | "day">("greeting");
  const [greeting, setGreeting] = useState<Greeting>(() =>
    greetingFor(new Date().getHours()),
  );
  const [spin, setSpin] = useState(false);
  const hiddenAt = useRef<number | null>(null);

  useEffect(() => {
    if (phase !== "greeting") return;
    const t = window.setTimeout(() => setPhase("day"), GREET_MS);
    return () => window.clearTimeout(t);
  }, [phase, greeting]);

  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        hiddenAt.current = Date.now();
      } else if (
        hiddenAt.current !== null &&
        Date.now() - hiddenAt.current >= REPLAY_AFTER_MS
      ) {
        hiddenAt.current = null;
        setGreeting(greetingFor(new Date().getHours()));
        setPhase("greeting");
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  const label = phase === "greeting" ? greeting.text : formatWeekday(today);

  return (
    <span className="wordmark">
      <button
        className={`wordmark-btn${spin ? " spinning" : ""}`}
        onClick={() => {
          setSpin(true);
          haptic(8);
        }}
        onAnimationEnd={(e) => {
          if (e.animationName === "wordmark-spin") setSpin(false);
        }}
        aria-live="polite"
      >
        <span key={`${phase}-${greeting.period}`} className={`topbar-label ${phase}`}>
          {phase === "greeting" && <PeriodIcon period={greeting.period} />}
          {label}
        </span>
      </button>
    </span>
  );
}
