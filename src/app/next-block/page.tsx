import Link from "next/link";
import { Barlow, Big_Shoulders } from "next/font/google";
import {
  BEFORE,
  BENCH_LINES,
  CALENDAR,
  CUT,
  EXAMPLE_T,
  GOALS,
  HYPERMOBILITY,
  KIND_RANK,
  NORMAL_WEEK,
  PIECES,
  RULES,
  SHORT_WEEKS,
  STARTING_WEIGHTS,
  VISIT_ORDER,
  benchBackups,
  pieceById,
  type Piece,
  type PieceKind,
  type Slot,
  type WeekDay,
} from "@/data/nextBlock";
import { toDateKey } from "@/lib/nutrition";
import { readTrainingGoals, readWorkouts } from "@/lib/trainingFile";
import { readLastStretch } from "@/lib/lastStretchFile";
import { goalTracks, type GoalTrack } from "@/lib/lastStretch";

/**
 * The next block, rendered from `src/data/nextBlock.ts`: what a week is made
 * of from January 4, 2027, and the rules for moving the pieces when the
 * week doesn't go to plan. It describes a template, not dates — the dated
 * heavy days that close the last two goals stay on `/last-stretch`, the one
 * page that schedules.
 *
 * The look — a hardwood court and a navy scoreboard — was picked on November
 * 4, 2026 from four samples, and lives in globals.css under `.arena`. The
 * scoreboard and the progress bars read the log through `goalTracks()`, so
 * they show the same figures `/last-stretch` does; everything else is the
 * data file. Reference material sits in closed `<details>`, which work
 * without JavaScript, so the snapshot keeps it too.
 */

export const metadata = { title: "The Next Block · Health" };

const display = Big_Shoulders({ subsets: ["latin"], variable: "--font-arena-display" });
const body = Barlow({ subsets: ["latin"], weight: ["400", "600", "700"], variable: "--font-arena-body" });

const TEST_DAY = "2026-12-08";

function daysBetween(from: string, to: string): number {
  return Math.round((Date.parse(`${to}T12:00:00`) - Date.parse(`${from}T12:00:00`)) / 86_400_000);
}

const TILE: Record<PieceKind, string> = {
  heavy: "arena-tile-heavy",
  bench: "arena-tile-gym",
  jump: "arena-tile-gym",
  cardio: "arena-tile-cardio",
  joint: "arena-tile-joint",
};

function slotLabel(slot: Slot): string {
  const p = pieceById(slot.id);
  return slot.minutes !== undefined ? `${p.short} ${slot.minutes}` : p.short;
}

function Chip({ slot }: { slot: Slot }) {
  const p = pieceById(slot.id);
  return (
    <span className={`${TILE[p.kind]} inline-flex shrink-0 items-center rounded-md px-2 py-1 text-xs font-bold leading-none`}>
      {slotLabel(slot)}
    </span>
  );
}

function Chips({ slots }: { slots: Slot[] }) {
  return (
    <span className="flex flex-wrap items-center gap-1">
      {slots.map((s, i) => (
        <Chip key={`${s.id}-${i}`} slot={s} />
      ))}
    </span>
  );
}

function DayTile({ day }: { day: WeekDay }) {
  if (day.slots.length === 0) {
    return (
      <li className="flex items-center gap-3 sm:flex-col sm:items-stretch sm:gap-1.5">
        <span className="arena-eyebrow w-10 shrink-0 sm:w-auto sm:text-center">{day.day}</span>
        <span className="arena-tile-rest flex-1 rounded-xl px-3 py-3 text-sm font-bold sm:flex sm:min-h-32 sm:items-center sm:justify-center">
          Off
        </span>
      </li>
    );
  }
  const ranked = [...day.slots].sort(
    (a, b) => KIND_RANK[pieceById(a.id).kind] - KIND_RANK[pieceById(b.id).kind],
  );
  const lead = ranked[0];
  const piece = pieceById(lead.id);
  const sub = lead.minutes !== undefined ? `${lead.minutes} min` : piece.tile.sub;
  const extras = day.slots
    .filter((s) => s !== lead)
    .map((s) => (s.minutes !== undefined ? `Zone 2 ${s.minutes} min` : pieceById(s.id).short.toLowerCase()));
  return (
    <li className="flex items-center gap-3 sm:flex-col sm:items-stretch sm:gap-1.5">
      <span className="arena-eyebrow w-10 shrink-0 sm:w-auto sm:text-center">{day.day}</span>
      <span className={`${TILE[piece.kind]} flex flex-1 items-baseline gap-2 rounded-xl px-3 py-2.5 sm:min-h-32 sm:flex-col sm:items-center sm:justify-center sm:gap-0.5 sm:px-1.5 sm:text-center`}>
        <span className="arena-display text-3xl">{piece.tile.big}</span>
        {sub && <span className="text-xs font-bold">{sub}</span>}
        {extras.length > 0 && (
          <span className="text-xs leading-tight opacity-85">+ {extras.join(", ")}</span>
        )}
      </span>
    </li>
  );
}

function SessionCard({ piece, wide = false }: { piece: Piece; wide?: boolean }) {
  let n = 0;
  return (
    <section className={`arena-panel flex flex-col gap-3 p-5 ${wide ? "md:col-span-2" : ""}`}>
      <div className="space-y-1">
        <p className="arena-eyebrow text-[color:var(--arena-orange-text)]">
          {piece.when} · {piece.time}
        </p>
        <h3 className="arena-display text-3xl">{piece.name}</h3>
      </div>
      <ol className={`divide-y ${wide ? "md:grid md:grid-flow-col md:grid-rows-3 md:gap-x-8" : ""}`}>
        {piece.items.map((item) => (
          <li
            key={item.name}
            className={`grid grid-cols-[2rem_1fr] items-baseline gap-2 py-2 ${wide ? "md:border-b" : ""}`}
          >
            <span className="arena-display text-2xl text-[color:var(--arena-orange-text)]">
              {item.warmup ? "" : ++n}
            </span>
            <span className={item.warmup ? "text-[color:var(--arena-panel-ink-2)]" : ""}>
              <span className="font-semibold">{item.name}</span>
              <span className="tnum block text-sm text-[color:var(--arena-panel-ink-2)]">{item.dose}</span>
            </span>
          </li>
        ))}
      </ol>
      {piece.note && (
        <p className="text-sm leading-relaxed text-[color:var(--arena-panel-ink-2)]">{piece.note}</p>
      )}
    </section>
  );
}

function Bar({ track }: { track: GoalTrack }) {
  const current = track.current ?? 0;
  const done = current >= track.target;
  const pct = Math.max(4, Math.min(100, (current / track.target) * 100));
  const colour = done
    ? "var(--arena-done-bar)"
    : track.rider
      ? "var(--arena-bench-bar)"
      : "var(--arena-orange-bright)";
  const label = track.unit === "reps" ? track.name : `${track.name} × 5`;
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-3 text-sm font-semibold">
        <span>{label}</span>
        <span className="tnum">
          {current} / {track.target}
          {done && " ✓"}
        </span>
      </div>
      <div className="h-2 rounded bg-[var(--arena-track)]">
        <div className="h-full rounded" style={{ width: `${pct}%`, background: colour }} />
      </div>
    </div>
  );
}

function Stat({ label, value, under }: { label: string; value: string; under: string }) {
  return (
    <div className="flex min-w-0 flex-col items-center rounded-lg bg-[var(--arena-navy-deep)] px-2 py-2 text-center md:min-w-24 md:px-3">
      <span className="arena-eyebrow arena-stat-label text-[color:var(--arena-on-navy-2)]">{label}</span>
      <span className="arena-display tnum text-4xl text-[color:var(--arena-orange-bright)]">{value}</span>
      <span className="arena-eyebrow arena-stat-label text-[color:var(--arena-on-navy-2)]">{under}</span>
    </div>
  );
}

function Heading({ children, sub }: { children: React.ReactNode; sub?: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <h2 className="arena-display text-3xl">{children}</h2>
      {sub && <p className="max-w-prose text-[15px] font-medium leading-relaxed text-[color:var(--arena-ink-2)]">{sub}</p>}
    </div>
  );
}

function Reference({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <details className="arena-details arena-panel">
      <summary className="flex items-center justify-between gap-3 px-5 py-4">
        <span className="arena-display text-xl">{title}</span>
        <span aria-hidden className="arena-caret text-xl transition-transform">›</span>
      </summary>
      <div className="border-t px-5 py-4">{children}</div>
    </details>
  );
}

export default function NextBlockPage() {
  const today = toDateKey(new Date());
  const tracks = goalTracks(readTrainingGoals(), readLastStretch(), readWorkouts(), [
    "deadlift",
    "squat",
    "pullups",
    "dips",
    "bench",
  ]);
  const track = (id: string) => tracks.find((t) => t.id === id);
  const trap = track("deadlift");
  const squat = track("squat");
  const bench = track("bench");
  const toTest = daysBetween(today, TEST_DAY);

  const sessions = PIECES.filter((p) => p.kind !== "joint");
  const joints = PIECES.filter((p) => p.kind === "joint");
  const lookup = Array.from({ length: 17 }, (_, i) => 130 + i * 5);
  const otherGoals = GOALS.filter((g) => g.state === "new");

  return (
    <div
      className={`${display.variable} ${body.variable} arena arena-court -mx-4 -mt-6 space-y-10 px-4 pb-10 pt-6 sm:mx-0 sm:mt-0 sm:rounded-2xl sm:p-8`}
    >
      <header className="arena-scoreboard flex flex-col gap-5 p-5 sm:p-6 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <p className="arena-eyebrow text-[color:var(--arena-orange-bright)]">Jan 4 – Jun 27, 2027</p>
          <h1 className="arena-display text-6xl sm:text-7xl">The Next Block</h1>
          <p className="max-w-md pt-1 text-sm text-[color:var(--arena-on-navy-2)]">
            One heavy day a week holds the strength goals. The rest goes to the bench, cardio and
            the dunk. Starting weights get real numbers before Jan 4.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-2 md:flex">
          {toTest >= 0 ? (
            <Stat label="Dec 8 goals" value={toTest === 0 ? "Today" : `${toTest}`} under={toTest === 0 ? "Dec 8" : "days away"} />
          ) : (
            bench && <Stat label="Bench × 5" value={`${bench.current ?? "–"}`} under={`of ${bench.target}`} />
          )}
          {trap && <Stat label="Trap bar × 5" value={`${trap.current ?? "–"}`} under={`of ${trap.target}`} />}
          {squat && <Stat label="Squat × 5" value={`${squat.current ?? "–"}`} under={`of ${squat.target}`} />}
        </div>
      </header>

      <section className="space-y-4">
        <Heading sub="Five sessions and two days off. The weekend is fasted, so the heavy day stays on a weekday and the weekend gets the lighter work.">
          A normal week
        </Heading>
        <div className="arena-lines relative overflow-hidden rounded-md p-3 sm:p-4">
          <svg
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0 mx-auto hidden h-44 w-full sm:block"
            viewBox="0 0 680 176"
            preserveAspectRatio="xMidYMax meet"
          >
            <path d="M250 176 L250 70 L430 70 L430 176" fill="none" stroke="var(--arena-line)" strokeWidth="4" />
            <circle cx="340" cy="70" r="56" fill="none" stroke="var(--arena-line)" strokeWidth="4" />
          </svg>
          <ol className="relative grid gap-2 sm:grid-cols-7">
            {NORMAL_WEEK.map((d) => (
              <DayTile key={d.day} day={d} />
            ))}
          </ol>
        </div>
        <p className="text-sm font-semibold text-[color:var(--arena-ink-2)]">
          Orange is the heavy day, navy is gym work, white is cardio. About 2 hours of Zone 2 a
          week, plus the intervals. The Wednesday session can move to any weekday the rules
          allow, or drop, with its Zone 2 added to the weekend.
        </p>
      </section>

      <section className="space-y-4">
        <Heading sub="T is the bench top set: the best clean 5 from the Dec 23 or Dec 31 heavy upper.">
          The sessions
        </Heading>
        <div className="grid gap-4 md:grid-cols-2">
          {sessions.map((p) => (
            <SessionCard key={p.id} piece={p} wide={p.id === "H"} />
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <Heading sub="Twelve minutes each, for the shins, calves, knees and hip flexors the jump uses and nothing else in the week trains.">
          Joint blocks
        </Heading>
        <div className="grid gap-4 md:grid-cols-2">
          {joints.map((p) => (
            <SessionCard key={p.id} piece={p} />
          ))}
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        <section className="arena-panel space-y-4 p-5">
          <h2 className="arena-display text-3xl">Rules</h2>
          <ol className="space-y-3">
            {RULES.map((r, i) => (
              <li key={r.rule} className="grid grid-cols-[2rem_1fr] gap-2">
                <span className="arena-display text-2xl text-[color:var(--arena-orange-text)]">{i + 1}</span>
                <span className="text-[15px] leading-snug">
                  <span className="font-semibold">{r.rule}</span>{" "}
                  <span className="text-[color:var(--arena-panel-ink-2)]">{r.detail}</span>
                </span>
              </li>
            ))}
          </ol>
          <div className="space-y-2 border-t pt-4">
            <p className="text-sm text-[color:var(--arena-panel-ink-2)]">
              Within one visit, fast work first and easy work last. A short warmup on the bike or
              sled is the only exception.
            </p>
            <ol className="flex flex-wrap items-center gap-1.5 text-sm font-semibold">
              {VISIT_ORDER.map((step, i) => (
                <li key={step} className="flex items-center gap-1.5">
                  <span className="rounded-md border px-2 py-1">{step}</span>
                  {i < VISIT_ORDER.length - 1 && <span aria-hidden>→</span>}
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="arena-scoreboard space-y-4 p-5">
          <h2 className="arena-display text-3xl">Progress</h2>
          <div className="space-y-3">
            {tracks.map((t) => (
              <Bar key={t.id} track={t} />
            ))}
          </div>
          <ul className="arena-rule-navy space-y-2 pt-4 text-sm">
            {otherGoals.map((g) => (
              <li key={g.name}>
                <span className="font-semibold">{g.name}:</span>{" "}
                <span className="text-[color:var(--arena-on-navy-2)]">{g.target}. {g.plan}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="space-y-4">
        <Heading sub="The weekend always happens, so a short week is a question of how many weekdays are free. Four heavy days in a month hold the goals; a month of cardio is what moves the heart rate.">
          Short weeks
        </Heading>
        <div className="arena-panel overflow-x-auto">
          <table className="w-full min-w-[600px] text-sm">
            <thead>
              <tr className="arena-eyebrow border-b text-left text-[color:var(--arena-panel-ink-2)]">
                <th className="px-5 py-3 font-bold">Free weekdays</th>
                <th className="px-2 py-3 font-bold">Weekdays</th>
                <th className="px-2 py-3 font-bold">Saturday</th>
                <th className="px-5 py-3 pl-2 font-bold">Sunday</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {SHORT_WEEKS.map((w) => (
                <tr key={w.free} className="align-top">
                  <td className="arena-display px-5 py-3 text-3xl text-[color:var(--arena-orange-text)]">{w.free}</td>
                  <td className="px-2 py-3">
                    {w.weekdays.length === 0 ? (
                      <span className="font-semibold">None</span>
                    ) : (
                      <span className="flex flex-wrap items-center gap-1.5">
                        {w.weekdays.map((day, i) => (
                          <span key={i} className="flex items-center gap-1.5">
                            {i > 0 && <span aria-hidden>·</span>}
                            <Chips slots={day} />
                          </span>
                        ))}
                      </span>
                    )}
                    {w.note && (
                      <p className="mt-1.5 max-w-xs text-xs leading-snug text-[color:var(--arena-panel-ink-2)]">{w.note}</p>
                    )}
                  </td>
                  <td className="px-2 py-3">
                    <Chips slots={w.saturday} />
                  </td>
                  <td className="px-5 py-3 pl-2">
                    <Chips slots={w.sunday} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-4">
        <Heading>Calendar</Heading>
        <ol className="arena-panel divide-y">
          {CALENDAR.map((c) => (
            <li key={c.when} className="grid gap-x-5 gap-y-0.5 px-5 py-3.5 sm:grid-cols-[11rem_1fr]">
              <span className={`arena-display text-xl ${c.travel ? "text-[color:var(--arena-panel-ink-2)]" : "text-[color:var(--arena-orange-text)]"}`}>
                {c.when}
              </span>
              <span className="text-[15px] leading-snug">
                <span className="font-semibold">{c.what}.</span>{" "}
                <span className="text-[color:var(--arena-panel-ink-2)]">{c.detail}</span>
              </span>
            </li>
          ))}
        </ol>
      </section>

      <section className="space-y-3">
        <Heading>Reference</Heading>

        <Reference title="Bench, three ways">
          <div className="space-y-4 text-sm">
            <p className="max-w-prose leading-relaxed text-[color:var(--arena-panel-ink-2)]">
              When the bench is taken, the whole bench slot moves to one backup for the day, with
              the same sets and reps. The Life Fitness chest press is 90% of the barbell to the
              nearest 10; dumbbells are 40% a hand to the nearest 5. T only steps on barbell
              days. If the first set on a backup leaves 3 or more reps, the ratio is off and gets
              corrected.
            </p>
            <div className="overflow-x-auto">
              <table className="tnum w-full min-w-[420px]">
                <caption className="arena-eyebrow pb-2 text-left text-[color:var(--arena-panel-ink-2)]">
                  Every bench line, if T is {EXAMPLE_T}
                </caption>
                <thead>
                  <tr className="border-b text-left text-xs text-[color:var(--arena-panel-ink-2)]">
                    <th className="py-2 pr-3 font-semibold">Line</th>
                    <th className="py-2 pr-3 text-right font-semibold">Barbell</th>
                    <th className="py-2 pr-3 text-right font-semibold">Chest press</th>
                    <th className="py-2 text-right font-semibold">Dumbbells, a hand</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {BENCH_LINES.map((l) => {
                    const bar = EXAMPLE_T + l.offset;
                    const b = benchBackups(bar);
                    return (
                      <tr key={l.line}>
                        <td className="py-2 pr-3">
                          {l.line} <span className="text-[color:var(--arena-panel-ink-2)]">{l.reps}</span>
                        </td>
                        <td className="py-2 pr-3 text-right font-semibold">{bar}</td>
                        <td className="py-2 pr-3 text-right">{b.press}</td>
                        <td className="py-2 text-right">{b.dumbbell}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="overflow-x-auto">
              <table className="tnum w-full min-w-[640px]">
                <caption className="arena-eyebrow pb-2 text-left text-[color:var(--arena-panel-ink-2)]">Lookup</caption>
                <tbody className="divide-y">
                  {(
                    [
                      ["Barbell", (w: number) => w],
                      ["Press", (w: number) => benchBackups(w).press],
                      ["DB", (w: number) => benchBackups(w).dumbbell],
                    ] as const
                  ).map(([label, f], row) => (
                    <tr key={label}>
                      <th className="py-1.5 pr-3 text-left text-xs font-semibold text-[color:var(--arena-panel-ink-2)]">{label}</th>
                      {lookup.map((w) => (
                        <td key={w} className={`py-1.5 text-right ${row === 0 ? "font-semibold" : ""}`}>
                          {f(w)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Reference>

        <Reference title="Starting weights">
          <div className="space-y-4 text-sm">
            <p className="max-w-prose leading-relaxed text-[color:var(--arena-panel-ink-2)]">
              Formulas now, numbers after Mexico. Anything marked hold stays put because it serves
              a goal without being one. A deload takes everything with a weight down 10–15%.
            </p>
            {STARTING_WEIGHTS.map((g) => (
              <div key={g.group} className="overflow-x-auto">
                <table className="w-full min-w-[520px]">
                  <caption className="arena-eyebrow pb-1.5 text-left text-[color:var(--arena-orange-text)]">{g.group}</caption>
                  <tbody className="divide-y">
                    {g.rows.map((r) => (
                      <tr key={r.name} className="align-top">
                        <td className="w-[30%] py-2 pr-3 font-semibold">{r.name}</td>
                        <td className="w-[38%] py-2 pr-3 text-[color:var(--arena-panel-ink-2)]">{r.start}</td>
                        <td className="py-2 text-[color:var(--arena-panel-ink-2)]">{r.then}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        </Reference>

        <Reference title="What was cut, and why">
          <ul className="divide-y text-sm">
            {CUT.map((c) => (
              <li key={c.what} className="py-2">
                <span className="font-semibold">{c.what}.</span>{" "}
                <span className="text-[color:var(--arena-panel-ink-2)]">{c.why}</span>
              </li>
            ))}
          </ul>
        </Reference>

        <Reference title="Hypermobility">
          <ul className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-[color:var(--arena-panel-ink-2)]">
            {HYPERMOBILITY.map((h) => (
              <li key={h}>{h}</li>
            ))}
          </ul>
        </Reference>

        <Reference title="Before Jan 4">
          <ul className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-[color:var(--arena-panel-ink-2)]">
            {BEFORE.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
        </Reference>
      </section>

      <footer className="arena-lines-thin flex flex-wrap items-baseline justify-between gap-3 rounded-lg px-5 py-3.5 text-sm font-semibold">
        <span>The dunk: you touch the rim now, and need a touch 6–8 inches over it.</span>
        <Link
          href="/last-stretch"
          className="underline decoration-2 underline-offset-4 hover:opacity-80"
        >
          The last stretch →
        </Link>
      </footer>
    </div>
  );
}
