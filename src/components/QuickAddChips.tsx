import type { FrequentItem } from "../lib/store";
import { formatCalories } from "../lib/format";

interface Props {
  items: FrequentItem[];
  onAdd: (item: FrequentItem, sourceEl: HTMLElement) => void;
}

/**
 * One-tap pills for the user's habitual entries. Appears only once the same
 * item has been logged at least twice, so day one stays uncluttered.
 */
export default function QuickAddChips({ items, onAdd }: Props) {
  if (items.length === 0) return null;
  return (
    <div className="chips" role="list" aria-label="Quick add">
      {items.map((item) => (
        <button
          key={`${item.description}|${item.calories}`}
          role="listitem"
          className="chip"
          onClick={(e) => onAdd(item, e.currentTarget)}
        >
          <span className="chip-plus" aria-hidden="true">
            +
          </span>
          {item.description}
          <span className="chip-cal">{formatCalories(item.calories)}</span>
        </button>
      ))}
    </div>
  );
}
