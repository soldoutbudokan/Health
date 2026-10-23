"use client";

import { useId, useState } from "react";
import { round, parseDateKey } from "@/lib/nutrition";
import { formatDay } from "@/lib/labels";
import type { TopSetPoint } from "@/lib/training";

/**
 * The goal lifts' heavy-day top sets over time, one small chart per lift in a
 * single card, each against its target. It replaced the lbs-moved chart on the
 * dashboard on October 22, 2026, by request: tonnage answered no question
 * anyone was asking, and whether the trap bar is closing on 300 is the one
 * this stretch is run for.
 *
 * Each lift gets its own y-scale, because 285 and 170 on one axis would flatten
 * both. The same HTML-marker trick as the other charts keeps the dots round
 * under the stretched SVG. The target is a dashed line rather than a pace line:
 * `/training` grades the pace, and the dashboard records.
 */

export interface GoalLift {
  id: string;
  name: string;
  unit: string;
  target: number;
  /** The rep count the goal is set at; a top set short of it draws hollow. */
  reps: number;
  colour: string;
  points: TopSetPoint[];
}

interface Props {
  lifts: GoalLift[];
  windowStart: string;
  today: string;
  /** Height of each lift's plot. */
  height?: number;
}

const day = (key: string) => parseDateKey(key).getTime() / 86_400_000;

function LiftRow({
  lift,
  windowStart,
  today,
  height,
}: {
  lift: GoalLift;
  windowStart: string;
  today: string;
  height: number;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const clipId = useId();

  const t0 = day(windowStart);
  const span = day(today) - t0 || 1;
  const W = 100;
  const x = (key: string) => ((day(key) - t0) / span) * W;

  // The target sits in the scale so the gap to it is always in frame.
  const values = [...lift.points.map((p) => p.value), lift.target];
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  const pad = Math.max((hi - lo) * 0.15, 2);
  const yMin = lo - pad;
  const yMax = hi + pad;
  const y = (v: number) => height - ((v - yMin) / (yMax - yMin)) * height;

  // A short top set stays off the line: drawn through it, 170 × 2 would read
  // as progress past the 165 × 5 before it.
  const path = lift.points
    .filter((p) => !p.short)
    .map((p, i) => `${i === 0 ? "M" : "L"}${x(p.date).toFixed(2)},${y(p.value).toFixed(2)}`)
    .join(" ");

  const label = (p: TopSetPoint) =>
    `${round(p.value, 1)}${p.reps !== undefined ? ` × ${p.reps}` : ` ${lift.unit}`}`;
  const latest = lift.points[lift.points.length - 1];
  const active = hover !== null ? lift.points[hover] : null;

  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between gap-2">
        <span className="flex min-w-0 items-center gap-1.5 text-xs font-medium text-ink-2">
          <span
            aria-hidden
            className="inline-block h-2 w-2 shrink-0 rounded-full"
            style={{ background: lift.colour }}
          />
          <span className="truncate">{lift.name}</span>
        </span>
        <span className="tnum shrink-0 text-xs text-muted">
          {active
            ? `${formatDay(active.date, today)} · ${label(active)}`
            : latest
              ? `${label(latest)} · target ${round(lift.target)}`
              : `target ${round(lift.target)}`}
        </span>
      </div>

      <div className="relative" style={{ height }} onMouseLeave={() => setHover(null)}>
        <svg
          width="100%"
          height={height}
          viewBox={`0 0 ${W} ${height}`}
          preserveAspectRatio="none"
          role="img"
          aria-label={`${lift.name}: ${lift.points.length} heavy-day top set${
            lift.points.length === 1 ? "" : "s"
          }${latest ? `, latest ${label(latest)} on ${latest.date}` : ""}, against a target of ${round(
            lift.target,
          )} ${lift.unit}`}
        >
          <defs>
            <clipPath id={clipId}>
              <rect x="0" y="0" width={W} height={height} />
            </clipPath>
          </defs>

          <g clipPath={`url(#${clipId})`}>
            <line
              x1="0"
              x2={W}
              y1={y(lift.target)}
              y2={y(lift.target)}
              stroke="var(--baseline)"
              strokeWidth="1.5"
              strokeDasharray="3 3"
              vectorEffect="non-scaling-stroke"
            />
            {path && (
              <path
                d={path}
                fill="none"
                stroke={lift.colour}
                strokeWidth="2"
                strokeLinejoin="round"
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
              />
            )}
          </g>
        </svg>

        {lift.points.map((p, i) => {
          const hollow = p.short || p.source !== "logged";
          return (
            <button
              key={p.date}
              type="button"
              className="absolute grid h-7 w-7 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full"
              style={{ left: `${x(p.date)}%`, top: `${(y(p.value) / height) * 100}%` }}
              onMouseEnter={() => setHover(i)}
              onFocus={() => setHover(i)}
              onBlur={() => setHover(null)}
              onClick={() => setHover((h) => (h === i ? null : i))}
              aria-label={`${lift.name}, ${formatDay(p.date, today)}: ${label(p)}${
                p.source === "logged" ? "" : ` (${p.source} record)`
              }`}
            >
              <span
                className="block rounded-full transition-transform"
                style={{
                  width: hover === i ? 11 : 8,
                  height: hover === i ? 11 : 8,
                  background: hollow ? "var(--page)" : lift.colour,
                  border: `2px solid ${lift.colour}`,
                }}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function GoalLiftsChart({ lifts, windowStart, today, height = 56 }: Props) {
  if (lifts.every((l) => l.points.length === 0)) return null;

  return (
    <figure className="card p-4">
      <figcaption className="mb-3 flex items-baseline justify-between gap-2">
        <h3 className="shrink-0 text-sm font-semibold">Goal lifts</h3>
        <span className="min-w-0 truncate text-xs text-muted">heavy-day top sets</span>
      </figcaption>

      <div className="space-y-3">
        {lifts.map((l) => (
          <LiftRow key={l.id} lift={l} windowStart={windowStart} today={today} height={height} />
        ))}
      </div>

      <div className="mt-2 flex justify-between text-[10px] text-muted">
        <span>{formatDay(windowStart, today)}</span>
        <span>{formatDay(today, today)}</span>
      </div>
      <p className="mt-1.5 text-[11px] leading-snug text-muted">
        Dashed: the target. Hollow: the August baseline, or a top set short of 5 reps.
      </p>
    </figure>
  );
}
