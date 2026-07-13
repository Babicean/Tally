import { createPortal } from "react-dom";

export interface ToastData {
  id: number;
  message: string;
  /** Optional action button, e.g. Undo. */
  action?: { label: string; onPress: () => void };
  /** Celebration toasts get the accent check styling. */
  kind: "confirm" | "undo" | "streak";
}

interface Props {
  toast: ToastData | null;
  /** Freeze the dismiss timer (finger down / hover / focus). */
  onHold?: () => void;
  /** Restart it once let go. */
  onRelease?: () => void;
}

/**
 * A single floating pill above the tab bar. Springs in, fades out via key.
 * The wrapper stays mounted so its live region exists before content
 * arrives — swapping text into an existing region is what screen readers
 * reliably announce. Touching or focusing the pill parks the timer, so
 * nobody races a 5-second Undo.
 */
export default function Toast({ toast, onHold, onRelease }: Props) {
  // Portal to <body> so the screen's stacking context can't trap it.
  return createPortal(
    <div className="toast-wrap" role="status" aria-live="polite">
      {toast && (
        <div
          key={toast.id}
          className={`toast toast-${toast.kind}`}
          onPointerEnter={onHold}
          onPointerDown={onHold}
          onPointerLeave={onRelease}
          onPointerUp={onRelease}
          onPointerCancel={onRelease}
          onFocus={onHold}
          onBlur={onRelease}
        >
          {toast.kind === "streak" && (
            <svg
              className="toast-spark"
              width="15"
              height="15"
              viewBox="0 0 15 15"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M7.5 0.8l1.7 4.9 4.9 1.8-4.9 1.8-1.7 4.9-1.7-4.9L.9 7.5l4.9-1.8L7.5.8z" />
            </svg>
          )}
          {toast.kind === "confirm" && (
            <svg
              className="toast-check"
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M2.5 7.5l3 3 6-7"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
          <span>{toast.message}</span>
          {toast.action && (
            <button className="toast-action" onClick={toast.action.onPress}>
              {toast.action.label}
            </button>
          )}
        </div>
      )}
    </div>,
    document.body,
  );
}
