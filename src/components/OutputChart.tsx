"use client";

import { useId, useState } from "react";
import { round, parseDateKey, addDays } from "@/lib/nutrition";
import { formatDay } from "@/lib/labels";
import type { OutputPoint } from "@/lib/training";
import { SESSION_LABELS } from "@/lib/trainingTypes";

/**
 * Pounds moved per session, over time — the standing companion to the
 * day-pinned Total output card, so a session's tonnage is seen against the
 * sessions before it. A sibling of `BodyweightChart`, built the same way: a
 * continuous quantity, so a line; HTML markers rather than SVG circles,
 * because the stretched SVG would squash circles into ellipses.
 *
 * Two honesty rules of its own. The y-axis starts at zero — tonnage has a
 * real zero, and a chart zoomed into the 4,000–6,000 band would draw an
 * ordinary lighter day as a collapse. And a session with no weighted work is
 * a gap, not a zero — `outputSeries` leaves it out, because a basketball
 * day's output isn't measured in pounds at all.
 *
 * The hover names the program day, because tonnage only compares fairly
 * within a day type: a light-upper landing under a heavy-lower is the
 * program working, not a slump.
 */

interface Props {
  points: OutputPoint[];
  today: string;
  height?: number;
}

const day = (key: string) => parseDateKey(key).getTime() / 86_400_000;

/** At least eight weeks of window, stretched to include every session. */
const MIN_WINDOW_DAYS = 56;

export function OutputChart({ points, today, height = 150 }: Props) {
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

  // Zero-based, with headroom so the heaviest session doesn't touch the frame.
  const yMax = Math.max(...points.map((p) => p.lbs)) * 1.15;
  const y = (v: number) => height - (v / yMax) * height;

  const path = points
    .map((p, i) => `${i === 0 ? "M" : "L"}${x(p.date).toFixed(2)},${y(p.lbs).toFixed(2)}`)
    .join(" ");

  const latest = points[points.length - 1];
  const active = hover !== null ? points[hover] : null;

  const describe = (p: OutputPoint) =>
    `${formatDay(p.date, today)} · ${SESSION_LABELS[p.type]} · ${round(p.lbs).toLocaleString("en-US")} lbs`;

  return (
    <figure className="card p-4">
      <figcaption className="mb-3 flex items-baseline justify-between gap-2">
        <h3 className="shrink-0 text-sm font-semibold">Lbs moved</h3>
        <span className="tnum min-w-0 truncate text-xs text-muted">
          {active
            ? describe(active)
            : `latest ${round(latest.lbs).toLocaleString("en-US")} lbs · ${formatDay(latest.date, today)}`}
        </span>
      </figcaption>

      <div className="relative" style={{ height }} onMouseLeave={() => setHover(null)}>
        <svg
          width="100%"
          height={height}
          viewBox={`0 0 ${W} ${height}`}
          preserveAspectRatio="none"
          role="img"
          aria-label={`Pounds moved per session: ${points.length} session${points.length === 1 ? "" : "s"}, latest ${round(latest.lbs).toLocaleString("en-US")} lbs on ${latest.date}`}
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
                stroke="var(--series-carbs)"
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
            aria-label={describe(p)}
          >
            <span
              className="block rounded-full transition-transform"
              style={{
                width: hover === i ? 11 : 8,
                height: hover === i ? 11 : 8,
                background: "var(--series-carbs)",
                border: "2px solid var(--series-carbs)",
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
