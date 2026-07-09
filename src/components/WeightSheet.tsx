import { FormEvent, useEffect, useState } from "react";
import Sheet from "./Sheet";
import { parseKg } from "../lib/weight";

interface Props {
  open: boolean;
  /** Today's logged weight, or null. */
  today: number | null;
  /** Prefill when nothing logged today: the last known weight. */
  last: number | null;
  onSave: (kg: number) => void;
  onRemove: () => void;
  onClose: () => void;
}

/** One field, one number a day. Information, never judgement. */
export default function WeightSheet({
  open,
  today,
  last,
  onSave,
  onRemove,
  onClose,
}: Props) {
  const [value, setValue] = useState("");
  const [error, setError] = useState(false);

  useEffect(() => {
    if (open) {
      setValue(today !== null ? String(today) : last !== null ? String(last) : "");
      setError(false);
    }
  }, [open, today, last]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const kg = parseKg(value);
    if (kg === undefined) {
      setError(true);
      return;
    }
    onSave(kg);
    onClose();
  };

  return (
    <Sheet open={open} title="Weight" onClose={onClose}>
      <p className="sheet-sub">Today's weigh-in. One number, once a day.</p>
      <form onSubmit={submit} noValidate>
        <div className={`field field-cal sheet-field${error ? " invalid" : ""}`}>
          <input
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              setError(false);
            }}
            inputMode="decimal"
            placeholder="72.5"
            aria-label="Weight in kilograms"
          />
          <span className="unit">kg</span>
        </div>
        {error && (
          <p className="add-error" role="alert">
            Enter a weight in kilograms, like 72.5.
          </p>
        )}
        <div className="sheet-actions">
          <button type="submit" className="add-submit">
            {today !== null ? "Update weight" : "Log weight"}
          </button>
          {today !== null && (
            <button
              type="button"
              className="sheet-secondary"
              onClick={() => {
                onRemove();
                onClose();
              }}
            >
              Remove today's weight
            </button>
          )}
        </div>
      </form>
    </Sheet>
  );
}
