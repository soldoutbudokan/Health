import { readFileSync } from "node:fs";
import { join } from "node:path";
import { csvLines, isDateKey, optional, optionalNumber, splitRow } from "./csv";
import { SESSION_LABELS, type SessionType } from "./trainingTypes";
import type { PlanDay, PlanSlot } from "./lastStretch";

/**
 * Build-time reader for `data/last-stretch.csv`. `node:fs`, so server
 * components only, like every reader in `trainingFile.ts`.
 *
 * Columns, in order:
 *
 *   date, session, phase, deload, optional, trap_bar, squat, leg_curl,
 *   bench, bench_backoff, pullups, cable_row, lat_pulldown, preacher_curl,
 *   y_raise, cable_fly, dips, milestone, note
 *
 * `session` is a SessionType or `rest`. The load columns are the planned
 * top-set weights in pounds and are blank where the day has no such lift;
 * blank means "nothing planned", never zero. `pullups` and `dips` are free
 * text ("2×5", "test (9)", "1×10") because a bodyweight plan is an
 * instruction, not a load. The six accessory columns were added September 17,
 * 2026, ahead of `milestone` so `note` stays last; rows before that date
 * carry them blank, because no accessory plan existed for those days.
 */

const SESSION_TYPES = Object.keys(SESSION_LABELS) as SessionType[];

function isSlot(s: string | undefined): s is PlanSlot {
  return s === "rest" || (s !== undefined && SESSION_TYPES.includes(s as SessionType));
}

export function parseLastStretchCsv(csv: string): PlanDay[] {
  const lines = csvLines(csv);
  const rows =
    lines.length > 0 && splitRow(lines[0])[0]?.trim().toLowerCase() === "date"
      ? lines.slice(1)
      : lines;

  const days: PlanDay[] = [];
  for (const line of rows) {
    const c = splitRow(line);
    const date = c[0]?.trim();
    if (!isDateKey(date)) continue;
    const slot = optional(c[1])?.toLowerCase();
    days.push({
      date,
      slot: isSlot(slot) ? slot : "rest",
      phase: optional(c[2])?.toLowerCase() ?? "",
      deload: /^(y|yes|true|1)$/i.test(c[3]?.trim() ?? ""),
      optional: /^(y|yes|true|1)$/i.test(c[4]?.trim() ?? ""),
      trapBar: optionalNumber(c[5]),
      squat: optionalNumber(c[6]),
      legCurl: optionalNumber(c[7]),
      bench: optionalNumber(c[8]),
      benchBackoff: optionalNumber(c[9]),
      pullups: optional(c[10]),
      cableRow: optionalNumber(c[11]),
      latPulldown: optionalNumber(c[12]),
      preacherCurl: optionalNumber(c[13]),
      yRaise: optionalNumber(c[14]),
      cableFly: optionalNumber(c[15]),
      dips: optional(c[16]),
      milestone: optional(c[17]),
      note: optional(c[18]),
    });
  }
  return days.sort((a, b) => a.date.localeCompare(b.date));
}

export function readLastStretch(): PlanDay[] {
  try {
    return parseLastStretchCsv(
      readFileSync(join(process.cwd(), "data", "last-stretch.csv"), "utf8"),
    );
  } catch {
    return [];
  }
}
