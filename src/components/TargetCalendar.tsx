import type { CSSProperties } from "react";
import type { Goals, LogEntry } from "@/lib/types";
import {
  addDays,
  entryMacros,
  parseDateKey,
  round,
  targetStatus,
  toDateKey,
  type TargetStatus,
} from "@/lib/nutrition";
import { formatFullDay } from "@/lib/labels";
import type { TrendBreak } from "@/components/TrendChart";

/**
 * Every month since the first logged day as a small calendar, each day
 * coloured by which targets it met. Asked for on October 20, 2026, beside the
 * on-target tiles.
 *
 * Two yes/no readings make four states, so it wears the status scale rather
 * than a ramp: green for both, yellow for protein alone (calories went over),
 * orange for calories alone (protein came up short), red for neither. A
 * diet-break day follows the same rule, faded, because the tiles leave it out.
 * A day nobody logged is a dashed outline, missing data rather than a miss,
 * and the build day stays unfilled until it's over, as it does in the tiles.
 *
 * Standing, like the tiles: the months don't move with the selected day. The
 * selected day is ringed, and any logged-range cell selects its day.
 */

const STATUS: Record<TargetStatus, { color: string; label: string; detail: string }> = {
  both: { color: "var(--status-good)", label: "Both", detail: "both targets hit" },
  protein: {
    color: "var(--status-warning)",
    label: "Protein only",
    detail: "protein hit, calories over",
  },
  calories: {
    color: "var(--status-serious)",
    label: "Calories only",
    detail: "calories under, protein short",
  },
  neither: {
    color: "var(--status-critical)",
    label: "Neither",
    detail: "calories over, protein short",
  },
};

/** How much of the status colour a break day keeps. */
const BREAK_MIX = 50;

const WEEKDAYS = ["M", "T", "W", "T", "F", "S", "S"];

const mondayOf = (key: string) =>
  addDays(key, -((parseDateKey(key).getDay() + 6) % 7));

/** The first of the next month, from a first of the month. */
const nextMonth = (key: string) => {
  const d = parseDateKey(key);
  d.setMonth(d.getMonth() + 1);
  return toDateKey(d);
};

interface Props {
  entries: LogEntry[];
  goals: Goals;
  /** Build day: unfinished, so never scored. Nothing after it is drawn. */
  builtOn: string;
  /** The diet breaks, faded rather than left out. */
  breaks: TrendBreak[];
  selected: string;
  onSelect: (date: string) => void;
}

export function TargetCalendar({
  entries,
  goals,
  builtOn,
  breaks,
  selected,
  onSelect,
}: Props) {
  if (entries.length === 0) return null;

  const totals = new Map<string, { calories: number; protein: number }>();
  for (const e of entries) {
    const m = entryMacros(e);
    const t = totals.get(e.date) ?? { calories: 0, protein: 0 };
    t.calories += m.calories;
    t.protein += m.protein;
    totals.set(e.date, t);
  }
  const first = [...totals.keys()].sort()[0];

  // Newest month first, so the current one leads on a phone.
  const months: string[] = [];
  for (let m = `${first.slice(0, 7)}-01`; m <= builtOn; m = nextMonth(m)) {
    months.unshift(m);
  }

  const cell = (date: string, month: string) => {
    if (date.slice(0, 7) !== month.slice(0, 7)) return <div key={date} />;

    const day = Number(date.slice(8));
    const ring: CSSProperties | undefined =
      date === selected
        ? { outline: "2px solid var(--text-primary)", outlineOffset: 1 }
        : undefined;
    const base =
      "tnum flex h-[22px] items-center justify-center rounded-[4px] text-[10px] leading-none";

    if (date < first || date > builtOn) {
      return (
        <div key={date} className={`${base} text-muted opacity-50`}>
          {day}
        </div>
      );
    }

    const t = totals.get(date);
    const brk = breaks.find((b) => date >= b.start && date <= b.end);
    let className = base;
    let style: CSSProperties = { ...ring };
    let title = formatFullDay(date);

    if (t === undefined) {
      className += " border border-dashed border-hairline text-muted";
      title += " · nothing logged";
    } else {
      title += ` · ${round(t.calories).toLocaleString("en-US")} kcal · ${round(t.protein, 1)} g protein`;
      if (date === builtOn) {
        className += " border border-hairline text-ink";
        title += " · in progress";
      } else {
        const s = STATUS[targetStatus(t, goals)];
        style = {
          ...style,
          // A faded fill takes the theme's ink, since what sits under it
          // flips between light and dark; a full fill keeps a fixed dark one,
          // which reads on all four status colours in both themes.
          background: brk
            ? `color-mix(in srgb, ${s.color} ${BREAK_MIX}%, transparent)`
            : s.color,
          color: brk ? "var(--text-primary)" : "#0b0b0b",
        };
        title += ` · ${s.detail}`;
      }
      if (brk) title += ` · ${brk.label}`;
    }

    return (
      <button
        key={date}
        type="button"
        onClick={() => onSelect(date)}
        aria-label={title}
        title={title}
        className={className}
        style={style}
      >
        {day}
      </button>
    );
  };

  return (
    <section className="card p-4">
      <h2 className="text-sm font-semibold">Calendar</h2>

      <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-4 sm:grid-cols-3">
        {months.map((month) => {
          const lastSunday = addDays(mondayOf(addDays(nextMonth(month), -1)), 6);
          const days: string[] = [];
          for (let d = mondayOf(month); d <= lastSunday; d = addDays(d, 1)) days.push(d);
          return (
            <div key={month} className="min-w-0">
              <div className="mb-1 text-xs font-medium text-ink-2">
                {parseDateKey(month).toLocaleDateString("en-US", { month: "long" })}
              </div>
              <div className="grid grid-cols-7 gap-[2px]">
                {WEEKDAYS.map((w, i) => (
                  <div key={i} className="text-center text-[9px] text-muted">
                    {w}
                  </div>
                ))}
                {days.map((d) => cell(d, month))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted">
        {Object.values(STATUS).map((s) => (
          <span key={s.label} className="flex items-center gap-1.5">
            <span className="h-[10px] w-[10px] rounded-[2px]" style={{ background: s.color }} />
            {s.label}
          </span>
        ))}
        <span className="flex items-center gap-1.5">
          <span
            className="h-[10px] w-[10px] rounded-[2px]"
            style={{
              background: `color-mix(in srgb, var(--status-good) ${BREAK_MIX}%, transparent)`,
            }}
          />
          Break, faded
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-[10px] w-[10px] rounded-[2px] border border-dashed border-hairline" />
          Not logged
        </span>
      </div>
    </section>
  );
}
