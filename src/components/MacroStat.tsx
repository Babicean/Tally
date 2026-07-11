import { useState } from "react";
import { haptic } from "../lib/fly";

interface Props {
  proteinAvg: number | null;
  fatAvg: number | null;
}

/**
 * The protein/day stat. When fat is tracked too, tapping it flips the
 * number over scoreboard-style to fat/day and back; with no fat data
 * it's an ordinary static stat.
 */
export default function MacroStat({ proteinAvg, fatAvg }: Props) {
  const [showFat, setShowFat] = useState(false);
  const [phase, setPhase] = useState<"idle" | "out" | "in">("idle");
  const canFlip = proteinAvg !== null && fatAvg !== null;

  if (proteinAvg === null && fatAvg === null) return null;

  const value = showFat ? fatAvg : proteinAvg;
  const label = showFat ? "fat / day" : "protein / day";

  const flip = () => {
    if (!canFlip || phase !== "idle") return;
    haptic(6);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setShowFat((f) => !f);
    } else {
      setPhase("out");
    }
  };

  const body = (
    <>
      <span className="tstat-v">
        {value}
        <span className="u"> g</span>
      </span>
      <span className="tstat-l">{label}</span>
    </>
  );

  if (!canFlip) return <div className="tstat">{body}</div>;

  return (
    <button
      type="button"
      className={`tstat tstat-flippable${phase === "out" ? " flip-out" : ""}${phase === "in" ? " flip-in" : ""}`}
      aria-label={`Showing ${label}. Tap to switch.`}
      onClick={flip}
      onAnimationEnd={() => {
        if (phase === "out") {
          setShowFat((f) => !f);
          setPhase("in");
        } else if (phase === "in") {
          setPhase("idle");
        }
      }}
    >
      {body}
    </button>
  );
}
