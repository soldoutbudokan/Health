import { PROGRAM } from "@/data/program";
import { addDays } from "./nutrition";
import { formatDay } from "./labels";
import {
  bestReps,
  bestWeight,
  byExercise,
  sameExercise,
  sessionSets,
  setLabel,
  topSet,
} from "./training";
import {
  GYM_SESSIONS,
  SESSION_LABELS,
  type Session,
  type SessionType,
  type TrainingGoals,
  type WorkoutSet,
} from "./trainingTypes";

/**
 * The Last Stretch: the calendar from September 7, 2026 to the day the three
 * remaining strength goals close — trap bar 300 × 5, Smith squat 225 × 5,
 * ten bodyweight pullups — on the line where every session goes well. The
 * bench rides along at an assumed rate and is not a condition of finishing.
 *
 * This is the one place on the site that says what to do on a date. The
 * dashboard records and never schedules, and that rule stands; this page is
 * the exception the owner asked for on September 7, 2026, and it is confined
 * to `/last-stretch`. Nothing here migrates onto the dashboard.
 *
 * The plan is `data/last-stretch.csv`, one row per day. Everything computed
 * about it lives here as pure functions so the page can compute on the build
 * machine and hand the client component plain data: the client never sees
 * the CSVs, never reads the clock, and keeps no state beyond which day is
 * open.
 *
 * A tick is derived, never clicked. A day is done when `data/sessions.csv`
 * carries a session of the planned type on that date — the log is the only
 * writer, and a checkbox that saved to the browser would be a second copy of
 * the truth, which is the design this repo abandoned twice. Logging the
 * session is what ticks the box.
 */

/** What a day is for. Every SessionType, plus a day with nothing planned. */
export type PlanSlot = SessionType | "rest";

export interface PlanDay {
  date: string;
  slot: PlanSlot;
  /** break · return · trip · block-1 · deload · block-2 · contingency */
  phase: string;
  deload: boolean;
  /** Skipping it is following the plan. */
  optional: boolean;
  /** Planned top-set loads. Absent where the day has no such lift. */
  trapBar?: number;
  squat?: number;
  legCurl?: number;
  bench?: number;
  benchBackoff?: number;
  /** "2×5", "test (9)", "2×4 easy, optional" — a string on purpose. */
  pullups?: string;
  /** A goal closing, or a step worth naming. */
  milestone?: string;
  note?: string;
}

export const PHASES: Record<string, { label: string; blurb: string }> = {
  break: {
    label: "The break",
    blurb: "BC, and the first deload in the log. The away routine plus the trunk block, daily.",
  },
  return: {
    label: "The return",
    blurb:
      "Belt on. The 14th learns it at 270 and 185; the 21st takes the one 10 lb jump. Two forced rest days and a five-day trip sit inside this phase.",
  },
  trip: {
    label: "The trip",
    blurb: "A maintenance week, not a deload. Away routine and trunk block, daily.",
  },
  "block-1": {
    label: "Block 1",
    blurb: "The first uninterrupted weeks. Five pounds a session on the heavy days when both sets move well.",
  },
  deload: {
    label: "Deload",
    blurb:
      "Same sessions, every weight down 10–15%, placed so the Oct 14–16 off days fall inside it.",
  },
  "block-2": {
    label: "Block 2",
    blurb:
      "Where the goals close on the all-goes-well line: trap bar 300 on Oct 26, ten pullups on Oct 30, squat 225 on Nov 9.",
  },
  contingency: {
    label: "Contingency",
    blurb:
      "Only if a goal is still open. Goal weights repeated, a deload in the week of Nov 23, and the file ends Dec 20; the deadline is Dec 31.",
  },
};

export const PHASE_ORDER = [
  "break",
  "return",
  "trip",
  "block-1",
  "deload",
  "block-2",
  "contingency",
];

/* ------------------------------------------------------------- one day */

export type DayStatus =
  /** A session of the planned type was logged on the day. */
  | "done"
  /** Something was logged, but not the planned type. */
  | "swapped"
  /** The day has passed with nothing logged. */
  | "missed"
  /** Optional, and passed without a session — following the plan. */
  | "skipped"
  /** Nothing was planned. */
  | "rest"
  /** Today or later. */
  | "upcoming";

export interface PlannedLift {
  exercise: string;
  prescription: string;
  /** The plan's load for this day, where the file carries one. */
  planned?: string;
  /** The most recent logged top set before this day, for context. */
  last?: string;
  optional?: boolean;
  note?: string;
}

export interface LoggedLift {
  exercise: string;
  sets: string;
  planned?: number;
  verdict?: "hit" | "under" | "over";
}

export interface DayView {
  plan: PlanDay;
  status: DayStatus;
  /**
   * What the cell shows under the session name, one entry per line:
   * "270 / 185" on a lower day, "165 / 150" (top set, back-offs) on a heavy
   * upper, "135 ×8" then "test" on a light upper with a pullup test. A phone
   * splits the "a / b" line in two.
   */
  summary: string[];
  lifts: PlannedLift[];
  logged?: {
    type: SessionType;
    label: string;
    fatigue?: number;
    flags: string[];
    note?: string;
    lifts: LoggedLift[];
  };
}

export interface WeekView {
  /** The Monday. */
  start: string;
  phase: string;
  days: DayView[];
}

/** Which plan column an exercise on the program reads its load from. */
function plannedLoad(plan: PlanDay, exercise: string): string | undefined {
  const fmt = (n: number | undefined) => (n === undefined ? undefined : `${n} lbs`);
  if (sameExercise(exercise, "Trap bar deadlift")) return fmt(plan.trapBar);
  if (sameExercise(exercise, "Smith machine squat")) return fmt(plan.squat);
  if (sameExercise(exercise, "Lying leg curl")) return fmt(plan.legCurl);
  if (sameExercise(exercise, "Bench press")) {
    if (plan.bench === undefined) return undefined;
    return plan.benchBackoff !== undefined
      ? `${plan.bench} lbs, back-offs ${plan.benchBackoff}`
      : `${plan.bench} lbs`;
  }
  if (sameExercise(exercise, "Pullups")) return plan.pullups;
  return undefined;
}

/** The number a logged top set is graded against, if the plan has one. */
function plannedNumber(plan: PlanDay, exercise: string): number | undefined {
  if (sameExercise(exercise, "Trap bar deadlift")) return plan.trapBar;
  if (sameExercise(exercise, "Smith machine squat")) return plan.squat;
  if (sameExercise(exercise, "Lying leg curl")) return plan.legCurl;
  if (sameExercise(exercise, "Bench press")) return plan.bench;
  return undefined;
}

/**
 * The most recent logged top set of an exercise strictly before a date —
 * "270 × 5 on Aug 28" — so the day's card shows where the lift last was
 * beside where the plan wants it. Weight wins, then reps, then time.
 */
export function lastPerformed(
  sets: WorkoutSet[],
  exercise: string,
  before: string,
  today: string,
): string | undefined {
  let lastDate: string | undefined;
  for (const s of sets) {
    if (s.date >= before || !sameExercise(s.exercise, exercise)) continue;
    if (!lastDate || s.date > lastDate) lastDate = s.date;
  }
  if (!lastDate) return undefined;
  const onDay = sets.filter(
    (s) => s.date === lastDate && sameExercise(s.exercise, exercise),
  );
  const best =
    topSet(onDay, exercise) ??
    onDay.reduce<WorkoutSet | undefined>(
      (b, s) => (s.reps !== undefined && (!b || (b.reps ?? 0) < s.reps) ? s : b),
      undefined,
    ) ??
    onDay[0];
  return `${setLabel(best)} on ${formatDay(lastDate, today)}`;
}

function summaryOf(plan: PlanDay): string[] {
  const lines: string[] = [];
  if (plan.trapBar !== undefined || plan.squat !== undefined) {
    lines.push(`${plan.trapBar ?? "–"} / ${plan.squat ?? "–"}`);
  }
  if (plan.bench !== undefined) {
    lines.push(
      plan.slot === "light-upper"
        ? `${plan.bench} ×8`
        : plan.benchBackoff !== undefined
          ? `${plan.bench} / ${plan.benchBackoff}`
          : `${plan.bench}`,
    );
  }
  if (plan.pullups?.startsWith("test")) lines.push("pullup test");
  return lines;
}

/**
 * The session logged on a date. Two can share a day — Aug 22 carried a light
 * upper and a basketball row — so the planned type wins, then a lifting day,
 * then whatever is there.
 */
function loggedOn(sessions: Session[], date: string, slot: PlanSlot): Session | undefined {
  const onDay = sessions.filter((s) => s.date === date);
  return (
    onDay.find((s) => s.type === slot) ??
    onDay.find((s) => GYM_SESSIONS.includes(s.type)) ??
    onDay[0]
  );
}

export function statusOf(
  plan: PlanDay,
  logged: Session | undefined,
  today: string,
): DayStatus {
  if (logged) {
    return logged.type === plan.slot || plan.slot === "rest" ? "done" : "swapped";
  }
  if (plan.slot === "rest") return "rest";
  if (plan.date >= today) return "upcoming";
  return plan.optional ? "skipped" : "missed";
}

export function dayView(
  plan: PlanDay,
  sessions: Session[],
  sets: WorkoutSet[],
  today: string,
): DayView {
  const logged = loggedOn(sessions, plan.date, plan.slot);
  const status = statusOf(plan, logged, today);
  const program = plan.slot === "rest" ? undefined : PROGRAM.find((p) => p.id === plan.slot);

  const lifts: PlannedLift[] = (program?.exercises ?? []).map((e) => ({
    exercise: e.name,
    prescription: e.prescription,
    planned: plannedLoad(plan, e.name),
    last: lastPerformed(sets, e.name, plan.date, today),
    optional: e.optional,
    note: e.note,
  }));

  const view: DayView = { plan, status, summary: summaryOf(plan), lifts };

  if (logged) {
    const daySets = sessionSets(sets, plan.date);
    const loggedLifts: LoggedLift[] = byExercise(daySets)
      .filter((g) => g.sets.some((s) => s.kind === "compound" || s.kind === "isolation"))
      .map((g) => {
        const top = topSet(g.sets, g.exercise);
        const planned = plannedNumber(plan, g.exercise);
        const weight = top?.weightLbs;
        const verdict =
          planned === undefined || weight === undefined
            ? undefined
            : weight >= planned
              ? weight > planned
                ? "over"
                : "hit"
              : "under";
        return {
          exercise: g.exercise,
          sets: g.sets.map(setLabel).join("  "),
          planned,
          verdict,
        };
      });
    view.logged = {
      type: logged.type,
      label: SESSION_LABELS[logged.type],
      fatigue: logged.fatigue,
      flags: logged.flags,
      note: logged.note,
      lifts: loggedLifts,
    };
  }

  return view;
}

/* --------------------------------------------------------------- weeks */

/** The Monday on or before a date. */
export function mondayOf(date: string): string {
  const d = new Date(`${date}T12:00:00`);
  const dow = (d.getDay() + 6) % 7; // Monday = 0
  return addDays(date, -dow);
}

/**
 * The plan as Monday-start weeks. A week's phase is its Monday's phase — the
 * week of Sep 21 holds two return days and five trip days and is filed under
 * the return, which is what the heading needs; each day still carries its
 * own phase for the detail.
 */
export function weeks(
  plans: PlanDay[],
  sessions: Session[],
  sets: WorkoutSet[],
  today: string,
): WeekView[] {
  const byDate = new Map(plans.map((p) => [p.date, p]));
  if (plans.length === 0) return [];
  const first = mondayOf(plans[0].date);
  const last = plans[plans.length - 1].date;
  const out: WeekView[] = [];
  for (let start = first; start <= last; start = addDays(start, 7)) {
    const days: DayView[] = [];
    for (let i = 0; i < 7; i++) {
      const date = addDays(start, i);
      const plan =
        byDate.get(date) ??
        ({ date, slot: "rest", phase: "", deload: false, optional: false } as PlanDay);
      days.push(dayView(plan, sessions, sets, today));
    }
    out.push({ start, phase: byDate.get(start)?.phase ?? days[0].plan.phase, days });
  }
  return out;
}

/* --------------------------------------------------------------- goals */

export interface GoalTrack {
  id: string;
  name: string;
  target: number;
  unit: string;
  /** Best so far, from the log. */
  current?: number;
  currentOn?: string;
  /** The plan's date for closing it, from the milestone column. */
  plannedOn?: string;
  /** The date the log first met the target, if it has. */
  hitOn?: string;
  /** Bench is tracked but not a condition of finishing. */
  rider: boolean;
}

const MILESTONE_KEY: Record<string, RegExp> = {
  deadlift: /trap bar/i,
  squat: /squat/i,
  pullups: /pullup/i,
  bench: /bench/i,
};

/**
 * The three goals the stretch is about, plus the bench as a rider. Graded on
 * real top sets only, the same rule the training page keeps: nothing
 * estimated feeds this.
 */
export function goalTracks(
  goals: TrainingGoals,
  plans: PlanDay[],
  sets: WorkoutSet[],
): GoalTrack[] {
  const wanted = ["deadlift", "squat", "pullups", "bench"];
  return wanted
    .map((id) => goals.goals.find((g) => g.id === id))
    .filter((g): g is NonNullable<typeof g> => g !== undefined)
    .map((g) => {
      const isReps = g.metric === "reps";
      const best = isReps
        ? bestReps(sets, g.exercise)
        : bestWeight(sets, g.exercise, g.reps ?? 5);
      const current = isReps ? best?.reps : best?.weightLbs;
      const key = MILESTONE_KEY[g.id];
      const plannedOn = plans.find((p) => p.milestone && key?.test(p.milestone))?.date;

      let hitOn: string | undefined;
      for (const s of sets) {
        if (!sameExercise(s.exercise, g.exercise)) continue;
        const value = isReps
          ? s.weightLbs === undefined
            ? s.reps
            : undefined
          : s.reps !== undefined && s.reps >= (g.reps ?? 5)
            ? s.weightLbs
            : undefined;
        if (value !== undefined && value >= g.target && (!hitOn || s.date < hitOn)) {
          hitOn = s.date;
        }
      }

      return {
        id: g.id,
        name: g.name,
        target: g.target,
        unit: g.unit,
        current,
        currentOn: best?.date,
        plannedOn,
        hitOn,
        rider: g.id === "bench",
      };
    });
}

/** Planned sessions that have passed, and how many were logged as planned. */
export function tally(views: DayView[], today: string): { done: number; due: number } {
  let done = 0;
  let due = 0;
  for (const v of views) {
    if (v.plan.slot === "rest" || v.plan.optional || v.plan.date >= today) continue;
    due++;
    if (v.status === "done") done++;
  }
  return { done, due };
}
