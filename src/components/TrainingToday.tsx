import Link from "next/link";
import { addDays, round } from "@/lib/nutrition";
import { formatDay } from "@/lib/labels";
import {
  bodyweightSeries,
  comparePlan,
  gymSessionsIn,
  latestSession,
  planFor,
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
import { WeekStrip } from "@/components/WeekStrip";
import { BodyweightChart } from "@/components/BodyweightChart";

/**
 * The training half of the dashboard: the same week strip, latest session and
 * plan check that lead `/training`, sitting beside the day's food because the
 * two halves are equally important and neither should be a page away.
 *
 * Server component — everything here is a static read of committed files, so
 * it ships as HTML with no state at all.
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

export function TrainingToday({
  sets,
  sessions,
  breaks,
  checkins,
  today,
}: {
  sets: WorkoutSet[];
  sessions: Session[];
  breaks: TrainingBreak[];
  checkins: Checkin[];
  today: string;
}) {
  const latest = latestSession(sessions);
  const latestSets = latest ? sessionSets(sets, latest.date) : [];
  const plan = planFor(latest);
  const planLines = plan ? comparePlan(plan, latestSets) : [];

  const week = weekStrip(sessions, breaks, today);
  const gymThisWeek = gymSessionsIn(sessions, addDays(today, -6), today);
  const sinceDeload = weeksSinceDeload(sessions, today);

  // The newest check-in, but only if it's recent enough to still be news — a
  // reading from a fortnight ago shown under "Today" would just mislead.
  const newest = checkins[checkins.length - 1];
  const checkin = newest && newest.date >= addDays(today, -6) ? newest : undefined;

  const bodyweight = bodyweightSeries(checkins, sessions);

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

      {bodyweight.length > 0 && (
        <BodyweightChart points={bodyweight} today={today} height={110} />
      )}

      <WeekStrip
        week={week}
        gymThisWeek={gymThisWeek}
        sinceDeload={sinceDeload}
        today={today}
      />

      {latest ? (
        <>
          <SessionCard session={latest} sets={latestSets} today={today} />
          {plan && <PlanCheck plan={plan} lines={planLines} />}
        </>
      ) : (
        <p className="card p-8 text-center text-sm text-muted">
          No sessions logged yet. Tell Claude Code what you lifted and it lands
          in <code>data/workouts.csv</code>.
        </p>
      )}
    </div>
  );
}
