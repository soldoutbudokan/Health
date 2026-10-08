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
 *   date, session, phase, deload, optional, trap_bar, trap_bar_backoff,
 *   squat, squat_backoff, leg_curl, weighted_jumps, bench, bench_backoff,
 *   pullups, cable_row, lat_pulldown, curl, curl_backup, y_raise, cable_fly,
 *   dips, milestone, note
 *
 * `session` is a SessionType or `rest`. The load columns are the planned
 * top-set weights in pounds and are blank where the day has no such lift;
 * blank means "nothing planned", never zero. `pullups` and `dips` are free
 * text ("2×5", "test (9)", "1×10") because a bodyweight plan is an
 * instruction, not a load. The six accessory columns were added September 17,
 * 2026, ahead of `milestone` so `note` stays last; rows before that date
 * carry them blank, because no accessory plan existed for those days.
 * `weighted_jumps` followed on September 19, 2026, inserted after
 * `leg_curl` rather than appended so the lower-day loads stay together, and
 * it is the light-lower days only — the heavy day's jumps are bodyweight by
 * prescription. Blank before October 3 for the same reason the accessories
 * are blank before September 21.
 *
 * `leg_curl`, `cable_row` and `lat_pulldown` can also carry a rep target,
 * `120×6`, added September 22, 2026: all three stacks move in 10s, so a planned 5 lb step is
 * written as the pin below it for one more rep (Epley puts 120 × 6 within
 * about 1% of 125 × 5). A bare number means the program's usual reps.
 *
 * `curl` was `preacher_curl` until October 3, 2026, when the Bayesian cable
 * curl replaced the preacher curl. Rows through October 2 hold preacher
 * numbers and rows after it Bayesian ones, a side. `curl_backup` followed the
 * same day, inserted after `curl`: the incline dumbbell curl, a hand, for
 * when the cables are taken. It steps on the same dates and is blank before
 * October 4. From October 11 the `curl` numbers end in .5: the home stack
 * starts at 2.5, climbs in 5s and has 1.5 lb add-ons, so 20 can't be set.
 *
 * `trap_bar_backoff` and `squat_backoff` came September 29, 2026, each placed
 * after its lift the way `bench_backoff` follows `bench`: the heavy lower
 * went from 2 × 5 at one weight to a top set of 5 and a back-off set of 5
 * about 10% lighter. Blank means both sets at the top weight — every light
 * lower, every deload, and every row before October 6.
 */

const SESSION_TYPES = Object.keys(SESSION_LABELS) as SessionType[];

function isSlot(s: string | undefined): s is PlanSlot {
  return s === "rest" || (s !== undefined && SESSION_TYPES.includes(s as SessionType));
}

/** "120", or "120×6" / "120x6" where the plan sets the reps too. */
function optionalLoad(v: string | undefined): { lbs?: number; reps?: number } {
  const m = v?.trim().match(/^(\d+(?:\.\d+)?)\s*(?:[x×]\s*(\d+))?$/i);
  return m ? { lbs: Number(m[1]), reps: m[2] ? Number(m[2]) : undefined } : {};
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
    const legCurl = optionalLoad(c[9]);
    const cableRow = optionalLoad(c[14]);
    const latPulldown = optionalLoad(c[15]);
    days.push({
      date,
      slot: isSlot(slot) ? slot : "rest",
      phase: optional(c[2])?.toLowerCase() ?? "",
      deload: /^(y|yes|true|1)$/i.test(c[3]?.trim() ?? ""),
      optional: /^(y|yes|true|1)$/i.test(c[4]?.trim() ?? ""),
      trapBar: optionalNumber(c[5]),
      trapBarBackoff: optionalNumber(c[6]),
      squat: optionalNumber(c[7]),
      squatBackoff: optionalNumber(c[8]),
      legCurl: legCurl.lbs,
      legCurlReps: legCurl.reps,
      weightedJumps: optionalNumber(c[10]),
      bench: optionalNumber(c[11]),
      benchBackoff: optionalNumber(c[12]),
      pullups: optional(c[13]),
      cableRow: cableRow.lbs,
      cableRowReps: cableRow.reps,
      latPulldown: latPulldown.lbs,
      latPulldownReps: latPulldown.reps,
      curl: optionalNumber(c[16]),
      curlBackup: optionalNumber(c[17]),
      yRaise: optionalNumber(c[18]),
      cableFly: optionalNumber(c[19]),
      dips: optional(c[20]),
      milestone: optional(c[21]),
      note: optional(c[22]),
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
