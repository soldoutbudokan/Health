import { readFileSync } from "node:fs";
import { join } from "node:path";
import { csvLines, isDateKey, optional, optionalNumber, splitRow } from "./csv";
import {
  KIND_LABELS,
  SESSION_LABELS,
  type Session,
  type SessionType,
  type SetKind,
  type Sweat,
  type TrainingBreak,
  type TrainingGoals,
  type TrainingSource,
  type WorkoutSet,
} from "./trainingTypes";

/**
 * Build-time readers for the training files. `node:fs`, so like `logFile.ts`
 * these run on the build machine only — importing any of them from a client
 * component fails the build, on purpose.
 *
 * Every reader degrades to empty rather than throwing. A fresh clone before
 * the first workout is logged is a legitimate state, and an empty page is the
 * honest thing to render for it.
 */

const dataPath = (name: string) => join(process.cwd(), "data", name);
const archivePath = (name: string) =>
  join(process.cwd(), "docs", "spreadsheet", name);

const SESSION_TYPES = Object.keys(SESSION_LABELS) as SessionType[];
const SET_KINDS = Object.keys(KIND_LABELS) as SetKind[];
const SOURCES: TrainingSource[] = ["logged", "sheet", "handoff"];
const SWEATS: Sweat[] = ["low", "normal", "high"];

/** Drop the header row if there is one, tolerating a hand-written file. */
function body(lines: string[], firstColumn: string): string[] {
  if (lines.length === 0) return [];
  const first = splitRow(lines[0])[0]?.trim().toLowerCase();
  return first === firstColumn ? lines.slice(1) : lines;
}

export function parseWorkoutsCsv(csv: string): WorkoutSet[] {
  const rows = body(csvLines(csv), "id");
  const sets: WorkoutSet[] = [];

  for (const [i, line] of rows.entries()) {
    const c = splitRow(line);
    const date = c[1]?.trim();
    // A set that can't be placed on a day can't be charted or compared, so it
    // is dropped rather than landing on an arbitrary date.
    if (!isDateKey(date)) continue;

    const session = optional(c[2])?.toLowerCase() as SessionType | undefined;
    const kind = optional(c[4])?.toLowerCase() as SetKind | undefined;
    const source = optional(c[11])?.toLowerCase() as TrainingSource | undefined;

    sets.push({
      id: optional(c[0]) ?? `${date}-${i}`,
      date,
      session: session && SESSION_TYPES.includes(session) ? session : undefined,
      exercise: optional(c[3]) ?? "Unnamed",
      kind: kind && SET_KINDS.includes(kind) ? kind : "isolation",
      setIndex: optionalNumber(c[5]) ?? 1,
      reps: optionalNumber(c[6]),
      weightLbs: optionalNumber(c[7]),
      durationMin: optionalNumber(c[8]),
      rpe: optionalNumber(c[9]),
      note: optional(c[10]),
      source: source && SOURCES.includes(source) ? source : "logged",
      // File order is session order. Nothing else records the order the
      // exercises actually happened in, and the session card renders in it.
      order: i,
    });
  }

  return sets.sort((a, b) => a.date.localeCompare(b.date) || a.order - b.order);
}

export function parseSessionsCsv(csv: string): Session[] {
  const rows = body(csvLines(csv), "date");
  const sessions: Session[] = [];

  for (const line of rows) {
    const c = splitRow(line);
    const date = c[0]?.trim();
    if (!isDateKey(date)) continue;

    const type = optional(c[1])?.toLowerCase() as SessionType | undefined;
    const sweat = optional(c[4])?.toLowerCase() as Sweat | undefined;

    sessions.push({
      date,
      type: type && SESSION_TYPES.includes(type) ? type : "other",
      durationMin: optionalNumber(c[2]),
      fatigue: optionalNumber(c[3]),
      sweat: sweat && SWEATS.includes(sweat) ? sweat : undefined,
      bodyweightLbs: optionalNumber(c[5]),
      // Anything truthy counts; "yes", "y" and "true" all read the same way.
      deload: /^(y|yes|true|1)$/i.test(c[6]?.trim() ?? ""),
      flags: (optional(c[7]) ?? "")
        .split(";")
        .map((f) => f.trim())
        .filter(Boolean),
      note: optional(c[8]),
    });
  }

  return sessions.sort((a, b) => a.date.localeCompare(b.date));
}

export function parseBreaksCsv(csv: string): TrainingBreak[] {
  const rows = body(csvLines(csv), "start");
  const breaks: TrainingBreak[] = [];

  for (const line of rows) {
    const c = splitRow(line);
    const start = c[0]?.trim();
    const end = c[1]?.trim();
    if (!isDateKey(start) || !isDateKey(end)) continue;

    const kind = optional(c[2])?.toLowerCase();
    breaks.push({
      start,
      end,
      kind:
        kind === "travel" || kind === "illness" || kind === "deload"
          ? kind
          : "other",
      label: optional(c[3]) ?? "Break",
      note: optional(c[4]),
    });
  }

  return breaks.sort((a, b) => a.start.localeCompare(b.start));
}

const EMPTY_GOALS: TrainingGoals = {
  baselineOn: "",
  deadline: "",
  goals: [],
  projection: [],
};

export function readWorkouts(): WorkoutSet[] {
  try {
    return parseWorkoutsCsv(readFileSync(dataPath("workouts.csv"), "utf8"));
  } catch {
    return [];
  }
}

export function readSessions(): Session[] {
  try {
    return parseSessionsCsv(readFileSync(dataPath("sessions.csv"), "utf8"));
  } catch {
    return [];
  }
}

export function readBreaks(): TrainingBreak[] {
  try {
    return parseBreaksCsv(readFileSync(dataPath("breaks.csv"), "utf8"));
  } catch {
    return [];
  }
}

/* ---------------------------------------------------------------- archive */

/**
 * The old spreadsheet, tidied into CSVs under `docs/spreadsheet/`.
 *
 * Fifteen months of work lives in there and it would be a waste to leave it in
 * a binary nobody opens. It is read but never *computed on*: the settings are
 * a mix of pounds and machine pin numbers ("6 Reps at 13" is a pin, "5 Reps at
 * 145 lbs" is a weight), and a chart that treated pin 13 as 13 lbs would be
 * confidently wrong. The handful of rows whose units are unambiguous were
 * copied by hand into `data/workouts.csv` instead; the rest is shown as-is,
 * as a record rather than as data.
 */
export interface ArchiveChange {
  date: string;
  exercise: string;
  type: string;
  focus: string;
  setting: string;
  day: string;
}

export interface ArchiveRoutineRow {
  day: string;
  exercise: string;
  type: string;
  focus: string;
  setting: string;
}

export interface GripReading {
  date: string;
  left?: number;
  right?: number;
}

function readArchiveCsv(name: string, firstColumn: string): string[][] {
  try {
    const rows = body(csvLines(readFileSync(archivePath(name), "utf8")), firstColumn);
    return rows.map(splitRow);
  } catch {
    return [];
  }
}

export function readArchiveChanges(): ArchiveChange[] {
  return readArchiveCsv("progression.csv", "date")
    .filter((c) => isDateKey(c[0]?.trim()))
    .map((c) => ({
      date: c[0].trim(),
      exercise: optional(c[1]) ?? "",
      type: optional(c[2]) ?? "",
      focus: optional(c[3]) ?? "",
      setting: optional(c[4]) ?? "",
      day: optional(c[5]) ?? "",
    }))
    .sort((a, b) => b.date.localeCompare(a.date));
}

export function readArchiveRoutine(): ArchiveRoutineRow[] {
  return readArchiveCsv("routine.csv", "day")
    .filter((c) => optional(c[0]) && optional(c[1]))
    .map((c) => ({
      day: c[0].trim(),
      exercise: c[1].trim(),
      type: optional(c[2]) ?? "",
      focus: optional(c[3]) ?? "",
      setting: optional(c[4]) ?? "",
    }));
}

export function readGrip(): GripReading[] {
  return readArchiveCsv("grip.csv", "date")
    .filter((c) => isDateKey(c[0]?.trim()))
    .map((c) => ({
      date: c[0].trim(),
      left: optionalNumber(c[1]),
      right: optionalNumber(c[2]),
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Unlike `readGoals`, this has no defaults to fall back on — a training goal
 * is a number somebody chose, and inventing one would put a fake pace line on
 * the page. An unreadable file renders no goals instead.
 */
export function readTrainingGoals(): TrainingGoals {
  try {
    const parsed = JSON.parse(
      readFileSync(dataPath("training-goals.json"), "utf8"),
    ) as Partial<TrainingGoals>;
    return {
      baselineOn: parsed.baselineOn ?? "",
      deadline: parsed.deadline ?? "",
      goals: Array.isArray(parsed.goals) ? parsed.goals : [],
      projection: Array.isArray(parsed.projection) ? parsed.projection : [],
    };
  } catch {
    return EMPTY_GOALS;
  }
}
