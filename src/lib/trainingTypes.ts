/**
 * The training half of the domain model.
 *
 * Four grains, four files, because they genuinely are four different things:
 *
 *   data/workouts.csv   one row per *set*      — what was lifted
 *   data/sessions.csv   one row per *session*  — how it felt, what it cost
 *   data/breaks.csv     one row per *stretch*  — why a gap in the log is a gap
 *   data/checkins.csv   one row per *check-in* — bodyweight and sleep, which
 *                        belong to a morning rather than to any session
 *
 * Sets are the atomic unit because sets differ inside a session: "2 sets of 5
 * at 155 and 135" is two rows, not one row with an average. Rolling them up
 * loses the back-off set, which is exactly the thing progression depends on.
 */

/** Which day of the program a session was. Mirrors `src/data/program.ts`. */
export type SessionType =
  | "heavy-lower"
  | "light-lower"
  | "heavy-upper"
  | "light-upper"
  | "off-a"
  | "off-b"
  | "stretch"
  | "basketball"
  | "other";

export const SESSION_LABELS: Record<SessionType, string> = {
  "heavy-lower": "Heavy Lower",
  "light-lower": "Light Lower",
  "heavy-upper": "Heavy Upper",
  "light-upper": "Light Upper",
  "off-a": "Off Day A — Jump Support",
  "off-b": "Off Day B — Upper Support",
  stretch: "Stretch Under Tension",
  basketball: "Basketball",
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
  basketball: "Ball",
  other: "Other",
};

export const GYM_SESSIONS: SessionType[] = [
  "heavy-lower",
  "light-lower",
  "heavy-upper",
  "light-upper",
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
