import type { PlanLine, PlanVerdict } from "@/lib/training";
import { setLabel } from "@/lib/training";
import type { PlannedSession } from "@/data/program";

/**
 * The logged session lined up against the day it was supposed to be.
 *
 * Reported flatly. An extra exercise and a missed set are both just facts
 * about the session, and a tracker that scolds gets closed — the value is in
 * seeing the drift accumulate across weeks, which only works if the reporting
 * stays neutral enough to be worth reading.
 *
 * Status is never carried by colour alone: every line has a glyph and a word.
 */

const STYLE: Record<
  PlanVerdict,
  { glyph: string; word: string; colour: string }
> = {
  met: { glyph: "✓", word: "As prescribed", colour: "var(--success-text)" },
  short: { glyph: "!", word: "Short", colour: "var(--status-warning)" },
  over: { glyph: "+", word: "Over", colour: "var(--series-protein)" },
  missing: { glyph: "×", word: "Not done", colour: "var(--status-serious)" },
  extra: { glyph: "+", word: "Extra", colour: "var(--series-protein)" },
  skipped: { glyph: "–", word: "Skipped", colour: "var(--text-muted)" },
};

export function PlanCheck({
  plan,
  lines,
}: {
  plan: PlannedSession;
  lines: PlanLine[];
}) {
  // Only what the plan actually asked for is scored. An optional exercise you
  // skipped isn't a miss, and something you added on top isn't a failure to do
  // something else — counting either in the denominator turns a good session
  // into a bad-looking fraction.
  const scored = lines.filter((l) => l.planned && l.verdict !== "skipped");
  const met = scored.filter((l) => l.verdict === "met").length;
  const extra = lines.filter((l) => l.verdict === "extra").length;

  return (
    <section className="card overflow-hidden">
      <header className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 border-b border-hairline px-4 py-3">
        <h2 className="text-base font-semibold">Against the plan</h2>
        <span className="tnum text-sm text-muted">
          {met} of {scored.length} as prescribed
          {extra > 0 && ` · ${extra} extra`}
        </span>
        <p className="w-full text-xs leading-snug text-muted">{plan.blurb}</p>
      </header>

      <ul className="divide-y divide-[color:var(--border)]">
        {lines.map((l, i) => {
          const s = STYLE[l.verdict];
          return (
            <li key={`${l.exercise}-${i}`} className="flex gap-3 px-4 py-2.5">
              <span
                aria-hidden
                className="mt-0.5 w-3 shrink-0 text-center text-sm font-bold"
                style={{ color: s.colour }}
              >
                {s.glyph}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                  <span className="text-[15px]">{l.exercise}</span>
                  <span className="tnum text-xs text-muted">
                    {l.sets.length > 0
                      ? l.sets.map(setLabel).join("  ")
                      : "not logged"}
                  </span>
                </div>
                <p className="text-xs text-muted">
                  <span className="sr-only">{s.word}. </span>
                  {l.detail}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
