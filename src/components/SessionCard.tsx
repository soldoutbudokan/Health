import { round } from "@/lib/nutrition";
import { formatDay } from "@/lib/labels";
import {
  byExercise,
  setLabel,
  volume,
  workingSets,
  type BurnEstimate,
} from "@/lib/training";
import {
  FATIGUE_LABELS,
  KIND_LABELS,
  KIND_ORDER,
  SESSION_LABELS,
  type Session,
  type SetKind,
  type WorkoutSet,
} from "@/lib/trainingTypes";

/**
 * One session, laid out the way you'd describe it out loud: grouped by what
 * the work was for, each exercise on a line, its sets beside it.
 *
 * Sets are shown individually rather than collapsed to "2 × 130 × 5", because
 * the sets that *differ* are the interesting ones — "155 × 5, 135 × 5" is a
 * top set and a back-off set, and averaging or collapsing them would hide the
 * single number progression actually keys on. The heaviest set of each
 * exercise is emphasised for the same reason.
 */

interface Props {
  session: Session;
  sets: WorkoutSet[];
  /** The build day, so "Today" means the day the snapshot was taken. */
  today: string;
  /** MET-based energy estimate for the session, when one can be made. */
  burn?: BurnEstimate;
}

function SetPill({ set, top }: { set: WorkoutSet; top: boolean }) {
  return (
    <span
      className={`tnum shrink-0 rounded-md px-2 py-1 text-xs ${
        top
          ? "bg-surface-2 font-semibold text-ink"
          : "border border-hairline text-ink-2"
      }`}
    >
      {setLabel(set)}
      {set.rpe !== undefined && (
        <span className="ml-1 font-normal text-muted">@{set.rpe}</span>
      )}
    </span>
  );
}

export function SessionCard({ session, sets, today, burn }: Props) {
  const groups = KIND_ORDER.map((kind) => ({
    kind,
    entries: byExercise(sets.filter((s) => s.kind === kind)),
  })).filter((g) => g.entries.length > 0);

  const working = workingSets(sets);
  const exerciseCount = byExercise(sets).length;
  const moved = volume(sets);

  return (
    <section className="card overflow-hidden">
      <header className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 border-b border-hairline px-4 py-3">
        <h2 className="text-base font-semibold">{SESSION_LABELS[session.type]}</h2>
        <span className="text-sm text-muted">{formatDay(session.date, today)}</span>
        <p className="tnum w-full text-xs text-muted">
          {exerciseCount} exercise{exerciseCount === 1 ? "" : "s"} · {working.length} working
          set{working.length === 1 ? "" : "s"}
          {moved > 0 && ` · ${round(moved).toLocaleString("en-US")} lbs moved`}
          {session.durationMin !== undefined && ` · ${round(session.durationMin)} min`}
          {burn && (
            /* "≈" and the tooltip both mark this as an estimate — a MET table
               figure, not a measurement. */
            <span
              title={`MET estimate: ${burn.met} METs × ${round(burn.bodyweightLbs, 1)} lbs × ${burn.minutes} min${
                burn.minutesAssumed ? " (duration estimated from the sets)" : ""
              }. Rough by nature — the trend across sessions is the signal, not any single figure.`}
            >
              {" "}
              · ≈{burn.kcal} kcal
            </span>
          )}
          {session.deload && " · deload week"}
        </p>
      </header>

      <div className="divide-y divide-[color:var(--border)]">
        {groups.map((g) => (
          <div key={g.kind} className="px-4 py-3">
            <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted">
              {KIND_LABELS[g.kind as SetKind]}
            </h3>
            <ul className="space-y-2">
              {g.entries.map((e, i) => {
                const heaviest = Math.max(
                  ...e.sets.map((s) => s.weightLbs ?? -Infinity),
                );
                const note = e.sets.find((s) => s.note)?.note;
                return (
                  <li key={`${e.exercise}-${i}`}>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                      <span className="min-w-0 flex-1 text-[15px]">{e.exercise}</span>
                      <div className="flex flex-wrap justify-end gap-1.5">
                        {e.sets.map((s) => (
                          <SetPill
                            key={s.id}
                            set={s}
                            top={
                              s.weightLbs !== undefined &&
                              s.weightLbs === heaviest &&
                              e.sets.length > 1
                            }
                          />
                        ))}
                      </div>
                    </div>
                    {note && (
                      <p className="mt-1 text-xs leading-snug text-muted">{note}</p>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      {(session.note || session.fatigue !== undefined || session.sweat || session.flags.length > 0) && (
        <footer className="border-t border-hairline bg-surface-2 px-4 py-3">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
            {session.fatigue !== undefined && (
              <span className="font-semibold">
                {FATIGUE_LABELS[session.fatigue] ?? `Fatigue ${session.fatigue}`}
              </span>
            )}
            {session.sweat && session.sweat !== "normal" && (
              <span className="text-ink-2">
                Sweat {session.sweat === "high" ? "above" : "below"} normal
              </span>
            )}
            {session.bodyweightLbs !== undefined && (
              <span className="tnum text-ink-2">
                Bodyweight {round(session.bodyweightLbs, 1)} lbs
              </span>
            )}
            {session.flags.map((f) => (
              <span
                key={f}
                className="rounded-md px-1.5 py-0.5 font-semibold"
                style={{
                  color: "var(--status-critical)",
                  background: "color-mix(in srgb, var(--status-critical) 12%, transparent)",
                }}
              >
                {f}
              </span>
            ))}
          </div>
          {session.note && (
            <p className="mt-1.5 text-xs leading-snug text-ink-2">{session.note}</p>
          )}
        </footer>
      )}
    </section>
  );
}
