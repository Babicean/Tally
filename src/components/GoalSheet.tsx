import { FormEvent, useEffect, useState } from "react";
import Sheet from "./Sheet";
import { parseCalories } from "../lib/store";

interface Props {
  open: boolean;
  goal: number | null;
  onSave: (goal: number | null) => void;
  onClose: () => void;
}

export default function GoalSheet({ open, goal, onSave, onClose }: Props) {
  const [value, setValue] = useState("");
  const [error, setError] = useState(false);

  useEffect(() => {
    if (open) {
      setValue(goal !== null ? String(goal) : "");
      setError(false);
    }
  }, [open, goal]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const parsed = parseCalories(value);
    if (parsed === null) {
      setError(true);
      return;
    }
    onSave(parsed);
    onClose();
  };

  return (
    <Sheet open={open} title="Daily goal" onClose={onClose}>
      <p className="sheet-sub">
        A gentle target for the day. The ring fills as you log — nothing turns
        red, ever.
      </p>
      <form onSubmit={submit} noValidate>
        <div className={`field field-cal sheet-field${error ? " invalid" : ""}`}>
          <input
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              setError(false);
            }}
            inputMode="numeric"
            placeholder="2,200"
            aria-label="Daily calorie goal"
          />
          <span className="unit">cal</span>
        </div>
        {error && (
          <p className="add-error" role="alert">
            Enter a goal between 1 and 20,000 calories.
          </p>
        )}
        <div className="sheet-actions">
          <button type="submit" className="add-submit">
            Save goal
          </button>
          {goal !== null && (
            <button
              type="button"
              className="sheet-secondary"
              onClick={() => {
                onSave(null);
                onClose();
              }}
            >
              Remove goal
            </button>
          )}
        </div>
      </form>
    </Sheet>
  );
}
