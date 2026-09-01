"use client";

import { useMemo } from "react";
import Link from "next/link";
import type { Goals, LogEntry } from "@/lib/types";
import {
  addDays,
  computeProgress,
  entriesForDate,
  loggedDates,
  microTotals,
  proteinPace,
  rollingAverage,
  round,
  sumEntries,
} from "@/lib/nutrition";
import { formatDay, formatFullDay } from "@/lib/labels";
import { BUILTIN_FOODS, suggestGapClosers } from "@/lib/search";
import type { BodyweightPoint } from "@/lib/training";
import { CalorieRing, MacroSplit, Micros, ProteinRing } from "@/components/Meters";
import { MealList } from "@/components/MealList";
import { GapClosers, StatTile } from "@/components/StatTiles";
import { TrendChart, type TrendBreak, type TrendPoint } from "@/components/TrendChart";
import { BodyweightChart } from "@/components/BodyweightChart";

interface Props {
  /** The whole log, parsed from `data/log.csv` on the build machine. */
  entries: LogEntry[];
  goals: Goals;
  /** Local calendar date of the build. Stands in for "today". */
  builtOn: string;
  /** Local hour of the build, 0–23. Only the protein pace reads it. */
  builtHour: number;
  /** Computed server-side, because `proteinStreak` reads the clock. */
  streak: number;
  /** Bodyweight readings — training-file data that renders with the food. */
  bodyweight: BodyweightPoint[];
  /** Shaded on the trend charts, so a week away doesn't read as a collapse. */
  breaks: TrendBreak[];
  /** The day being looked at. Owned by `TodayView`, shared with training. */
  date: string;
  onDateChange: (date: string) => void;
}

/**
 * The dashboard. Every number on it is derived from props — there is no store,
 * no fetch and no write path, and the only state is which day you are looking
 * at.
 *
 * Nothing here reads the clock. "Today" is `builtOn`, threaded down from the
 * server component, because a page pre-rendered on the build machine and then
 * hydrated in a browser has to produce the same markup twice, and the clock is
 * the one thing guaranteed to have moved in between. It is also the honest
 * reading: this build cannot know about anything that happened after it.
 */
export function Dashboard({
  entries,
  goals,
  builtOn,
  builtHour,
  streak,
  bodyweight,
  breaks,
  date,
  onDateChange,
}: Props) {
  const dates = useMemo(() => loggedDates(entries), [entries]);

  // Don't walk forward past the snapshot, or past the last logged day if the
  // log somehow runs ahead of the build.
  const horizon = dates[0] && dates[0] > builtOn ? dates[0] : builtOn;
  const atHorizon = date >= horizon;
  const isSnapshotDay = date === builtOn;

  const dayEntries = useMemo(() => entriesForDate(entries, date), [entries, date]);
  const totals = useMemo(() => sumEntries(dayEntries), [dayEntries]);
  const micros = useMemo(() => microTotals(dayEntries), [dayEntries]);
  const progress = useMemo(() => computeProgress(totals, goals), [totals, goals]);

  /**
   * `proteinPace` only reads `getHours()`, so a date carrying the build hour
   * and nothing else gives both renders the same answer. The pace is therefore
   * "as of when this snapshot was taken", which is the only sense it can have.
   */
  const pace = useMemo(
    () => proteinPace(totals, goals, new Date(2000, 0, 1, builtHour)),
    [totals, goals, builtHour],
  );

  const gapClosers = useMemo(
    () =>
      suggestGapClosers(
        BUILTIN_FOODS,
        progress.protein.toMin,
        progress.calories.remaining,
      ),
    [progress.protein.toMin, progress.calories.remaining],
  );

  /*
   * The whole log, not a trailing window. This was the last 14 days ending on
   * the selected day until August 19, 2026, which made it the third element on
   * the page that moved when you stepped back a day — and the only one where
   * that motion cost something, because a 14-day window is exactly wide enough
   * to hide whether a bad week is a bad week or the normal state of things.
   * Reading a trend means seeing all of it.
   *
   * That makes these two standing elements, like the bodyweight chart below
   * and the week strip opposite: historical context rather than a day's
   * record. The day columns either side of them are still one selected day.
   *
   * Every calendar day between the first entry and the build day gets a slot,
   * including the ones with nothing in them — a gap is the point, and the
   * break shading is what tells a trip apart from a lapse.
   */
  const trend = useMemo(() => {
    const cal: TrendPoint[] = [];
    const prot: TrendPoint[] = [];
    const fiber: TrendPoint[] = [];
    const sodium: TrendPoint[] = [];
    const first = dates[dates.length - 1];
    if (!first) return { cal, prot, fiber, sodium };
    for (let d = first; d <= horizon; d = addDays(d, 1)) {
      const es = entriesForDate(entries, d);
      const t = sumEntries(es);
      cal.push({ date: d, value: t.calories, logged: es.length > 0 });
      prot.push({ date: d, value: t.protein, logged: es.length > 0 });
      // Micros key off recordedRows, not on the day having entries: a day
      // where nothing recorded sodium is an empty slot, not a zero-sodium
      // day, and a day where only some rows did is a floor.
      const m = microTotals(es);
      for (const [pts, mt] of [
        [fiber, m.fiber],
        [sodium, m.sodium],
      ] as const) {
        pts.push({
          date: d,
          value: mt.total,
          logged: mt.recordedRows > 0,
          partial: mt.recordedRows < mt.totalRows,
        });
      }
    }
    return { cal, prot, fiber, sodium };
  }, [entries, dates, horizon]);

  const { avg: avg7, loggedDays: logged7 } = useMemo(
    () => rollingAverage(entries, date, 7),
    [entries, date],
  );

  return (
    <div className="space-y-6">
      {/* Date bar — navigation only. Nothing on this page changes the log. */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => onDateChange(addDays(date, -1))}
          aria-label="Previous day"
          className="rounded-lg border border-hairline px-2.5 py-1.5 text-ink-2 hover:bg-surface-2"
        >
          ‹
        </button>
        <h1 className="text-lg font-semibold">{formatDay(date, builtOn)}</h1>
        <button
          onClick={() => onDateChange(addDays(date, 1))}
          disabled={atHorizon}
          aria-label="Next day"
          className="rounded-lg border border-hairline px-2.5 py-1.5 text-ink-2 hover:bg-surface-2 disabled:opacity-30"
        >
          ›
        </button>
        {!isSnapshotDay && (
          <button
            onClick={() => onDateChange(builtOn)}
            className="rounded-lg px-2 py-1.5 text-sm font-medium text-protein hover:bg-surface-2"
          >
            Today
          </button>
        )}

        {/* Stepping a day at a time is fine for a run of consecutive days and
            useless for a log with gaps in it, so the logged days are also a
            list you can jump straight into. */}
        {dates.length > 1 && (
          <label className="ml-auto flex items-center gap-1.5 text-xs text-muted">
            Jump to
            <select
              value={dates.includes(date) ? date : ""}
              onChange={(e) => e.target.value && onDateChange(e.target.value)}
              className="rounded-lg border border-hairline bg-surface-2 px-2 py-1.5 text-xs text-ink outline-none"
            >
              {!dates.includes(date) && (
                <option value="">{formatDay(date, builtOn)} · nothing logged</option>
              )}
              {dates.map((d) => (
                <option key={d} value={d}>
                  {formatDay(d, builtOn)}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      {/* Hero meters */}
      <section className="card p-5">
        {/* A narrower gap on phones is what keeps the two rings side by side
            there; at gap-8 the pair no longer fits 430 px and wraps into a
            column twice as tall. */}
        <div className="flex flex-wrap items-center justify-center gap-4 sm:justify-around sm:gap-8">
          <CalorieRing consumed={totals.calories} goal={goals.calories} />
          <ProteinRing
            consumed={totals.protein}
            min={goals.proteinMin}
            max={goals.proteinMax}
          />
        </div>
        <div className="mt-5 border-t border-hairline pt-4">
          <MacroSplit
            protein={totals.protein}
            carbs={totals.carbs}
            fat={totals.fat}
          />
        </div>
        {dayEntries.length > 0 && (
          <div className="mt-4 border-t border-hairline pt-4">
            <Micros
              fiber={micros.fiber}
              sugar={micros.sugar}
              sodium={micros.sodium}
              fiberGoal={goals.fiber}
            />
          </div>
        )}
      </section>

      {/* KPI row. Back to 2×2 at lg, where the dashboard shares the page with
          the training column and four-across tiles would be crushed. */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-2">
        {isSnapshotDay ? (
          <StatTile
            label="Protein pace"
            value={progress.protein.toMin === 0 ? "Done" : `${round(pace.perMeal)}g`}
            unit={progress.protein.toMin === 0 ? undefined : "/ meal"}
            hint={pace.label}
            tone={progress.protein.toMin === 0 ? "good" : "neutral"}
          />
        ) : (
          /* Pacing a day that is already over is meaningless, so a finished
             day reports what it finished on instead. */
          <StatTile
            label="Protein result"
            value={progress.protein.toMin === 0 ? "Met" : `${round(progress.protein.toMin)}g`}
            unit={progress.protein.toMin === 0 ? undefined : "short"}
            hint={`Finished on ${round(totals.protein)}g of ${goals.proteinMin}g`}
            tone={progress.protein.toMin === 0 ? "good" : "neutral"}
          />
        )}
        <StatTile
          label="Protein streak"
          value={streak}
          unit={streak === 1 ? "day" : "days"}
          hint={
            streak === 0
              ? `Hit ${goals.proteinMin}g to start one`
              : "Consecutive days at target"
          }
          tone={streak >= 3 ? "good" : "neutral"}
        />
        <StatTile
          label="Avg kcal · 7d"
          value={logged7 > 0 ? round(avg7.calories).toLocaleString() : "—"}
          hint={
            logged7 > 0
              ? `Over ${logged7} logged day${logged7 === 1 ? "" : "s"} · target ${goals.calories.toLocaleString()}`
              : "No days logged yet"
          }
          tone={
            logged7 > 0 && Math.abs(avg7.calories - goals.calories) <= 200
              ? "good"
              : "neutral"
          }
        />
        <StatTile
          label="Avg protein · 7d"
          value={logged7 > 0 ? round(avg7.protein) : "—"}
          unit={logged7 > 0 ? "g" : undefined}
          hint={
            logged7 > 0
              ? `Over ${logged7} logged day${logged7 === 1 ? "" : "s"} · target ${goals.proteinMin}–${goals.proteinMax}g`
              : "No days logged yet"
          }
          tone={logged7 > 0 && avg7.protein >= goals.proteinMin ? "good" : "neutral"}
        />
      </div>

      {/* Gap closers — only when there's actually a gap to close. */}
      {progress.protein.toMin > 0 && dayEntries.length > 0 && (
        <GapClosers
          foods={gapClosers}
          needProtein={progress.protein.toMin}
          remainingCalories={progress.calories.remaining}
        />
      )}

      <MealList entries={dayEntries} />

      {dayEntries.length === 0 && (
        <div className="card p-8 text-center">
          <p className="text-sm text-ink-2">
            Nothing logged for {formatDay(date, builtOn).toLowerCase()}.
          </p>
          <p className="mx-auto mt-2 max-w-md text-xs leading-relaxed text-muted">
            {dates.length === 0
              ? "The log is empty. It lives in data/log.csv — once there are rows in it, this page fills in on the next build."
              : "Days are added by editing data/log.csv and pushing; the site rebuilds from the file."}
          </p>
        </div>
      )}

      {/* Trends — two charts, never one with two y-axes. */}
      <div className="grid gap-3 sm:grid-cols-2">
        <TrendChart
          title={`Calories · all ${trend.cal.length} days`}
          unit="kcal"
          points={trend.cal}
          color="var(--series-carbs)"
          today={builtOn}
          goal={goals.calories}
          breaks={breaks}
        />
        <TrendChart
          title={`Protein · all ${trend.prot.length} days`}
          unit="g"
          points={trend.prot}
          color="var(--series-protein)"
          today={builtOn}
          band={{ min: goals.proteinMin, max: goals.proteinMax }}
          breaks={breaks}
        />
        {/* Fiber and sodium sit under the two above rather than beside them
            because they are read second and are the weaker data: both are
            summed over only the rows that record them, so a hatched bar is a
            floor. Fiber takes the third macro slot — the one the two charts
            above leave free — and sodium takes the neutral ink on purpose,
            because goals.json sets no sodium target and a saturated series
            colour on an unscored reading implies one. */}
        <TrendChart
          title={`Fiber · all ${trend.fiber.length} days`}
          unit="g"
          points={trend.fiber}
          color="var(--series-fat)"
          today={builtOn}
          goal={goals.fiber}
          breaks={breaks}
        />
        <TrendChart
          title={`Sodium · all ${trend.sodium.length} days`}
          unit="mg"
          points={trend.sodium}
          color="var(--text-secondary)"
          today={builtOn}
          caption="no target set"
          breaks={breaks}
        />
      </div>

      {/* Standing, unlike the trends above — bodyweight is the diet's slow
          output, so it charts here and ignores the selected day. */}
      {bodyweight.length > 0 && (
        <BodyweightChart points={bodyweight} today={builtOn} height={130} />
      )}

      <p className="pb-2 text-center text-xs leading-relaxed text-muted">
        <Link href="/history" className="hover:text-ink">
          Full history &amp; export →
        </Link>
        <br />
        <span>Read-only snapshot of {formatFullDay(builtOn)}.</span>
      </p>
    </div>
  );
}
