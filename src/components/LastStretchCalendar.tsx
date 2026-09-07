"use client";

import { useState } from "react";
import { PHASES, type DayStatus, type DayView, type GoalTrack, type WeekView } from "@/lib/lastStretch";
import { formatDay, formatFullDay } from "@/lib/labels";
import { GYM_SESSIONS, SESSION_LABELS, SESSION_SHORT } from "@/lib/trainingTypes";

/**
 * The Last Stretch calendar. Every value is a prop computed on the build
 * machine; the only state is which day is open. Nothing here reads the
 * clock — `today` arrives from the server component — and nothing here
 * writes anywhere: a tick is what the log says, not what was clicked.
 *
 * Visual grammar: an outlined cell is planned, a filled cell happened, a
 * faded cell with a cross was missed. Status is never colour alone — every
 * state has a glyph, and the open day spells it out in words.
 */

const STATUS: Record<DayStatus, { glyph: string; word: string; colour: string }> = {
  done: { glyph: "✓", word: "Done — logged as planned", colour: "var(--success-text)" },
  swapped: { glyph: "↔", word: "Something else was logged", colour: "var(--status-warning)" },
  missed: { glyph: "×", word: "Missed — nothing logged", colour: "var(--status-serious)" },
  skipped: { glyph: "–", word: "Skipped — it was optional", colour: "var(--text-muted)" },
  rest: { glyph: "", word: "Nothing planned", colour: "var(--text-muted)" },
  upcoming: { glyph: "", word: "Upcoming", colour: "var(--text-muted)" },
};

const WEEKDAYS = ["M", "T", "W", "T", "F", "S", "S"];

function tone(view: DayView): { colour: string; on: string } | undefined {
  const slot = view.plan.slot;
  if (slot === "rest") return undefined;
  if (GYM_SESSIONS.includes(slot)) return { colour: "var(--series-protein)", on: "#ffffff" };
  if (slot === "stretch") return { colour: "var(--series-stretch)", on: "var(--on-stretch)" };
  return undefined; // off-a, off-b: neutral surface
}

function Cell({
  view,
  today,
  selected,
  labelMonth,
  onSelect,
}: {
  view: DayView;
  today: string;
  selected: boolean;
  /** Mondays and the first of a month carry the month: "Sep 14". */
  labelMonth: boolean;
  onSelect: (date: string) => void;
}) {
  const { plan, status } = view;
  const t = tone(view);
  const filled = status === "done" || status === "swapped";
  const faded = status === "missed" || status === "skipped";
  const isToday = plan.date === today;
  const day = Number(plan.date.slice(8, 10));
  const dayLabel = labelMonth
    ? new Date(`${plan.date}T12:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" })
    : String(day);
  // A phone cell is about 44px wide, so "270 / 185" becomes two lines there.
  const phoneLines = view.summary.flatMap((l) => (l === "pullup test" ? ["test"] : l.split(" / ")));

  const style: React.CSSProperties = {};
  let cls =
    "relative flex min-h-[5.5rem] w-full flex-col items-stretch rounded-lg px-0.5 pb-1 pt-0.5 text-left transition-colors sm:min-h-[5.25rem] sm:px-1 ";
  if (plan.slot === "rest") {
    cls += "border border-dashed border-hairline text-muted";
  } else if (t) {
    if (filled) {
      style.background = t.colour;
      style.color = t.on;
    } else {
      style.boxShadow = `inset 0 0 0 2px ${t.colour}`;
      style.color = t.colour;
      cls += "bg-surface ";
    }
  } else {
    cls += filled ? "bg-surface-2 text-ink" : "bg-surface-2/60 text-ink-2 ";
  }
  if (faded) style.opacity = 0.55;
  if (selected) style.outline = "2px solid var(--text-primary)";
  if (selected) style.outlineOffset = "2px";

  const s = STATUS[status];

  return (
    <button
      type="button"
      onClick={() => onSelect(plan.date)}
      aria-pressed={selected}
      aria-label={`${formatFullDay(plan.date)}: ${plan.slot === "rest" ? "rest" : SESSION_LABELS[plan.slot]}. ${s.word}.`}
      className={cls}
      style={style}
    >
      <span className="flex items-baseline justify-between text-[10px] leading-tight">
        <span className={`tnum truncate ${isToday ? "font-bold underline underline-offset-2" : "opacity-80"}`}>
          {dayLabel}
        </span>
        <span aria-hidden className="font-bold" style={filled ? undefined : { color: s.colour }}>
          {s.glyph}
          {plan.milestone && <span title={plan.milestone}> ★</span>}
        </span>
      </span>
      <span className="mt-auto truncate text-[9px] font-semibold leading-tight sm:text-[11px]">
        {plan.slot === "rest" ? "rest" : SESSION_SHORT[plan.slot]}
        {plan.deload && plan.slot !== "rest" && GYM_SESSIONS.includes(plan.slot) && (
          <span className="ml-0.5 text-[9px] font-normal opacity-80">DL</span>
        )}
      </span>
      <span className="hidden sm:block">
        {view.summary.map((l) => (
          <span key={l} className="tnum block truncate text-[10px] leading-tight opacity-90">
            {l}
          </span>
        ))}
      </span>
      <span className="sm:hidden">
        {phoneLines.map((l, i) => (
          <span key={`${l}-${i}`} className="tnum block truncate text-[10px] leading-tight opacity-90">
            {l}
          </span>
        ))}
      </span>
      {view.summary.length === 0 && plan.optional && (
        <span className="text-[10px] leading-tight opacity-90">optional</span>
      )}
    </button>
  );
}

function GoalTile({ g, today }: { g: GoalTrack; today: string }) {
  const hit = g.hitOn !== undefined;
  return (
    <div className="card px-4 py-3">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-sm font-medium">{g.name}</span>
        {g.rider && <span className="text-[10px] uppercase tracking-wide text-muted">rider</span>}
      </div>
      <div className="tnum mt-1 text-xl font-semibold">
        {g.current !== undefined ? g.current : "—"}
        <span className="text-sm font-normal text-muted"> → {g.target} {g.unit}</span>
      </div>
      <p className="mt-0.5 text-xs text-muted">
        {hit ? (
          <span style={{ color: "var(--success-text)" }}>✓ Hit {formatDay(g.hitOn!, today)}</span>
        ) : g.plannedOn ? (
          <>Planned {formatDay(g.plannedOn, today)}</>
        ) : (
          <>Assumed rate; not a condition of finishing</>
        )}
        {g.currentOn && !hit && <> · best {formatDay(g.currentOn, today)}</>}
      </p>
    </div>
  );
}

function Detail({ view, today }: { view: DayView; today: string }) {
  const { plan, status, lifts, logged } = view;
  const s = STATUS[status];
  const phase = PHASES[plan.phase];

  return (
    <section className="card overflow-hidden">
      <header className="border-b border-hairline px-4 py-3">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
          <h3 className="text-base font-semibold">
            {formatFullDay(plan.date)}
            {plan.date === today && <span className="ml-2 text-xs font-normal text-muted">today</span>}
          </h3>
          <span className="text-xs text-muted">
            {phase?.label ?? "Outside the plan"}
            {plan.deload && " · deload"}
          </span>
        </div>
        <div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
          <span className="text-[15px]">
            {plan.slot === "rest" ? "Rest" : SESSION_LABELS[plan.slot]}
            {plan.optional && <span className="ml-1.5 text-xs text-muted">optional</span>}
          </span>
          <span className="text-xs font-medium" style={{ color: s.colour }}>
            {s.glyph && <span aria-hidden>{s.glyph} </span>}
            {s.word}
          </span>
        </div>
        {plan.milestone && (
          <p className="mt-1 text-sm font-medium">★ {plan.milestone}</p>
        )}
        {plan.note && <p className="mt-1 text-xs leading-snug text-muted">{plan.note}</p>}
      </header>

      {lifts.length > 0 && (
        <div className="px-4 py-3">
          <h4 className="text-[11px] font-semibold uppercase tracking-wide text-muted">The plan</h4>
          <ol className="mt-1.5 divide-y divide-[color:var(--border)]">
            {lifts.map((l, i) => (
              <li key={`${l.exercise}-${i}`} className="py-2">
                <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                  <span className="text-[15px]">
                    <span className="tnum mr-2 text-xs text-muted">{i + 1}</span>
                    {l.exercise}
                    {l.optional && <span className="ml-1.5 text-xs text-muted">optional</span>}
                  </span>
                  <span className="tnum text-sm">
                    {l.planned ? <strong>{l.planned}</strong> : <span className="text-ink-2">{l.prescription}</span>}
                  </span>
                </div>
                <div className="mt-0.5 flex flex-wrap items-baseline justify-between gap-x-3 text-xs text-muted">
                  <span>{l.planned ? l.prescription : ""}</span>
                  {l.last && <span className="tnum">last: {l.last}</span>}
                </div>
              </li>
            ))}
          </ol>
        </div>
      )}

      {logged && (
        <div className="border-t border-hairline px-4 py-3">
          <h4 className="text-[11px] font-semibold uppercase tracking-wide text-muted">What happened</h4>
          <p className="mt-1 text-sm">
            {logged.label}
            {logged.fatigue !== undefined && (
              <span className="text-muted"> · fatigue {logged.fatigue}/5</span>
            )}
            {logged.flags.length > 0 && (
              <span className="text-muted"> · {logged.flags.join(", ")}</span>
            )}
          </p>
          {logged.lifts.length > 0 && (
            <ul className="mt-1.5 divide-y divide-[color:var(--border)]">
              {logged.lifts.map((l) => (
                <li key={l.exercise} className="flex flex-wrap items-baseline justify-between gap-x-3 py-1.5">
                  <span className="text-[15px]">{l.exercise}</span>
                  <span className="tnum text-sm">
                    {l.sets}
                    {l.verdict && (
                      <span
                        className="ml-2 text-xs font-medium"
                        style={{
                          color:
                            l.verdict === "under" ? "var(--status-warning)" : "var(--success-text)",
                        }}
                      >
                        {l.verdict === "hit" ? "✓ as planned" : l.verdict === "over" ? `+ over ${l.planned}` : `! under ${l.planned}`}
                      </span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          )}
          {logged.note && <p className="mt-1.5 text-xs leading-snug text-muted">{logged.note}</p>}
        </div>
      )}
    </section>
  );
}

export function LastStretchCalendar({
  weeks,
  goals,
  today,
  done,
  due,
}: {
  weeks: WeekView[];
  goals: GoalTrack[];
  /** Local calendar date of the build. Stands in for "today". */
  today: string;
  done: number;
  due: number;
}) {
  const all = weeks.flatMap((w) => w.days);
  const initial =
    all.find((d) => d.plan.date === today)?.plan.date ??
    all.find((d) => d.plan.date > today)?.plan.date ??
    all[all.length - 1]?.plan.date ??
    "";
  const [selected, setSelected] = useState(initial);
  const open = all.find((d) => d.plan.date === selected);

  let lastPhase = "";

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {goals.map((g) => (
          <GoalTile key={g.id} g={g} today={today} />
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:items-start">
        <section className="card px-4 py-3">
          <div className="flex flex-wrap items-baseline justify-between gap-x-3">
            <h2 className="text-sm font-semibold">The calendar</h2>
            {due > 0 && (
              <span className="tnum text-xs text-muted">
                {done} of {due} planned sessions logged so far
              </span>
            )}
          </div>
          <p className="mt-0.5 text-[11px] leading-snug text-muted">
            Outlined is planned, filled happened, faded with a cross was missed. Blue is a lifting
            day, teal the away routine, grey an off day at home. Tap a day.
          </p>

          <div className="mt-3 grid grid-cols-7 gap-0.5 sm:gap-1.5">
            {WEEKDAYS.map((w, i) => (
              <span key={`${w}-${i}`} className="text-center text-[10px] text-muted">
                {w}
              </span>
            ))}
          </div>

          {weeks.map((w) => {
            const heading = w.phase !== lastPhase ? PHASES[w.phase] : undefined;
            lastPhase = w.phase;
            const holdsOpen = w.days.some((d) => d.plan.date === selected);
            return (
              <div key={w.start}>
                {heading && (
                  <div className="mt-3 mb-1.5 border-t border-hairline pt-2.5">
                    <div className="text-xs font-semibold">{heading.label}</div>
                    <p className="text-[11px] leading-snug text-muted">{heading.blurb}</p>
                  </div>
                )}
                <div className="mt-1.5 grid grid-cols-7 gap-0.5 sm:gap-1.5">
                  {w.days.map((d, i) => (
                    <Cell
                      key={d.plan.date}
                      view={d}
                      today={today}
                      selected={d.plan.date === selected}
                      labelMonth={i === 0 || d.plan.date.endsWith("-01")}
                      onSelect={setSelected}
                    />
                  ))}
                </div>
                {/* On a phone the detail opens under the week that was tapped,
                    so it lands where the eye already is instead of at the foot
                    of a fifteen-week column. Wide screens use the side panel. */}
                {holdsOpen && open && (
                  <div className="mt-2 lg:hidden">
                    <Detail view={open} today={today} />
                  </div>
                )}
              </div>
            );
          })}
        </section>

        <div className="hidden lg:sticky lg:top-20 lg:block">
          {open && <Detail view={open} today={today} />}
        </div>
      </div>
    </div>
  );
}
