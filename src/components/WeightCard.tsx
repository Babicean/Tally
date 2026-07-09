import type { WeightEntry } from "../lib/weight";

/** "2026-07-04" → "Jul 4", for axis labels. */
function shortDay(day: string): string {
  const [y, m, d] = day.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

interface Props {
  weights: WeightEntry[];
}

const X0 = 10;
const X1 = 310;
const Y0 = 16;
const Y1 = 84;

/**
 * The weight story: a quiet line of the last ~60 weigh-ins and the
 * plain numbers. No colors for up or down — information, never
 * judgement.
 */
export default function WeightCard({ weights }: Props) {
  const series = weights.slice(-60);
  const values = series.map((w) => w.kg);
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  const span = hi - lo || 1;
  const px = (i: number) =>
    series.length === 1 ? 160 : X0 + (i / (series.length - 1)) * (X1 - X0);
  const py = (v: number) => Y1 - ((v - lo) / span) * (Y1 - Y0);

  const current = values[values.length - 1];
  // Change over the last ~30 days of data we actually have.
  const monthAgoIdx = Math.max(0, series.length - 30);
  const change = current - values[monthAgoIdx];
  const changeText =
    series.length > 1
      ? `${change > 0 ? "+" : ""}${(Math.round(change * 10) / 10).toFixed(1)} kg since ${shortDay(series[monthAgoIdx].day)}`
      : "First weigh-in logged.";

  // Value labels: all while sparse, else first / low / high / last.
  const peak = values.indexOf(hi);
  const trough = values.indexOf(lo);
  const labelled =
    series.length <= 8
      ? values.map((_, i) => i)
      : [0, peak, trough, series.length - 1];

  return (
    <section className="card trend-card weight-card">
      <div className="trend-head">
        <span className="trend-label">Weight</span>
        <span className="trend-avg">
          {current}
          <span className="unit"> kg</span>
        </span>
      </div>
      <p className="trend-avg-caption">{changeText}</p>
      <svg
        className="trend-chart exline-chart"
        viewBox="0 0 320 100"
        role="img"
        aria-label="Weight over time"
      >
        {series.length > 1 && (
          <polyline
            className="exline"
            points={series.map((w, i) => `${px(i)},${py(w.kg)}`).join(" ")}
          />
        )}
        {series.map((w, i) => (
          <g key={w.day}>
            <circle
              className={`exdot${i === series.length - 1 ? " now" : ""}`}
              cx={px(i)}
              cy={py(w.kg)}
              r={i === series.length - 1 ? 4 : 3}
            />
            {labelled.includes(i) && (
              <text className="axis-label exval" x={px(i)} y={py(w.kg) - 8}>
                {w.kg}
              </text>
            )}
          </g>
        ))}
        <text className="axis-label" x={X0} y={97} textAnchor="start">
          {shortDay(series[0].day)}
        </text>
        {series.length > 1 && (
          <text className="axis-label" x={X1} y={97} textAnchor="end">
            {shortDay(series[series.length - 1].day)}
          </text>
        )}
      </svg>
    </section>
  );
}
