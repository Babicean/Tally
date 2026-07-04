import { useMemo, useState } from "react";
import type { DayKey, DaySummary, Entry, MenuItem } from "../types";
import { addDays } from "../lib/day";
import { formatCalories, formatDayLabel, formatTime } from "../lib/format";
import type { BackupPayload, MergeResult } from "../lib/backup";
import TrendChart, { TrendPoint } from "./TrendChart";
import DataCard from "./DataCard";

interface Props {
  today: DayKey;
  history: DaySummary[];
  entries: Entry[];
  menu: MenuItem[];
  dailyGoal: number | null;
  onImport: (backup: BackupPayload) => MergeResult;
}

export default function HistoryScreen({
  today,
  history,
  entries,
  menu,
  dailyGoal,
  onImport,
}: Props) {
  const [openDay, setOpenDay] = useState<DayKey | null>(null);

  const { points, average } = useMemo(() => {
    const totals = new Map(history.map((s) => [s.day, s.total]));
    const pts: TrendPoint[] = [];
    for (let i = 6; i >= 0; i--) {
      const day = addDays(today, -i);
      pts.push({ day, total: totals.get(day) ?? 0 });
    }
    const logged = pts.filter((p) => p.total > 0);
    const avg =
      logged.length > 0
        ? Math.round(logged.reduce((s, p) => s + p.total, 0) / logged.length)
        : null;
    return { points: pts, average: avg };
  }, [history, today]);

  return (
    <div className="screen">
      <h1 className="history-title">History</h1>

      {history.length > 0 && (
        <section className="card trend-card">
          <div className="trend-head">
            <p className="trend-label">Last 7 days</p>
          </div>
          {average !== null ? (
            <>
              <p className="trend-avg">
                {formatCalories(average)}
                <span className="unit">cal</span>
              </p>
              <p className="trend-avg-caption">daily average</p>
            </>
          ) : (
            <p className="trend-avg-caption">No entries in the last 7 days.</p>
          )}
          <TrendChart points={points} average={average} />
        </section>
      )}

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
          {history.map((summary) => {
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
                    {formatCalories(summary.total)}
                    <span className="unit">cal</span>
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
                          {formatTime(entry.timestamp)}
                        </span>
                        <span className="day-entry-title">
                          {entry.description || "—"}
                        </span>
                        <span className="day-entry-cal">
                          +{formatCalories(entry.calories)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <DataCard
        entries={entries}
        menu={menu}
        dailyGoal={dailyGoal}
        onImport={onImport}
      />
    </div>
  );
}
