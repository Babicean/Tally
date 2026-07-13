import { FormEvent, useEffect, useState } from "react";
import type { Entry } from "../types";
import Sheet from "./Sheet";
import { parseCalories } from "../lib/store";
import { parseProtein } from "../lib/menu";
import { trackingDayFor } from "../lib/day";
import { formatDayLabel, formatTime } from "../lib/format";

interface Props {
  entry: Entry | null;
  trackProtein: boolean;
  onSave: (
    id: string,
    calories: number,
    description: string,
    protein: number | null,
    fat: number | null,
    /** Omitted when the time field was left untouched. */
    timestamp?: number,
  ) => void;
  onClose: () => void;
}

/** Epoch ms → the local value string a datetime-local input expects. */
function toLocalInputValue(ts: number): string {
  const d = new Date(ts);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}`;
}

export default function EditEntrySheet({
  entry,
  trackProtein,
  onSave,
  onClose,
}: Props) {
  const [calories, setCalories] = useState("");
  const [description, setDescription] = useState("");
  const [protein, setProtein] = useState("");
  const [fat, setFat] = useState("");
  const [when, setWhen] = useState("");
  const [error, setError] = useState<string | null>(null);
  // Which fields the error is about, so the outline lands on the actual
  // mistake instead of always blaming calories.
  const [bad, setBad] = useState<{
    cal?: boolean;
    protein?: boolean;
    fat?: boolean;
  }>({});

  useEffect(() => {
    if (entry) {
      setCalories(String(entry.calories));
      setDescription(entry.description);
      setProtein(entry.protein != null ? String(entry.protein) : "");
      setFat(entry.fat != null ? String(entry.fat) : "");
      setWhen(toLocalInputValue(entry.timestamp));
      setError(null);
      setBad({});
    }
  }, [entry]);

  const clearError = () => {
    setError(null);
    setBad({});
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!entry) return;
    const parsed = parseCalories(calories);
    const parsedProtein = trackProtein ? parseProtein(protein) : entry.protein ?? null;
    const parsedFat = trackProtein ? parseProtein(fat) : entry.fat ?? null;
    if (parsed === null || parsedProtein === undefined || parsedFat === undefined) {
      setBad({
        cal: parsed === null,
        protein: parsedProtein === undefined,
        fat: parsedFat === undefined,
      });
      setError(
        parsed === null
          ? "Calories must be a positive number up to 20,000."
          : parsedProtein === undefined
            ? "Protein must be a number of grams up to 1,000, or blank."
            : "Fat must be a number of grams up to 1,000, or blank.",
      );
      return;
    }
    // Only a changed time field rewrites the timestamp: the input holds
    // minutes, so parsing an untouched value would truncate seconds and
    // reorder same-minute entries (and re-derive the tracking day).
    const timeChanged =
      when !== "" && when !== toLocalInputValue(entry.timestamp);
    const ts = timeChanged ? new Date(when).getTime() : entry.timestamp;
    if (!Number.isFinite(ts)) {
      setError("That date doesn’t look right.");
      return;
    }
    if (ts > Date.now() + 60_000) {
      setError("Can’t log into the future.");
      return;
    }
    onSave(
      entry.id,
      parsed,
      description,
      parsedProtein,
      parsedFat,
      timeChanged ? ts : undefined,
    );
    onClose();
  };

  // App-formatted stand-in for the raw datetime input: "Today · 5:49 PM".
  const whenDate = when
    ? new Date(when)
    : entry
      ? new Date(entry.timestamp)
      : null;
  const whenLabel =
    whenDate && Number.isFinite(whenDate.getTime())
      ? `${formatDayLabel(trackingDayFor(whenDate))} · ${formatTime(whenDate.getTime())}`
      : "Pick a date";

  return (
    <Sheet open={entry !== null} title="Edit entry" onClose={onClose}>
      <p className="sheet-sub">
        Change what it was, how much, or when. Moving the time moves it to
        the right day automatically.
      </p>
      <form onSubmit={submit} noValidate>
        <div className="field sheet-name">
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={80}
            placeholder="Note (optional)"
            aria-label="Description"
          />
        </div>
        <div className="sheet-fields">
          <div className={`field field-cal${bad.cal ? " invalid" : ""}`}>
            <input
              value={calories}
              onChange={(e) => {
                setCalories(e.target.value);
                clearError();
              }}
              inputMode="numeric"
              aria-label="Calories"
            />
            <span className="unit">cal</span>
          </div>
          {trackProtein && (
            <div
              className={`field field-cal field-protein${bad.protein ? " invalid" : ""}`}
            >
              <input
                value={protein}
                onChange={(e) => {
                  setProtein(e.target.value);
                  clearError();
                }}
                inputMode="numeric"
                aria-label="Protein in grams (optional)"
              />
              <span className="unit">g protein</span>
            </div>
          )}
          {trackProtein && (
            <div
              className={`field field-cal field-protein${bad.fat ? " invalid" : ""}`}
            >
              <input
                value={fat}
                onChange={(e) => {
                  setFat(e.target.value);
                  clearError();
                }}
                inputMode="numeric"
                aria-label="Fat in grams (optional)"
              />
              <span className="unit">g fat</span>
            </div>
          )}
        </div>
        <div className="field sheet-name sheet-when">
          {/* The styled label is what you see; the real datetime input is
              an invisible layer on top so a tap still opens the system
              picker. Its value drives the label, so nothing drifts. */}
          <span className="when-display" aria-hidden="true">
            {whenLabel}
          </span>
          <input
            className="when-input"
            type="datetime-local"
            value={when}
            onChange={(e) => {
              setWhen(e.target.value);
              clearError();
            }}
            aria-label="Logged at"
          />
        </div>
        {error && (
          <p className="add-error" role="alert">
            {error}
          </p>
        )}
        <div className="sheet-actions">
          <button type="submit" className="add-submit">
            Save changes
          </button>
        </div>
      </form>
    </Sheet>
  );
}
