import { readFileSync } from "node:fs";
import { join } from "node:path";
import { DEFAULT_GOALS, type Goals } from "./types";

/**
 * Goals are a committed file, not a setting.
 *
 * They changed roughly never, and every editable copy of them was another
 * thing that could drift out of step with the log it was scoring. One file in
 * the repo, read at build time next to `data/log.csv`, is the whole story.
 *
 * Like `logFile.ts` this uses `node:fs`, so it runs on the build machine only
 * — importing it from a client component will fail.
 */

const GOALS_PATH = join(process.cwd(), "data", "goals.json");

/** A field is only adopted if it is a real, non-negative number. */
function num(v: unknown): number | undefined {
  return typeof v === "number" && Number.isFinite(v) && v >= 0 ? v : undefined;
}

/**
 * Read the committed goals, falling back to the defaults field by field.
 *
 * Per-field rather than all-or-nothing: a file that sets only `calories` is a
 * reasonable thing to write, and a typo in one number shouldn't silently reset
 * the other three.
 */
export function readGoals(): Goals {
  let parsed: Record<string, unknown> = {};
  try {
    parsed = JSON.parse(readFileSync(GOALS_PATH, "utf8")) as Record<string, unknown>;
  } catch {
    // Missing or malformed: the defaults are the same numbers the app was
    // built around, so an unreadable file degrades to the right answer.
    return { ...DEFAULT_GOALS };
  }

  return {
    calories: num(parsed.calories) ?? DEFAULT_GOALS.calories,
    proteinMin: num(parsed.proteinMin) ?? DEFAULT_GOALS.proteinMin,
    proteinMax: num(parsed.proteinMax) ?? DEFAULT_GOALS.proteinMax,
    carbs: num(parsed.carbs) ?? DEFAULT_GOALS.carbs,
    fat: num(parsed.fat) ?? DEFAULT_GOALS.fat,
    fiber: num(parsed.fiber) ?? DEFAULT_GOALS.fiber,
  };
}
