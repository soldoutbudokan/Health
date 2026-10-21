import { useMemo, useRef, useState, type CSSProperties } from "react";
import type { Goals, LogEntry, MealSlot } from "@/lib/types";
import {
  addDays,
  entryMacros,
  parseDateKey,
  round,
  targetStatus,
  toDateKey,
  type TargetStatus,
} from "@/lib/nutrition";
import { formatDay, formatFullDay } from "@/lib/labels";
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
 * selected day is ringed, and any logged-range cell selects its day. Hovering
 * or focusing a cell opens a card with the day's two meters and where its
 * calories went, so a yellow day says how far over it ran.
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

const SLOTS: MealSlot[] = ["breakfast", "lunch", "dinner", "snack"];

/** The hover card's width, so it can be kept inside the calendar. */
const CARD_W = 232;

interface DayTotals {
  calories: number;
  protein: number;
  meals: Record<MealSlot, number>;
  /** The single biggest item by calories. */
  top: { name: string; calories: number };
}

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
  const sectionRef = useRef<HTMLElement>(null);
  const [hover, setHover] = useState<{
    date: string;
    x: number;
    top: number;
    bottom: number;
    width: number;
  } | null>(null);

  const totals = useMemo(() => {
    const out = new Map<string, DayTotals>();
    for (const e of entries) {
      const m = entryMacros(e);
      const t = out.get(e.date) ?? {
        calories: 0,
        protein: 0,
        meals: { breakfast: 0, lunch: 0, dinner: 0, snack: 0 },
        top: { name: "", calories: -1 },
      };
      t.calories += m.calories;
      t.protein += m.protein;
      t.meals[e.slot] += m.calories;
      if (m.calories > t.top.calories) t.top = { name: e.name, calories: m.calories };
      out.set(e.date, t);
    }
    return out;
  }, [entries]);

  if (entries.length === 0) return null;
  const first = [...totals.keys()].sort()[0];

  const show = (date: string, el: HTMLElement) => {
    const box = sectionRef.current?.getBoundingClientRect();
    if (!box) return;
    const r = el.getBoundingClientRect();
    setHover({
      date,
      x: r.left + r.width / 2 - box.left,
      top: r.top - box.top,
      bottom: r.bottom - box.top,
      width: box.width,
    });
  };

  // Oldest month first, so time runs left to right like the trend charts.
  const months: string[] = [];
  for (let m = `${first.slice(0, 7)}-01`; m <= builtOn; m = nextMonth(m)) {
    months.push(m);
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
    // The card is for the eye; the label carries the same day for a reader.
    let label = formatFullDay(date);

    if (t === undefined) {
      className += " border border-dashed border-hairline text-muted";
      label += " · nothing logged";
    } else {
      label += ` · ${round(t.calories).toLocaleString("en-US")} kcal · ${round(t.protein, 1)} g protein`;
      if (date === builtOn) {
        className += " border border-hairline text-ink";
        label += " · in progress";
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
        label += ` · ${s.detail}`;
      }
      if (brk) label += ` · ${brk.label}`;
    }

    return (
      <button
        key={date}
        type="button"
        onClick={() => onSelect(date)}
        onMouseEnter={(e) => show(date, e.currentTarget)}
        onFocus={(e) => show(date, e.currentTarget)}
        onBlur={() => setHover(null)}
        aria-label={label}
        className={className}
        style={style}
      >
        {day}
      </button>
    );
  };

  return (
    <section
      ref={sectionRef}
      className="card relative p-4"
      onMouseLeave={() => setHover(null)}
    >
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

      {hover && (
        <DayCard
          date={hover.date}
          t={totals.get(hover.date)}
          goals={goals}
          builtOn={builtOn}
          brk={breaks.find((b) => hover.date >= b.start && hover.date <= b.end)}
          style={{
            width: CARD_W,
            left: Math.max(4, Math.min(hover.x - CARD_W / 2, hover.width - CARD_W - 4)),
            // Above the cell when there's room, which keeps the finger or
            // pointer off it; below on the top row.
            ...(hover.top > 180
              ? { top: hover.top - 8, transform: "translateY(-100%)" }
              : { top: hover.bottom + 8 }),
          }}
        />
      )}
    </section>
  );
}

function DayCard({
  date,
  t,
  goals,
  builtOn,
  brk,
  style,
}: {
  date: string;
  t: DayTotals | undefined;
  goals: Goals;
  builtOn: string;
  brk: TrendBreak | undefined;
  style: CSSProperties;
}) {
  const status = t && date !== builtOn ? STATUS[targetStatus(t, goals)] : undefined;
  const meals = t ? SLOTS.filter((s) => t.meals[s] > 0) : [];

  return (
    <div
      aria-hidden
      className="card pointer-events-none absolute z-20 p-3 text-xs"
      style={{ ...style, boxShadow: "0 6px 24px rgba(0,0,0,0.18)" }}
    >
      <div className="flex items-baseline justify-between gap-2">
        <span className="font-semibold">{formatDay(date, builtOn)}</span>
        {brk && <span className="truncate text-[11px] text-muted">{brk.label}</span>}
      </div>

      {t === undefined ? (
        <p className="mt-1.5 text-muted">Nothing logged.</p>
      ) : (
        <>
          <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-ink-2">
            <span
              className="h-[10px] w-[10px] shrink-0 rounded-[2px]"
              style={{
                background: status
                  ? brk
                    ? `color-mix(in srgb, ${status.color} ${BREAK_MIX}%, transparent)`
                    : status.color
                  : undefined,
                border: status ? undefined : "1px solid var(--hairline)",
              }}
            />
            {status
              ? status.detail[0].toUpperCase() + status.detail.slice(1)
              : "In progress"}
          </div>

          <Meter
            label="Calories"
            value={`${round(t.calories).toLocaleString("en-US")} / ${goals.calories.toLocaleString("en-US")}`}
            amount={t.calories}
            scale={Math.max(goals.calories, t.calories) * 1.08}
            color="var(--series-carbs)"
            ticks={[goals.calories]}
          />
          <Meter
            label="Protein"
            value={`${round(t.protein)}g / ${goals.proteinMin}–${goals.proteinMax}g`}
            amount={t.protein}
            scale={Math.max(goals.proteinMax, t.protein) * 1.08}
            color="var(--series-protein)"
            band={[goals.proteinMin, goals.proteinMax]}
          />

          {meals.length > 0 && (
            <div className="mt-2.5 border-t border-hairline pt-2 text-[11px]">
              <div
                className="grid gap-1"
                style={{ gridTemplateColumns: `repeat(${meals.length}, minmax(0, 1fr))` }}
              >
                {meals.map((s) => (
                  <div key={s} className="min-w-0">
                    <div className="truncate text-[10px] text-muted">
                      {s[0].toUpperCase() + s.slice(1)}
                    </div>
                    <div className="tnum">{round(t.meals[s]).toLocaleString("en-US")}</div>
                  </div>
                ))}
              </div>
              <div className="mt-1.5 flex justify-between gap-2 text-ink-2">
                <span className="truncate">Biggest: {t.top.name}</span>
                <span className="tnum shrink-0">
                  {round(t.top.calories).toLocaleString("en-US")} kcal
                </span>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

/** A thin bar against its target: a tick at a goal, a shaded band for a range. */
function Meter({
  label,
  value,
  amount,
  scale,
  color,
  ticks = [],
  band,
}: {
  label: string;
  value: string;
  amount: number;
  scale: number;
  color: string;
  ticks?: number[];
  band?: [number, number];
}) {
  const pct = (n: number) => `${Math.min(100, (n / scale) * 100)}%`;
  return (
    <div className="mt-2">
      <div className="flex items-baseline justify-between text-[11px]">
        <span className="text-muted">{label}</span>
        <span className="tnum">{value}</span>
      </div>
      <div className="relative mt-1 h-[6px] rounded-full bg-surface-2">
        {band && (
          <div
            className="absolute inset-y-0"
            style={{
              left: pct(band[0]),
              width: `calc(${pct(band[1])} - ${pct(band[0])})`,
              background: `color-mix(in srgb, ${color} 25%, transparent)`,
            }}
          />
        )}
        <div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{ width: pct(amount), background: color }}
        />
        {[...ticks, ...(band ?? [])].map((v) => (
          <div
            key={v}
            className="absolute -top-[2px] h-[10px] w-[2px] rounded-full"
            style={{ left: `calc(${pct(v)} - 1px)`, background: "var(--text-secondary)" }}
          />
        ))}
      </div>
    </div>
  );
}
