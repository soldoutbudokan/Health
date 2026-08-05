import { addDays, parseDateKey } from "./nutrition";

/**
 * `formatDateKey` in `nutrition.ts` reads the clock and the ambient locale.
 * Both are fine in a browser-only app and both are hazards here: every page is
 * pre-rendered on the build machine and then hydrated in a browser, and any
 * value that differs between those two moments is a hydration mismatch.
 *
 * So the day a label is relative to arrives as an argument — the build day,
 * threaded down from the server component — and the locale is pinned. Server
 * and client then render the identical string, and "Today" means the day the
 * snapshot was taken, which is the only day this build can honestly speak for.
 */
export function formatDay(key: string, today: string): string {
  if (!key) return "";
  if (key === today) return "Today";
  if (key === addDays(today, -1)) return "Yesterday";
  return parseDateKey(key).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

/** Long form for headings and captions: "Tuesday, August 4, 2026". */
export function formatFullDay(key: string): string {
  if (!key) return "";
  return parseDateKey(key).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
