import { FormEvent, useEffect, useState } from "react";
import Sheet from "./Sheet";
import {
  energyUnitLabel,
  parseEnergy,
  toDisplayEnergy,
  type EnergyUnit,
} from "../lib/units";

interface Props {
  open: boolean;
  goal: number | null;
  unit: EnergyUnit;
  onSave: (goal: number | null) => void;
  onClose: () => void;
}

export default function GoalSheet({ open, goal, unit, onSave, onClose }: Props) {
  const [value, setValue] = useState("");
  const [error, setError] = useState(false);

  useEffect(() => {
    if (open) {
      setValue(goal !== null ? String(toDisplayEnergy(goal, unit)) : "");
      setError(false);
    }
  }, [open, goal, unit]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const parsed = parseEnergy(value, unit);
    if (parsed === null) {
      setError(true);
      return;
    }
    onSave(parsed);
    onClose();
  };

  return (
    <Sheet
      open={open}
      title={unit === "kj" ? "Kilojoule target" : "Calorie target"}
      onClose={onClose}
    >
      <p className="sheet-sub">
        A daily target. The ring fills as you log. Information, never
        judgement.
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
            placeholder={unit === "kj" ? "8,700" : "2,000"}
            aria-label={unit === "kj" ? "Daily kilojoule goal" : "Daily calorie goal"}
          />
          <span className="unit">{energyUnitLabel(unit)}</span>
        </div>
        {error && (
          <p className="add-error" role="alert">
            {unit === "kj"
              ? "Enter a target between 1 and 83,680 kilojoules."
              : "Enter a target between 1 and 20,000 calories."}
          </p>
        )}
        <div className="sheet-actions">
          <button type="submit" className="add-submit">
            Update target
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
              Remove target
            </button>
          )}
        </div>
      </form>
    </Sheet>
  );
}
