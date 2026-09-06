import { useCallback, useState } from "react";
import type { DayKey, Entry, MenuItem } from "../types";
import type { FrequentItem } from "../lib/store";
import { formatEnergy, type EnergyUnit } from "../lib/units";
import type { MicroTargets, Micros } from "../lib/micros";
import { flyCalories, haptic } from "../lib/fly";
import { celebrate, emberBurst } from "../lib/burst";
import type { Streak } from "../lib/streak";
import { useToast } from "../hooks/useToast";
import Hero from "./Hero";
import AddEntryForm from "./AddEntryForm";
import QuickAddChips from "./QuickAddChips";
import MenuPickSheet from "./MenuPickSheet";
import EntryList from "./EntryList";
import EditEntrySheet from "./EditEntrySheet";
import GoalSheet from "./GoalSheet";
import WeightSheet from "./WeightSheet";
import Toast from "./Toast";

interface Props {
  today: DayKey;
  total: number;
  protein: number;
  fat: number;
  /** Derived carbs for today, or null when nothing is derivable. */
  carbs: number | null;
  trackProtein: boolean;
  proteinTarget: number | null;
  fatTarget: number | null;
  streak: Streak;
  steps: number | null;
  entries: Entry[];
  quickAdds: FrequentItem[];
  menu: MenuItem[];
  dailyGoal: number | null;
  /** False until the goal sheet is first opened; drives the pill hint. */
  onGoalSeen: () => void;
  onSetGoal: (goal: number | null) => void;
  onAdd: (
    calories: number,
    description: string,
    protein?: number | null,
    fat?: number | null,
    when?: Date,
    micros?: Micros | null,
  ) => Entry;
  onUpdate: (
    id: string,
    calories: number,
    description: string,
    protein?: number | null,
    fat?: number | null,
    timestamp?: number,
    micros?: Micros | null,
  ) => void;
  onDelete: (id: string) => Entry | null;
  onRestore: (entry: Entry) => void;
  /** Weigh-in chip: shown until today has one, gone once it does. */
  trackWeight: boolean;
  todayWeight: number | null;
  lastWeight: number | null;
  onLogWeight: (kg: number) => void;
  onRemoveWeight: () => void;
  unit: EnergyUnit;
  /** Play the hero teach-flip once (kcal peeks at kJ, flips back). */
  unitHint: boolean;
  onToggleUnit: () => void;
  onUnitHintDone: () => void;
  /** Electrolytes: today's totals and targets for the hero's second page. */
  trackMicros: boolean;
  micros: Micros;
  microTargets: MicroTargets;
}

export default function TodayScreen({
  today,
  total,
  protein,
  fat,
  carbs,
  trackProtein,
  proteinTarget,
  fatTarget,
  streak,
  steps,
  entries,
  quickAdds,
  menu,
  dailyGoal,
  onGoalSeen,
  onSetGoal,
  onAdd,
  onUpdate,
  onDelete,
  onRestore,
  trackWeight,
  todayWeight,
  lastWeight,
  onLogWeight,
  onRemoveWeight,
  unit,
  unitHint,
  onToggleUnit,
  onUnitHintDone,
  trackMicros,
  micros,
  microTargets,
}: Props) {
  const { toast, showToast, showConfirmation, dismiss, hold, release } =
    useToast();
  const [goalOpen, setGoalOpen] = useState(false);
  const [menuPickOpen, setMenuPickOpen] = useState(false);
  const [weightOpen, setWeightOpen] = useState(false);
  const [editing, setEditing] = useState<Entry | null>(null);

  const handleAdd = useCallback(
    (
      calories: number,
      description: string,
      sourceEl: HTMLElement,
      itemProtein: number | null = null,
      itemFat: number | null = null,
      itemMicros: Micros | null = null,
    ) => {
      const extendsStreak = !streak.loggedToday && streak.length + 1 >= 2;
      const crossesTarget =
        dailyGoal !== null && total < dailyGoal && total + calories >= dailyGoal;
      const crossesProtein =
        trackProtein &&
        proteinTarget !== null &&
        itemProtein !== null &&
        protein < proteinTarget &&
        protein + itemProtein >= proteinTarget;
      onAdd(calories, description, itemProtein, itemFat, undefined, itemMicros);
      flyCalories(`+${formatEnergy(calories, unit)}`, sourceEl);
      if (extendsStreak) {
        // First log of the day and the chain holds — small fireworks.
        const day = streak.length + 1;
        window.setTimeout(() => {
          celebrate(document.getElementById("hero-total"));
          haptic(24);
          showToast({ kind: "streak", message: `${day} day streak` }, 2600);
        }, 350);
        haptic(10);
      } else if (crossesTarget) {
        // Hitting the day's target earns the small fireworks too.
        window.setTimeout(() => {
          celebrate(document.getElementById("hero-total"));
          haptic(24);
          showToast({ kind: "streak", message: "Target reached" }, 2600);
        }, 350);
        haptic(10);
      } else if (crossesProtein) {
        // Protein goal met: little fires rise off the protein line.
        window.setTimeout(() => {
          emberBurst(document.getElementById("protein-line"));
          haptic(20);
          showToast({ kind: "streak", message: "Protein target hit" }, 2600);
        }, 350);
        haptic(10);
      } else {
        haptic(10);
        showConfirmation();
      }
    },
    [onAdd, streak, total, dailyGoal, trackProtein, proteinTarget, protein, unit, showToast, showConfirmation],
  );

  const handleDelete = useCallback(
    (id: string, decremented = false) => {
      const deleted = onDelete(id);
      haptic(8);
      if (deleted) {
        showToast(
          {
            kind: "undo",
            // A ×N row losing one instance stays on screen — "deleted"
            // would overclaim.
            message: decremented ? "Removed one" : "Entry deleted",
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
        fat={fat}
        carbs={carbs}
        trackProtein={trackProtein}
        proteinTarget={proteinTarget}
        fatTarget={fatTarget}
        streak={streak}
        steps={steps}
        goal={dailyGoal}
        unit={unit}
        unitHint={unitHint}
        onToggleUnit={onToggleUnit}
        onUnitHintDone={onUnitHintDone}
        trackMicros={trackMicros}
        micros={micros}
        microTargets={microTargets}
        onEditGoal={() => {
          onGoalSeen();
          setGoalOpen(true);
        }}
      />

      <QuickAddChips
        items={quickAdds}
        unit={unit}
        menuAvailable={menu.length > 0}
        showWeightChip={trackWeight && todayWeight === null}
        onLogWeight={() => setWeightOpen(true)}
        onBrowseMenu={() => setMenuPickOpen(true)}
        onAdd={(item, el) =>
          handleAdd(
            item.calories,
            item.description,
            el,
            item.protein ?? null,
            item.fat ?? null,
            item.micros ?? null,
          )
        }
      />

      <AddEntryForm
        trackProtein={trackProtein}
        unit={unit}
        onAdd={(cal, desc, el, p, f) => handleAdd(cal, desc, el, p, f)}
      />

      <h2 className="section-label">
        Today’s entries
        {entries.length > 0 && <span className="count">{entries.length}</span>}
      </h2>
      <EntryList
        entries={entries}
        trackProtein={trackProtein}
        unit={unit}
        onDelete={handleDelete}
        onEdit={setEditing}
        onRepeat={(entry, el) =>
          handleAdd(
            entry.calories,
            entry.description,
            el,
            entry.protein ?? null,
            entry.fat ?? null,
            entry.micros ?? null,
          )
        }
      />

      <MenuPickSheet
        open={menuPickOpen}
        menu={menu}
        trackProtein={trackProtein}
        unit={unit}
        onPick={(item, el) => {
          handleAdd(
            item.calories,
            item.name,
            el,
            item.protein ?? null,
            item.fat ?? null,
            item.micros ?? null,
          );
          setMenuPickOpen(false);
        }}
        onClose={() => setMenuPickOpen(false)}
      />
      <GoalSheet
        open={goalOpen}
        goal={dailyGoal}
        unit={unit}
        onSave={onSetGoal}
        onClose={() => setGoalOpen(false)}
      />
      <WeightSheet
        open={weightOpen}
        today={todayWeight}
        last={lastWeight}
        onSave={(kg) => {
          onLogWeight(kg);
          haptic(10);
        }}
        onRemove={onRemoveWeight}
        onClose={() => setWeightOpen(false)}
      />
      <EditEntrySheet
        entry={editing}
        trackProtein={trackProtein}
        trackMicros={trackMicros}
        unit={unit}
        onSave={onUpdate}
        onClose={() => setEditing(null)}
      />
      <Toast toast={toast} onHold={hold} onRelease={release} />
    </div>
  );
}
