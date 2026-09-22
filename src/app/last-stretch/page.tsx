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
              A day is done when a session of the planned type is logged on it. There&rsquo;s
              nothing to click here on purpose: the log file is the only record, and a
              checkbox saved in the browser would be a second copy. Log the session and
              the box ticks on the next build.
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium">The loads are the plan if the session before went well</dt>
            <dd className="mt-0.5 text-sm leading-relaxed text-ink-2">
              Each heavy day is 5 lbs more than the last. If a session doesn&rsquo;t go well,
              the next one repeats the weight and every later row moves back a week. Past
              rows never change. One exception: the belt jump on Sep 22, a single 10 lb
              step, only if Sep 14 went well and the back was quiet for the two mornings
              after.
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium">The accessories are rules, not targets</dt>
            <dd className="mt-0.5 text-sm leading-relaxed text-ink-2">
              From Sep 21 the upper days also have numbers for the row, pulldown, curl, Y
              raise, fly and dips. None of these builds a bench; they keep the shoulders
              balanced and the elbows happy while the main lifts go up. The row goes up
              with the bench and stays near 83% of it, the pulldown goes up each light
              upper toward bodyweight, the curl goes up once a block, and the Y raise, fly
              and dips stay put. If a set isn&rsquo;t clean, repeat the number, same as the main
              lifts. The cable row, pulldown and leg curl machines go up in 10s, so a 5 lb step shows
              as the lower weight for 6 reps: 120 &times; 6 stands in for 125 &times; 5.
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium">The weighted jump holds at 20</dt>
            <dd className="mt-0.5 text-sm leading-relaxed text-ink-2">
              From Oct 3 the light lower days have a number for it too, and it stays put:
              20 lbs a hand, 15 on a deload. The jump is about speed off the floor, and 40
              lbs at a 186 lb bodyweight is already about a fifth; any more and it starts
              costing the speed it&rsquo;s there to train. Every other jump is bodyweight on
              purpose.
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium">Where it ends</dt>
            <dd className="mt-0.5 text-sm leading-relaxed text-ink-2">
              Ten pullups on Nov 8, then trap bar 300 and squat 225 on Nov 17. Once all
              three are done, the stretch is over, whatever the bench is doing. The rows
              after that are backup: the same goal weights repeated for any lift that
              stalls, a deload the week of Nov 23, and the plan ending Dec 20. The
              deadline is still Dec 31.
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium">The shape of a week</dt>
            <dd className="mt-0.5 text-sm leading-relaxed text-ink-2">
              Weekends are the likeliest training days and they&rsquo;re fasted, so they get the
              light days: light lower Saturday, light upper Sunday. The heavy days are
              Tuesday and Thursday, fed. The first week back ran on weekdays because that
              weekend was taken, and the deload week moves its heavy days to Monday and
              Tuesday because I&rsquo;m away for the rest of it.
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium">Asking what a day should look like</dt>
            <dd className="mt-0.5 text-sm leading-relaxed text-ink-2">
              Tap the day. The card shows that session&rsquo;s program with the planned weight
              in bold and the last logged set next to it. The reasons behind the weights,
              the belt and the lower back are in sections 9 and 10 of{" "}
              <code className="text-[13px]">docs/training-plan.md</code>.
            </dd>
          </div>
        </dl>
      </section>
    </div>
  );
}
