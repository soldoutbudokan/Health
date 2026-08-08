import { round } from "@/lib/nutrition";
import { formatDay } from "@/lib/labels";
import { sessionOutput } from "@/lib/training";
import type { WorkoutSet } from "@/lib/trainingTypes";

/**
 * The selected day's total output: pounds moved, bodyweight reps and minutes
 * of conditioning, with a bar per weighted exercise showing where the pounds
 * came from. Only active, logged work counts — every number is a sum over
 * `data/workouts.csv` rows, so the card exists for any past day just by
 * stepping back to it.
 *
 * This is deliberately *not* a calories-burned figure. That was built and
 * removed the same day (August 5, 2026) because MET numbers are population
 * averages dressed as data. Pounds, reps and minutes are things that were
 * actually counted, so they can be totalled without inventing anything —
 * which is also why they stay three numbers instead of one.
 */

interface Props {
  /** The day's session sets, as handed to the session card. */
  sets: WorkoutSet[];
  date: string;
  /** The build day, so the header names the day the way the other cards do. */
  today: string;
}

function Stat({
  value,
  label,
  hint,
}: {
  value: string | number;
  label: string;
  hint?: string;
}) {
  return (
    <div className="min-w-0 max-w-64">
      <div className="text-xl font-semibold leading-none">{value}</div>
      <div className="mt-1 text-[11px] font-medium uppercase tracking-wide text-muted">
        {label}
      </div>
      {hint && <div className="mt-0.5 truncate text-xs text-muted">{hint}</div>}
    </div>
  );
}

export function OutputCard({ sets, date, today }: Props) {
  const out = sessionOutput(sets);
  if (out.volumeLbs === 0 && out.bodyweightReps === 0 && out.conditioningMin === 0) {
    // A session whose sets carry no numbers (a pure mobility day) has nothing
    // to total. No card beats a card of zeros that read as "did nothing".
    return null;
  }

  const maxLbs = out.lifts[0]?.lbs ?? 0;

  return (
    <section className="card p-4">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-sm font-semibold">Total output</h2>
        <span className="text-xs text-muted">{formatDay(date, today)}</span>
      </div>

      <div className="mt-3 flex flex-wrap gap-x-8 gap-y-2">
        {out.volumeLbs > 0 && (
          <Stat
            value={round(out.volumeLbs).toLocaleString("en-US")}
            label="lbs moved"
            // With a single weighted lift there is no bar chart below to name
            // it, so the stat carries the name itself.
            hint={out.lifts.length === 1 ? out.lifts[0].exercise : undefined}
          />
        )}
        {out.bodyweightReps > 0 && (
          <Stat
            value={out.bodyweightReps}
            label="bodyweight reps"
            hint={out.bodyweight.map((r) => `${r.exercise} ×${r.reps}`).join(" · ")}
          />
        )}
        {out.conditioningMin > 0 && (
          <Stat
            value={round(out.conditioningMin, 1)}
            label="min conditioning"
            hint={out.conditioning.map((r) => r.exercise).join(" · ")}
          />
        )}
      </div>

      {/* One bar says nothing next to its own number, so the chart appears
          only once there are at least two lifts to compare. */}
      {out.lifts.length > 1 && (
        <div className="mt-4 border-t border-hairline pt-3">
          <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted">
            Lbs moved, by exercise
          </h3>
          <ul className="space-y-1.5">
            {out.lifts.map((l) => (
              <li key={l.exercise} className="flex items-center gap-2">
                <span
                  className="w-32 shrink-0 truncate text-xs text-ink-2"
                  title={l.exercise}
                >
                  {l.exercise}
                </span>
                <div className="min-w-0 flex-1">
                  {/* The 8px floor keeps the smallest accessory visible as a
                      mark; its value is beside it either way. */}
                  <div
                    aria-hidden
                    className="h-2 rounded-r-[4px]"
                    style={{
                      width: `${(l.lbs / maxLbs) * 100}%`,
                      minWidth: 8,
                      background: "var(--series-protein)",
                    }}
                  />
                </div>
                <span className="tnum w-12 shrink-0 text-right text-xs text-ink-2">
                  {round(l.lbs).toLocaleString("en-US")}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
