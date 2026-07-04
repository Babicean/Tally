import { useCallback, useState } from "react";
import type { DayKey, Entry } from "../types";
import type { FrequentItem } from "../lib/store";
import { formatCalories } from "../lib/format";
import { flyCalories, haptic } from "../lib/fly";
import { celebrate } from "../lib/burst";
import type { Streak } from "../lib/streak";
import { useToast } from "../hooks/useToast";
import Hero from "./Hero";
import AddEntryForm from "./AddEntryForm";
import QuickAddChips from "./QuickAddChips";
import EntryList from "./EntryList";
import EditEntrySheet from "./EditEntrySheet";
import GoalSheet from "./GoalSheet";
import Toast from "./Toast";

interface Props {
  today: DayKey;
  total: number;
  protein: number;
  streak: Streak;
  entries: Entry[];
  quickAdds: FrequentItem[];
  dailyGoal: number | null;
  onSetGoal: (goal: number | null) => void;
  onAdd: (
    calories: number,
    description: string,
    protein?: number | null,
  ) => Entry;
  onUpdate: (
    id: string,
    calories: number,
    description: string,
    protein?: number | null,
  ) => void;
  onDelete: (id: string) => Entry | null;
  onRestore: (entry: Entry) => void;
}

export default function TodayScreen({
  today,
  total,
  protein,
  streak,
  entries,
  quickAdds,
  dailyGoal,
  onSetGoal,
  onAdd,
  onUpdate,
  onDelete,
  onRestore,
}: Props) {
  const { toast, showToast, showConfirmation, dismiss } = useToast();
  const [goalOpen, setGoalOpen] = useState(false);
  const [editing, setEditing] = useState<Entry | null>(null);

  const handleAdd = useCallback(
    (
      calories: number,
      description: string,
      sourceEl: HTMLElement,
      itemProtein: number | null = null,
    ) => {
      const extendsStreak = !streak.loggedToday && streak.length + 1 >= 2;
      onAdd(calories, description, itemProtein);
      flyCalories(`+${formatCalories(calories)}`, sourceEl);
      if (extendsStreak) {
        // First log of the day and the chain holds — small fireworks.
        const day = streak.length + 1;
        window.setTimeout(() => {
          celebrate(document.getElementById("hero-total"));
          haptic(24);
          showToast({ kind: "streak", message: `${day}-day streak` }, 2600);
        }, 350);
        haptic(10);
      } else {
        haptic(10);
        showConfirmation();
      }
    },
    [onAdd, streak, showToast, showConfirmation],
  );

  const handleDelete = useCallback(
    (id: string) => {
      const deleted = onDelete(id);
      haptic(8);
      if (deleted) {
        showToast(
          {
            kind: "undo",
            message: "Entry deleted",
            action: {
              label: "Undo",
              onPress: () => {
                onRestore(deleted);
                haptic(10);
                dismiss();
              },
            },
          },
          5000,
        );
      }
    },
    [onDelete, onRestore, showToast, dismiss],
  );

  return (
    <div className="screen">
      <Hero
        today={today}
        total={total}
        protein={protein}
        streak={streak}
        goal={dailyGoal}
        onEditGoal={() => setGoalOpen(true)}
      />

      <QuickAddChips
        items={quickAdds}
        onAdd={(item, el) =>
          handleAdd(item.calories, item.description, el, item.protein ?? null)
        }
      />

      <AddEntryForm onAdd={(cal, desc, el) => handleAdd(cal, desc, el)} />

      <h2 className="section-label">
        Today’s entries
        {entries.length > 0 && <span className="count">{entries.length}</span>}
      </h2>
      <EntryList
        entries={entries}
        onDelete={handleDelete}
        onEdit={setEditing}
      />

      <GoalSheet
        open={goalOpen}
        goal={dailyGoal}
        onSave={onSetGoal}
        onClose={() => setGoalOpen(false)}
      />
      <EditEntrySheet
        entry={editing}
        onSave={onUpdate}
        onClose={() => setEditing(null)}
      />
      <Toast toast={toast} />
    </div>
  );
}
