import { FormEvent, useEffect, useMemo, useState } from "react";
import type { MenuItem } from "../types";
import { formatCalories } from "../lib/format";
import Sheet from "./Sheet";

interface Props {
  open: boolean;
  /** The meal being edited, or null when creating. */
  meal: MenuItem | null;
  /** Foods available as components (meals can't contain meals). */
  foods: MenuItem[];
  trackProtein: boolean;
  onSave: (name: string, componentIds: string[]) => void;
  onDelete?: () => void;
  onClose: () => void;
}

/**
 * A Meal bundles menu foods into one loggable row — "Usual breakfast"
 * becomes one tap. Pick from what's already saved; the totals write
 * themselves.
 */
export default function MealSheet({
  open,
  meal,
  foods,
  trackProtein,
  onSave,
  onDelete,
  onClose,
}: Props) {
  const [name, setName] = useState("");
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (open) {
      setName(meal?.name ?? "");
      setPicked(new Set(meal?.componentIds ?? []));
      setError(null);
      setConfirmDelete(false);
    }
  }, [open, meal]);

  const totals = useMemo(() => {
    let cal = 0;
    let protein = 0;
    let fat = 0;
    for (const f of foods) {
      if (!picked.has(f.id)) continue;
      cal += f.calories;
      protein += f.protein ?? 0;
      fat += f.fat ?? 0;
    }
    return { cal, protein, fat };
  }, [foods, picked]);

  const toggle = (id: string) => {
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    setError(null);
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Name the meal.");
      return;
    }
    if (picked.size === 0) {
      setError("Pick at least one item.");
      return;
    }
    onSave(name.trim(), [...picked]);
    onClose();
  };

  return (
    <Sheet open={open} title={meal ? "Edit meal" : "New meal"} onClose={onClose}>
      <p className="sheet-sub">
        Bundle your regulars into one tap. Logging a meal adds one entry
        with the total.
      </p>
      <form onSubmit={submit} noValidate>
        <div className="field sheet-name">
          <input
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError(null);
            }}
            maxLength={60}
            placeholder="Usual breakfast"
            aria-label="Meal name"
          />
        </div>
        {foods.length === 0 ? (
          <p className="acct-note">
            Save a few foods to the Menu first, then bundle them here.
          </p>
        ) : (
          <div className="meal-picker">
            {foods.map((f) => {
              const on = picked.has(f.id);
              return (
                <button
                  key={f.id}
                  type="button"
                  className={`meal-option${on ? " on" : ""}`}
                  onClick={() => toggle(f.id)}
                  aria-pressed={on}
                >
                  <span className={`meal-check${on ? " on" : ""}`} aria-hidden="true">
                    {on && (
                      <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                        <path
                          d="M2 6.4l2.7 2.7L10 3.6"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </span>
                  <span className="meal-option-name">{f.name}</span>
                  <span className="meal-option-cal">
                    {formatCalories(f.calories)} cal
                  </span>
                </button>
              );
            })}
          </div>
        )}
        {picked.size > 0 && (
          <p className="meal-total">
            {formatCalories(totals.cal)} cal
            {trackProtein && totals.protein > 0 && ` · ${totals.protein} g protein`}
            {trackProtein && totals.fat > 0 && ` · ${totals.fat} g fat`}
          </p>
        )}
        {error && (
          <p className="add-error" role="alert">
            {error}
          </p>
        )}
        <div className="sheet-actions">
          <button type="submit" className="add-submit">
            {meal ? "Save meal" : "Add meal"}
          </button>
          {meal && onDelete && (
            <button
              type="button"
              className="sheet-secondary"
              onClick={() => {
                if (!confirmDelete) {
                  setConfirmDelete(true);
                  return;
                }
                onDelete();
                onClose();
              }}
            >
              {confirmDelete ? "Tap again to delete" : "Delete meal"}
            </button>
          )}
        </div>
      </form>
    </Sheet>
  );
}
