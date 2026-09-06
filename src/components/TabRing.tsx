import { ringProgress, withinGoal } from "../lib/goal";

interface Props {
  total: number;
  goal: number | null;
}

// Tab-bar geometry (SVG user units): a 17px miniature of the hero ring.
const R = 6.5;
const CIRCUMFERENCE = 2 * Math.PI * R;
// With no goal set there is nothing to fill against, so the icon rests at
// the app icon's arc instead of sitting empty all day.
const RESTING = 0.64;

/**
 * The Today tab icon: the same ring as the hero, at tab size, filling
 * with the day's tally. Empty at breakfast, full at the goal, amber only
 * past the grace band, exactly like the big one.
 */
export default function TabRing({ total, goal }: Props) {
  const progress = ringProgress(total, goal);
  const fill = progress ?? RESTING;
  const over = goal !== null && !withinGoal(total, goal);
  return (
    <svg
      className={`tab-ring${over ? " over" : ""}`}
      width="17"
      height="17"
      viewBox="0 0 17 17"
      fill="none"
      aria-hidden="true"
      data-progress={progress === null ? undefined : fill.toFixed(3)}
    >
      <circle cx="8.5" cy="8.5" r={R} stroke="currentColor" strokeWidth="1.8" opacity="0.28" />
      <circle
        className="tab-ring-arc"
        cx="8.5"
        cy="8.5"
        r={R}
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeDasharray={CIRCUMFERENCE}
        strokeDashoffset={CIRCUMFERENCE * (1 - fill)}
        // A round-capped zero-length dash still paints a dot; hide it.
        style={{ opacity: fill > 0 ? 1 : 0 }}
        transform="rotate(-90 8.5 8.5)"
      />
    </svg>
  );
}
