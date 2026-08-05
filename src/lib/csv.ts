/**
 * RFC 4180 row splitting, shared by every CSV the build reads.
 *
 * Naive `line.split(",")` corrupts roughly a third of this data: food names
 * contain commas ("Chicken Curry, curry only"), and so do provenance notes on
 * workout rows. Doubled quotes inside a quoted field are an escaped quote.
 *
 * Deliberately free of `node:fs` so it stays a pure function — the readers
 * that wrap it are the build-time-only half.
 */
export function splitRow(line: string): string[] {
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

/** Non-empty lines only. A trailing newline is not a row. */
export function csvLines(csv: string): string[] {
  return csv.split(/\r?\n/).filter((l) => l.trim().length > 0);
}

/** Trimmed, or undefined when blank. Blank means *not recorded*, never zero. */
export function optional(v: string | undefined): string | undefined {
  const s = v?.trim();
  return s ? s : undefined;
}

/** A finite number, or undefined. Same blank-is-not-zero rule. */
export function optionalNumber(v: string | undefined): number | undefined {
  const s = v?.trim();
  if (!s) return undefined;
  const n = Number(s);
  return Number.isFinite(n) ? n : undefined;
}

export const isDateKey = (s: string | undefined): s is string =>
  !!s && /^\d{4}-\d{2}-\d{2}$/.test(s);
