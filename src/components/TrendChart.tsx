"use client";

import { useId, useState } from "react";
import { round } from "@/lib/nutrition";
import { formatDay } from "@/lib/labels";

export interface TrendPoint {
  date: string;
  value: number;
  /** False for days with no entries at all — drawn as an empty slot. */
  logged: boolean;
}

/** A stretch of not-logging with a reason — shaded so a gap reads as a trip. */
export interface TrendBreak {
  start: string;
  end: string;
  label: string;
}

interface Props {
  title: string;
  unit: string;
  points: TrendPoint[];
  color: string;
  /**
   * The day "Today" refers to — the build day, passed down rather than read
   * from the clock so the pre-rendered labels and the hydrated ones match.
   */
  today: string;
  /** Single reference line, e.g. the calorie target. */
  goal?: number;
  /** Reference band, e.g. the protein 160–180 g target. */
  band?: { min: number; max: number };
  /**
   * Shaded behind the bars, from `data/breaks.csv`. Without them a run of
   * short days reads as a diet that fell apart, when it was a week away from
   * a kitchen — which is the same job breaks.csv already does for training.
   */
  breaks?: TrendBreak[];
  height?: number;
}

/**
 * Daily totals over time. Deliberately two separate charts rather than one
 * with two y-axes — calories and grams don't share a scale, and a dual-axis
 * chart lets you draw any relationship you like between them.
 *
 * Bars rather than a line because the days are discrete and some are missing:
 * a line would interpolate straight through a day you didn't log and imply
 * you ate something you didn't.
 */
export function TrendChart({
  title,
  unit,
  points,
  color,
  today,
  goal,
  band,
  breaks = [],
  height = 132,
}: Props) {
  const [hover, setHover] = useState<number | null>(null);
  const clipId = useId();

  const ceiling = Math.max(
    ...points.map((p) => p.value),
    goal ?? 0,
    band?.max ?? 0,
    1,
  );
  // Headroom so a record day doesn't touch the top edge.
  const scaleMax = ceiling * 1.12;

  const W = 100; // viewBox units; the SVG stretches to its container
  // A fixed gap outgrows the width once there are enough bars — at 90 days
  // 1.6 units of gap consumes 142 of the 100 available and the bars come out
  // negative, which browsers drop silently rather than clamp. Capping the gap
  // at half a slot keeps 7/14/30 exactly as they were and only binds at 90.
  const gap = Math.min(1.6, W / points.length / 2);
  const barW = (W - gap * (points.length - 1)) / points.length;

  const y = (v: number) => height - (v / scaleMax) * height;

  // Breaks are date ranges; the chart is a list of columns. Map one to the
  // other by index so a shaded band lines up with the bars it covers, and drop
  // any break that falls entirely outside the window.
  const shaded = breaks
    .map((b) => {
      const first = points.findIndex((p) => p.date >= b.start && p.date <= b.end);
      if (first === -1) return null;
      let last = first;
      while (last + 1 < points.length && points[last + 1].date <= b.end) last++;
      // Half a gap of bleed at each end, so the band brackets its columns
      // rather than stopping flush against the first and last bar — clamped to
      // the viewBox, because a break touching either end would otherwise run
      // off it and rely on the SVG viewport to hide the overhang.
      const x = Math.max(0, first * (barW + gap) - gap / 2);
      const right = Math.min(W, last * (barW + gap) + barW + gap / 2);
      return { label: b.label, x, width: right - x };
    })
    .filter((v): v is NonNullable<typeof v> => v !== null);

  const active = hover !== null ? points[hover] : null;
  const activeBreak =
    active && breaks.find((b) => active.date >= b.start && active.date <= b.end);

  return (
    <figure className="card p-4">
      <figcaption className="mb-3 flex items-baseline justify-between gap-2">
        <h3 className="text-sm font-semibold">{title}</h3>
        <span className="tnum text-xs text-muted">
          {active
            ? `${formatDay(active.date, today)} · ${active.logged ? `${round(active.value)} ${unit}` : "not logged"}${activeBreak ? ` · ${activeBreak.label}` : ""}`
            : goal
              ? `target ${round(goal)} ${unit}`
              : band
                ? `target ${band.min}–${band.max} ${unit}`
                : ""}
        </span>
      </figcaption>

      <div
        className="relative"
        onMouseLeave={() => setHover(null)}
        style={{ height }}
      >
        <svg
          width="100%"
          height={height}
          viewBox={`0 0 ${W} ${height}`}
          preserveAspectRatio="none"
          role="img"
          aria-label={`${title} over ${points.length} days`}
        >
          <defs>
            <clipPath id={clipId}>
              <rect x="0" y="0" width={W} height={height} />
            </clipPath>
          </defs>

          {/* Breaks go down first, behind even the target band: they are the
              reason for the shape of the data, not a reading on it. Same fill
              as the week strip's "off" chip, so a break looks the same on both
              sides of the page. */}
          {shaded.map((b) => (
            <rect
              key={b.label + b.x}
              x={b.x}
              y="0"
              width={b.width}
              height={height}
              fill="var(--track)"
            />
          ))}

          {/* Target band sits behind the bars as recessive context. */}
          {band && (
            <rect
              x="0"
              y={y(band.max)}
              width={W}
              height={Math.max(0, y(band.min) - y(band.max))}
              fill={color}
              opacity={0.1}
            />
          )}

          {/* Reference lines, hairline weight — chrome, not data. */}
          {goal !== undefined && (
            <line
              x1="0"
              x2={W}
              y1={y(goal)}
              y2={y(goal)}
              stroke="var(--baseline)"
              strokeWidth="0.5"
              strokeDasharray="2 2"
              vectorEffect="non-scaling-stroke"
            />
          )}
          {band && (
            <line
              x1="0"
              x2={W}
              y1={y(band.min)}
              y2={y(band.min)}
              stroke="var(--baseline)"
              strokeWidth="0.5"
              strokeDasharray="2 2"
              vectorEffect="non-scaling-stroke"
            />
          )}

          <g clipPath={`url(#${clipId})`}>
            {points.map((p, i) => {
              const x = i * (barW + gap);
              const h = p.logged ? Math.max(height - y(p.value), 1.5) : 0;
              const isHover = hover === i;
              return (
                <g key={p.date}>
                  {/* Empty slot so unlogged days read as absent, not as zero. */}
                  {!p.logged && (
                    <rect
                      x={x}
                      y={height - 2}
                      width={barW}
                      height={2}
                      rx={1}
                      fill="var(--track)"
                    />
                  )}
                  {p.logged && (
                    <rect
                      x={x}
                      y={height - h}
                      width={barW}
                      height={h}
                      rx={1.4}
                      fill={color}
                      opacity={hover === null || isHover ? 1 : 0.45}
                      className="transition-opacity duration-150"
                    />
                  )}
                </g>
              );
            })}
          </g>

          {/* Baseline */}
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

        {/* Hit targets are full-height columns, wider than the bars. Tapping
            has to work as well as hovering — there is no hover on a phone, and
            without a click handler the whole chart is unreadable on touch. */}
        <div className="absolute inset-0 flex" onMouseLeave={() => setHover(null)}>
          {points.map((p, i) => (
            <button
              key={p.date}
              type="button"
              className="h-full flex-1 cursor-pointer"
              onMouseEnter={() => setHover(i)}
              onFocus={() => setHover(i)}
              onBlur={() => setHover(null)}
              onClick={() => setHover((h) => (h === i ? null : i))}
              aria-label={`${formatDay(p.date, today)}: ${p.logged ? `${round(p.value)} ${unit}` : "not logged"}${
                breaks.some((b) => p.date >= b.start && p.date <= b.end)
                  ? ` (${breaks.find((b) => p.date >= b.start && p.date <= b.end)!.label})`
                  : ""
              }`}
            />
          ))}
        </div>
      </div>

      <div className="mt-2 flex justify-between text-[10px] text-muted">
        <span>{formatDay(points[0]?.date ?? "", today)}</span>
        <span>{formatDay(points[points.length - 1]?.date ?? "", today)}</span>
      </div>
    </figure>
  );
}
