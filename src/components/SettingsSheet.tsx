import Sheet from "./Sheet";
import type { ThemePref } from "../lib/theme";

interface Props {
  open: boolean;
  theme: ThemePref;
  onSetTheme: (theme: ThemePref) => void;
  onClose: () => void;
}

const OPTIONS: { id: ThemePref; label: string }[] = [
  { id: "system", label: "System" },
  { id: "light", label: "Light" },
  { id: "dark", label: "Dark" },
];

export default function SettingsSheet({
  open,
  theme,
  onSetTheme,
  onClose,
}: Props) {
  return (
    <Sheet open={open} title="Settings" onClose={onClose}>
      <p className="settings-label">Appearance</p>
      <div className="seg" role="radiogroup" aria-label="Appearance">
        {OPTIONS.map((o) => (
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
      <p className="settings-foot">
        Tally · your data never leaves this device.
        <br />
        Back up or restore from the History tab.
      </p>
    </Sheet>
  );
}
