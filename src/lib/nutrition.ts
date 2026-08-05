import {
  type Goals,
  type LogEntry,
  type Macros,
  type MealSlot,
  ZERO_MACROS,
} from "./types";

/** Local calendar date as YYYY-MM-DD. Never use toISOString() — that's UTC. */
export function toDateKey(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function parseDateKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(key: string, delta: number): string {
  const d = parseDateKey(key);
  d.setDate(d.getDate() + delta);
  return toDateKey(d);
}

export function formatDateKey(key: string): string {
  const today = toDateKey();
  if (key === today) return "Today";
  if (key === addDays(today, -1)) return "Yesterday";
  return parseDateKey(key).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function scaleMacros(m: Macros, factor: number): Macros {
  return {
    calories: m.calories * factor,
    protein: m.protein * factor,
    carbs: m.carbs * factor,
    fat: m.fat * factor,
    fiber: m.fiber === undefined ? undefined : m.fiber * factor,
    sugar: m.sugar === undefined ? undefined : m.sugar * factor,
    sodium: m.sodium === undefined ? undefined : m.sodium * factor,
  };
}

export function addMacros(a: Macros, b: Macros): Macros {
  return {
    calories: a.calories + b.calories,
    protein: a.protein + b.protein,
    carbs: a.carbs + b.carbs,
    fat: a.fat + b.fat,
    fiber: (a.fiber ?? 0) + (b.fiber ?? 0),
    sugar: (a.sugar ?? 0) + (b.sugar ?? 0),
    sodium: (a.sodium ?? 0) + (b.sodium ?? 0),
  };
}

export function entryMacros(e: LogEntry): Macros {
  return scaleMacros(e.macros, e.servings);
}

export function sumEntries(entries: LogEntry[]): Macros {
  return entries.reduce((acc, e) => addMacros(acc, entryMacros(e)), {
    ...ZERO_MACROS,
  });
}

export function entriesForDate(entries: LogEntry[], date: string): LogEntry[] {
  return entries.filter((e) => e.date === date);
}

export function groupBySlot(entries: LogEntry[]): Record<MealSlot, LogEntry[]> {
  const out: Record<MealSlot, LogEntry[]> = {
    breakfast: [],
    lunch: [],
    dinner: [],
    snack: [],
  };
  for (const e of entries) out[e.slot].push(e);
  return out;
}

/** Round for display without pretending to a precision the data doesn't have. */
export function round(n: number, places = 0): number {
  const f = 10 ** places;
  return Math.round(n * f) / f;
}

export interface GoalProgress {
  calories: {
    consumed: number;
    goal: number;
    remaining: number;
    pct: number;
  };
  protein: {
    consumed: number;
    min: number;
    max: number;
    /** Grams still needed to clear the minimum. 0 once the band is reached. */
    toMin: number;
    /** Progress toward the minimum, 0–1+ */
    pct: number;
    status: "under" | "in-band" | "over";
  };
  carbs: number;
  fat: number;
  fiber: number;
  /** Share of calories from each macro, 0–1. Sums to ~1 when data is sane. */
  split: { protein: number; carbs: number; fat: number };
}

export function computeProgress(totals: Macros, goals: Goals): GoalProgress {
  const proteinStatus: GoalProgress["protein"]["status"] =
    totals.protein < goals.proteinMin
      ? "under"
      : totals.protein > goals.proteinMax
        ? "over"
        : "in-band";

  const proteinKcal = totals.protein * 4;
  const carbKcal = totals.carbs * 4;
  const fatKcal = totals.fat * 9;
  const macroKcal = proteinKcal + carbKcal + fatKcal;

  return {
    calories: {
      consumed: totals.calories,
      goal: goals.calories,
      remaining: goals.calories - totals.calories,
      pct: goals.calories > 0 ? totals.calories / goals.calories : 0,
    },
    protein: {
      consumed: totals.protein,
      min: goals.proteinMin,
      max: goals.proteinMax,
      toMin: Math.max(0, goals.proteinMin - totals.protein),
      pct: goals.proteinMin > 0 ? totals.protein / goals.proteinMin : 0,
      status: proteinStatus,
    },
    carbs: totals.carbs,
    fat: totals.fat,
    fiber: totals.fiber ?? 0,
    split: {
      protein: macroKcal > 0 ? proteinKcal / macroKcal : 0,
      carbs: macroKcal > 0 ? carbKcal / macroKcal : 0,
      fat: macroKcal > 0 ? fatKcal / macroKcal : 0,
    },
  };
}

/**
 * Protein pacing. Splitting the remaining protein across the meals you have
 * left is a far more actionable number than a single end-of-day total — it is
 * the difference between "I'm 90 g short" and "that's 45 g at dinner and 45 g
 * in a shake", which is the actual decision.
 */
export function proteinPace(
  totals: Macros,
  goals: Goals,
  now: Date = new Date(),
): { mealsLeft: number; perMeal: number; label: string } {
  const hour = now.getHours();
  // Meals still plausibly ahead of you, counting a late snack.
  const mealsLeft = hour < 10 ? 3 : hour < 14 ? 3 : hour < 19 ? 2 : 1;
  const need = Math.max(0, goals.proteinMin - totals.protein);
  const perMeal = need / mealsLeft;

  let label: string;
  if (need === 0) {
    label = "Protein goal met";
  } else if (mealsLeft === 1) {
    label = `${round(need)}g left, one meal to go`;
  } else {
    label = `~${round(perMeal)}g per meal across ${mealsLeft} more`;
  }
  return { mealsLeft, perMeal, label };
}

/**
 * Rolling average over the last `days` days, inclusive of `endDate`.
 *
 * Divides by the number of days that actually have entries, not by the
 * calendar window. A day you never logged is missing data, not a zero-calorie
 * day, and averaging it in as zero drags every number toward the floor — one
 * logged day of 2,700 kcal would otherwise report as "386 kcal average".
 */
export function rollingAverage(
  entries: LogEntry[],
  endDate: string,
  days: number,
): { avg: Macros; loggedDays: number } {
  const keys = new Set<string>();
  for (let i = 0; i < days; i++) keys.add(addDays(endDate, -i));
  const inRange = entries.filter((e) => keys.has(e.date));
  const loggedDays = new Set(inRange.map((e) => e.date)).size;
  const total = sumEntries(inRange);
  return {
    avg: loggedDays > 0 ? scaleMacros(total, 1 / loggedDays) : { ...ZERO_MACROS },
    loggedDays,
  };
}

export interface MicroTotal {
  /** Sum over the rows that record this field, scaled by servings. */
  total: number;
  /** How many of the day's rows record it. */
  recordedRows: number;
  totalRows: number;
}

/**
 * Fiber, sugar and sodium, counting only the rows that record them. A blank
 * is *not recorded*, not zero, so a total over partial data is a floor — the
 * caller renders it as "≥" rather than passing it off as complete.
 */
export function microTotals(entries: LogEntry[]): {
  fiber: MicroTotal;
  sugar: MicroTotal;
  sodium: MicroTotal;
} {
  const make = (pick: (m: Macros) => number | undefined): MicroTotal => {
    let total = 0;
    let recordedRows = 0;
    for (const e of entries) {
      const v = pick(e.macros);
      if (v === undefined) continue;
      total += v * e.servings;
      recordedRows++;
    }
    return { total, recordedRows, totalRows: entries.length };
  };
  return {
    fiber: make((m) => m.fiber),
    sugar: make((m) => m.sugar),
    sodium: make((m) => m.sodium),
  };
}

/** Every date that has at least one entry, newest first. */
export function loggedDates(entries: LogEntry[]): string[] {
  return [...new Set(entries.map((e) => e.date))].sort().reverse();
}

/**
 * Consecutive days ending today (or yesterday, so the streak survives until
 * you log) on which protein cleared the minimum.
 */
export function proteinStreak(entries: LogEntry[], goals: Goals): number {
  const byDate = new Map<string, number>();
  for (const e of entries) {
    byDate.set(
      e.date,
      (byDate.get(e.date) ?? 0) + e.macros.protein * e.servings,
    );
  }
  const today = toDateKey();
  let cursor = (byDate.get(today) ?? 0) >= goals.proteinMin ? today : addDays(today, -1);
  let streak = 0;
  // `has` gates the walk, not just the threshold: an unlogged day must end the
  // streak even when the threshold is 0, which every day clears vacuously.
  while (byDate.has(cursor) && (byDate.get(cursor) ?? 0) >= goals.proteinMin) {
    streak++;
    cursor = addDays(cursor, -1);
  }
  return streak;
}
