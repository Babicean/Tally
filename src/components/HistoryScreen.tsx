import { useMemo, useState } from "react";
import type { DayKey, DaySummary, Entry } from "../types";
import { addDays } from "../lib/day";
import { formatDayLabel, formatTime } from "../lib/format";
import {
  energyUnitLabel,
  formatEnergy,
  type EnergyUnit,
} from "../lib/units";
import { weeklyStats } from "../lib/stats";
import type { WeightEntry } from "../lib/weight";
import WeightCard from "./WeightCard";
import WeightSheet from "./WeightSheet";
import { TrendPoint } from "./TrendChart";
import InsightsCard from "./InsightsCard";
import BackdateSheet from "./BackdateSheet";
import Toast from "./Toast";
import { useToast } from "../hooks/useToast";

/** The most gap rows one hole in the log may add: backdating much past a
    week is guesswork, and a long-dormant install must not render a
    hundred empty rows. */
const MAX_GAP_ROWS = 7;

interface DayItem {
  day: DayKey;
  /** Null marks a gap day: nothing logged, tap to backdate. */
  summary: DaySummary | null;
}

/**
 * The All days list: every logged day, plus dimmed "nothing logged" rows
 * for the holes between them (and yesterday, so day one can backdate
 * last night's dinner). Today only appears once something is logged.
 */
function buildDayItems(history: DaySummary[], today: DayKey): DayItem[] {
  if (history.length === 0) return [];
  const logged = new Map(history.map((s) => [s.day, s]));
  const yesterday = addDays(today, -1);
  const newest = history[0].day;
  const oldest = history[history.length - 1].day;
  const start = newest > yesterday ? newest : yesterday;
  const end = oldest < yesterday ? oldest : yesterday;
  const items: DayItem[] = [];
  let gapRun = 0;
  for (let day = start; day >= end; day = addDays(day, -1)) {
    const summary = logged.get(day) ?? null;
    if (summary) {
      items.push({ day, summary });
      gapRun = 0;
    } else if (day !== today) {
      gapRun += 1;
      if (gapRun <= MAX_GAP_ROWS) items.push({ day, summary: null });
    }
  }
  return items;
}

interface Props {
  today: DayKey;
  history: DaySummary[];
  entries: Entry[];
  trackProtein: boolean;
  unit: EnergyUnit;
  dailyGoal: number | null;
  trackWeight: boolean;
  weights: WeightEntry[];
  todayWeight: number | null;
  lastWeight: number | null;
  onLogWeight: (kg: number) => void;
  onRemoveWeight: () => void;
  onAddBackdated: (
    calories: number,
    description: string,
    protein: number | null,
    fat: number | null,
    when: Date,
  ) => void;
}

export default function HistoryScreen({
  today,
  history,
  entries,
  trackProtein,
  unit,
  dailyGoal,
  trackWeight,
  weights,
  todayWeight,
  lastWeight,
  onLogWeight,
  onRemoveWeight,
  onAddBackdated,
}: Props) {
  const [openDay, setOpenDay] = useState<DayKey | null>(null);
  const [weightOpen, setWeightOpen] = useState(false);
  const [backdating, setBackdating] = useState<DayKey | null>(null);
  const { toast, showToast, hold, release } = useToast();

  const { points, deltaPct } = useMemo(() => {
    const totals = new Map(history.map((s) => [s.day, s.total]));
    const pts: TrendPoint[] = [];
    for (let i = 6; i >= 0; i--) {
      const day = addDays(today, -i);
      pts.push({ day, total: totals.get(day) ?? 0 });
    }
    return { points: pts, deltaPct: weeklyStats(entries, today).deltaPct };
  }, [history, entries, today]);

  const dayItems = useMemo(
    () => buildDayItems(history, today),
    [history, today],
  );

  return (
    <div className="screen">
      <h1 className="history-title">History</h1>

      {history.length > 0 && (
        <InsightsCard
          entries={entries}
          today={today}
          dailyGoal={dailyGoal}
          trackProtein={trackProtein}
          unit={unit}
          points={points}
          deltaPct={deltaPct}
        />
      )}

      {trackWeight && (
        <WeightCard
          weights={weights}
          todayWeight={todayWeight}
          onLog={() => setWeightOpen(true)}
        />
      )}
      <WeightSheet
        open={weightOpen}
        today={todayWeight}
        last={lastWeight}
        onSave={onLogWeight}
        onRemove={onRemoveWeight}
        onClose={() => setWeightOpen(false)}
      />

      {history.length > 0 && <h2 className="section-label">All days</h2>}
      {history.length === 0 ? (
        <div className="card empty history-empty">
          <svg
            className="empty-icon"
            viewBox="0 0 52 52"
            fill="none"
            aria-hidden="true"
          >
            <rect
              x="10"
              y="26"
              width="7"
              height="16"
              rx="2.5"
              stroke="currentColor"
              strokeWidth="2"
              opacity="0.5"
            />
            <rect
              x="22.5"
              y="18"
              width="7"
              height="24"
              rx="2.5"
              stroke="currentColor"
              strokeWidth="2"
            />
            <rect
              x="35"
              y="10"
              width="7"
              height="32"
              rx="2.5"
              stroke="currentColor"
              strokeWidth="2"
              opacity="0.5"
            />
          </svg>
          <p className="empty-title">No history yet</p>
          <p className="empty-sub">
            Every day you log is saved here automatically.
            <br />A new day starts at 2:00&nbsp;AM.
          </p>
        </div>
      ) : (
        <div className="card history-days">
          {dayItems.map(({ day, summary }) => {
            if (!summary) {
              // A hole in the log: one tap opens the backdate sheet.
              return (
                <div key={day} className="day-group day-gap">
                  <button
                    className="day-toggle"
                    onClick={() => setBackdating(day)}
                  >
                    <span className="day-label">{formatDayLabel(day)}</span>
                    <span className="day-gap-note">nothing logged</span>
                    <span className="day-gap-add" aria-hidden="true">
                      +
                    </span>
                  </button>
                </div>
              );
            }
            const open = openDay === summary.day;
            return (
              <div
                key={summary.day}
                className={`day-group${open ? " open" : ""}`}
              >
                <button
                  className="day-toggle"
                  onClick={() => setOpenDay(open ? null : summary.day)}
                  aria-expanded={open}
                >
                  <span className="day-label">
                    {formatDayLabel(summary.day)}
                  </span>
                  <span className="day-total">
                    {formatEnergy(summary.total, unit)}
                    <span className="unit">{energyUnitLabel(unit)}</span>
                  </span>
                  <svg
                    className="day-chevron"
                    width="12"
                    height="12"
                    viewBox="0 0 12 12"
                    fill="none"
                  >
                    <path
                      d="M4 2l4 4-4 4"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
                <div className="day-detail">
                  <div className="day-detail-clip">
                    {summary.entries.map((entry) => (
                      <div key={entry.id} className="day-entry">
                        <span className="day-entry-time">
                          {entry.description
                            ? formatTime(entry.timestamp)
                            : ""}
                        </span>
                        <span className="day-entry-title">
                          {entry.description || formatTime(entry.timestamp)}
                        </span>
                        <span className="day-entry-cal">
                          +{formatEnergy(entry.calories, unit)}
                          <span className="unit">{energyUnitLabel(unit)}</span>
                        </span>
                      </div>
                    ))}
                    {summary.day !== today && (
                      <button
                        className="backdate-btn"
                        onClick={() => setBackdating(summary.day)}
                      >
                        + Add to this day
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}


      <BackdateSheet
        day={backdating}
        trackProtein={trackProtein}
        unit={unit}
        onAdd={(cal, desc, prot, fatG, when) => {
          onAddBackdated(cal, desc, prot, fatG, when);
          showToast({ kind: "confirm", message: "Added" }, 1600);
        }}
        onClose={() => setBackdating(null)}
      />
      <Toast toast={toast} onHold={hold} onRelease={release} />
    </div>
  );
}
