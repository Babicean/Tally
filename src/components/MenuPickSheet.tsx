import type { MenuItem } from "../types";
import Sheet from "./Sheet";
import {
  energyNoun,
  energyUnitLabel,
  formatEnergy,
  toDisplayEnergy,
  type EnergyUnit,
} from "../lib/units";
import CategoryIcon, { CategoryId } from "./CategoryIcon";

interface Props {
  open: boolean;
  menu: MenuItem[];
  trackProtein: boolean;
  unit: EnergyUnit;
  onPick: (item: MenuItem, sourceEl: HTMLElement) => void;
  onClose: () => void;
}

/**
 * Quick picker over the saved Menu, opened from the Today screen's chip
 * row. Same rows as the Menu tab, but every tap logs to today — editing
 * and pinning stay on the Menu tab.
 */
export default function MenuPickSheet({
  open,
  menu,
  trackProtein,
  unit,
  onPick,
  onClose,
}: Props) {
  return (
    <Sheet open={open} title="From the Menu" onClose={onClose}>
      <p className="sheet-sub">One tap logs it to today.</p>
      {/* Plain buttons: list roles on <button> would erase their button
          semantics for screen readers. */}
      <div className="pick-list">
        {menu.map((item) => (
          <button
            key={item.id}
            className="pick-row"
            onClick={(e) => onPick(item, e.currentTarget)}
            aria-label={`Log ${item.name} (${toDisplayEnergy(item.calories, unit)} ${energyNoun(unit)})`}
          >
            <span className="menu-tile" aria-hidden="true">
              <CategoryIcon id={item.category as CategoryId | null} />
            </span>
            <span className="menu-text">
              <span className="menu-name">{item.name}</span>
              <span className="menu-detail">
                {formatEnergy(item.calories, unit)} {energyUnitLabel(unit)}
                {trackProtein &&
                  item.protein != null &&
                  ` · ${item.protein} g protein`}
                {trackProtein &&
                  item.fat != null &&
                  ` · ${item.fat} g fat`}
              </span>
            </span>
            <span className="menu-log" aria-hidden="true">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path
                  d="M8 3v10M3 8h10"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </span>
          </button>
        ))}
      </div>
    </Sheet>
  );
}
