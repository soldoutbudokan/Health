"use client";

import { useId, useState } from "react";
import { round, parseDateKey } from "@/lib/nutrition";
import { formatDay } from "@/lib/labels";
import type { RmPoint } from "@/lib/training";

/**
 * One lift's estimated 1-, 3- and 5-rep maxes over time. Built on the same
 * chassis as `LiftChart` — same window, same break shading, HTML markers for
 * the same stretched-viewBox reason — but deliberately *without* a pace line
 * or target: the goals are graded on real top sets, and drawing an estimate
 * against a real target would put two different kinds of number on one scale
 * and invite reading the flattering one.
 *
 * The three curves are one estimate restated at three rep counts, not three
 * measurements, so they only ever move together; markers and hover live on
 * the e1RM line and the caption reports all three. Existence here is by
 * explicit request (August 10, 2026) — see the CLAUDE.md history section
 * before extending this into anything the log doesn't actually measure.
 */

interface Props {
  title: string;
  points: RmPoint[];
  breaks: { start: string; end: string; label: string }[];
  windowStart: string;
  windowEnd: string;
  today: string;
  colour: string;
  height?: number;
}

const day = (key: string) => parseDateKey(key).getTime() / 86_400_000;

/** The three curves, styled by distance from the estimate's anchor set. */
const CURVES = [
  { key: "e1", label: "e1RM", width: 2, opacity: 1 },
  { key: "e3", label: "e3RM", width: 1.5, opacity: 0.55 },
  { key: "e5", label: "e5RM", width: 1.5, opacity: 0.35 },
] as const;

export function RmChart({
  title,
  points,
  breaks,
  windowStart,
  windowEnd,
  today,
  colour,
  height = 150,
}: Props) {
  const [hover, setHover] = useState<number | null>(null);
  const clipId = useId();

  const t0 = day(windowStart);
  const t1 = day(windowEnd);
  const W = 100;
  const span = t1 - t0 || 1;
  const x = (key: string) => ((day(key) - t0) / span) * W;

  const values = points.flatMap((p) => [p.e1, p.e5]);
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  const pad = Math.max((hi - lo) * 0.15, hi * 0.02, 1);
  const yMin = Math.max(0, lo - pad);
  const yMax = hi + pad;
  const y = (v: number) => height - ((v - yMin) / (yMax - yMin || 1)) * height;

  const inWindow = points.filter((p) => p.date >= windowStart && p.date <= windowEnd);
  if (inWindow.length === 0) return null;

  const pathFor = (key: (typeof CURVES)[number]["key"]) =>
    inWindow
      .map((p, i) => `${i === 0 ? "M" : "L"}${x(p.date).toFixed(2)},${y(p[key]).toFixed(2)}`)
      .join(" ");

  const last = inWindow[inWindow.length - 1];
  const active = hover !== null ? inWindow[hover] : null;

  const describe = (p: RmPoint) =>
    `${formatDay(p.date, today)} · ${round(p.weightLbs, 1)} × ${p.reps} → e1 ${round(p.e1)} · e3 ${round(p.e3)} · e5 ${round(p.e5)} lbs`;

  // The line-end labels are HTML, like the markers — SVG text inside the
  // stretched viewBox would distort. Nudged apart when two curves converge.
  const labelX = Math.min(x(last.date) + 2, 88);
  let prevTop = -Infinity;
  const labels = CURVES.map((c) => {
    const top = Math.max((y(last[c.key]) / height) * 100, prevTop + 9);
    prevTop = top;
    return { ...c, top };
  });

  return (
    <figure className="card p-4">
      <figcaption className="mb-3 flex items-baseline justify-between gap-2">
        <h3 className="shrink-0 text-sm font-semibold">{title}</h3>
        <span className="tnum min-w-0 truncate text-xs text-muted">
          {active
            ? describe(active)
            : `est. 1RM ≈ ${round(last.e1)} lbs · ${formatDay(last.date, today)}`}
        </span>
      </figcaption>

      <div className="relative" style={{ height }} onMouseLeave={() => setHover(null)}>
        <svg
          width="100%"
          height={height}
          viewBox={`0 0 ${W} ${height}`}
          preserveAspectRatio="none"
          role="img"
          aria-label={`${title}: estimated one-, three- and five-rep maxes over ${inWindow.length} logged day${inWindow.length === 1 ? "" : "s"}, latest estimated single about ${round(last.e1)} lbs`}
        >
          <defs>
            <clipPath id={clipId}>
              <rect x="0" y="0" width={W} height={height} />
            </clipPath>
          </defs>

          <g clipPath={`url(#${clipId})`}>
            {breaks.map((b) => (
              <rect
                key={b.start}
                x={x(b.start)}
                y="0"
                width={Math.max(0, x(b.end) - x(b.start))}
                height={height}
                fill="var(--text-muted)"
                opacity={0.12}
              />
            ))}

            {CURVES.map((c) =>
              inWindow.length > 1 ? (
                <path
                  key={c.key}
                  d={pathFor(c.key)}
                  fill="none"
                  stroke={colour}
                  strokeWidth={c.width}
                  opacity={c.opacity}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  vectorEffect="non-scaling-stroke"
                />
              ) : null,
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

        {labels.map((l) => (
          <span
            key={l.key}
            aria-hidden
            className="tnum absolute -translate-y-1/2 text-[9px] font-medium text-muted"
            style={{ left: `${labelX}%`, top: `${l.top}%` }}
          >
            {l.label}
          </span>
        ))}

        {/* Markers on the e1RM curve only — the caption carries all three
            figures, and three rows of tap targets would overlap. */}
        {inWindow.map((p, i) => (
          <button
            key={p.date}
            type="button"
            className="absolute grid h-7 w-7 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full"
            style={{ left: `${x(p.date)}%`, top: `${(y(p.e1) / height) * 100}%` }}
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
                background: p.source === "logged" ? colour : "var(--page)",
                border: `2px solid ${colour}`,
              }}
            />
          </button>
        ))}
      </div>

      <div className="mt-2 flex justify-between text-[10px] text-muted">
        <span>{formatDay(windowStart, today)}</span>
        <span>{formatDay(windowEnd, today)}</span>
      </div>
    </figure>
  );
}
