import { useMemo, useState } from "react";
import type { DayKey, Entry } from "../types";
import { insightsFor, InsightsRange } from "../lib/insights";
import {
  energyUnitLabel,
  formatEnergy,
  type EnergyUnit,
} from "../lib/units";
import MacroStat from "./MacroStat";
import TrendChart, { TrendPoint } from "./TrendChart";

/** Collapsed list length, and the cap once "and N more" is expanded. */
const TOP_LIMIT = 5;
const EXPANDED_LIMIT = 25;

interface Props {
  entries: Entry[];
  today: DayKey;
  dailyGoal: number | null;
  trackProtein: boolean;
  unit: EnergyUnit;
  /** The last 7 tracking days, oldest first, for the Week bar chart. */
  points: TrendPoint[];
  /** Signed percent change vs the previous week, or null. */
  deltaPct: number | null;
}

/**
 * The one weekly/monthly numbers card: average and bar chart (Week view),
 * quiet stats, your most-logged foods, and when in the day the calories
 * land. Observations only. Absorbed the old trend card in 2.13 — the two
 * were repeating the same numbers back to back.
 */
export default function InsightsCard({
  entries,
  today,
  dailyGoal,
  trackProtein,
  unit,
  points,
  deltaPct,
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
          {range === "week" && insights.avgCalories !== null && (
            <>
              <p className="trend-avg">
                {formatEnergy(insights.avgCalories, unit)}
                <span className="unit">{energyUnitLabel(unit)}</span>
              </p>
              <p className="trend-avg-caption">daily average</p>
              <TrendChart
                points={points}
                average={insights.avgCalories}
                unit={unit}
              />
            </>
          )}
          <div className="trend-stats insights-stats">
            <div className="tstat">
              <span className="tstat-v">
                {insights.daysLogged}
                <span className="u">/{insights.spanDays}</span>
              </span>
              <span className="tstat-l">days logged</span>
            </div>
            {/* Week shows the average as the hero above; Month keeps it
                here as a stat. */}
            {range === "month" && insights.avgCalories !== null && (
              <div className="tstat">
                <span className="tstat-v">
                  {formatEnergy(insights.avgCalories, unit)}
                </span>
                <span className="tstat-l">{energyUnitLabel(unit)} / day</span>
              </div>
            )}
            {range === "week" && deltaPct !== null && (
              <div className="tstat">
                <span className="tstat-v">
                  {deltaPct > 0 ? "+" : ""}
                  {deltaPct}
                  <span className="u">%</span>
                </span>
                <span className="tstat-l">
                  {energyUnitLabel(unit)} vs last week
                </span>
              </div>
            )}
            {insights.goalDays !== null && (
              <div className="tstat">
                <span className="tstat-v">{insights.goalDays}</span>
                <span className="tstat-l">days under goal</span>
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
                      {formatEnergy(food.calories, unit)}
                      <span className="u"> {energyUnitLabel(unit)}</span>
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
