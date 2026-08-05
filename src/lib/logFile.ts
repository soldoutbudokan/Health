import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { LogEntry, MealSlot, FoodSource } from "./types";

/**
 * The log is a CSV committed to this repo, and it is the only source of truth.
 *
 * There is no database, no gist and no browser storage behind this — Claude
 * Code edits the file, commits, and the Pages workflow rebuilds the site. That
 * is the whole write path. Two consequences worth knowing before changing
 * anything here: the site is a snapshot of the last commit rather than of live
 * state, and because it is read at build time this module runs on the build
 * machine only. Importing it from a client component will fail.
 *
 * The columns are deliberately identical to what the app's own CSV export
 * produces, so the file you download and the file the app reads are the same
 * shape — you can open it in Excel, fix a number, and commit it back.
 */

const LOG_PATH = join(process.cwd(), "data", "log.csv");

export const LOG_COLUMNS = [
  "id",
  "date",
  "meal",
  "food",
  "variant",
  "brand",
  "serving",
  "servings",
  "calories",
  "protein_g",
  "carbs_g",
  "fat_g",
  "fiber_g",
  "sugar_g",
  "sodium_mg",
  "source",
  "logged_at",
] as const;

const SLOTS: MealSlot[] = ["breakfast", "lunch", "dinner", "snack"];

/**
 * Split one CSV line, honouring quoted fields.
 *
 * Food names contain commas ("Chicken Curry, curry only") and apostrophes, so
 * a naive split on "," corrupts roughly a third of the catalog. Doubled quotes
 * inside a quoted field are an escaped quote, per RFC 4180.
 */
function splitRow(line: string): string[] {
  const out: string[] = [];
  let field = "";
  let quoted = false;

  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (quoted) {
      if (c === '"') {
        if (line[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          quoted = false;
        }
      } else {
        field += c;
      }
    } else if (c === '"') {
      quoted = true;
    } else if (c === ",") {
      out.push(field);
      field = "";
    } else {
      field += c;
    }
  }
  out.push(field);
  return out;
}

const optional = (v: string | undefined) => {
  const s = v?.trim();
  return s ? s : undefined;
};

/** Blank means "not recorded", which is not the same as zero. */
const optionalNumber = (v: string | undefined) => {
  const s = v?.trim();
  if (!s) return undefined;
  const n = Number(s);
  return Number.isFinite(n) ? n : undefined;
};

const requiredNumber = (v: string | undefined) => optionalNumber(v) ?? 0;

export function parseLogCsv(csv: string): LogEntry[] {
  const lines = csv.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return [];

  // Tolerate a missing header so a hand-written file still loads.
  const first = splitRow(lines[0]).map((c) => c.trim().toLowerCase());
  const hasHeader = first[0] === "id" || first[0] === "date";
  const rows = hasHeader ? lines.slice(1) : lines;

  const entries: LogEntry[] = [];
  for (const [i, line] of rows.entries()) {
    const c = splitRow(line);
    const date = c[1]?.trim();
    // A row without a date can't be placed on any day, so it is dropped rather
    // than silently landing on today and skewing that day's totals.
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) continue;

    const slot = c[2]?.trim().toLowerCase() as MealSlot;
    const loggedAt = optional(c[16]) ?? `${date}T12:00:00.000Z`;

    entries.push({
      id: optional(c[0]) ?? `${date}-${i}`,
      date,
      slot: SLOTS.includes(slot) ? slot : "snack",
      // foodId is only meaningful for entries that came from the catalog; the
      // read-only app never dereferences it, so the name is a fine stand-in.
      foodId: optional(c[3]) ?? "",
      name: optional(c[3]) ?? "Unnamed",
      variant: optional(c[4]),
      brand: optional(c[5]),
      source: (optional(c[15]) as FoodSource) ?? "custom",
      per: optional(c[6]) ?? "1 serving",
      servings: optionalNumber(c[7]) ?? 1,
      macros: {
        calories: requiredNumber(c[8]),
        protein: requiredNumber(c[9]),
        carbs: requiredNumber(c[10]),
        fat: requiredNumber(c[11]),
        fiber: optionalNumber(c[12]),
        sugar: optionalNumber(c[13]),
        sodium: optionalNumber(c[14]),
      },
      loggedAt,
    });
  }

  return entries.sort(
    (a, b) => a.date.localeCompare(b.date) || a.loggedAt.localeCompare(b.loggedAt),
  );
}

/** Read the committed log. Build-time only — never call this from the client. */
export function readLog(): LogEntry[] {
  try {
    return parseLogCsv(readFileSync(LOG_PATH, "utf8"));
  } catch {
    // A missing file is a legitimate state: a fresh clone before the first
    // entry is logged. An empty dashboard is the honest thing to render.
    return [];
  }
}
