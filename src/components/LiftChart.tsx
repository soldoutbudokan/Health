"use client";

import { useId, useState } from "react";
import { round, parseDateKey } from "@/lib/nutrition";
import { formatDay } from "@/lib/labels";
import type { TrainingSource } from "@/lib/trainingTypes";

/**
 * One lift's top set over time, with the pace line it is being measured
 * against and the weeks nobody trained shaded behind it.
 *
 * The shading is the reason this chart exists rather than a table. A drop
 * between January and August is a mystery; a drop with six weeks of travel and
 * illness drawn underneath it is an explanation, and the two lifts that rode
 * through the break untouched are visible at a glance next to the two that
 * didn't.
 *
 * The bands and lines are SVG stretched to the container with
 * `preserveAspectRatio="none"`, which turns any circle drawn inside it into an
 * ellipse — so the point markers are HTML positioned on top instead, and stay
 * round at every width.
 */

export interface LiftPoint {
  date: string;
  value: number;
  reps?: number;
  source: TrainingSource;
  note?: string;
}

interface Props {
  title: string;
  unit: string;
  points: LiftPoint[];
  /** The straight line from baseline to target. */
  pace: { from: string; fromValue: number; to: string; toValue: number };
  breaks: { start: string; end: string; label: string }[];
  windowStart: string;
  windowEnd: string;
  today: string;
  colour: string;
  height?: number;
}

const day = (key: string) => parseDateKey(key).getTime() / 86_400_000;

export function LiftChart({
  title,
  unit,
  points,
  pace,
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

  // A zero-width window would divide by zero; it can only happen with a
  // malformed goals file, and a flat chart is a better failure than a crash.
  const span = t1 - t0 || 1;
  const x = (key: string) => ((day(key) - t0) / span) * W;

  const values = [...points.map((p) => p.value), pace.fromValue, pace.toValue];
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  const pad = Math.max((hi - lo) * 0.15, hi * 0.02, 1);
  const yMin = Math.max(0, lo - pad);
  const yMax = hi + pad;
  const y = (v: number) => height - ((v - yMin) / (yMax - yMin || 1)) * height;

  const inWindow = points.filter((p) => p.date >= windowStart && p.date <= windowEnd);
  const path = inWindow
    .map((p, i) => `${i === 0 ? "M" : "L"}${x(p.date).toFixed(2)},${y(p.value).toFixed(2)}`)
    .join(" ");

  const active = hover !== null ? inWindow[hover] : null;

  return (
    <figure className="card p-4">
      <figcaption className="mb-3 flex items-baseline justify-between gap-2">
        <h3 className="text-sm font-semibold">{title}</h3>
        <span className="tnum text-xs text-muted">
          {active
            ? `${formatDay(active.date, today)} · ${round(active.value, 1)} ${unit}${
                active.reps ? ` × ${active.reps}` : ""
              }`
            : `target ${round(pace.toValue)} ${unit}`}
        </span>
      </figcaption>

      <div className="relative" style={{ height }} onMouseLeave={() => setHover(null)}>
        <svg
          width="100%"
          height={height}
          viewBox={`0 0 ${W} ${height}`}
          preserveAspectRatio="none"
          role="img"
          aria-label={`${title}: ${inWindow.length} recorded top sets between ${windowStart} and ${windowEnd}, against a target of ${round(pace.toValue)} ${unit}`}
        >
          <defs>
            <clipPath id={clipId}>
              <rect x="0" y="0" width={W} height={height} />
            </clipPath>
          </defs>

          <g clipPath={`url(#${clipId})`}>
            {/* Weeks nobody trained, behind everything else. */}
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

            {/* The pace line: where a straight run at the target would be. */}
            <line
              x1={x(pace.from)}
              x2={x(pace.to)}
              y1={y(pace.fromValue)}
              y2={y(pace.toValue)}
              stroke="var(--baseline)"
              strokeWidth="1.5"
              strokeDasharray="3 3"
              vectorEffect="non-scaling-stroke"
            />

            {path && (
              <path
                d={path}
                fill="none"
                stroke={colour}
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

        {/* Markers as HTML so they stay circular under the stretched viewBox.
            Buttons rather than divs because tapping has to work as well as
            hovering — there is no hover on a phone. */}
        {inWindow.map((p, i) => (
          <button
            key={`${p.date}-${i}`}
            type="button"
            className="absolute grid h-7 w-7 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full"
            style={{ left: `${x(p.date)}%`, top: `${(y(p.value) / height) * 100}%` }}
            onMouseEnter={() => setHover(i)}
            onFocus={() => setHover(i)}
            onBlur={() => setHover(null)}
            onClick={() => setHover((h) => (h === i ? null : i))}
            aria-label={`${formatDay(p.date, today)}: ${round(p.value, 1)} ${unit}${
              p.reps ? ` for ${p.reps} reps` : ""
            }${p.source === "logged" ? "" : ` (${p.source} record)`}`}
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
      {breaks.length > 0 && (
        <p className="mt-1.5 text-[11px] leading-snug text-muted">
          Shaded: {breaks.map((b) => b.label).join(", ")}. Hollow markers came from
          the old spreadsheet or the handoff, not from a logged session.
        </p>
      )}
    </figure>
  );
}
