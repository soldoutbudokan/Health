import { addDays, parseDateKey, round } from "./nutrition";
import { PROGRAM, type PlannedExercise, type PlannedSession } from "@/data/program";
import {
  GYM_SESSIONS,
  type Checkin,
  type Session,
  type TrainingBreak,
  type TrainingGoal,
  type TrainingGoals,
  type WorkoutSet,
} from "./trainingTypes";

/**
 * Everything computed about training. Pure functions over the parsed files,
 * so both the server components and the tests can call them.
 *
 * The one rule that runs through all of it: an absent number is absent, not
 * zero. A session with no bodyweight recorded is not a session at 0 lbs, and
 * a week with no sessions logged is not a week of no training — it might be a
 * week nobody wrote down. `data/breaks.csv` exists to tell those two apart.
 */

/* ------------------------------------------------------------------ names */

/**
 * The same lift gets written a dozen ways across a spreadsheet, a handoff
 * document and whatever gets typed on a given evening: "Pullups", "Pull ups",
 * "pull-ups". Comparison against the plan is worthless if "Cable row" and
 * "Seated row" read as different exercises, so everything is folded to a
 * canonical key before it is matched.
 */
const ALIASES: Record<string, string> = {
  pullup: "pullups",
  pullups: "pullups",
  chinup: "pullups",
  chinups: "pullups",
  bench: "bench press",
  benchpress: "bench press",
  flatbenchpress: "bench press",
  inclinebench: "incline bench press",
  inclinebenchpress: "incline bench press",
  seatedrow: "cable row",
  cablerow: "cable row",
  row: "cable row",
  latpull: "lat pulldown",
  latpulldown: "lat pulldown",
  preachercurl: "preacher curl",
  preachercurls: "preacher curl",
  seatedyraise: "seated y raise",
  yraise: "seated y raise",
  dip: "dips",
  dips: "dips",
  deadlift: "trap bar deadlift",
  trapbardeadlift: "trap bar deadlift",
  smithsquat: "smith machine squat",
  smithmachinesquat: "smith machine squat",
  squat: "smith machine squat",
  legcurl: "lying leg curl",
  lyinglegcurl: "lying leg curl",
  lyinghamstringcurl: "lying leg curl",
  hamstringcurl: "lying leg curl",
  jump: "jumps",
  jumps: "jumps",
  maxjumps: "jumps",
  sled: "sled",
  sledpushpull: "sled",
  shoulderwarmup: "shoulder warmup",
  shoulderwarmups: "shoulder warmup",
  pushup: "pushups",
  pushups: "pushups",
};

export function canonical(name: string): string {
  const stripped = name.toLowerCase().replace(/[^a-z0-9]/g, "");
  return ALIASES[stripped] ?? name.trim().toLowerCase();
}

export const sameExercise = (a: string, b: string) => canonical(a) === canonical(b);

/* --------------------------------------------------------------- sessions */

export function setsOn(sets: WorkoutSet[], date: string): WorkoutSet[] {
  return sets.filter((s) => s.date === date);
}

export function sessionOn(sessions: Session[], date: string): Session | undefined {
  return sessions.find((s) => s.date === date);
}

/** The most recent session that was actually logged, if there is one. */
export function latestSession(sessions: Session[]): Session | undefined {
  return sessions.length ? sessions[sessions.length - 1] : undefined;
}

/** Sets belonging to a real session, in the order they were performed. */
export function sessionSets(sets: WorkoutSet[], date: string): WorkoutSet[] {
  return setsOn(sets, date)
    .filter((s) => s.session)
    .sort((a, b) => a.order - b.order);
}

/** Distinct exercises in a session, each with its sets, in performed order. */
export function byExercise(sets: WorkoutSet[]): { exercise: string; sets: WorkoutSet[] }[] {
  const out: { exercise: string; sets: WorkoutSet[] }[] = [];
  for (const s of sets) {
    // Matched on the *raw* name, not the canonical one: the sled appears twice
    // in a session as warmup and finisher, and those are two entries, not one.
    const last = out[out.length - 1];
    if (last && last.exercise === s.exercise && last.sets[0].kind === s.kind) {
      last.sets.push(s);
    } else {
      out.push({ exercise: s.exercise, sets: [s] });
    }
  }
  return out;
}

/* ------------------------------------------------------------------ bests */

/**
 * Heaviest weight moved for at least `reps` reps, on or before `asOf`.
 *
 * "At least" rather than "exactly" because a set of 155×6 is strictly better
 * evidence of a 155×5 than a set of 155×5 is, and refusing to count it would
 * hide progress behind a rep-scheme technicality.
 */
export function bestWeight(
  sets: WorkoutSet[],
  exercise: string,
  reps: number,
  asOf?: string,
): WorkoutSet | undefined {
  let best: WorkoutSet | undefined;
  for (const s of sets) {
    if (!sameExercise(s.exercise, exercise)) continue;
    if (s.weightLbs === undefined || s.reps === undefined) continue;
    if (s.reps < reps) continue;
    if (asOf && s.date > asOf) continue;
    if (!best || s.weightLbs > best.weightLbs!) best = s;
  }
  return best;
}

/** Most reps in a single bodyweight set, on or before `asOf`. */
export function bestReps(
  sets: WorkoutSet[],
  exercise: string,
  asOf?: string,
): WorkoutSet | undefined {
  let best: WorkoutSet | undefined;
  for (const s of sets) {
    if (!sameExercise(s.exercise, exercise)) continue;
    if (s.reps === undefined || s.weightLbs !== undefined) continue;
    if (asOf && s.date > asOf) continue;
    if (!best || s.reps > best.reps!) best = s;
  }
  return best;
}

/** The heaviest set of an exercise within one session. */
export function topSet(sets: WorkoutSet[], exercise: string): WorkoutSet | undefined {
  let best: WorkoutSet | undefined;
  for (const s of sets) {
    if (!sameExercise(s.exercise, exercise)) continue;
    if (s.weightLbs === undefined) continue;
    if (!best || s.weightLbs > best.weightLbs!) best = s;
  }
  return best;
}

/**
 * Epley one-rep-max estimate. Used only to compare sets at *different* rep
 * counts — 165×5 against 145×8 — never to restate a set that is already at
 * the goal's rep count, where the raw weight is the honest number.
 */
export function estimated1RM(weightLbs: number, reps: number): number {
  return round(weightLbs * (1 + reps / 30));
}

/**
 * One point per day for an exercise: that day's heaviest set.
 *
 * Heaviest rather than every set, because a chart of every set draws the
 * back-off sets as a sawtooth and buries the trend the chart exists to show.
 * The top set is the number progression is decided on, so it is the number
 * plotted.
 */
export function liftSeries(
  sets: WorkoutSet[],
  exercise: string,
): { date: string; value: number; reps?: number; source: WorkoutSet["source"]; note?: string }[] {
  const best = new Map<string, WorkoutSet>();
  for (const s of sets) {
    if (!sameExercise(s.exercise, exercise)) continue;
    if (s.weightLbs === undefined) continue;
    const cur = best.get(s.date);
    if (!cur || s.weightLbs > cur.weightLbs!) best.set(s.date, s);
  }
  return [...best.values()]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((s) => ({
      date: s.date,
      value: s.weightLbs!,
      reps: s.reps,
      source: s.source,
      note: s.note,
    }));
}

/* ------------------------------------------------------------------- pace */

export interface GoalProgress {
  goal: TrainingGoal;
  /** Best to date. Undefined when nothing relevant has been logged yet. */
  current?: number;
  /** The set the current best came from, for provenance. */
  currentSet?: WorkoutSet;
  /** Where a straight line from baseline to target says you should be today. */
  pace?: number;
  /** current − pace. Positive is ahead. Undefined when either is unknown. */
  delta?: number;
  /** 0–1 along the baseline → target road. Clamped, so it never overshoots. */
  fraction: number;
  /** What January's spreadsheet projected for the current month. */
  projected?: number;
}

/** Fraction of the run from baseline day to deadline that has elapsed. */
function elapsed(goals: TrainingGoals, today: string): number {
  if (!goals.baselineOn || !goals.deadline) return 0;
  const start = parseDateKey(goals.baselineOn).getTime();
  const end = parseDateKey(goals.deadline).getTime();
  const now = parseDateKey(today).getTime();
  if (end <= start) return 1;
  return Math.min(1, Math.max(0, (now - start) / (end - start)));
}

export function goalProgress(
  goals: TrainingGoals,
  sets: WorkoutSet[],
  today: string,
): GoalProgress[] {
  const t = elapsed(goals, today);
  const month = today.slice(0, 7);
  const projectionRow = goals.projection.find((p) => p.month === month);

  return goals.goals.map((goal) => {
    const projected = projectionRow?.values[goal.id];

    if (goal.metric === "skill") {
      return { goal, fraction: 0, projected };
    }

    const set =
      goal.metric === "weight"
        ? bestWeight(sets, goal.exercise, goal.reps ?? 5, today)
        : bestReps(sets, goal.exercise, today);

    const current =
      goal.metric === "weight" ? set?.weightLbs : set?.reps;

    // A target equal to the baseline ("hold 10 dips") has no road to travel,
    // so the fraction is 1 once the baseline is met rather than 0/0.
    const span = goal.target - goal.baseline;
    const pace = span === 0 ? goal.target : goal.baseline + span * t;
    const fraction =
      span === 0
        ? current !== undefined && current >= goal.target
          ? 1
          : 0
        : Math.min(1, Math.max(0, ((current ?? goal.baseline) - goal.baseline) / span));

    return {
      goal,
      current,
      currentSet: set,
      pace: round(pace),
      delta: current === undefined ? undefined : round(current - pace),
      fraction,
      projected,
    };
  });
}

/* ------------------------------------------------------------- compliance */

export interface DaySlot {
  date: string;
  session?: Session;
  /** The break covering this day, when the log is silent because of one. */
  break?: TrainingBreak;
}

export function breakOn(breaks: TrainingBreak[], date: string): TrainingBreak | undefined {
  return breaks.find((b) => date >= b.start && date <= b.end);
}

/** The seven days ending on `today`, oldest first. */
export function weekStrip(
  sessions: Session[],
  breaks: TrainingBreak[],
  today: string,
): DaySlot[] {
  return Array.from({ length: 7 }, (_, i) => {
    const date = addDays(today, i - 6);
    return { date, session: sessionOn(sessions, date), break: breakOn(breaks, date) };
  });
}

export function gymSessionsIn(sessions: Session[], from: string, to: string): number {
  return sessions.filter(
    (s) => s.date >= from && s.date <= to && GYM_SESSIONS.includes(s.type),
  ).length;
}

/**
 * Weeks since the last deload week, or undefined if none has been recorded.
 *
 * Undefined rather than "infinity" because a log that starts today has not
 * gone a long time without a deload — it has no opinion yet, and the page
 * should say so instead of raising a false alarm on day one.
 */
export function weeksSinceDeload(sessions: Session[], today: string): number | undefined {
  const last = [...sessions].reverse().find((s) => s.deload);
  if (!last) return undefined;
  const days =
    (parseDateKey(today).getTime() - parseDateKey(last.date).getTime()) / 86_400_000;
  return Math.floor(days / 7);
}

/* ------------------------------------------------------------- bodyweight */

export interface BodyweightPoint {
  date: string;
  lbs: number;
}

/**
 * Every bodyweight reading, one per day, oldest first. Check-ins are the
 * primary record; a weight noted on a session row still counts, but when both
 * exist for a day the morning check-in wins — it's the more standardised
 * reading (same time, same conditions) and the one the file format is for.
 */
export function bodyweightSeries(
  checkins: Checkin[],
  sessions: Session[],
): BodyweightPoint[] {
  const byDate = new Map<string, number>();
  for (const s of sessions) {
    if (s.bodyweightLbs !== undefined) byDate.set(s.date, s.bodyweightLbs);
  }
  for (const c of checkins) {
    if (c.bodyweightLbs !== undefined) byDate.set(c.date, c.bodyweightLbs);
  }
  return [...byDate.entries()]
    .map(([date, lbs]) => ({ date, lbs }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

/* ------------------------------------------------ comparison with the plan */

export type PlanVerdict = "met" | "short" | "over" | "missing" | "extra" | "skipped";

export interface PlanLine {
  /** Absent on an `extra` line — something done that the plan never listed. */
  planned?: PlannedExercise;
  exercise: string;
  /** Empty on a `missing` line. */
  sets: WorkoutSet[];
  verdict: PlanVerdict;
  detail: string;
}

/**
 * Line up a logged session against the day it was supposed to be.
 *
 * This is the whole reason the program lives in code. A log that records what
 * you did is a record; one that knows what you were *meant* to do is feedback,
 * and feedback is what makes a plan stick. Deviations are reported flatly —
 * an extra exercise and a missing one are both just facts about the session.
 */
export function comparePlan(plan: PlannedSession, sets: WorkoutSet[]): PlanLine[] {
  const done = byExercise(sets);
  const claimed = new Set<number>();
  const lines: PlanLine[] = [];

  for (const planned of plan.exercises) {
    // A slot with a set-count prescription pools every unclaimed exercise that
    // answers to it — the named lift or its alternative — because a volume
    // prescription is about the slot's total sets, not one exercise name:
    // incline pressed beside flat bench counts toward the bench 3–4.
    // Slots without a set count (the sled's "5–10 min") take one match only,
    // so a second sled bout at the end of a session stays visible as its own
    // line instead of vanishing into the warmup's.
    const pools = planned.sets !== undefined;
    const matches: number[] = [];
    for (const [i, d] of done.entries()) {
      if (claimed.has(i)) continue;
      if (matches.length > 0 && !pools) break;
      if (
        sameExercise(d.exercise, planned.name) ||
        (planned.alternative !== undefined &&
          sameExercise(d.exercise, planned.alternative))
      ) {
        matches.push(i);
      }
    }

    if (matches.length === 0) {
      lines.push({
        planned,
        exercise: planned.name,
        sets: [],
        verdict: planned.optional ? "skipped" : "missing",
        detail: planned.optional ? "Optional — fine to skip" : planned.prescription,
      });
      continue;
    }

    for (const i of matches) claimed.add(i);
    const actual = matches.flatMap((i) => done[i].sets);
    lines.push({
      planned,
      exercise: matches.map((i) => done[i].exercise).join(" + "),
      sets: actual,
      ...judge(planned, actual),
    });
  }

  for (const [i, d] of done.entries()) {
    if (claimed.has(i)) continue;
    lines.push({
      exercise: d.exercise,
      sets: d.sets,
      verdict: "extra",
      detail: "Not in the plan for this day",
    });
  }

  return lines;
}

function judge(
  planned: PlannedExercise,
  actual: WorkoutSet[],
): { verdict: PlanVerdict; detail: string } {
  const min = planned.sets;
  const max = planned.setsMax ?? planned.sets;

  if (min !== undefined && actual.length < min) {
    const gap = min - actual.length;
    return {
      verdict: "short",
      detail: `${gap} set${gap === 1 ? "" : "s"} short of ${planned.prescription}`,
    };
  }
  if (max !== undefined && actual.length > max) {
    return { verdict: "over", detail: `${actual.length} sets against ${planned.prescription}` };
  }

  // Sets are right; check the reps. Only counted where the plan states a rep
  // target — "2 sets" with no number is satisfied by two sets of anything.
  if (planned.reps !== undefined) {
    const shortSets = actual.filter(
      (s) => s.reps !== undefined && s.reps < planned.reps!,
    );
    if (shortSets.length) {
      const lowest = Math.min(...shortSets.map((s) => s.reps!));
      return {
        verdict: "short",
        detail: `${lowest} reps against ${planned.prescription}`,
      };
    }
  }

  return { verdict: "met", detail: planned.prescription };
}

/** The planned session for a logged one, when it maps to a program day. */
export function planFor(session: Session | undefined): PlannedSession | undefined {
  if (!session) return undefined;
  return PROGRAM.find((p) => p.id === session.type);
}

/* ---------------------------------------------------------------- display */

/**
 * "155 × 5", "5 reps", "6 min" — one set rendered as a person would say it.
 * Weight-and-reps, bodyweight reps, and time are genuinely different shapes,
 * and forcing them into one column of numbers makes all three harder to read.
 */
export function setLabel(s: WorkoutSet): string {
  if (s.weightLbs !== undefined && s.reps !== undefined) {
    return `${round(s.weightLbs, 1)} × ${s.reps}`;
  }
  if (s.durationMin !== undefined) return `${round(s.durationMin, 1)} min`;
  if (s.reps !== undefined) return `${s.reps} rep${s.reps === 1 ? "" : "s"}`;
  if (s.weightLbs !== undefined) return `${round(s.weightLbs, 1)} lbs`;
  return "—";
}

/** Total working volume in pounds. Warmups and time-based work contribute 0. */
export function volume(sets: WorkoutSet[]): number {
  return sets.reduce(
    (t, s) => t + (s.weightLbs !== undefined && s.reps !== undefined ? s.weightLbs * s.reps : 0),
    0,
  );
}

export function workingSets(sets: WorkoutSet[]): WorkoutSet[] {
  return sets.filter((s) => s.kind !== "warmup" && s.kind !== "finisher");
}
