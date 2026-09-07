import Link from "next/link";
import { toDateKey } from "@/lib/nutrition";
import { readSessions, readTrainingGoals, readWorkouts } from "@/lib/trainingFile";
import { readLastStretch } from "@/lib/lastStretchFile";
import { goalTracks, tally, weeks } from "@/lib/lastStretch";
import { LastStretchCalendar } from "@/components/LastStretchCalendar";

/**
 * THE LAST STRETCH — the calendar from September 7, 2026 to the day the three
 * remaining strength goals close, on the line where every session goes well.
 *
 * Server component: reads the plan and the training files at build time,
 * computes every day's status against the log, and hands the client calendar
 * plain data. This is the one page on the site that says what to do on a
 * date; the dashboard still only records, and that rule is not relaxed here —
 * it is worked around on a page whose whole purpose is the plan.
 */

export const metadata = { title: "The Last Stretch · Health" };

export default function LastStretchPage() {
  const plans = readLastStretch();
  const sets = readWorkouts();
  const sessions = readSessions();
  const goals = readTrainingGoals();
  const today = toDateKey(new Date());

  const wk = weeks(plans, sessions, sets, today);
  const { done, due } = tally(
    wk.flatMap((w) => w.days),
    today,
  );
  const tracks = goalTracks(goals, plans, sets);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h1 className="text-lg font-semibold uppercase tracking-wide">The Last Stretch</h1>
        <Link
          href="/program"
          className="text-sm font-medium text-ink-2 underline decoration-hairline underline-offset-4 hover:text-ink"
        >
          The program →
        </Link>
        <p className="w-full text-sm text-muted">
          Every planned session from the BC break to the day the trap bar reaches 300 × 5,
          the squat 225 × 5 and the pullups 10, assuming every session goes well. The bench
          rides along at an assumed rate and is not a condition of finishing; after these
          three close, the next block is cardio. The plan is{" "}
          <code className="text-[13px]">data/last-stretch.csv</code>; the ticks come from{" "}
          <code className="text-[13px]">data/sessions.csv</code>.
        </p>
      </div>

      {plans.length > 0 ? (
        <LastStretchCalendar weeks={wk} goals={tracks} today={today} done={done} due={due} />
      ) : (
        <p className="card p-8 text-center text-sm text-muted">
          No plan file. Write <code>data/last-stretch.csv</code> and rebuild.
        </p>
      )}

      <section className="card p-4">
        <h2 className="text-base font-semibold">How to read it</h2>
        <dl className="mt-3 space-y-3">
          <div>
            <dt className="text-sm font-medium">A tick is the log, not a click</dt>
            <dd className="mt-0.5 text-sm leading-relaxed text-ink-2">
              A day is done when a session of the planned type was logged on it. There is
              nothing on this page to press to complete a workout, on purpose: the site has
              one writer and one file, and a checkbox that saved in the browser would be a
              second copy of the truth. Log the session and the box ticks itself on the next
              build.
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium">The loads are the plan if the session before went well</dt>
            <dd className="mt-0.5 text-sm leading-relaxed text-ink-2">
              Each heavy day steps 5 lbs on the one before it. When a session does not move
              well, the next one repeats the weight and every later row slides a week; the
              file gets revised to say so, the past rows stay as they were. One exception
              is written in: the belt jump on Sep 21, a single 10 lb step allowed only if
              Sep 14 moved well and the back said nothing for two mornings.
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium">Where it ends</dt>
            <dd className="mt-0.5 text-sm leading-relaxed text-ink-2">
              Trap bar 300 on Oct 26, ten pullups on Oct 30, squat 225 on Nov 9. Once all
              three have landed the stretch is over, whatever the bench is doing, and the
              rows after that are contingency: the same goal weights repeated for the
              sessions that stall, with a deload in the week of Nov 23 and the file ending
              Dec 20. The deadline stays Dec 31.
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium">Asking what a day should look like</dt>
            <dd className="mt-0.5 text-sm leading-relaxed text-ink-2">
              Tap the day. The card lists the program for that session with the planned
              load in bold and the last logged set beside it, so the answer to &ldquo;what
              am I doing today&rdquo; is on the page. The reasoning behind the loads, the
              belt and the lower back is in sections 9 and 10 of{" "}
              <code className="text-[13px]">docs/training-plan.md</code>.
            </dd>
          </div>
        </dl>
      </section>
    </div>
  );
}
