import Link from "next/link";
import { addDays, round } from "@/lib/nutrition";
import { formatDay } from "@/lib/labels";
import {
  breakOn,
  comparePlan,
  gymSessionsIn,
  sessionsIn,
  outputSeries,
  planFor,
  sessionOn,
  sessionSets,
  weekStrip,
  weeksSinceDeload,
} from "@/lib/training";
import type {
  Checkin,
  Session,
  TrainingBreak,
  WorkoutSet,
} from "@/lib/trainingTypes";
import { SessionCard } from "@/components/SessionCard";
import { PlanCheck } from "@/components/PlanCheck";
import { OutputCard } from "@/components/OutputCard";
import { WeekStrip } from "@/components/WeekStrip";
import { OutputChart } from "@/components/OutputChart";

/**
 * The training half of the dashboard, pinned to the dashboard's selected day:
 * the session logged *on that day* and nothing else's. Yesterday shows
 * yesterday's heavy upper; today shows blank until something is logged. The
 * site never schedules — an empty day is an honest empty, not a plan.
 *
 * The week strip and the lbs-moved chart sit below as standing context; they
 * are historical and don't change with the selected day. The bodyweight chart
 * used to sit here too, and moved to the food column on August 9, 2026 —
 * bodyweight follows diet more than it follows any single session.
 */

/** "23:00" → "11:00 pm". The file stores a local 24-hour clock. */
function formatClock(hhmm: string): string {
  const [h, m] = hhmm.split(":").map(Number);
  const suffix = h < 12 ? "am" : "pm";
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${String(m).padStart(2, "0")} ${suffix}`;
}

/** Minutes slept, with the start on the evening before the end. */
function sleepMinutes(start: string, end: string): number {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  const s = sh * 60 + sm;
  const e = eh * 60 + em;
  return e >= s ? e - s : e + 24 * 60 - s;
}

function formatDuration(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m === 0 ? `${h} h` : `${h} h ${m} m`;
}

function CheckinCard({ checkin, today }: { checkin: Checkin; today: string }) {
  const slept =
    checkin.sleepStart && checkin.sleepEnd
      ? sleepMinutes(checkin.sleepStart, checkin.sleepEnd)
      : undefined;

  return (
    <section className="card px-4 py-3">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-sm font-semibold">Morning check-in</h2>
        <span className="text-xs text-muted">{formatDay(checkin.date, today)}</span>
      </div>
      <div className="mt-1.5 flex flex-wrap items-baseline gap-x-5 gap-y-1 text-sm text-ink-2">
        {checkin.bodyweightLbs !== undefined && (
          <span className="tnum">
            <span className="text-base font-semibold text-ink">
              {round(checkin.bodyweightLbs, 1)}
            </span>{" "}
            lbs
          </span>
        )}
        {checkin.sleepStart && checkin.sleepEnd && (
          <span className="tnum">
            Slept {formatClock(checkin.sleepStart)}–{formatClock(checkin.sleepEnd)}
            {slept !== undefined && (
              <span className="text-muted"> · {formatDuration(slept)}</span>
            )}
          </span>
        )}
      </div>
      {checkin.note && (
        <p className="mt-1 text-xs leading-snug text-muted">{checkin.note}</p>
      )}
    </section>
  );
}

export function TrainingDay({
  sets,
  sessions,
  breaks,
  checkins,
  date,
  today,
}: {
  sets: WorkoutSet[];
  sessions: Session[];
  breaks: TrainingBreak[];
  checkins: Checkin[];
  /** The day the dashboard is looking at — this column follows it. */
  date: string;
  today: string;
}) {
  const session = sessionOn(sessions, date);
  const daySets = session ? sessionSets(sets, date) : [];
  const plan = planFor(session);
  const planLines = plan ? comparePlan(plan, daySets) : [];
  const checkin = checkins.find((c) => c.date === date);
  const dayBreak = breakOn(breaks, date);

  const week = weekStrip(sessions, breaks, today);
  const gymThisWeek = gymSessionsIn(sessions, addDays(today, -6), today);
  const sessionsThisWeek = sessionsIn(sessions, addDays(today, -6), today);
  const sinceDeload = weeksSinceDeload(sessions, today);
  const output = outputSeries(sets, sessions);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="py-1.5 text-lg font-semibold">Training</h1>
        <Link
          href="/training"
          className="ml-auto text-sm font-medium text-ink-2 underline decoration-hairline underline-offset-4 hover:text-ink"
        >
          Full training →
        </Link>
      </div>

      {checkin && <CheckinCard checkin={checkin} today={today} />}

      {session ? (
        <>
          <SessionCard session={session} sets={daySets} today={today} />
          {plan && <PlanCheck plan={plan} lines={planLines} />}
          <OutputCard sets={daySets} date={date} today={today} />
        </>
      ) : (
        <div className="card p-8 text-center">
          <p className="text-sm text-ink-2">
            No training logged for {formatDay(date, today).toLowerCase()}.
          </p>
          {dayBreak && (
            <p className="mx-auto mt-2 max-w-md text-xs leading-relaxed text-muted">
              Marked away: {dayBreak.label}.
            </p>
          )}
        </div>
      )}

      <WeekStrip
        week={week}
        gymThisWeek={gymThisWeek}
        sessionsThisWeek={sessionsThisWeek}
        sinceDeload={sinceDeload}
        today={today}
      />

      {output.length > 0 && <OutputChart points={output} today={today} height={130} />}
    </div>
  );
}
