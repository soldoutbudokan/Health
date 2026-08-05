import Link from "next/link";
import { addDays, round, toDateKey } from "@/lib/nutrition";
import { formatDay } from "@/lib/labels";
import {
  readBreaks,
  readCheckins,
  readSessions,
  readTrainingGoals,
  readWorkouts,
} from "@/lib/trainingFile";
import {
  bodyweightSeries,
  comparePlan,
  gymSessionsIn,
  goalProgress,
  latestSession,
  liftSeries,
  planFor,
  sessionSets,
  weekStrip,
  weeksSinceDeload,
} from "@/lib/training";
import { type TrainingGoal } from "@/lib/trainingTypes";
import { SessionCard } from "@/components/SessionCard";
import { PlanCheck } from "@/components/PlanCheck";
import { GoalPace } from "@/components/GoalPace";
import { LiftChart } from "@/components/LiftChart";
import { WeekStrip } from "@/components/WeekStrip";
import { BodyweightChart } from "@/components/BodyweightChart";

/**
 * Server component: reads the three training files at build time and renders
 * the lot. Only the charts are client components, because hover is the only
 * interaction on the page — everything else is a static read of committed
 * files, so it ships as HTML.
 *
 * The build day is computed here and threaded down as `today` for the same
 * reason it is on the nutrition dashboard: a label that reads the clock during
 * render says one thing while pre-rendering and another on hydration.
 */

export const metadata = { title: "Training · Health" };

/** How far back the charts look. Seven months puts the layoff in frame. */
const CHART_LOOKBACK_DAYS = 212;

const CHART_COLOURS: Record<string, string> = {
  deadlift: "var(--series-protein)",
  squat: "var(--series-carbs)",
  bench: "var(--series-fat)",
};

export default function TrainingPage() {
  const sets = readWorkouts();
  const sessions = readSessions();
  const breaks = readBreaks();
  const checkins = readCheckins();
  const goals = readTrainingGoals();
  const today = toDateKey(new Date());

  const latest = latestSession(sessions);
  const latestSets = latest ? sessionSets(sets, latest.date) : [];
  const plan = planFor(latest);
  const planLines = plan ? comparePlan(plan, latestSets) : [];

  const progress = goalProgress(goals, sets, today);
  const week = weekStrip(sessions, breaks, today);
  const gymThisWeek = gymSessionsIn(sessions, addDays(today, -6), today);
  const sinceDeload = weeksSinceDeload(sessions, today);

  const chartWindowStart = goals.baselineOn
    ? addDays(goals.baselineOn, -CHART_LOOKBACK_DAYS)
    : addDays(today, -CHART_LOOKBACK_DAYS);

  const charted = goals.goals.filter(
    (g): g is TrainingGoal => g.metric === "weight",
  );
  const bodyweight = bodyweightSeries(checkins, sessions);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h1 className="text-lg font-semibold">Training</h1>
        <Link
          href="/program"
          className="text-sm font-medium text-ink-2 underline decoration-hairline underline-offset-4 hover:text-ink"
        >
          See the full program →
        </Link>
        <p className="w-full text-sm text-muted">
          Four gym sessions a week against a December 31st deadline. The log is{" "}
          <code className="text-[13px]">data/workouts.csv</code>; the plan it is
          checked against is <code className="text-[13px]">docs/training-plan.md</code>.
        </p>
      </div>

      {/* Week strip — orienting, so it sits above the detail. */}
      <WeekStrip
        week={week}
        gymThisWeek={gymThisWeek}
        sinceDeload={sinceDeload}
        today={today}
      />

      {latest ? (
        <div>
          {/* Same label the dashboard column carries: this is the last thing
              logged, not anything scheduled for today. */}
          <h2 className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted">
            Last logged session · {formatDay(latest.date, today)}
          </h2>
          <div className="grid gap-5 lg:grid-cols-2">
            <SessionCard session={latest} sets={latestSets} today={today} />
            {plan && <PlanCheck plan={plan} lines={planLines} />}
          </div>
        </div>
      ) : (
        <p className="card p-8 text-center text-sm text-muted">
          No sessions logged yet. Tell Claude Code what you lifted and it lands in{" "}
          <code>data/workouts.csv</code>.
        </p>
      )}

      <GoalPace progress={progress} today={today} deadline={goals.deadline} />

      {(charted.length > 0 || bodyweight.length > 0) && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {charted.map((g) => (
            <LiftChart
              key={g.id}
              title={g.name}
              unit={g.unit}
              points={liftSeries(sets, g.exercise)}
              pace={{
                from: goals.baselineOn,
                fromValue: g.baseline,
                to: goals.deadline,
                toValue: g.target,
              }}
              breaks={breaks}
              windowStart={chartWindowStart}
              windowEnd={goals.deadline}
              today={today}
              colour={CHART_COLOURS[g.id] ?? "var(--series-protein)"}
            />
          ))}
          {bodyweight.length > 0 && (
            <BodyweightChart points={bodyweight} today={today} />
          )}
        </div>
      )}

      {breaks.length > 0 && (
        <section className="card overflow-hidden">
          <header className="border-b border-hairline px-4 py-3">
            <h2 className="text-base font-semibold">Interruptions</h2>
            <p className="mt-0.5 text-xs leading-snug text-muted">
              Recorded so a gap in the log reads as a gap in training rather than a
              gap in record-keeping — and so a lift that came back lower has an
              explanation attached to it.
            </p>
          </header>
          <ul className="divide-y divide-[color:var(--border)]">
            {breaks.map((b) => {
              const days =
                Math.round(
                  (new Date(`${b.end}T12:00:00`).getTime() -
                    new Date(`${b.start}T12:00:00`).getTime()) /
                    86_400_000,
                ) + 1;
              return (
                <li key={`${b.start}-${b.kind}`} className="px-4 py-3">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                    <span className="text-[15px] font-medium">{b.label}</span>
                    <span className="tnum text-xs text-muted">
                      {formatDay(b.start, today)} – {formatDay(b.end, today)} ·{" "}
                      {round(days / 7, 1)} weeks
                    </span>
                  </div>
                  {b.note && (
                    <p className="mt-0.5 text-xs leading-snug text-muted">{b.note}</p>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}
