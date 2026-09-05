/**
 * The training half of the domain model.
 *
 * Four grains, four files, because they genuinely are four different things:
 *
 *   data/workouts.csv   one row per *set*      — what was lifted
 *   data/sessions.csv   one row per *session*  — how it felt, what it cost
 *   data/breaks.csv     one row per *stretch*  — why a gap in the log is a gap
 *   data/checkins.csv   one row per *check-in* — bodyweight, sleep and resting
 *                        vitals, which belong to a morning rather than to any
 *                        session
 *
 * Sets are the atomic unit because sets differ inside a session: "2 sets of 5
 * at 155 and 135" is two rows, not one row with an average. Rolling them up
 * loses the back-off set, which is exactly the thing progression depends on.
 */

/**
 * Which day of the program a session was — or, for the last four, that it was
 * not one. `full-body`, `basketball`, `conditioning` and `other` have no
 * `src/data/program.ts` entry on purpose: `planFor()` looks the type up in
 * PROGRAM and returns undefined when it misses, so a session of one of these
 * kinds draws no plan comparison and reads as the deviation it is. Adding a
 * program day to make one of them score would be the mistake the CLAUDE.md
 * rule warns about.
 *
 * `full-body` was added on August 13, 2026, for a session that put the sled,
 * jumps, trap bar, bench, pullups, squat and dips into one day because it was
 * the only day that week training was possible. It had been logged as `other`
 * for a few hours first, which was true and said nothing. The program splits
 * upper from lower for good reasons and a full-body day is a real departure
 * from it, so the type exists to name *which* departure it was — the same job
 * `conditioning` does for a sled-only day. It is deliberately not a program
 * day: naming a deviation is not the same as sanctioning it, and if these
 * start recurring the answer is to revise `docs/training-plan.md`, not to
 * quietly add a PROGRAM entry so they stop reading as deviations.
 */
export type SessionType =
  | "heavy-lower"
  | "light-lower"
  | "heavy-upper"
  | "light-upper"
  | "off-a"
  | "off-b"
  | "stretch"
  | "full-body"
  | "basketball"
  | "conditioning"
  | "other";

export const SESSION_LABELS: Record<SessionType, string> = {
  "heavy-lower": "Heavy Lower",
  "light-lower": "Light Lower",
  "heavy-upper": "Heavy Upper",
  "light-upper": "Light Upper",
  "off-a": "Off Day A — Jump Support",
  "off-b": "Off Day B — Upper Support",
  stretch: "Stretch Under Tension",
  "full-body": "Full Body",
  basketball: "Basketball",
  conditioning: "Conditioning",
  other: "Other",
};

/** Short form for the week strip, where there is room for about six letters. */
export const SESSION_SHORT: Record<SessionType, string> = {
  "heavy-lower": "H·Low",
  "light-lower": "L·Low",
  "heavy-upper": "H·Up",
  "light-upper": "L·Up",
  "off-a": "Off A",
  "off-b": "Off B",
  stretch: "Stretch",
  "full-body": "Full",
  basketball: "Ball",
  conditioning: "Cond",
  other: "Other",
};

/**
 * The days that put a barbell in your hands. Named for where they happen but
 * used for what they are: `gymSessionsIn()` counts them as the week's training
 * frequency, and the week strip highlights them. `conditioning` is deliberately
 * absent even though the sled is done at the gym — counting it here would read
 * a sled bout as a lifting session and inflate both the frequency and the
 * deload clock.
 *
 * `full-body` is here, added August 13, 2026, and it is the one member that is
 * not a program day. That is not an inconsistency — it is two different
 * questions being answered separately. Whether a session draws a plan
 * comparison is settled by PROGRAM, which full-body is rightly absent from;
 * whether it was a lifting day is settled here, and a day carrying the trap
 * bar, bench and squat plainly was one. Leaving it out would render the week
 * it happened as "1 session · 0 of 4 lifting" for a week in which every main
 * lift was trained, which is a worse falsehood than the one the exclusion
 * would be avoiding. The denominator stays 4: the numerator counts lifting
 * days done, the 4 counts what the program asks for, and "1 of 4" is the
 * honest reading of a week with one full-body session in it.
 */
export const GYM_SESSIONS: SessionType[] = [
  "heavy-lower",
  "light-lower",
  "heavy-upper",
  "light-upper",
  "full-body",
];

/**
 * What sort of work a set is. Drives how the session card groups things, so
 * these are presentation categories as much as physiological ones — the sled
 * is `warmup` at the start of a session and `finisher` at the end, and that
 * distinction is the whole reason both appear.
 */
export type SetKind =
  | "warmup"
  | "jump"
  | "compound"
  | "isolation"
  | "core"
  | "mobility"
  | "finisher";

export const KIND_LABELS: Record<SetKind, string> = {
  warmup: "Warmup",
  jump: "Jumps",
  compound: "Main",
  isolation: "Accessory",
  core: "Core",
  mobility: "Mobility",
  finisher: "Finisher",
};

/** The order the session card lays the groups out in. */
export const KIND_ORDER: SetKind[] = [
  "warmup",
  "mobility",
  "jump",
  "compound",
  "isolation",
  "core",
  "finisher",
];

/**
 * Where a number came from. `logged` is a set that actually happened and was
 * recorded as it happened; the other two are reference points imported from
 * documents, and deserve less trust — see `data/workouts.csv`.
 */
export type TrainingSource = "logged" | "sheet" | "handoff";

export interface WorkoutSet {
  id: string;
  /** Local calendar date, YYYY-MM-DD. */
  date: string;
  /** Absent on imported reference points, which belong to no session. */
  session?: SessionType;
  exercise: string;
  kind: SetKind;
  setIndex: number;
  /** Absent for time-based work (sled, holds). */
  reps?: number;
  /** Absent for bodyweight and time-based work. Blank ≠ zero. */
  weightLbs?: number;
  durationMin?: number;
  /** 1–10 rate of perceived exertion, when recorded. */
  rpe?: number;
  note?: string;
  source: TrainingSource;
  /** Row order in the file, i.e. the order the session actually happened in. */
  order: number;
}

export type Sweat = "low" | "normal" | "high";

export interface Session {
  date: string;
  type: SessionType;
  durationMin?: number;
  /** 1 (fresh) to 5 (wiped out). Absent means not recorded. */
  fatigue?: number;
  sweat?: Sweat;
  bodyweightLbs?: number;
  deload: boolean;
  /** Joint or soreness tags, e.g. `front-shoulder`. Usually empty. */
  flags: string[];
  note?: string;
}

export const FATIGUE_LABELS: Record<number, string> = {
  1: "Fresh",
  2: "Easy",
  3: "Worked",
  4: "Hard",
  5: "Exhausted",
};

/**
 * A morning check-in. Separate from `Session` because a weigh-in doesn't need
 * a workout to exist — rest days have mornings too — and folding it into
 * sessions would invent phantom "other" sessions just to carry a number.
 */
export interface Checkin {
  date: string;
  bodyweightLbs?: number;
  /** Local clock time HH:MM, the night before. */
  sleepStart?: string;
  /** Local clock time HH:MM, the morning of `date`. */
  sleepEnd?: string;
  /**
   * Resting blood pressure in mmHg. A reading is the pair; the card shows
   * nothing when only one half is present. Added September 5, 2026, with the
   * first reading in a long time — the only earlier one is the undated 119/80
   * in `docs/spreadsheet/vitals.csv`.
   */
  systolicMmHg?: number;
  diastolicMmHg?: number;
  /** Resting heart rate, beats per minute. */
  restingHrBpm?: number;
  note?: string;
}

export interface TrainingBreak {
  start: string;
  end: string;
  kind: "travel" | "illness" | "deload" | "other";
  label: string;
  note?: string;
}

export type GoalMetric =
  /** Heaviest top set at `reps` reps. */
  | "weight"
  /** Most bodyweight reps in a set. */
  | "reps"
  /** Tracked by milestone rather than by number. */
  | "skill";

export type GoalStatus = "on-track" | "stretch" | "achieved" | "skill";

export interface TrainingGoal {
  id: string;
  name: string;
  /** Matches `WorkoutSet.exercise` after alias normalisation. */
  exercise: string;
  metric: GoalMetric;
  /** The rep count a `weight` goal is expressed at. */
  reps?: number;
  baseline: number;
  target: number;
  unit: string;
  status: GoalStatus;
  /** Where a stretch target is honestly expected to land instead. */
  realistic?: { min: number; max: number };
  note?: string;
}

export interface TrainingGoals {
  /** The day the baselines were taken. Start of the pace line. */
  baselineOn: string;
  /** End of the pace line. */
  deadline: string;
  goals: TrainingGoal[];
  /**
   * The monthly projection from the January spreadsheet, superseded by the
   * August handoff. Kept because the distance between the two is the layoff:
   * it shows which lifts rode through six weeks off and which didn't.
   */
  projection: { month: string; values: Record<string, number> }[];
}
