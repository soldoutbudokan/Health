"use client";

import { useId, useState } from "react";
import { round, parseDateKey, addDays } from "@/lib/nutrition";
import { formatDay } from "@/lib/labels";
import type { OutputPoint } from "@/lib/training";
import { SESSION_LABELS, SESSION_SHORT } from "@/lib/trainingTypes";

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
 * Every point carries a day-type tick under the plot, in the week strip's
 * short vocabulary, because tonnage only compares fairly within a day type:
 * a light-upper landing under a heavy-lower is the program working, not a
 * slump — and that should be readable without a hover. Ticks that would
 * collide are skipped, never overlapped; two staggered lanes absorb
 * back-to-back sessions first, and a skipped point still has its hover.
 */

interface Props {
  points: OutputPoint[];
  today: string;
  height?: number;
}

const day = (key: string) => parseDateKey(key).getTime() / 86_400_000;

/**
 * Two weeks of window at minimum, stretched to include every session. The
 * bodyweight chart holds eight weeks because weight moves on a months scale;
 * here the window hugs the logged span instead, because sessions come days
 * apart and the day-type ticks need the horizontal room — under the longer
 * window the first week of sessions piled into a corner and half the ticks
 * had to be skipped.
 */
const MIN_WINDOW_DAYS = 14;

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

  // Greedy left-to-right placement of the day-type ticks: take the first lane
  // with room, skip the label entirely when both are taken. The gap is about
  // one rendered label's width, so nothing ever overlaps.
  const LABEL_GAP = 9;
  const laneEdge = [-Infinity, -Infinity];
  const ticks = points.flatMap((p) => {
    const px = x(p.date);
    for (let lane = 0; lane < laneEdge.length; lane++) {
      if (px - laneEdge[lane] >= LABEL_GAP) {
        laneEdge[lane] = px;
        return [{ p, px, lane }];
      }
    }
    return [];
  });
  const laneCount = ticks.reduce((m, t) => Math.max(m, t.lane + 1), 0);

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

      {/* The dot buttons above carry the full reading, so this row is visual
          duplication for sighted readers and hidden from assistive tech. */}
      {laneCount > 0 && (
        <div aria-hidden className="relative mt-1" style={{ height: laneCount * 13 }}>
          {ticks.map((t) => (
            <span
              key={t.p.date}
              className="absolute -translate-x-1/2 whitespace-nowrap text-[10px] text-muted"
              style={{ left: `${Math.min(Math.max(t.px, 4), 96)}%`, top: t.lane * 13 }}
            >
              {SESSION_SHORT[t.p.type]}
            </span>
          ))}
        </div>
      )}

      <div className="mt-2 flex justify-between text-[10px] text-muted">
        <span>{formatDay(windowStart, today)}</span>
        <span>{formatDay(today, today)}</span>
      </div>
    </figure>
  );
}
