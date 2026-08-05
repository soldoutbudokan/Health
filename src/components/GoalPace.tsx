import { round } from "@/lib/nutrition";
import { formatDay } from "@/lib/labels";
import type { GoalProgress } from "@/lib/training";

/**
 * The six goals against the road from the August baseline to December 31st.
 *
 * The bar is the road; the fill is where you are; the tick is where a straight
 * line says you should be today. That third mark is the whole point — "165 of
 * 225" says nothing without knowing whether it is early or late, and a bare
 * percentage on a five-month goal reads as failure for four of those months.
 *
 * Underneath each bar sits what the January spreadsheet projected for this
 * month. The distance between the two is the six weeks lost to travel and
 * illness, which is worth seeing rather than quietly absorbing into "behind".
 */

type Verdict = "ahead" | "on-pace" | "behind" | "achieved" | "skill" | "unknown";

const VERDICT: Record<Verdict, { word: string; colour: string }> = {
  ahead: { word: "Ahead", colour: "var(--success-text)" },
  "on-pace": { word: "On pace", colour: "var(--success-text)" },
  behind: { word: "Behind", colour: "var(--status-warning)" },
  achieved: { word: "Achieved", colour: "var(--success-text)" },
  skill: { word: "Milestones", colour: "var(--text-muted)" },
  unknown: { word: "Not logged", colour: "var(--text-muted)" },
};

/**
 * Tolerance before a goal is called off-pace: 3% of the total span, floored at
 * 2 units. Without it every goal reads "behind" the day after the baseline is
 * set, because a linear pace line has already moved and you have not.
 */
function verdictFor(p: GoalProgress): Verdict {
  if (p.goal.metric === "skill") return "skill";
  if (p.current === undefined) return "unknown";
  if (p.current >= p.goal.target) return "achieved";
  if (p.delta === undefined) return "unknown";
  const tol = Math.max(2, Math.abs(p.goal.target - p.goal.baseline) * 0.03);
  if (p.delta >= tol) return "ahead";
  if (p.delta <= -tol) return "behind";
  return "on-pace";
}

function ProjectionNote({ p }: { p: GoalProgress }) {
  if (p.projected === undefined || p.current === undefined) return null;
  const diff = round(p.current - p.projected, 1);
  const unit = p.goal.unit ? ` ${p.goal.unit}` : "";
  return (
    <p className="tnum mt-1.5 text-[11px] leading-snug text-muted">
      January&rsquo;s projection had you at {round(p.projected)}
      {unit} by now —{" "}
      {Math.abs(diff) < 2
        ? "you're on it"
        : `you're ${Math.abs(diff)} ${diff > 0 ? "ahead of" : "behind"} it`}
      .
    </p>
  );
}

function GoalRow({ p, today }: { p: GoalProgress; today: string }) {
  const v = verdictFor(p);
  const { goal } = p;
  const span = goal.target - goal.baseline;
  const unit = goal.unit ? ` ${goal.unit}` : "";

  // Where the pace tick sits along the bar. Same linear road as `pace`, so it
  // is derived from it rather than recomputed from dates.
  const paceFraction =
    span === 0 || p.pace === undefined
      ? 0
      : Math.min(1, Math.max(0, (p.pace - goal.baseline) / span));

  return (
    <li className="px-4 py-3.5">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
        <h3 className="text-[15px] font-medium">{goal.name}</h3>
        <span
          className="text-xs font-semibold"
          style={{ color: VERDICT[v].colour }}
        >
          {VERDICT[v].word}
        </span>
      </div>

      {goal.metric === "skill" ? (
        <p className="mt-1 text-xs leading-snug text-muted">{goal.note}</p>
      ) : (
        <>
          <p className="tnum mt-0.5 text-xs text-ink-2">
            {p.current !== undefined ? (
              <>
                <span className="text-base font-semibold text-ink">
                  {round(p.current, 1)}
                </span>
                {unit}
                {goal.metric === "weight" && goal.reps ? ` × ${goal.reps}` : ""}
                {p.currentSet && (
                  <span className="text-muted">
                    {" "}
                    · {formatDay(p.currentSet.date, today)}
                  </span>
                )}
              </>
            ) : (
              <span className="text-muted">nothing logged yet</span>
            )}
          </p>

          {span === 0 ? (
            <p className="mt-1.5 text-xs text-muted">
              Hold at {goal.target}
              {unit}. The job here is maintenance, not progress.
            </p>
          ) : (
            <>
              <div className="relative mt-2.5 h-2 rounded-full bg-track">
                <div
                  className="h-2 rounded-full transition-[width]"
                  style={{
                    width: `${p.fraction * 100}%`,
                    background: VERDICT[v].colour,
                  }}
                />
                {/* Where today's pace says you should be. */}
                <div
                  className="absolute -top-1 h-4 w-0.5 rounded"
                  style={{
                    left: `${paceFraction * 100}%`,
                    background: "var(--text-primary)",
                  }}
                  aria-hidden
                />
              </div>
              <div className="tnum mt-1 flex justify-between text-[11px] text-muted">
                <span>
                  {goal.baseline}
                  {unit} in August
                </span>
                <span>
                  {goal.target}
                  {unit} by December
                </span>
              </div>
              <p className="sr-only">
                Pace for today is {p.pace}
                {unit}.
              </p>
            </>
          )}

          {goal.status === "stretch" && goal.realistic && (
            <p className="mt-1.5 text-[11px] leading-snug text-muted">
              A stretch target. {goal.realistic.min}–{goal.realistic.max}
              {unit} is the realistic December landing.
            </p>
          )}

          <ProjectionNote p={p} />
        </>
      )}
    </li>
  );
}

export function GoalPace({
  progress,
  today,
  deadline,
}: {
  progress: GoalProgress[];
  today: string;
  deadline: string;
}) {
  return (
    <section className="card overflow-hidden">
      <header className="border-b border-hairline px-4 py-3">
        <h2 className="text-base font-semibold">Goals</h2>
        <p className="mt-0.5 text-xs text-muted">
          Against a straight line from the August baseline to {formatDay(deadline, today)}.
          The upright tick on each bar is today&rsquo;s pace.
        </p>
      </header>
      <ul className="divide-y divide-[color:var(--border)]">
        {progress.map((p) => (
          <GoalRow key={p.goal.id} p={p} today={today} />
        ))}
      </ul>
    </section>
  );
}
