import { useEffect, useRef, useState } from "react";
import type { DayKey } from "../types";
import type { Streak } from "../lib/streak";
import { formatCalories, formatHeroDate } from "../lib/format";
import AnimatedNumber from "./AnimatedNumber";

interface Props {
  today: DayKey;
  total: number;
  /** Grams of protein logged today; hidden when zero. */
  protein: number;
  streak: Streak;
  goal: number | null;
  onEditGoal: () => void;
}

// Ring geometry (SVG user units).
const SIZE = 240;
const STROKE = 8;
const R = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * R;
const INNER_R = R - STROKE / 2 - 1; // liquid clips just inside the track

/** A periodic wave surface, twice the ring width so it can drift seamlessly. */
function wavePath(width: number, amp: number, period: number, depth: number) {
  let d = "M0 0";
  for (let x = 0; x < width; x += period) {
    d += ` q ${period / 4} ${-amp} ${period / 2} 0 t ${period / 2} 0`;
  }
  return `${d} V ${depth} H 0 Z`;
}
const WAVE = wavePath(SIZE * 2, 5, 96, SIZE + 24);

/**
 * The liquid's color: denim under target, amber once past it, red only when
 * far over. Deliberately stepped — blue and amber are near-complementary, so
 * continuous blends pass through grey mud; the 600ms fill transition turns
 * each step into a smooth morph instead.
 */
function liquidColor(pct: number): string {
  if (pct <= 1) return "var(--accent)";
  if (pct <= 1.2) return "var(--warn)";
  return "var(--danger)";
}

/**
 * The hero total. Without a goal it's the big free-standing number; with a
 * goal it sits inside a progress ring that fills toward the target and shifts
 * to a calm amber once the target is passed.
 */
export default function Hero({
  today,
  total,
  protein,
  streak,
  goal,
  onEditGoal,
}: Props) {
  const [pulsing, setPulsing] = useState(false);
  const prevTotal = useRef(total);
  useEffect(() => {
    if (prevTotal.current !== total) {
      prevTotal.current = total;
      setPulsing(true);
      const t = window.setTimeout(() => setPulsing(false), 500);
      return () => window.clearTimeout(t);
    }
  }, [total]);

  // Let the ring animate from empty on first paint.
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const raf = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  if (goal === null) {
    return (
      <header className="hero">
        <p className="hero-date">{formatHeroDate(today)}</p>
        {streak.length >= 2 && (
          <p className="streak-line">
            <svg width="11" height="11" viewBox="0 0 15 15" fill="currentColor" aria-hidden="true">
              <path d="M7.5 0.8l1.7 4.9 4.9 1.8-4.9 1.8-1.7 4.9-1.7-4.9L.9 7.5l4.9-1.8L7.5.8z" />
            </svg>
            {streak.length}-day streak
          </p>
        )}
        <h1 id="hero-total" className={`hero-total${pulsing ? " pulse" : ""}`}>
          <AnimatedNumber value={total} />
        </h1>
        <p className="hero-caption">calories today</p>
        {protein > 0 && (
          <p className="hero-protein">{formatCalories(protein)} g protein</p>
        )}
        <button className="goal-pill ghost" onClick={onEditGoal}>
          Set a calorie target
        </button>
      </header>
    );
  }

  const progress = Math.min(total / goal, 1);
  const over = total > goal;
  const offset = CIRCUMFERENCE * (1 - (mounted ? progress : 0));

  return (
    <header className="hero hero-ring">
      <p className="hero-date">{formatHeroDate(today)}</p>
      {streak.length >= 2 && (
        <p className="streak-line">
          <svg width="11" height="11" viewBox="0 0 15 15" fill="currentColor" aria-hidden="true">
            <path d="M7.5 0.8l1.7 4.9 4.9 1.8-4.9 1.8-1.7 4.9-1.7-4.9L.9 7.5l4.9-1.8L7.5.8z" />
          </svg>
          {streak.length}-day streak
        </p>
      )}
      <div className="ring">
        <svg
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          role="img"
          aria-label={`${total} of ${goal} calories`}
        >
          <defs>
            <clipPath id="ring-clip">
              <circle cx={SIZE / 2} cy={SIZE / 2} r={INNER_R} />
            </clipPath>
          </defs>
          {/* Liquid fill: rises with progress, drifts like water. */}
          <g
            clipPath="url(#ring-clip)"
            className="liquid"
            style={{ "--liquid": liquidColor(total / goal) } as React.CSSProperties}
          >
            <g
              className="liquid-level"
              style={{
                transform: `translateY(${SIZE * (1 - (mounted ? Math.min(total / goal, 1) : 0))}px)`,
              }}
            >
              <g className="liquid-wave w1">
                <path d={WAVE} />
              </g>
              <g className="liquid-wave w2">
                <path d={WAVE} />
              </g>
            </g>
          </g>
          <circle
            className="ring-track"
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={R}
            strokeWidth={STROKE}
          />
          <circle
            className={`ring-progress${over ? " over" : ""}${total / goal > 1.2 ? " way-over" : ""}`}
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={R}
            strokeWidth={STROKE}
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={offset}
            transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
          />
        </svg>
        <div className="ring-inner">
          <h1
            id="hero-total"
            className={`ring-total${pulsing ? " pulse" : ""}`}
          >
            <AnimatedNumber value={total} />
          </h1>
          <p className="ring-caption">of {formatCalories(goal)} cal</p>
        </div>
      </div>
      {protein > 0 && (
        <p className="hero-protein">{formatCalories(protein)} g protein</p>
      )}
      <button
        className={`goal-pill${over ? " over" : ""}${total / goal > 1.2 ? " way-over" : ""}`}
        onClick={onEditGoal}
      >
        <AnimatedNumber value={over ? total - goal : goal - total} />
        {over ? " over goal" : " remaining"}
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
          <path
            d="M3.5 2l3 3-3 3"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </header>
  );
}
