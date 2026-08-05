"use client";

import { useId, useState } from "react";
import { round, parseDateKey, addDays } from "@/lib/nutrition";
import { formatDay } from "@/lib/labels";
import type { BodyweightPoint } from "@/lib/training";

/**
 * Bodyweight over time. A sibling of `LiftChart` rather than a reuse of it:
 * there is no pace line, because bodyweight has no December target — it is
 * context for the lifts (the bench goal note says food and sleep decide most
 * of it), not a goal being chased. Same mark for the same reason as the lifts:
 * a continuous quantity, so a line; and the same HTML-marker trick, because
 * the stretched SVG would squash circles into ellipses.
 *
 * Renders from the very first reading — a chart with one dot is a chart
 * that's ready, which beats appearing out of nowhere weeks later.
 */

interface Props {
  points: BodyweightPoint[];
  today: string;
  height?: number;
}

const day = (key: string) => parseDateKey(key).getTime() / 86_400_000;

/** At least eight weeks of window, stretched to include every reading. */
const MIN_WINDOW_DAYS = 56;

export function BodyweightChart({ points, today, height = 150 }: Props) {
  const [hover, setHover] = useState<number | null>(null);
  const clipId = useId();

  if (points.length === 0) return null;

  const windowStart =
    points[0].date < addDays(today, -MIN_WINDOW_DAYS)
      ? points[0].date
      : addDays(today, -MIN_WINDOW_DAYS);

  const t0 = day(windowStart);
  const span = day(today) - t0 || 1;
  const W = 100;
  const x = (key: string) => ((day(key) - t0) / span) * W;

  // Pad the domain so a flat run doesn't hug the frame; ±2 lbs floor keeps a
  // single reading from drawing at the very edge.
  const values = points.map((p) => p.lbs);
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  const pad = Math.max((hi - lo) * 0.25, 2);
  const yMin = lo - pad;
  const yMax = hi + pad;
  const y = (v: number) => height - ((v - yMin) / (yMax - yMin)) * height;

  const path = points
    .map((p, i) => `${i === 0 ? "M" : "L"}${x(p.date).toFixed(2)},${y(p.lbs).toFixed(2)}`)
    .join(" ");

  const latest = points[points.length - 1];
  const active = hover !== null ? points[hover] : null;

  return (
    <figure className="card p-4">
      <figcaption className="mb-3 flex items-baseline justify-between gap-2">
        <h3 className="text-sm font-semibold">Bodyweight</h3>
        <span className="tnum text-xs text-muted">
          {active
            ? `${formatDay(active.date, today)} · ${round(active.lbs, 1)} lbs`
            : `latest ${round(latest.lbs, 1)} lbs · ${formatDay(latest.date, today)}`}
        </span>
      </figcaption>

      <div className="relative" style={{ height }} onMouseLeave={() => setHover(null)}>
        <svg
          width="100%"
          height={height}
          viewBox={`0 0 ${W} ${height}`}
          preserveAspectRatio="none"
          role="img"
          aria-label={`Bodyweight: ${points.length} reading${points.length === 1 ? "" : "s"}, latest ${round(latest.lbs, 1)} lbs on ${latest.date}`}
        >
          <defs>
            <clipPath id={clipId}>
              <rect x="0" y="0" width={W} height={height} />
            </clipPath>
          </defs>

          <g clipPath={`url(#${clipId})`}>
            {points.length > 1 && (
              <path
                d={path}
                fill="none"
                stroke="var(--series-protein)"
                strokeWidth="2"
                strokeLinejoin="round"
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
              />
            )}
          </g>

          <line
            x1="0"
            x2={W}
            y1={height}
            y2={height}
            stroke="var(--baseline)"
            strokeWidth="1"
            vectorEffect="non-scaling-stroke"
          />
        </svg>

        {points.map((p, i) => (
          <button
            key={p.date}
            type="button"
            className="absolute grid h-7 w-7 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full"
            style={{ left: `${x(p.date)}%`, top: `${(y(p.lbs) / height) * 100}%` }}
            onMouseEnter={() => setHover(i)}
            onFocus={() => setHover(i)}
            onBlur={() => setHover(null)}
            onClick={() => setHover((h) => (h === i ? null : i))}
            aria-label={`${formatDay(p.date, today)}: ${round(p.lbs, 1)} lbs`}
          >
            <span
              className="block rounded-full transition-transform"
              style={{
                width: hover === i ? 11 : 8,
                height: hover === i ? 11 : 8,
                background: "var(--series-protein)",
                border: "2px solid var(--series-protein)",
              }}
            />
          </button>
        ))}
      </div>

      <div className="mt-2 flex justify-between text-[10px] text-muted">
        <span>{formatDay(windowStart, today)}</span>
        <span>{formatDay(today, today)}</span>
      </div>
    </figure>
  );
}
