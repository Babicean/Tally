import { useEffect, useState } from "react";
import { haptic } from "../lib/fly";

interface Props {
  proteinAvg: number | null;
  fatAvg: number | null;
  /** Derived, so shown with a "≈"; null when nothing was derivable. */
  carbsAvg?: number | null;
}

interface Face {
  value: number;
  label: string;
  approx: boolean;
}

/**
 * The macro stat. Tapping it flips scoreboard-style through whichever of
 * protein / fat / carbs per day have data; with only one it's an
 * ordinary static stat.
 */
export default function MacroStat({ proteinAvg, fatAvg, carbsAvg = null }: Props) {
  const faces: Face[] = [];
  if (proteinAvg !== null) faces.push({ value: proteinAvg, label: "protein / day", approx: false });
  if (fatAvg !== null) faces.push({ value: fatAvg, label: "fat / day", approx: false });
  if (carbsAvg !== null) faces.push({ value: carbsAvg, label: "carbs / day", approx: true });

  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<"idle" | "out" | "in">("idle");
  const canFlip = faces.length > 1;

  // Props can change under the flip (range toggles, data edits): a face
  // disappearing must not leave a blank stat or a stuck phase.
  useEffect(() => {
    if (index >= faces.length && faces.length > 0) setIndex(0);
  }, [index, faces.length]);
  useEffect(() => {
    if (!canFlip && phase !== "idle") setPhase("idle");
  }, [canFlip, phase]);

  if (faces.length === 0) return null;
  const face = faces[Math.min(index, faces.length - 1)];

  const flip = () => {
    if (!canFlip || phase !== "idle") return;
    haptic(6);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setIndex((i) => (i + 1) % faces.length);
    } else {
      setPhase("out");
    }
  };

  const body = (
    <>
      <span className="tstat-v">
        {face.approx && <span className="u">≈ </span>}
        {face.value}
        <span className="u"> g</span>
      </span>
      <span className="tstat-l">{face.label}</span>
    </>
  );

  if (!canFlip) return <div className="tstat">{body}</div>;

  const next = faces[(index + 1) % faces.length];
  return (
    <button
      type="button"
      className={`tstat tstat-flippable${phase === "out" ? " flip-out" : ""}${phase === "in" ? " flip-in" : ""}`}
      aria-label={`Showing ${face.label}. Tap to switch to ${next.label}.`}
      onClick={flip}
      onAnimationEnd={() => {
        if (phase === "out") {
          setIndex((i) => (i + 1) % faces.length);
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
