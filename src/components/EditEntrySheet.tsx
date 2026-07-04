import { FormEvent, useEffect, useState } from "react";
import type { Entry } from "../types";
import Sheet from "./Sheet";
import { parseCalories } from "../lib/store";
import { formatTime } from "../lib/format";

interface Props {
  entry: Entry | null;
  onSave: (id: string, calories: number, description: string) => void;
  onClose: () => void;
}

export default function EditEntrySheet({ entry, onSave, onClose }: Props) {
  const [calories, setCalories] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState(false);

  useEffect(() => {
    if (entry) {
      setCalories(String(entry.calories));
      setDescription(entry.description);
      setError(false);
    }
  }, [entry]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!entry) return;
    const parsed = parseCalories(calories);
    if (parsed === null) {
      setError(true);
      return;
    }
    onSave(entry.id, parsed, description);
    onClose();
  };

  return (
    <Sheet open={entry !== null} title="Edit entry" onClose={onClose}>
      {entry && (
        <p className="sheet-sub">Logged at {formatTime(entry.timestamp)}.</p>
      )}
      <form onSubmit={submit} noValidate>
        <div className="sheet-fields">
          <div className={`field field-cal${error ? " invalid" : ""}`}>
            <input
              value={calories}
              onChange={(e) => {
                setCalories(e.target.value);
                setError(false);
              }}
              inputMode="numeric"
              aria-label="Calories"
            />
            <span className="unit">cal</span>
          </div>
          <div className="field">
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={80}
              placeholder="Note (optional)"
              aria-label="Description"
            />
          </div>
        </div>
        {error && (
          <p className="add-error" role="alert">
            Calories must be a positive number up to 20,000.
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
