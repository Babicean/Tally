import { useCallback, useRef, useState } from "react";
import type { ToastData } from "../components/Toast";

// Rotating confirmation copy — short, warm, never a lecture.
const CONFIRMATIONS = ["Logged", "Counted", "On the tally", "Noted"];

/**
 * Per-screen toast state: one visible pill, auto-dismissed. `hold`
 * freezes the dismiss timer and `release` restarts it from the full
 * duration — touching an Undo toast must never lose the race.
 */
export function useToast() {
  const [toast, setToast] = useState<ToastData | null>(null);
  const timer = useRef(0);
  const id = useRef(0);
  const duration = useRef(0);
  const held = useRef(false);

  const showToast = useCallback(
    (data: Omit<ToastData, "id">, ms: number) => {
      window.clearTimeout(timer.current);
      id.current += 1;
      duration.current = ms;
      held.current = false;
      setToast({ ...data, id: id.current });
      timer.current = window.setTimeout(() => setToast(null), ms);
    },
    [],
  );

  const hold = useCallback(() => {
    held.current = true;
    window.clearTimeout(timer.current);
  }, []);

  const release = useCallback(() => {
    if (!held.current) return;
    held.current = false;
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setToast(null), duration.current);
  }, []);

  const showConfirmation = useCallback(() => {
    showToast(
      {
        kind: "confirm",
        message:
          CONFIRMATIONS[Math.floor(Math.random() * CONFIRMATIONS.length)],
      },
      1600,
    );
  }, [showToast]);

  const dismiss = useCallback(() => {
    window.clearTimeout(timer.current);
    setToast(null);
  }, []);

  return { toast, showToast, showConfirmation, dismiss, hold, release };
}
