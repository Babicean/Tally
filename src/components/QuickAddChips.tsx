import type { FrequentItem } from "../lib/store";
import UtensilsIcon from "./UtensilsIcon";
import { formatEnergy, type EnergyUnit } from "../lib/units";

interface Props {
  items: FrequentItem[];
  unit: EnergyUnit;
  /** Whether the Menu has anything worth browsing. */
  menuAvailable: boolean;
  /** Ghost weigh-in chip: on until today has a weigh-in. */
  showWeightChip: boolean;
  onLogWeight: () => void;
  onBrowseMenu: () => void;
  onAdd: (item: FrequentItem, sourceEl: HTMLElement) => void;
}

/**
 * One-tap pills for the user's habitual entries, led by a Menu chip that
 * opens the saved-staples picker. Habit chips appear only once the same
 * item has been logged at least twice, so day one stays uncluttered.
 */
export default function QuickAddChips({
  items,
  unit,
  menuAvailable,
  showWeightChip,
  onLogWeight,
  onBrowseMenu,
  onAdd,
}: Props) {
  if (items.length === 0 && !menuAvailable && !showWeightChip) return null;
  // Plain buttons, no list roles: role="listitem" on a <button> would
  // replace its button semantics and screen readers would read the chips
  // as inert text.
  return (
    <div className="chips">
      {menuAvailable && (
        <button
          className="chip chip-menu"
          onClick={onBrowseMenu}
          aria-label="Add from Menu"
        >
          <UtensilsIcon size={14} />
          Menu
        </button>
      )}
      {items.map((item) => (
        <button
          key={`${item.description}|${item.calories}`}
          className="chip"
          onClick={(e) => onAdd(item, e.currentTarget)}
        >
          <span className="chip-plus" aria-hidden="true">
            +
          </span>
          <span className="chip-label">{item.description}</span>
          <span className="chip-cal">{formatEnergy(item.calories, unit)}</span>
        </button>
      ))}
      {showWeightChip && (
        <button className="chip chip-ghost" onClick={onLogWeight}>
          log weight
        </button>
      )}
    </div>
  );
}
