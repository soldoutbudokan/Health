import { formatDay } from "@/lib/labels";
import type { DaySlot } from "@/lib/training";
import { GYM_SESSIONS, SESSION_SHORT } from "@/lib/trainingTypes";

/**
 * The last seven days as a strip — orienting, so it sits above the detail
 * wherever it appears. Extracted from the training page so the dashboard's
 * training column can carry the same card.
 */
export function WeekStrip({
  week,
  gymThisWeek,
  sessionsThisWeek,
  sinceDeload,
  today,
}: {
  week: DaySlot[];
  /** The four programmed lifting days only — the program's own target. */
  gymThisWeek: number;
  /** Everything logged, lifting or not. */
  sessionsThisWeek: number;
  sinceDeload: number | undefined;
  today: string;
}) {
  return (
    <section className="card px-4 py-3">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-sm font-semibold">Last seven days</h2>
        {/*
          Two figures, because "3 of 4 gym sessions" was one number doing two
          jobs and getting one of them wrong: the sled bout happened at the gym,
          so a week with it read as a session short. The total counts what was
          trained; the second counts only the four lifting days the program
          prescribes, which is the number progression actually depends on.
        */}
        <span className="tnum text-xs text-muted">
          {sessionsThisWeek} session{sessionsThisWeek === 1 ? "" : "s"} ·{" "}
          {gymThisWeek} of 4 lifting
        </span>
      </div>
      <ol className="mt-2.5 grid grid-cols-7 gap-1.5">
        {week.map((d) => {
          // The two filled chip states, and the whole of that colour scale:
          // a gym day in slot-1 blue, a conditioning day in magenta. Every
          // other day is a neutral surface, so nothing else competes and the
          // pair only ever has to separate from each other.
          const isGym = d.session ? GYM_SESSIONS.includes(d.session.type) : false;
          const fill = isGym
            ? { background: "var(--series-protein)", color: "#ffffff" }
            : d.session?.type === "conditioning"
              ? {
                  background: "var(--series-conditioning)",
                  color: "var(--on-conditioning)",
                }
              : undefined;
          return (
            <li key={d.date} className="text-center">
              <div className="text-[10px] text-muted">
                {formatDay(d.date, today) === "Today"
                  ? "Today"
                  : new Date(`${d.date}T12:00:00`).toLocaleDateString("en-US", {
                      weekday: "narrow",
                    })}
              </div>
              <div
                className={`mt-1 grid h-11 place-items-center rounded-lg px-0.5 text-[10px] font-semibold leading-tight ${
                  fill
                    ? ""
                    : d.session
                      ? "bg-surface-2 text-ink-2"
                      : d.break
                        ? "bg-track text-muted"
                        : "border border-dashed border-hairline text-muted"
                }`}
                style={fill}
                title={d.session ? d.date : (d.break?.label ?? d.date)}
              >
                {d.session
                  ? SESSION_SHORT[d.session.type]
                  : d.break
                    ? "off"
                    : "—"}
              </div>
            </li>
          );
        })}
      </ol>
      <p className="mt-2 text-[11px] leading-snug text-muted">
        {sinceDeload === undefined
          ? "No deload week recorded yet. The plan calls for one every 4–5 weeks — mark it in data/sessions.csv when it happens."
          : `${sinceDeload} week${sinceDeload === 1 ? "" : "s"} since the last deload. The plan calls for one every 4–5 weeks.`}
      </p>
    </section>
  );
}
