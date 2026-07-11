import { useMemo, useState } from "react";
import type { DayKey, Entry } from "../types";
import { formatCalories } from "../lib/format";
import { insightsFor, InsightsRange } from "../lib/insights";

interface Props {
  entries: Entry[];
  today: DayKey;
  dailyGoal: number | null;
  trackProtein: boolean;
}

/**
 * What you ate over the week or month: quiet numbers, your most-logged
 * foods, and when in the day the calories land. Observations only.
 */
export default function InsightsCard({
  entries,
  today,
  dailyGoal,
  trackProtein,
}: Props) {
  const [range, setRange] = useState<InsightsRange>("week");
  const insights = useMemo(
    () => insightsFor(entries, today, range, dailyGoal),
    [entries, today, range, dailyGoal],
  );

  const empty =
    range === "week"
      ? "Nothing logged in the last 7 days yet."
      : "Nothing logged this month yet.";

  return (
    <section className="card insights-card">
      <div className="trend-head">
        <p className="trend-label">Insights</p>
      </div>
      <div className="seg two" role="tablist" aria-label="Insights range">
        {(
          [
            ["week", "Week"],
            ["month", "Month"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            role="tab"
            aria-selected={range === id}
            className={`seg-btn${range === id ? " active" : ""}`}
            onClick={() => setRange(id)}
          >
            {label}
          </button>
        ))}
      </div>

      {insights.daysLogged === 0 ? (
        <p className="insights-empty">{empty}</p>
      ) : (
        <>
          <div className="trend-stats insights-stats">
            <div className="tstat">
              <span className="tstat-v">
                {insights.daysLogged}
                <span className="u">/{insights.spanDays}</span>
              </span>
              <span className="tstat-l">days logged</span>
            </div>
            {insights.avgCalories !== null && (
              <div className="tstat">
                <span className="tstat-v">
                  {formatCalories(insights.avgCalories)}
                </span>
                <span className="tstat-l">cal / day</span>
              </div>
            )}
            {insights.goalDays !== null && (
              <div className="tstat">
                <span className="tstat-v">
                  {insights.goalDays}
                  <span className="u">/{insights.daysLogged}</span>
                </span>
                <span className="tstat-l">on target</span>
              </div>
            )}
            {trackProtein && insights.proteinAvg !== null && (
              <div className="tstat">
                <span className="tstat-v">
                  {insights.proteinAvg}
                  <span className="u"> g</span>
                </span>
                <span className="tstat-l">protein / day</span>
              </div>
            )}
          </div>

          <h3 className="insights-sub">Top foods</h3>
          {insights.topFoods.length === 0 ? (
            <p className="insights-note">
              Name your entries, or log from the Menu, and your most eaten
              foods appear here.
            </p>
          ) : (
            <ul className="insights-foods">
              {insights.topFoods.map((food) => (
                <li key={food.name.toLowerCase()} className="ifood">
                  <span className="ifood-name">{food.name}</span>
                  <span className="ifood-count">&times;{food.count}</span>
                  <span className="ifood-cal">
                    {formatCalories(food.calories)}
                    <span className="u"> cal</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
          {insights.moreFoods > 0 && (
            <p className="insights-note">
              and {insights.moreFoods} more this{" "}
              {range === "week" ? "week" : "month"}
            </p>
          )}

          <h3 className="insights-sub">When you eat</h3>
          <div className="insights-split">
            {insights.split.map((slot) => (
              <div key={slot.label} className="isplit">
                <span className="isplit-label">
                  {slot.label}
                  <span className="isplit-hours"> {slot.hours}</span>
                </span>
                <span className="isplit-bar" aria-hidden="true">
                  <span
                    className="isplit-fill"
                    style={{ width: `${Math.round(slot.share * 100)}%` }}
                  />
                </span>
                <span className="isplit-cal">
                  {Math.round(slot.share * 100)}%
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
