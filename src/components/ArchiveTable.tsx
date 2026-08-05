import type {
  ArchiveChange,
  ArchiveRoutineRow,
  GripReading,
} from "@/lib/trainingFile";

/**
 * The old spreadsheet, on the site.
 *
 * Collapsed behind native `<details>` rather than a tab component: it is
 * reference material that most visits won't open, and `<details>` costs no
 * JavaScript, works before hydration, and is keyboard-accessible for free.
 *
 * Presented as a record, not as data. The settings mix pounds with machine pin
 * numbers — "6 Reps at 13" is a pin position, "5 Reps at 145 lbs" is a weight
 * — so nothing here is charted or totalled. Reproducing it verbatim is the
 * honest option; inferring units would invent numbers.
 */

function Section({
  summary,
  count,
  children,
}: {
  summary: string;
  count: string;
  children: React.ReactNode;
}) {
  return (
    <details className="group border-t border-hairline">
      <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3 text-sm font-medium hover:bg-surface-2">
        <span
          aria-hidden
          className="text-muted transition-transform group-open:rotate-90"
        >
          ›
        </span>
        {summary}
        <span className="tnum ml-auto text-xs text-muted">{count}</span>
      </summary>
      <div className="px-4 pb-4">{children}</div>
    </details>
  );
}

const TH = "px-2 py-1.5 text-left text-[11px] font-semibold uppercase tracking-wide text-muted";
const TD = "px-2 py-1.5 align-top";

export function ArchiveTable({
  changes,
  routine,
  grip,
}: {
  changes: ArchiveChange[];
  routine: ArchiveRoutineRow[];
  grip: GripReading[];
}) {
  if (!changes.length && !routine.length && !grip.length) return null;

  const days = [...new Set(routine.map((r) => r.day))];
  const span = changes.length
    ? `${changes[changes.length - 1].date} – ${changes[0].date}`
    : "";

  return (
    <section className="card overflow-hidden">
      <header className="px-4 py-3">
        <h2 className="text-base font-semibold">Archive — the previous routine</h2>
        <p className="mt-1 text-sm leading-relaxed text-ink-2">
          Before this program there was a five-day push/pull/legs/upper/lower split,
          tracked in a spreadsheet from February 2025{span && ` to January 2026`}.
          It is kept here because fifteen months of progression is worth more on a
          page than in a binary nobody opens — the original is at{" "}
          <code className="text-[13px]">docs/irl-cdtw.xlsx</code>, tidied into CSVs
          beside it.
        </p>
        <p className="mt-2 text-xs leading-snug text-muted">
          Read, never computed on. The settings mix pounds with machine pin numbers,
          so charting them would be confidently wrong. The rows whose units were
          unambiguous — bench, squat, deadlift, pullups, dips — were copied into{" "}
          <code>data/workouts.csv</code> by hand and appear on the charts there.
        </p>
      </header>

      {routine.length > 0 && (
        <Section summary="The five-day split, as it stood at the end" count={`${routine.length} exercises`}>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {days.map((day) => (
              <div key={day}>
                <h3 className="mb-1 text-sm font-semibold">{day}</h3>
                <table className="w-full text-xs">
                  <tbody className="divide-y divide-[color:var(--border)]">
                    {routine
                      .filter((r) => r.day === day)
                      .map((r, i) => (
                        <tr key={`${r.exercise}-${i}`}>
                          <td className={TD}>
                            <div>{r.exercise}</div>
                            <div className="text-[11px] text-muted">{r.focus}</div>
                          </td>
                          <td className={`${TD} tnum whitespace-nowrap text-right text-muted`}>
                            {r.setting || "—"}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        </Section>
      )}

      {changes.length > 0 && (
        <Section summary="Every setting change, newest first" count={`${changes.length} changes`}>
          <div className="max-h-96 overflow-auto rounded-lg border border-hairline">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-surface-2">
                <tr>
                  <th className={TH}>Date</th>
                  <th className={TH}>Exercise</th>
                  <th className={TH}>Day</th>
                  <th className={TH}>New setting</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[color:var(--border)]">
                {changes.map((c, i) => (
                  <tr key={`${c.date}-${c.exercise}-${i}`}>
                    <td className={`${TD} tnum whitespace-nowrap text-muted`}>{c.date}</td>
                    <td className={TD}>{c.exercise}</td>
                    <td className={`${TD} text-muted`}>{c.day}</td>
                    <td className={`${TD} tnum whitespace-nowrap`}>{c.setting}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      )}

      {grip.length > 0 && (
        <Section summary="Grip readings" count={`${grip.length} readings`}>
          <table className="w-full max-w-sm text-xs">
            <thead>
              <tr>
                <th className={TH}>Date</th>
                <th className={`${TH} text-right`}>Left</th>
                <th className={`${TH} text-right`}>Right</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[color:var(--border)]">
              {grip.map((g) => (
                <tr key={g.date}>
                  <td className={`${TD} tnum text-muted`}>{g.date}</td>
                  <td className={`${TD} tnum text-right`}>{g.left ?? "—"}</td>
                  <td className={`${TD} tnum text-right`}>{g.right ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-2 text-[11px] leading-snug text-muted">
            The spreadsheet never recorded a unit for these, so none is shown. Worth
            restarting with one — grip is a common deadlift limiter and the left/right
            gap here is wide enough to be interesting.
          </p>
        </Section>
      )}
    </section>
  );
}
