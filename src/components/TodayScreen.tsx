import { useCallback, useRef, useState } from "react";
import type { DayKey, Entry } from "../types";
import type { FrequentItem } from "../lib/store";
import { formatCalories } from "../lib/format";
import { flyCalories, haptic } from "../lib/fly";
import Hero from "./Hero";
import AddEntryForm from "./AddEntryForm";
import QuickAddChips from "./QuickAddChips";
import EntryList from "./EntryList";
import EditEntrySheet from "./EditEntrySheet";
import GoalSheet from "./GoalSheet";
import Toast, { ToastData } from "./Toast";

interface Props {
  today: DayKey;
  total: number;
  entries: Entry[];
  quickAdds: FrequentItem[];
  dailyGoal: number | null;
  onSetGoal: (goal: number | null) => void;
  onAdd: (calories: number, description: string) => Entry;
  onUpdate: (id: string, calories: number, description: string) => void;
  onDelete: (id: string) => Entry | null;
  onRestore: (entry: Entry) => void;
}

// Rotating confirmation copy — short, warm, never a lecture.
const CONFIRMATIONS = ["Logged", "Counted", "On the tally", "Noted"];

export default function TodayScreen({
  today,
  total,
  entries,
  quickAdds,
  dailyGoal,
  onSetGoal,
  onAdd,
  onUpdate,
  onDelete,
  onRestore,
}: Props) {
  const [toast, setToast] = useState<ToastData | null>(null);
  const [goalOpen, setGoalOpen] = useState(false);
  const [editing, setEditing] = useState<Entry | null>(null);
  const toastTimer = useRef(0);
  const toastId = useRef(0);

  const showToast = useCallback(
    (data: Omit<ToastData, "id">, duration: number) => {
      window.clearTimeout(toastTimer.current);
      toastId.current += 1;
      setToast({ ...data, id: toastId.current });
      toastTimer.current = window.setTimeout(() => setToast(null), duration);
    },
    [],
  );

  const handleAdd = useCallback(
    (calories: number, description: string, sourceEl: HTMLElement) => {
      onAdd(calories, description);
      flyCalories(`+${formatCalories(calories)}`, sourceEl);
      haptic(10);
      showToast(
        {
          kind: "confirm",
          message:
            CONFIRMATIONS[Math.floor(Math.random() * CONFIRMATIONS.length)],
        },
        1600,
      );
    },
    [onAdd, showToast],
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
                setToast(null);
              },
            },
          },
          5000,
        );
      }
    },
    [onDelete, onRestore, showToast],
  );

  return (
    <div className="screen">
      <Hero
        today={today}
        total={total}
        goal={dailyGoal}
        onEditGoal={() => setGoalOpen(true)}
      />

      <QuickAddChips
        items={quickAdds}
        onAdd={(item, el) => handleAdd(item.calories, item.description, el)}
      />

      <AddEntryForm onAdd={handleAdd} />

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
