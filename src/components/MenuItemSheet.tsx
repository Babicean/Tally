import { FormEvent, useEffect, useState } from "react";
import type { MenuItem } from "../types";
import Sheet from "./Sheet";
import { parseProtein } from "../lib/menu";
import {
  energyUnitLabel,
  parseEnergy,
  toDisplayEnergy,
  type EnergyUnit,
} from "../lib/units";
import CategoryIcon, { CATEGORIES } from "./CategoryIcon";
import {
  MICROS,
  hasMicros,
  parseMg,
  type MicroId,
  type Micros,
} from "../lib/micros";

interface Props {
  open: boolean;
  trackProtein: boolean;
  /** Shows the electrolyte fields behind a quiet reveal. */
  trackMicros: boolean;
  unit: EnergyUnit;
  /** Item being edited, or null when adding a new one. */
  item: MenuItem | null;
  onSave: (
    name: string,
    calories: number,
    protein: number | null,
    fat: number | null,
    category: string | null,
    /** Electrolytes in mg, or null to clear. */
    micros: Micros | null,
  ) => void;
  onDelete?: () => void;
  onClose: () => void;
}

export default function MenuItemSheet({
  open,
  trackProtein,
  trackMicros,
  unit,
  item,
  onSave,
  onDelete,
  onClose,
}: Props) {
  const [name, setName] = useState("");
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [fat, setFat] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const emptyMicro = (): Record<MicroId, string> => ({
    sodium: "",
    potassium: "",
    magnesium: "",
    calcium: "",
  });
  const [micro, setMicro] = useState<Record<MicroId, string>>(emptyMicro);
  // Opens itself when the item already carries electrolytes.
  const [microsOpen, setMicrosOpen] = useState(false);
  const [bad, setBad] = useState<MicroId | null>(null);

  useEffect(() => {
    if (open) {
      setName(item?.name ?? "");
      setCalories(item ? String(toDisplayEnergy(item.calories, unit)) : "");
      setProtein(item?.protein != null ? String(item.protein) : "");
      setFat(item?.fat != null ? String(item.fat) : "");
      setCategory(item?.category ?? null);
      const m = emptyMicro();
      for (const meta of MICROS) {
        const v = item?.micros?.[meta.id];
        if (typeof v === "number") m[meta.id] = String(v);
      }
      setMicro(m);
      setMicrosOpen(hasMicros(item?.micros));
      setBad(null);
      setError(null);
    }
  }, [open, item, unit]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Give the item a name.");
      return;
    }
    const cal = parseEnergy(calories, unit);
    if (cal === null) {
      setError(
        unit === "kj"
          ? "Kilojoules must be a positive number up to 83,680."
          : "Calories must be a positive number up to 20,000.",
      );
      return;
    }
    const prot = trackProtein ? parseProtein(protein) : item?.protein ?? null;
    const fatG = trackProtein ? parseProtein(fat) : item?.fat ?? null;
    if (prot === undefined || fatG === undefined) {
      setError("Grams must be between 0 and 1,000 (or left blank).");
      return;
    }
    const micros: Micros = {};
    if (trackMicros && microsOpen) {
      for (const meta of MICROS) {
        const parsed = parseMg(micro[meta.id]);
        if (parsed === undefined) {
          setBad(meta.id);
          setError(
            `${meta.label[0].toUpperCase()}${meta.label.slice(1)} must be a number of milligrams, or blank.`,
          );
          return;
        }
        if (parsed !== null) micros[meta.id] = parsed;
      }
    } else if (item?.micros) {
      // Tracking off or the reveal closed: keep what the item already had.
      Object.assign(micros, item.micros);
    }
    onSave(trimmed, cal, prot, fatG, category, hasMicros(micros) ? micros : null);
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
          ? "Tweak the details. Logged entries keep their values."
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
              placeholder={unit === "kj" ? "2,280" : "545"}
              aria-label={unit === "kj" ? "Kilojoules" : "Calories"}
            />
            <span className="unit">{energyUnitLabel(unit)}</span>
          </div>
          {trackProtein && (
          <div className="field field-cal field-protein">
            <input
              value={protein}
              onChange={(e) => {
                setProtein(e.target.value);
                setError(null);
              }}
              inputMode="numeric"
              aria-label="Protein in grams (optional)"
            />
            <span className="unit">g protein</span>
          </div>
          )}
          {trackProtein && (
          <div className="field field-cal field-protein">
            <input
              value={fat}
              onChange={(e) => {
                setFat(e.target.value);
                setError(null);
              }}
              inputMode="numeric"
              aria-label="Fat in grams (optional)"
            />
            <span className="unit">g fat</span>
          </div>
          )}
        </div>
        {trackMicros && !microsOpen && (
          <button
            type="button"
            className="add-macros-toggle"
            onClick={() => setMicrosOpen(true)}
          >
            + electrolytes
          </button>
        )}
        {trackMicros && microsOpen && (
          <div className="add-micros">
            {MICROS.map((m) => (
              <div
                key={m.id}
                className={`field field-cal field-protein${bad === m.id ? " invalid" : ""}`}
              >
                <input
                  value={micro[m.id]}
                  onChange={(e) => {
                    setMicro((prev) => ({ ...prev, [m.id]: e.target.value }));
                    setError(null);
                    setBad(null);
                  }}
                  inputMode="numeric"
                  aria-label={`${m.label[0].toUpperCase()}${m.label.slice(1)} in milligrams (optional)`}
                />
                <span className="unit">mg {m.label}</span>
              </div>
            ))}
          </div>
        )}
        <div
          className="cat-grid"
          role="radiogroup"
          aria-label="Category (optional)"
        >
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              type="button"
              role="radio"
              aria-checked={category === c.id}
              className={`cat-option${category === c.id ? " selected" : ""}`}
              onClick={() =>
                setCategory((prev) => (prev === c.id ? null : c.id))
              }
            >
              <CategoryIcon id={c.id} />
              <span>{c.label}</span>
            </button>
          ))}
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
