import { useMemo, useState } from "react";
import type { DayKey, Entry } from "../types";
import { formatCalories } from "../lib/format";
import { insightsFor, InsightsRange } from "../lib/insights";
import MacroStat from "./MacroStat";

/** Collapsed list length, and the cap once "and N more" is expanded. */
const TOP_LIMIT = 5;
const EXPANDED_LIMIT = 25;

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
  const [expanded, setExpanded] = useState(false);
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
            onClick={() => {
              setRange(id);
              setExpanded(false);
            }}
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
            {trackProtein && (
              <MacroStat
                proteinAvg={insights.proteinAvg}
                fatAvg={insights.fatAvg}
              />
            )}
          </div>

          <h3 className="insights-sub">Top foods</h3>
          {insights.foods.length === 0 ? (
            <p className="insights-note">
              Name your entries, or log from the Menu, and your most eaten
              foods appear here.
            </p>
          ) : (
            <ul className="insights-foods">
              {insights.foods
                .slice(0, expanded ? EXPANDED_LIMIT : TOP_LIMIT)
                .map((food) => (
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
          {!expanded && insights.foods.length > TOP_LIMIT && (
            <button
              type="button"
              className="insights-more"
              onClick={() => setExpanded(true)}
            >
              and {insights.foods.length - TOP_LIMIT} more this{" "}
              {range === "week" ? "week" : "month"}
            </button>
          )}
          {expanded && (
            <>
              {insights.foods.length > EXPANDED_LIMIT && (
                <p className="insights-note">
                  and {insights.foods.length - EXPANDED_LIMIT} more beyond
                  these
                </p>
              )}
              <button
                type="button"
                className="insights-more"
                onClick={() => setExpanded(false)}
              >
                show less
              </button>
            </>
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
