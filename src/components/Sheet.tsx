import { ReactNode, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

interface Props {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}

const CLOSE_MS = 200;

/**
 * A modal sheet: slides up from the bottom on phones, appears as a centered
 * card on wider screens. Closes on backdrop tap or Escape.
 */
export default function Sheet({ open, title, onClose, children }: Props) {
  const [render, setRender] = useState(open);
  const [closing, setClosing] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setRender(true);
      setClosing(false);
    } else if (render) {
      setClosing(true);
      const t = window.setTimeout(() => {
        setRender(false);
        setClosing(false);
      }, CLOSE_MS);
      return () => window.clearTimeout(t);
    }
  }, [open, render]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    // Move focus into the sheet so keyboard users land in the right place.
    const first = panelRef.current?.querySelector<HTMLElement>(
      "input, button",
    );
    first?.focus();
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!render) return null;

  // Portal to <body>: the screen's entrance animation creates a stacking
  // context that would otherwise trap the sheet underneath the tab bar.
  return createPortal(
    <div
      className={`sheet-backdrop${closing ? " closing" : ""}`}
      onClick={onClose}
    >
      <div
        ref={panelRef}
        className={`sheet${closing ? " closing" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sheet-grabber" aria-hidden="true" />
        <h2 className="sheet-title">{title}</h2>
        {children}
      </div>
    </div>,
    document.body,
  );
}
