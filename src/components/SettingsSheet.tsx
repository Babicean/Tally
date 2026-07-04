import { useEffect, useState } from "react";
import Sheet from "./Sheet";
import type { ThemePref } from "../lib/theme";
import { parseProtein } from "../lib/menu";

interface Props {
  open: boolean;
  theme: ThemePref;
  onSetTheme: (theme: ThemePref) => void;
  trackProtein: boolean;
  onSetTrackProtein: (on: boolean) => void;
  proteinTarget: number | null;
  onSetProteinTarget: (grams: number | null) => void;
  onClose: () => void;
}

const THEME_OPTIONS: { id: ThemePref; label: string }[] = [
  { id: "system", label: "System" },
  { id: "light", label: "Light" },
  { id: "dark", label: "Dark" },
];

export default function SettingsSheet({
  open,
  theme,
  onSetTheme,
  trackProtein,
  onSetTrackProtein,
  proteinTarget,
  onSetProteinTarget,
  onClose,
}: Props) {
  const [target, setTarget] = useState("");

  useEffect(() => {
    if (open) setTarget(proteinTarget !== null ? String(proteinTarget) : "");
  }, [open, proteinTarget]);

  const commitTarget = () => {
    const parsed = parseProtein(target);
    if (parsed === undefined) {
      // Invalid input: fall back to what's stored.
      setTarget(proteinTarget !== null ? String(proteinTarget) : "");
      return;
    }
    onSetProteinTarget(parsed === 0 ? null : parsed);
  };

  return (
    <Sheet open={open} title="Settings" onClose={onClose}>
      <p className="settings-label">Appearance</p>
      <div className="seg" role="radiogroup" aria-label="Appearance">
        {THEME_OPTIONS.map((o) => (
          <button
            key={o.id}
            role="radio"
            aria-checked={theme === o.id}
            className={`seg-btn${theme === o.id ? " active" : ""}`}
            onClick={() => onSetTheme(o.id)}
          >
            {o.label}
          </button>
        ))}
      </div>

      <p className="settings-label">Protein</p>
      <div className="settings-row">
        <div className="settings-row-text">
          <span className="settings-row-title">Track protein</span>
          <span className="settings-row-sub">
            Adds optional grams to Menu items and entries.
          </span>
        </div>
        <button
          className={`switch${trackProtein ? " on" : ""}`}
          role="switch"
          aria-checked={trackProtein}
          aria-label="Track protein"
          onClick={() => onSetTrackProtein(!trackProtein)}
        >
          <span className="switch-knob" />
        </button>
      </div>
      {trackProtein && (
        <div className="settings-row">
          <div className="settings-row-text">
            <span className="settings-row-title">Daily protein target</span>
            <span className="settings-row-sub">Blank for no target.</span>
          </div>
          <div className="field field-cal settings-target">
            <input
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              onBlur={commitTarget}
              onKeyDown={(e) => {
                if (e.key === "Enter") (e.target as HTMLInputElement).blur();
              }}
              inputMode="numeric"
              aria-label="Daily protein target in grams"
            />
            <span className="unit">g</span>
          </div>
        </div>
      )}

      <p className="settings-foot">
        Tally v{__APP_VERSION__} · your data never leaves this device.
        <br />
        Back up or restore from the History tab.
      </p>
    </Sheet>
  );
}
