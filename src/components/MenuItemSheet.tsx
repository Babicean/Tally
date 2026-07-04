import { FormEvent, useEffect, useState } from "react";
import type { MenuItem } from "../types";
import Sheet from "./Sheet";
import { parseCalories } from "../lib/store";
import { parseProtein } from "../lib/menu";

interface Props {
  open: boolean;
  /** Item being edited, or null when adding a new one. */
  item: MenuItem | null;
  onSave: (name: string, calories: number, protein: number | null) => void;
  onDelete?: () => void;
  onClose: () => void;
}

export default function MenuItemSheet({
  open,
  item,
  onSave,
  onDelete,
  onClose,
}: Props) {
  const [name, setName] = useState("");
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setName(item?.name ?? "");
      setCalories(item ? String(item.calories) : "");
      setProtein(item?.protein != null ? String(item.protein) : "");
      setError(null);
    }
  }, [open, item]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Give the item a name.");
      return;
    }
    const cal = parseCalories(calories);
    if (cal === null) {
      setError("Calories must be a positive number up to 20,000.");
      return;
    }
    const prot = parseProtein(protein);
    if (prot === undefined) {
      setError("Protein must be between 0 and 1,000 grams (or left blank).");
      return;
    }
    onSave(trimmed, cal, prot);
    onClose();
  };

  return (
    <Sheet
      open={open}
      title={item ? "Edit item" : "New menu item"}
      onClose={onClose}
    >
      <p className="sheet-sub">
        {item
          ? "Tweak the details — logged entries keep their values."
          : "Save a regular so it's one tap from now on."}
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
            placeholder="Mini Cali Burrito"
            aria-label="Item name"
          />
        </div>
        <div className="sheet-fields">
          <div className="field field-cal">
            <input
              value={calories}
              onChange={(e) => {
                setCalories(e.target.value);
                setError(null);
              }}
              inputMode="numeric"
              placeholder="545"
              aria-label="Calories"
            />
            <span className="unit">cal</span>
          </div>
          <div className="field field-cal field-protein">
            <input
              value={protein}
              onChange={(e) => {
                setProtein(e.target.value);
                setError(null);
              }}
              inputMode="numeric"
              placeholder="—"
              aria-label="Protein in grams (optional)"
            />
            <span className="unit">g protein</span>
          </div>
        </div>
        {error && (
          <p className="add-error" role="alert">
            {error}
          </p>
        )}
        <div className="sheet-actions">
          <button type="submit" className="add-submit">
            {item ? "Save changes" : "Add to menu"}
          </button>
          {item && onDelete && (
            <button
              type="button"
              className="sheet-secondary"
              onClick={() => {
                onDelete();
                onClose();
              }}
            >
              Remove from menu
            </button>
          )}
        </div>
      </form>
    </Sheet>
  );
}
