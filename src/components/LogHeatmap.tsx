import type { Goals, LogEntry } from "@/lib/types";
import { addDays, entryMacros, parseDateKey, round } from "@/lib/nutrition";
import { formatFullDay } from "@/lib/labels";

/**
 * Every day of the log as one cell — weeks as columns, Monday at the top,
 * the shape a contribution graph draws for a log whose storage really is git.
 *
 * Three states, because the honest distinction is three-way: a day nobody
 * logged (dashed outline — missing data, not a zero day), a logged day short
 * of the protein floor (neutral fill), and a logged day at or over it (the
 * status green, paired with its legend label per the palette's relief rule).
 * There is no intensity ramp on purpose: protein against the band's floor is
 * a met/not-met reading, and shading "how hit" a hit day was would rank days
 * the band deliberately treats as equal.
 *
 * The window starts at the first logged day rather than a fixed lookback —
 * a fixed year of pre-log emptiness would read as a year of missed days.
 */

interface Props {
  entries: LogEntry[];
  goals: Goals;
  /** Build day — the grid's last cell, and the cell that gets the outline. */
  builtOn: string;
}

/** Monday of the week containing `key`, per the ISO week the grid rows use. */
const mondayOf = (key: string) =>
  addDays(key, -((parseDateKey(key).getDay() + 6) % 7));

const monthShort = (key: string) =>
  parseDateKey(key).toLocaleDateString("en-US", { month: "short" });

export function LogHeatmap({ entries, goals, builtOn }: Props) {
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
  const days: string[] = [];
  for (let d = mondayOf(first); d <= builtOn; d = addDays(d, 1)) days.push(d);

  const weeks: string[][] = [];
  for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7));

  // Coverage counts from the first logged day, not from its week's Monday —
  // the lead-in cells exist for grid alignment, not as days that were missed.
  const daysSinceFirst = days.length - days.indexOf(first);

  // A column is labelled when a month begins inside it. The first column gets
  // the label too, but only when no month boundary lands in the first few
  // columns to collide with.
  const monthLabels = weeks.map((week) =>
    week.some((d) => d.slice(8) === "01") ? monthShort(week[week.length - 1]) : "",
  );
  if (!monthLabels[0] && !monthLabels[1] && !monthLabels[2]) {
    monthLabels[0] = monthShort(weeks[0][0]);
  }

  return (
    <section className="card p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-sm font-semibold">Every day</h2>
        <span className="tnum text-xs text-muted">
          {totals.size} of {daysSinceFirst} days logged
        </span>
      </div>

      {/* Hidden from assistive tech: the Daily totals table below carries the
          same days with their numbers, row by row — this is the glanceable
          duplicate, not the record. */}
      <div aria-hidden className="mt-3 overflow-x-auto pb-1">
        <div className="min-w-max">
          <div className="flex gap-[3px]">
            <div className="w-7 shrink-0" />
            {weeks.map((week, i) => (
              <div
                key={week[0]}
                className="w-[13px] shrink-0 overflow-visible whitespace-nowrap text-[9px] text-muted"
              >
                {monthLabels[i]}
              </div>
            ))}
          </div>

          <div className="mt-1 flex gap-[3px]">
            <div className="flex w-7 shrink-0 flex-col gap-[3px] pr-1.5 text-right">
              {["M", "", "W", "", "F", "", ""].map((l, i) => (
                <div key={i} className="h-[13px] text-[9px] leading-[13px] text-muted">
                  {l}
                </div>
              ))}
            </div>

            {weeks.map((week) => (
              <div key={week[0]} className="flex flex-col gap-[3px]">
                {week.map((date) => {
                  const t = totals.get(date);
                  const hit = t !== undefined && t.protein >= goals.proteinMin;
                  return (
                    <div
                      key={date}
                      className={`h-[13px] w-[13px] rounded-[3px] ${
                        t === undefined
                          ? "border border-dashed border-hairline"
                          : hit
                            ? ""
                            : "border border-hairline bg-surface-2"
                      }`}
                      style={{
                        ...(hit ? { background: "var(--status-good)" } : undefined),
                        ...(date === builtOn
                          ? { outline: "1px solid var(--text-muted)", outlineOffset: 1 }
                          : undefined),
                      }}
                      title={
                        t === undefined
                          ? `${formatFullDay(date)} · nothing logged`
                          : `${formatFullDay(date)} · ${round(t.calories).toLocaleString("en-US")} kcal · ${round(t.protein)} g protein${hit ? " · protein target hit" : ""}`
                      }
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted">
        <span className="flex items-center gap-1.5">
          <span className="h-[10px] w-[10px] rounded-[2px] border border-dashed border-hairline" />
          nothing logged
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-[10px] w-[10px] rounded-[2px] border border-hairline bg-surface-2" />
          logged
        </span>
        <span className="flex items-center gap-1.5">
          <span
            className="h-[10px] w-[10px] rounded-[2px]"
            style={{ background: "var(--status-good)" }}
          />
          protein ≥ {goals.proteinMin} g
        </span>
      </div>

      <p className="mt-2 text-[11px] leading-snug text-muted">
        One cell per day since the first logged day, whatever the range picked
        above. An empty cell is a day nobody logged — missing data, not a zero
        day. The table below carries the same days with their numbers.
      </p>
    </section>
  );
}
