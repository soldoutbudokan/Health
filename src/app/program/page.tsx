import Link from "next/link";
import {
  AWAY_FROM_THE_GYM,
  HYPERMOBILITY_RULES,
  OPEN_ITEMS,
  PROGRAM,
  PROGRESSION_RULES,
  RATIONALE,
  SCHEDULING_RULES,
  type PlannedSession,
} from "@/data/program";
import { KIND_LABELS } from "@/lib/trainingTypes";
import {
  readArchiveChanges,
  readArchiveRoutine,
  readGrip,
} from "@/lib/trainingFile";
import { ArchiveTable } from "@/components/ArchiveTable";

/**
 * The program, rendered from `src/data/program.ts` — the same object the
 * training page checks each session against, so the plan you read here and the
 * plan you are graded on cannot drift apart.
 *
 * The reasoning underneath each choice is included rather than summarised. A
 * plan whose rules you can't remember the reason for is a plan you will quietly
 * break in six weeks, and most of these rules exist because of hypermobility
 * rather than because of preference.
 */

export const metadata = { title: "Program · Health" };

function SessionTable({ session }: { session: PlannedSession }) {
  return (
    <section className="card overflow-hidden">
      <header className="border-b border-hairline px-4 py-3">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3">
          <h2 className="text-base font-semibold">{session.name}</h2>
          <span className="text-xs uppercase tracking-wide text-muted">
            {session.place}
          </span>
        </div>
        <p className="mt-1 text-xs leading-snug text-muted">{session.blurb}</p>
      </header>

      <ol className="divide-y divide-[color:var(--border)]">
        {session.exercises.map((e, i) => (
          <li key={`${e.name}-${i}`} className="px-4 py-2.5">
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
              <span className="text-[15px]">
                <span className="tnum mr-2 text-xs text-muted">{i + 1}</span>
                {e.name}
                {e.alternative && (
                  <span className="text-ink-2"> or {e.alternative}</span>
                )}
                {e.optional && (
                  <span className="ml-1.5 text-xs text-muted">optional</span>
                )}
              </span>
              <span className="tnum text-sm font-medium">{e.prescription}</span>
            </div>
            <div className="mt-0.5 flex flex-wrap items-baseline gap-x-2">
              <span className="text-[11px] uppercase tracking-wide text-muted">
                {KIND_LABELS[e.kind]}
              </span>
              {e.note && (
                <span className="flex-1 text-xs leading-snug text-muted">{e.note}</span>
              )}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

function Notes({
  title,
  items,
}: {
  title: string;
  items: { title: string; body: string }[];
}) {
  return (
    <section className="card p-4">
      <h2 className="text-base font-semibold">{title}</h2>
      <dl className="mt-3 space-y-3">
        {items.map((n) => (
          <div key={n.title}>
            <dt className="text-sm font-medium">{n.title}</dt>
            <dd className="mt-0.5 text-sm leading-relaxed text-ink-2">{n.body}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

/**
 * The away-from-the-gym protocol. Rendered here and nowhere else on purpose:
 * this is the plan page, and the plan is allowed to say what to do. The
 * dashboard is not — a day there shows what was logged and never what was
 * suggested — so this must not migrate onto it, however convenient that would
 * be mid-trip.
 */
function AwayFromTheGym() {
  return (
    <section className="card p-4">
      <h2 className="text-base font-semibold">Away from the gym</h2>
      <p className="mt-1 text-sm leading-relaxed text-ink-2">{AWAY_FROM_THE_GYM.blurb}</p>

      <h3 className="mt-4 text-sm font-medium">One movement per goal lift, daily</h3>
      <ol className="mt-2 divide-y divide-[color:var(--border)]">
        {AWAY_FROM_THE_GYM.daily.map((d, i) => (
          <li key={`${d.goal}-${i}`} className="py-2.5">
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
              <span className="text-[15px] font-medium">{d.goal}</span>
              <span className="tnum text-sm font-medium text-ink-2">{d.dose}</span>
            </div>
            <p className="mt-0.5 text-sm leading-snug text-ink-2">{d.movement}</p>
            <p className="mt-0.5 text-xs leading-snug text-muted">{d.loading}</p>
          </li>
        ))}
      </ol>

      <h3 className="mt-4 text-sm font-medium">Feet — supination</h3>
      <p className="mt-1 text-xs leading-snug text-muted">
        Barefoot, and safe to do every day. A hypermobile foot tends to collapse onto
        its ligaments rather than hold its own arch, and supination is what turns the
        foot into a rigid lever at takeoff — so this is jump work as much as foot work.
      </p>
      <ol className="mt-2 divide-y divide-[color:var(--border)]">
        {AWAY_FROM_THE_GYM.feet.map((f) => (
          <li key={f.name} className="py-2.5">
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
              <span className="text-[15px]">{f.name}</span>
              <span className="tnum text-sm font-medium text-ink-2">{f.dose}</span>
            </div>
            <p className="mt-0.5 text-xs leading-snug text-muted">{f.note}</p>
          </li>
        ))}
      </ol>

      <h3 className="mt-4 text-sm font-medium">What not to do</h3>
      <dl className="mt-2 space-y-2.5">
        {AWAY_FROM_THE_GYM.avoid.map((a) => (
          <div key={a.title}>
            <dt className="text-sm font-medium">{a.title}</dt>
            <dd className="mt-0.5 text-sm leading-relaxed text-ink-2">{a.body}</dd>
          </div>
        ))}
      </dl>

      <p className="mt-4 text-xs leading-snug text-muted">{AWAY_FROM_THE_GYM.returning}</p>
    </section>
  );
}

export default function ProgramPage() {
  const gym = PROGRAM.filter((s) => s.place === "gym");
  const home = PROGRAM.filter((s) => s.place === "home");
  const changes = readArchiveChanges();
  const oldRoutine = readArchiveRoutine();
  const grip = readGrip();

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h1 className="text-lg font-semibold">Program</h1>
        <Link
          href="/training"
          className="text-sm font-medium text-ink-2 underline decoration-hairline underline-offset-4 hover:text-ink"
        >
          ← Back to the log
        </Link>
        <p className="w-full text-sm text-muted">
          Four gym sessions a week — two upper, two lower, each with a heavy and a
          light day — plus short home sessions on off days. Transcribed from{" "}
          <code className="text-[13px]">docs/training-plan.md</code>, which stays the
          source of truth for the reasoning.
        </p>
      </div>

      <section className="card p-4">
        <h2 className="text-base font-semibold">Slotting the week</h2>
        <p className="mt-1 text-sm text-ink-2">
          The days float. There are only two scheduling rules:
        </p>
        <ul className="mt-2 space-y-1.5">
          {SCHEDULING_RULES.map((r) => (
            <li key={r} className="flex gap-2 text-sm text-ink-2">
              <span aria-hidden className="text-muted">
                •
              </span>
              {r}
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs leading-snug text-muted">
          No exercise gets more than two sets, except bench press — two sets is
          easier to lock in mentally, so both sets have to be treated as real work
          sets. Off days are home-only, capped at about 20 minutes, and low
          intensity by design.
        </p>
      </section>

      <h2 className="pt-1 text-sm font-semibold uppercase tracking-wide text-muted">
        Gym days
      </h2>
      <div className="grid gap-5 lg:grid-cols-2">
        {gym.map((s) => (
          <SessionTable key={s.id} session={s} />
        ))}
      </div>

      <h2 className="pt-1 text-sm font-semibold uppercase tracking-wide text-muted">
        Off days, at home
      </h2>
      <div className="grid gap-5 lg:grid-cols-2">
        {home.map((s) => (
          <SessionTable key={s.id} session={s} />
        ))}
      </div>

      <AwayFromTheGym />

      <section className="card p-4">
        <h2 className="text-base font-semibold">Hypermobility rules</h2>
        <p className="mt-1 text-sm text-ink-2">
          These apply everywhere, in every session. End range of motion is larger
          than it should be, so the joints need muscle working under tension near
          — not at — end range.
        </p>
        <ol className="mt-3 space-y-2">
          {HYPERMOBILITY_RULES.map((r, i) => (
            <li key={r} className="flex gap-2.5 text-sm leading-relaxed text-ink-2">
              <span className="tnum shrink-0 font-semibold text-muted">{i + 1}</span>
              {r}
            </li>
          ))}
        </ol>
      </section>

      <Notes title="Progression and cycles" items={PROGRESSION_RULES} />
      <Notes title="Why the plan looks like this" items={RATIONALE} />
      <Notes title="Open items" items={OPEN_ITEMS} />

      <ArchiveTable changes={changes} routine={oldRoutine} grip={grip} />
    </div>
  );
}
