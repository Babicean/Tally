import { FormEvent, useEffect, useState } from "react";
import type { DayKey } from "../types";
import Sheet from "./Sheet";
import { parseProtein } from "../lib/menu";
import {
  energyUnitLabel,
  parseEnergy,
  type EnergyUnit,
} from "../lib/units";
import { fromDayKey } from "../lib/day";
import { formatDayLabel } from "../lib/format";

interface Props {
  /** The tracking day being amended, or null when closed. */
  day: DayKey | null;
  trackProtein: boolean;
  unit: EnergyUnit;
  onAdd: (
    calories: number,
    description: string,
    protein: number | null,
    fat: number | null,
    when: Date,
  ) => void;
  onClose: () => void;
}

/** Add a forgotten entry to a past day (logged at noon of that day). */
export default function BackdateSheet({
  day,
  trackProtein,
  unit,
  onAdd,
  onClose,
}: Props) {
  const [calories, setCalories] = useState("");
  const [description, setDescription] = useState("");
  const [protein, setProtein] = useState("");
  const [fat, setFat] = useState("");
  const [error, setError] = useState<string | null>(null);
  // Which fields the error is about, so the outline lands on the actual
  // mistake instead of always blaming calories.
  const [bad, setBad] = useState<{
    cal?: boolean;
    protein?: boolean;
    fat?: boolean;
  }>({});

  useEffect(() => {
    if (day) {
      setCalories("");
      setDescription("");
      setProtein("");
      setFat("");
      setError(null);
      setBad({});
    }
  }, [day]);

  const clearError = () => {
    setError(null);
    setBad({});
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!day) return;
    const cal = parseEnergy(calories, unit);
    const prot = trackProtein ? parseProtein(protein) : null;
    const fatG = trackProtein ? parseProtein(fat) : null;
    if (cal === null || prot === undefined || fatG === undefined) {
      setBad({
        cal: cal === null,
        protein: prot === undefined,
        fat: fatG === undefined,
      });
      setError(
        cal === null
          ? unit === "kj"
            ? "Kilojoules must be a positive number up to 83,680."
            : "Calories must be a positive number up to 20,000."
          : prot === undefined
            ? "Protein must be a number of grams up to 1,000, or blank."
            : "Fat must be a number of grams up to 1,000, or blank.",
      );
      return;
    }
    // Noon keeps the entry safely inside the day's 2 AM–2 AM window.
    const when = fromDayKey(day);
    when.setHours(12, 0, 0, 0);
    onAdd(cal, description, prot, fatG, when);
    onClose();
  };

  return (
    <Sheet
      open={day !== null}
      title={day ? `Add to ${formatDayLabel(day)}` : "Add entry"}
      onClose={onClose}
    >
      <p className="sheet-sub">
        For the things you forgot to log. It counts toward this day's total
        and keeps your streak honest.
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
              placeholder={unit === "kj" ? "2,000" : "500"}
              aria-label={unit === "kj" ? "Kilojoules" : "Calories"}
            />
            <span className="unit">{energyUnitLabel(unit)}</span>
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
        {error && (
          <p className="add-error" role="alert">
            {error}
          </p>
        )}
        <div className="sheet-actions">
          <button type="submit" className="add-submit">
            Add entry
          </button>
        </div>
      </form>
    </Sheet>
  );
}
