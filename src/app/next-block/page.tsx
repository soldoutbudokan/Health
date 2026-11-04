import Link from "next/link";
import {
  BEFORE,
  BENCH_LINES,
  CALENDAR,
  CUT,
  EXAMPLE_T,
  GOALS,
  HYPERMOBILITY,
  NORMAL_WEEK,
  PIECES,
  RULES,
  SHORT_WEEKS,
  STARTING_WEIGHTS,
  VISIT_ORDER,
  benchBackups,
  pieceById,
  type GoalState,
  type Piece,
  type PieceKind,
  type Slot,
} from "@/data/nextBlock";

/**
 * The next block, rendered from `src/data/nextBlock.ts`: what a week is made
 * of from November 30, 2026, and the rules for moving the pieces when the
 * week doesn't go to plan. It describes a template, not dates — the dated
 * heavy days that close the last two goals stay on `/last-stretch`, the one
 * page that schedules. Nothing here reads the log.
 *
 * The everyday material comes first and the reference material (backup
 * weights, starting weights, what was cut) sits in closed `<details>`, which
 * work without JavaScript, so the snapshot keeps them too.
 */

export const metadata = { title: "The Next Block · Health" };

const TONE: Record<PieceKind, React.CSSProperties | undefined> = {
  heavy: { background: "var(--series-fullbody)", color: "var(--on-fullbody)" },
  bench: { background: "var(--series-protein)", color: "#ffffff" },
  jump: { background: "var(--series-stretch)", color: "var(--on-stretch)" },
  cardio: { background: "var(--series-conditioning)", color: "var(--on-conditioning)" },
  joint: undefined,
};

function Chip({ slot, full = false }: { slot: Slot; full?: boolean }) {
  const p = pieceById(slot.id);
  const label = full ? p.name : p.short;
  return (
    <span
      style={TONE[p.kind]}
      className={`inline-flex shrink-0 items-center rounded-md px-2 py-1 text-xs font-semibold leading-none ${
        p.kind === "joint" ? "border border-hairline-strong text-ink-2" : ""
      }`}
    >
      {label}
      {slot.minutes !== undefined && <span className="tnum ml-1 font-normal">{slot.minutes} min</span>}
    </span>
  );
}

function Slots({ slots, full = false, stack = false }: { slots: Slot[]; full?: boolean; stack?: boolean }) {
  return (
    <span className={`flex flex-wrap gap-1 ${stack ? "sm:flex-col sm:items-start" : "items-center"}`}>
      {slots.map((s, i) => (
        <Chip key={`${s.id}-${i}`} slot={s} full={full} />
      ))}
    </span>
  );
}

function SectionHead({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <h2 className="text-base font-semibold">{title}</h2>
      {children && <p className="max-w-prose text-sm leading-relaxed text-ink-2">{children}</p>}
    </div>
  );
}

function PieceCard({ piece, wide = false }: { piece: Piece; wide?: boolean }) {
  let n = 0;
  return (
    <section className={`card overflow-hidden ${wide ? "sm:col-span-2" : ""}`}>
      <header className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-hairline px-4 py-3">
        <Chip slot={{ id: piece.id }} full />
        <span className="text-xs text-muted">
          {piece.when} · {piece.time}
        </span>
      </header>
      <ol className="divide-y divide-[color:var(--border)]">
        {piece.items.map((item) => (
          <li
            key={item.name}
            className="flex items-baseline justify-between gap-4 px-4 py-2 text-[15px]"
          >
            <span className={`min-w-0 ${item.warmup ? "text-muted" : ""}`}>
              <span className="tnum mr-2 inline-block w-3 text-xs text-muted">
                {item.warmup ? "" : ++n}
              </span>
              {item.name}
            </span>
            <span className="tnum shrink-0 text-right text-sm text-ink-2">{item.dose}</span>
          </li>
        ))}
      </ol>
      {piece.note && (
        <p className="border-t border-hairline px-4 py-3 text-sm leading-relaxed text-ink-2">
          {piece.note}
        </p>
      )}
    </section>
  );
}

const STATE: Record<GoalState, { word: string; className: string }> = {
  done: { word: "Done", className: "bg-good/15 text-[color:var(--success-text)]" },
  open: { word: "Closes Dec 15", className: "border border-hairline-strong text-ink-2" },
  climbing: { word: "Climbing", className: "bg-protein text-white" },
  new: { word: "New", className: "bg-surface-2 text-ink-2" },
};

function Reference({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <details className="card group">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-[15px] font-medium [&::-webkit-details-marker]:hidden">
        {title}
        <span aria-hidden className="text-muted transition-transform group-open:rotate-90">
          ›
        </span>
      </summary>
      <div className="border-t border-hairline px-4 py-4">{children}</div>
    </details>
  );
}

export default function NextBlockPage() {
  const sessions = PIECES.filter((p) => p.kind !== "joint");
  const joints = PIECES.filter((p) => p.kind === "joint");
  const lookup = Array.from({ length: 17 }, (_, i) => 130 + i * 5);

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          <h1 className="text-lg font-semibold uppercase tracking-wide">The Next Block</h1>
          <Link
            href="/last-stretch"
            className="text-sm font-medium text-ink-2 underline decoration-hairline underline-offset-4 hover:text-ink"
          >
            The last stretch →
          </Link>
        </div>
        <p className="max-w-prose text-[15px] leading-relaxed text-ink-2">
          From Monday, November 30 to June 27, 2027. One heavy day a week holds the strength
          goals; the rest of the week goes to the bench, cardio and the dunk. Draft: the
          starting weights get real numbers after Mexico.
        </p>
        <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-[14px] border border-hairline bg-[color:var(--border)] sm:grid-cols-4">
          {[
            ["Sessions", "5 a week at most, 2 on the weekend"],
            ["Heavy day", "1, on a weekday, fed"],
            ["Bench", "3 days a week"],
            ["Food", "As now. No cut yet"],
          ].map(([k, v]) => (
            <div key={k} className="bg-surface px-4 py-3">
              <dt className="text-xs font-medium uppercase tracking-wide text-muted">{k}</dt>
              <dd className="mt-0.5 text-sm font-medium">{v}</dd>
            </div>
          ))}
        </dl>
      </div>

      <section className="space-y-3">
        <SectionHead title="A normal week">
          Five sessions and two rest days. The weekend is fasted, so the heavy day stays on a
          weekday and the light work takes Saturday and Sunday.
        </SectionHead>
        <ol className="grid gap-1.5 sm:grid-cols-7">
          {NORMAL_WEEK.map((d) => (
            <li
              key={d.day}
              className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 sm:min-h-28 sm:flex-col sm:items-start ${
                d.slots.length === 0
                  ? "border-dashed border-hairline-strong"
                  : "border-hairline bg-surface"
              }`}
            >
              <span className="w-9 shrink-0 text-xs font-semibold uppercase tracking-wide text-muted">
                {d.day}
              </span>
              {d.slots.length > 0 ? (
                <Slots slots={d.slots} stack />
              ) : (
                <span className="text-xs text-muted">Rest</span>
              )}
            </li>
          ))}
        </ol>
        <p className="text-sm text-ink-2">
          About 2 hours of Zone 2 plus the intervals. Bench on Tuesday, Thursday and Sunday;
          jumps on Thursday and Saturday. The Wednesday session can move to any weekday the
          rules allow, or drop, with its Zone 2 added to the weekend.
        </p>
      </section>

      <section className="space-y-3">
        <SectionHead title="The sessions">
          T is the bench top set. The best clean 5 from the Nov 12 or Nov 19 heavy upper
          sets it.
        </SectionHead>
        <div className="grid gap-3 sm:grid-cols-2">
          {sessions.map((p) => (
            <PieceCard key={p.id} piece={p} wide={p.id === "H"} />
          ))}
        </div>
        <SectionHead title="The joint blocks">
          Twelve minutes each, for the shins, calves, knees and hip flexors the jump uses and
          nothing else in the week trains.
        </SectionHead>
        <div className="grid gap-3 sm:grid-cols-2">
          {joints.map((p) => (
            <PieceCard key={p.id} piece={p} />
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <SectionHead title="Moving things around">
          No weekday is fixed. These six rules are.
        </SectionHead>
        <ol className="card divide-y divide-[color:var(--border)]">
          {RULES.map((r, i) => (
            <li key={r.rule} className="flex gap-3 px-4 py-3">
              <span className="tnum w-4 shrink-0 text-sm font-semibold text-muted">{i + 1}</span>
              <span className="text-[15px]">
                <span className="font-medium">{r.rule}</span>{" "}
                <span className="text-ink-2">{r.detail}</span>
              </span>
            </li>
          ))}
        </ol>
        <div className="space-y-2">
          <p className="text-sm text-ink-2">
            Within one visit, fast work comes first and easy work last. A short warmup on the
            bike or sled is the only exception.
          </p>
          <ol className="flex flex-wrap items-center gap-1.5 text-sm">
            {VISIT_ORDER.map((step, i) => (
              <li key={step} className="flex items-center gap-1.5">
                <span className="rounded-md bg-surface-2 px-2 py-1 font-medium">{step}</span>
                {i < VISIT_ORDER.length - 1 && (
                  <span aria-hidden className="text-muted">
                    →
                  </span>
                )}
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="space-y-3">
        <SectionHead title="Short weeks">
          The weekend always happens, so a short week is a question of how many weekdays are
          free. Four heavy days in a month hold the goals; a month of cardio is what moves the
          heart rate.
        </SectionHead>
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="border-b border-hairline text-left text-xs uppercase tracking-wide text-muted">
                <th className="px-4 py-2.5 font-medium">Free weekdays</th>
                <th className="px-2 py-2.5 font-medium">Weekdays</th>
                <th className="px-2 py-2.5 font-medium">Saturday</th>
                <th className="px-4 py-2.5 pl-2 font-medium">Sunday</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[color:var(--border)]">
              {SHORT_WEEKS.map((w) => (
                <tr key={w.free} className="align-top">
                  <td className="tnum px-4 py-3 font-semibold">{w.free}</td>
                  <td className="px-2 py-3">
                    {w.weekdays.length === 0 ? (
                      <span className="text-muted">None</span>
                    ) : (
                      <span className="flex flex-wrap items-center gap-1.5">
                        {w.weekdays.map((day, i) => (
                          <span key={i} className="flex items-center gap-1.5">
                            {i > 0 && <span className="text-muted">·</span>}
                            <Slots slots={day} />
                          </span>
                        ))}
                      </span>
                    )}
                    {w.note && <p className="mt-1.5 max-w-xs text-xs leading-snug text-muted">{w.note}</p>}
                  </td>
                  <td className="px-2 py-3">
                    <Slots slots={w.saturday} />
                  </td>
                  <td className="px-4 py-3 pl-2">
                    <Slots slots={w.sunday} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-3">
        <SectionHead title="Goals" />
        <ul className="card divide-y divide-[color:var(--border)]">
          {GOALS.map((g) => (
            <li key={g.name} className="grid gap-x-4 gap-y-1 px-4 py-3 sm:grid-cols-[11rem_1fr_auto]">
              <div>
                <p className="text-[15px] font-medium">{g.name}</p>
                <p className="tnum text-sm text-ink-2">{g.target}</p>
              </div>
              <p className="text-sm leading-relaxed text-ink-2">{g.plan}</p>
              <span
                className={`h-fit w-fit rounded-full px-2 py-0.5 text-xs font-semibold sm:justify-self-end ${STATE[g.state].className}`}
              >
                {STATE[g.state].word}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-3">
        <SectionHead title="Calendar" />
        <ol className="card divide-y divide-[color:var(--border)]">
          {CALENDAR.map((c) => (
            <li key={c.when} className="grid gap-x-4 gap-y-0.5 px-4 py-3 sm:grid-cols-[10rem_1fr]">
              <span className="tnum flex items-center gap-2 text-sm font-semibold">
                <span
                  aria-hidden
                  className={`h-2 w-2 shrink-0 rounded-full ${
                    c.travel ? "border border-hairline-strong" : "bg-ink"
                  }`}
                />
                {c.when}
              </span>
              <span className="text-[15px]">
                <span className="font-medium">{c.what}.</span>{" "}
                <span className="text-ink-2">{c.detail}</span>
              </span>
            </li>
          ))}
        </ol>
      </section>

      <section className="space-y-3">
        <SectionHead title="Reference" />

        <Reference title="Bench, three ways">
          <div className="space-y-4">
            <p className="max-w-prose text-sm leading-relaxed text-ink-2">
              When the bench is taken, the whole bench slot moves to one backup for the day,
              with the same sets and reps. The Life Fitness chest press is 90% of the barbell to
              the nearest 10; dumbbells are 40% a hand to the nearest 5. T only steps on barbell
              days. If the first set on a backup leaves 3 or more reps, the ratio is off and
              gets corrected.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[420px] text-sm">
                <caption className="pb-2 text-left text-xs text-muted">
                  Every bench line, if T is {EXAMPLE_T}
                </caption>
                <thead>
                  <tr className="border-b border-hairline text-left text-xs uppercase tracking-wide text-muted">
                    <th className="py-2 pr-3 font-medium">Line</th>
                    <th className="py-2 pr-3 text-right font-medium">Barbell</th>
                    <th className="py-2 pr-3 text-right font-medium">Chest press</th>
                    <th className="py-2 text-right font-medium">Dumbbells, a hand</th>
                  </tr>
                </thead>
                <tbody className="tnum divide-y divide-[color:var(--border)]">
                  {BENCH_LINES.map((l) => {
                    const bar = EXAMPLE_T + l.offset;
                    const b = benchBackups(bar);
                    return (
                      <tr key={l.line}>
                        <td className="py-2 pr-3">
                          {l.line} <span className="text-muted">{l.reps}</span>
                        </td>
                        <td className="py-2 pr-3 text-right">{bar}</td>
                        <td className="py-2 pr-3 text-right">{b.press}</td>
                        <td className="py-2 text-right">{b.dumbbell}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="overflow-x-auto">
              <table className="tnum w-full min-w-[640px] text-sm">
                <caption className="pb-2 text-left text-xs text-muted">Lookup</caption>
                <tbody className="divide-y divide-[color:var(--border)]">
                  <tr>
                    <th className="py-1.5 pr-3 text-left text-xs font-medium uppercase tracking-wide text-muted">
                      Barbell
                    </th>
                    {lookup.map((w) => (
                      <td key={w} className="py-1.5 text-right font-medium">
                        {w}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <th className="py-1.5 pr-3 text-left text-xs font-medium uppercase tracking-wide text-muted">
                      Press
                    </th>
                    {lookup.map((w) => (
                      <td key={w} className="py-1.5 text-right text-ink-2">
                        {benchBackups(w).press}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <th className="py-1.5 pr-3 text-left text-xs font-medium uppercase tracking-wide text-muted">
                      DB
                    </th>
                    {lookup.map((w) => (
                      <td key={w} className="py-1.5 text-right text-ink-2">
                        {benchBackups(w).dumbbell}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </Reference>

        <Reference title="Starting weights">
          <div className="space-y-4">
            <p className="max-w-prose text-sm leading-relaxed text-ink-2">
              Formulas now, numbers after Mexico. Anything marked hold stays put because it
              serves a goal without being one. A deload takes everything with a weight down
              10–15%.
            </p>
            {STARTING_WEIGHTS.map((g) => (
              <div key={g.group} className="overflow-x-auto">
                <table className="w-full min-w-[520px] text-sm">
                  <caption className="pb-1.5 text-left text-xs font-medium uppercase tracking-wide text-muted">
                    {g.group}
                  </caption>
                  <tbody className="divide-y divide-[color:var(--border)]">
                    {g.rows.map((r) => (
                      <tr key={r.name} className="align-top">
                        <td className="w-[30%] py-2 pr-3 font-medium">{r.name}</td>
                        <td className="w-[38%] py-2 pr-3 text-ink-2">{r.start}</td>
                        <td className="py-2 text-ink-2">{r.then}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        </Reference>

        <Reference title="What was cut, and why">
          <ul className="divide-y divide-[color:var(--border)]">
            {CUT.map((c) => (
              <li key={c.what} className="py-2 text-sm">
                <span className="font-medium">{c.what}.</span>{" "}
                <span className="text-ink-2">{c.why}</span>
              </li>
            ))}
          </ul>
        </Reference>

        <Reference title="Hypermobility">
          <ul className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-ink-2">
            {HYPERMOBILITY.map((h) => (
              <li key={h}>{h}</li>
            ))}
          </ul>
        </Reference>

        <Reference title="Before Nov 30">
          <ul className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-ink-2">
            {BEFORE.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
        </Reference>
      </section>
    </div>
  );
}
