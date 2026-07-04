import { useEffect, useRef, useState } from "react";
import type { Entry } from "../types";
import { formatCalories, formatTime } from "../lib/format";

interface Props {
  entries: Entry[];
  onDelete: (id: string) => void;
}

const LEAVE_MS = 240;

/**
 * Today's entries with enter/exit animations. Deletions collapse the row
 * (grid-rows 1fr → 0fr) before the entry is actually removed from state.
 */
export default function EntryList({ entries, onDelete }: Props) {
  const [leaving, setLeaving] = useState<Set<string>>(new Set());
  // Ids rendered at least once — new ids after mount get the enter animation.
  const seenRef = useRef<Set<string> | null>(null);
  if (seenRef.current === null) {
    seenRef.current = new Set(entries.map((e) => e.id));
  }
  const seen = seenRef.current;

  useEffect(() => {
    for (const e of entries) seen.add(e.id);
  }, [entries, seen]);

  const remove = (id: string) => {
    setLeaving((prev) => new Set(prev).add(id));
    window.setTimeout(() => {
      onDelete(id);
      setLeaving((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }, LEAVE_MS);
  };

  if (entries.length === 0) {
    return (
      <div className="card empty">
        <svg
          className="empty-icon"
          viewBox="0 0 52 52"
          fill="none"
          aria-hidden="true"
        >
          <circle
            cx="26"
            cy="26"
            r="20"
            stroke="currentColor"
            strokeWidth="2"
            opacity="0.5"
          />
          <circle cx="26" cy="26" r="9" stroke="currentColor" strokeWidth="2" />
        </svg>
        <p className="empty-title">Nothing logged yet</p>
        <p className="empty-sub">Add your first entry to start today’s tally.</p>
      </div>
    );
  }

  return (
    <div className="card entry-list">
      {entries.map((entry) => {
        const isNew = !seen.has(entry.id);
        const isLeaving = leaving.has(entry.id);
        return (
          <div
            key={entry.id}
            className={`entry-shell${isLeaving ? " leaving" : ""}${
              isNew ? " entering" : ""
            }`}
          >
            <div className="entry-clip">
              <div className="entry-row">
                <div className="entry-text">
                  <p className="entry-title">
                    {entry.description || formatTime(entry.timestamp)}
                  </p>
                  {entry.description && (
                    <p className="entry-time">{formatTime(entry.timestamp)}</p>
                  )}
                </div>
                <span className="entry-cal">
                  +{formatCalories(entry.calories)}
                  <span className="unit">cal</span>
                </span>
                <button
                  className="entry-delete"
                  onClick={() => remove(entry.id)}
                  aria-label={`Delete ${
                    entry.description || "entry"
                  } (${entry.calories} calories)`}
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path
                      d="M3 3l8 8M11 3l-8 8"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
