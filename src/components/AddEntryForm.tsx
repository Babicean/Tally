import { FormEvent, useRef, useState } from "react";
import { MAX_CALORIES, parseCalories } from "../lib/store";
import { parseProtein } from "../lib/menu";
import { formatCalories } from "../lib/format";

interface Props {
  /** Shows the optional protein/fat fields behind a quiet toggle. */
  trackProtein: boolean;
  onAdd: (
    calories: number,
    description: string,
    sourceEl: HTMLElement,
    protein: number | null,
    fat: number | null,
  ) => void;
}

export default function AddEntryForm({ trackProtein, onAdd }: Props) {
  const [calories, setCalories] = useState("");
  const [description, setDescription] = useState("");
  const [protein, setProtein] = useState("");
  const [fat, setFat] = useState("");
  // Once opened it stays open for the session — someone logging macros
  // once will usually want them on the next entry too.
  const [macrosOpen, setMacrosOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Which fields the error is about; the .invalid class also plays the
  // shake once when it lands.
  const [bad, setBad] = useState<{
    cal?: boolean;
    protein?: boolean;
    fat?: boolean;
  }>({});
  const calRef = useRef<HTMLInputElement>(null);
  const submitRef = useRef<HTMLButtonElement>(null);

  const showMacros = trackProtein && macrosOpen;

  const clearError = () => {
    setError(null);
    setBad({});
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const parsed = parseCalories(calories);
    const parsedProtein = showMacros ? parseProtein(protein) : null;
    const parsedFat = showMacros ? parseProtein(fat) : null;
    if (parsed === null || parsedProtein === undefined || parsedFat === undefined) {
      setBad({
        cal: parsed === null,
        protein: parsedProtein === undefined,
        fat: parsedFat === undefined,
      });
      setError(
        parsed === null
          ? calories.trim() === ""
            ? "Enter how many calories to add."
            : `Calories must be a positive number up to ${formatCalories(MAX_CALORIES)}.`
          : parsedProtein === undefined
            ? "Protein must be a number of grams up to 1,000, or blank."
            : "Fat must be a number of grams up to 1,000, or blank.",
      );
      if (parsed === null) calRef.current?.focus();
      return;
    }
    onAdd(parsed, description, submitRef.current ?? calRef.current!, parsedProtein, parsedFat);
    setCalories("");
    setDescription("");
    setProtein("");
    setFat("");
    clearError();
    calRef.current?.focus();
  };

  return (
    <form className="card add-card" onSubmit={submit} noValidate>
      <div className="add-fields">
        <div className={`field field-cal${bad.cal ? " invalid" : ""}`}>
          <input
            ref={calRef}
            value={calories}
            onChange={(e) => {
              setCalories(e.target.value);
              if (error) clearError();
            }}
            inputMode="numeric"
            enterKeyHint="done"
            placeholder="500"
            aria-label="Calories"
            aria-invalid={bad.cal === true}
          />
          <span className="unit">cal</span>
        </div>
        <div className="field">
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={80}
            enterKeyHint="done"
            placeholder="Chicken wrap"
            aria-label="Description"
          />
        </div>
        <button
          ref={submitRef}
          type="submit"
          className="add-submit"
          aria-label="Add entry"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path
              d="M9 3.5v11M3.5 9h11"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>
      {trackProtein && !macrosOpen && (
        <button
          type="button"
          className="add-macros-toggle"
          onClick={() => setMacrosOpen(true)}
        >
          + macros
        </button>
      )}
      {showMacros && (
        <div className="add-macros">
          <div className={`field field-cal field-protein${bad.protein ? " invalid" : ""}`}>
            <input
              value={protein}
              onChange={(e) => {
                setProtein(e.target.value);
                if (error) clearError();
              }}
              inputMode="numeric"
              enterKeyHint="done"
              aria-label="Protein in grams (optional)"
            />
            <span className="unit">g protein</span>
          </div>
          <div className={`field field-cal field-protein${bad.fat ? " invalid" : ""}`}>
            <input
              value={fat}
              onChange={(e) => {
                setFat(e.target.value);
                if (error) clearError();
              }}
              inputMode="numeric"
              enterKeyHint="done"
              aria-label="Fat in grams (optional)"
            />
            <span className="unit">g fat</span>
          </div>
        </div>
      )}
      {error && (
        <p className="add-error" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}
