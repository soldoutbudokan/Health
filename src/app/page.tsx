import { readLog } from "@/lib/logFile";
import { readGoals } from "@/lib/goalsFile";
import {
  readBreaks,
  readCheckins,
  readSessions,
  readWorkouts,
} from "@/lib/trainingFile";
import { proteinStreak, toDateKey } from "@/lib/nutrition";
import { TodayView } from "@/components/TodayView";

/**
 * Server component: reads the log off disk at build time and hands the parsed
 * entries to a client component as plain data.
 *
 * That split is the point of the whole app. `readLog` uses `node:fs`, so it can
 * only ever run on the build machine; what ships to the browser is JSON baked
 * into the HTML. The client half owns nothing but which day you are looking at.
 *
 * The two clock-derived values are computed here rather than in the browser.
 * `proteinStreak` calls `toDateKey()` internally, and anything that reads the
 * clock during render produces one answer while pre-rendering and a different
 * one on hydration.
 */
export default function Page() {
  const entries = readLog();
  const goals = readGoals();
  const now = new Date();
  const today = toDateKey(now);

  /* Diet and training side by side, because they are equally important and
     neither half should be a page away. TodayView owns the selected day, so
     stepping back a day moves both columns together. */
  return (
    <TodayView
      entries={entries}
      goals={goals}
      builtOn={today}
      builtHour={now.getHours()}
      streak={proteinStreak(entries, goals)}
      sets={readWorkouts()}
      sessions={readSessions()}
      breaks={readBreaks()}
      checkins={readCheckins()}
    />
  );
}
