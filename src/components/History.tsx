"use client";

import { useMemo, useState } from "react";
import type { Goals, LogEntry } from "@/lib/types";
import {
  addDays,
  entriesForDate,
  loggedDates,
  microTotals,
  rollingAverage,
  round,
  sumEntries,
} from "@/lib/nutrition";
import { formatDay, formatFullDay } from "@/lib/labels";
import { download, toAppleHealthXML, toMarkdown } from "@/lib/export";
import { TrendChart, type TrendBreak, type TrendPoint } from "@/components/TrendChart";
import { StatTile } from "@/components/StatTiles";
import { LogHeatmap } from "@/components/LogHeatmap";

/*
 * `"all"` is the default as of August 19, 2026. A range toggle that opens on 30
 * days answers "how was the last month" when the question the charts are for is
 * "how has it gone" — and with the log only a fortnight old, 30 was a window
 * padded with a fortnight of blank. The narrower windows stay because zooming
 * in is a real thing to want; they are just no longer where you land.
 */
const RANGES = [7, 14, 30, 90, "all"] as const;
type Range = (typeof RANGES)[number];

interface Props {
  entries: LogEntry[];
  goals: Goals;
  /** Build day. The windows end here and "Today" means this. */
  builtOn: string;
  /** Shaded on the trend charts — see TrendChart. */
  breaks: TrendBreak[];
}

/**
 * History is read-only in the same way the dashboard is: the entries arrive as
 * props from the build, and the only state is how far back you want to look.
 */
export function History({ entries, goals, builtOn, breaks }: Props) {
  const [range, setRange] = useState<Range>("all");

  const dates = useMemo(() => loggedDates(entries), [entries]);

  // How many calendar days the charts and the stats below actually cover.
  // "all" reaches back to the first entry; everything else is a fixed window
  // ending on the build day, which may run off the front of the log.
  const span = useMemo(() => {
    if (range !== "all") return range;
    const first = dates[dates.length - 1];
    if (!first) return 1;
    let n = 1;
    for (let d = first; d < builtOn; d = addDays(d, 1)) n++;
    return n;
  }, [range, dates, builtOn]);

  const points = useMemo(() => {
    const cal: TrendPoint[] = [];
    const prot: TrendPoint[] = [];
    const fiber: TrendPoint[] = [];
    const sodium: TrendPoint[] = [];
    for (let i = span - 1; i >= 0; i--) {
      const d = addDays(builtOn, -i);
      const es = entriesForDate(entries, d);
      const t = sumEntries(es);
      cal.push({ date: d, value: t.calories, logged: es.length > 0 });
      prot.push({ date: d, value: t.protein, logged: es.length > 0 });
      // See the same block in Dashboard: a micro is logged only where a row
      // records it, and a partial day is a floor rather than a low day.
      const m = microTotals(es);
      for (const [pts, mt] of [
        [fiber, m.fiber],
        [sodium, m.sodium],
      ] as const) {
        pts.push({
          date: d,
          value: mt.total,
          logged: mt.recordedRows > 0,
          partial: mt.recordedRows < mt.totalRows,
        });
      }
    }
    return { cal, prot, fiber, sodium };
  }, [entries, span, builtOn]);

  const stats = useMemo(() => {
    // rollingAverage already divides by logged days rather than calendar days.
    const { avg, loggedDays } = rollingAverage(entries, builtOn, span);
    const onTarget = points.prot.filter(
      (p) => p.logged && p.value >= goals.proteinMin,
    ).length;
    return {
      loggedDays,
      avg,
      onTarget,
      // `null`, not 0 — nothing logged is an absence of evidence, and a 0%
      // painted in the alert colour reads as "you missed every day".
      hitRate: loggedDays > 0 ? (onTarget / loggedDays) * 100 : null,
    };
  }, [points, entries, goals.proteinMin, span, builtOn]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="text-lg font-semibold">History</h1>
        <div className="ml-auto flex gap-1" role="group" aria-label="Time range">
          {RANGES.map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              aria-pressed={range === r}
              className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold ${
                range === r
                  ? "bg-surface-2 text-ink"
                  : "text-ink-2 hover:bg-surface-2"
              }`}
            >
              {r === "all" ? "All" : `${r}d`}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile
          label="Days logged"
          value={stats.loggedDays}
          unit={`/ ${span}`}
          hint={`${Math.round((stats.loggedDays / span) * 100)}% coverage`}
        />
        <StatTile
          label="Protein target hit"
          value={stats.hitRate === null ? "—" : `${Math.round(stats.hitRate)}%`}
          hint={
            stats.hitRate === null
              ? `Nothing logged in the last ${span} days`
              : `${stats.onTarget} of ${stats.loggedDays} logged days`
          }
          tone={
            stats.hitRate === null
              ? "neutral"
              : stats.hitRate >= 80
                ? "good"
                : stats.hitRate >= 50
                  ? "neutral"
                  : "warn"
          }
        />
        <StatTile
          label="Avg kcal / logged day"
          value={stats.loggedDays > 0 ? round(stats.avg.calories).toLocaleString() : "—"}
          hint={`Target ${goals.calories.toLocaleString()}`}
        />
        <StatTile
          label="Avg protein / logged day"
          value={stats.loggedDays > 0 ? round(stats.avg.protein) : "—"}
          unit={stats.loggedDays > 0 ? "g" : undefined}
          hint={`Target ${goals.proteinMin}–${goals.proteinMax}g`}
          tone={
            stats.loggedDays > 0 && stats.avg.protein >= goals.proteinMin
              ? "good"
              : "neutral"
          }
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <TrendChart
          title={`Calories · ${range === "all" ? `all ${span} days` : `last ${span} days`}`}
          unit="kcal"
          points={points.cal}
          color="var(--series-carbs)"
          today={builtOn}
          goal={goals.calories}
          breaks={breaks}
          height={150}
        />
        <TrendChart
          title={`Protein · ${range === "all" ? `all ${span} days` : `last ${span} days`}`}
          unit="g"
          points={points.prot}
          color="var(--series-protein)"
          today={builtOn}
          band={{ min: goals.proteinMin, max: goals.proteinMax }}
          breaks={breaks}
          height={150}
        />
        {/* Underneath the two above, and the same pair as the dashboard's —
            see the note there for the colour choices and why a hatched bar is
            a floor rather than a low day. */}
        <TrendChart
          title={`Fiber · ${range === "all" ? `all ${span} days` : `last ${span} days`}`}
          unit="g"
          points={points.fiber}
          color="var(--series-fat)"
          today={builtOn}
          goal={goals.fiber}
          breaks={breaks}
          height={150}
        />
        <TrendChart
          title={`Na · ${range === "all" ? `all ${span} days` : `last ${span} days`}`}
          label="Sodium"
          unit="mg"
          points={points.sodium}
          color="var(--text-secondary)"
          today={builtOn}
          caption="no target set"
          breaks={breaks}
          height={150}
        />
      </div>

      {/* The whole log at a glance — deliberately outside the range toggle,
          which windows the charts above but would defeat a calendar. */}
      <LogHeatmap entries={entries} goals={goals} builtOn={builtOn} />

      {/* Table view — the accessible counterpart to the charts above. */}
      <section className="card overflow-hidden">
        <h2 className="border-b border-hairline px-4 py-3 text-sm font-semibold">
          Daily totals
        </h2>
        {dates.length === 0 ? (
          <p className="p-6 text-center text-sm text-muted">
            The log is empty. Rows land here once <code>data/log.csv</code> has some.
          </p>
        ) : (
          <div className="max-h-[420px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-surface">
                <tr className="border-b border-hairline text-left text-[11px] uppercase tracking-wide text-muted">
                  <th className="px-4 py-2 font-semibold">Date</th>
                  <th className="px-2 py-2 text-right font-semibold">kcal</th>
                  <th className="px-2 py-2 text-right font-semibold">Protein</th>
                  <th className="hidden px-2 py-2 text-right font-semibold sm:table-cell">
                    Carbs
                  </th>
                  <th className="hidden px-2 py-2 text-right font-semibold sm:table-cell">
                    Fat
                  </th>
                  <th className="hidden px-2 py-2 text-right font-semibold sm:table-cell">
                    Fiber
                  </th>
                  <th className="px-4 py-2 text-right font-semibold">Target</th>
                </tr>
              </thead>
              <tbody className="tnum">
                {dates.map((d) => {
                  const dayEntries = entriesForDate(entries, d);
                  const t = sumEntries(dayEntries);
                  const fiber = microTotals(dayEntries).fiber;
                  const hit = t.protein >= goals.proteinMin;
                  return (
                    <tr key={d} className="border-b border-hairline last:border-b-0">
                      <td className="px-4 py-2">{formatDay(d, builtOn)}</td>
                      <td className="px-2 py-2 text-right">{round(t.calories)}</td>
                      <td
                        className="px-2 py-2 text-right font-medium"
                        style={{ color: "var(--series-protein)" }}
                      >
                        {round(t.protein, 1)}
                      </td>
                      <td className="hidden px-2 py-2 text-right text-muted sm:table-cell">
                        {round(t.carbs)}
                      </td>
                      <td className="hidden px-2 py-2 text-right text-muted sm:table-cell">
                        {round(t.fat)}
                      </td>
                      {/* "≥" marks a floor: some of the day's rows left fiber
                          blank, and blank is not recorded, not zero. */}
                      <td className="hidden px-2 py-2 text-right text-muted sm:table-cell">
                        {fiber.recordedRows === 0
                          ? "—"
                          : `${fiber.recordedRows < fiber.totalRows ? "≥" : ""}${round(fiber.total)}`}
                      </td>
                      <td className="px-4 py-2 text-right">
                        {hit ? (
                          <span
                            className="text-xs font-semibold"
                            style={{ color: "var(--success-text)" }}
                          >
                            ✓ hit
                          </span>
                        ) : (
                          <span className="text-xs text-muted">
                            −{round(goals.proteinMin - t.protein)}g
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <ExportPanel entries={entries} goals={goals} builtOn={builtOn} />

      <section className="card p-4">
        <h2 className="text-sm font-semibold">Where this comes from</h2>
        <p className="mt-1 text-xs leading-relaxed text-muted">
          Everything on this site was read out of <code>data/log.csv</code> and{" "}
          <code>data/goals.json</code> when it was built, on{" "}
          {formatFullDay(builtOn)}. There is no database and no browser storage:
          the file in the repo is the log, git is its history, and the site
          catches up on the next build. Nothing you do here can change it — and
          nothing needs backing up, because the CSV already is the backup.
        </p>
      </section>
    </div>
  );
}

function ExportPanel({
  entries,
  goals,
  builtOn,
}: {
  entries: LogEntry[];
  goals: Goals;
  builtOn: string;
}) {
  const has = entries.length > 0;

  const options = [
    {
      title: "Markdown",
      body: "A readable log with per-day tables — drops straight into notes or a repo.",
      action: () =>
        download(
          `nutrition-log-${builtOn}.md`,
          toMarkdown(entries, goals, builtOn),
          "text/markdown",
        ),
    },
    {
      title: "Apple Health XML",
      body: "Health-export schema with dietary energy, protein, carbs, fat, fibre and sodium records.",
      action: () =>
        download(
          `nutrition-apple-health-${builtOn}.xml`,
          toAppleHealthXML(entries),
          "application/xml",
        ),
    },
  ];

  return (
    <section className="card p-4">
      <h2 className="text-sm font-semibold">Export</h2>
      <p className="mt-1 text-xs text-muted">
        {has
          ? `${entries.length} entries across ${loggedDates(entries).length} days. For the raw rows, read data/log.csv in the repo — it is the file this page was built from.`
          : "Nothing to export yet."}
      </p>

      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {options.map((o) => (
          <button
            key={o.title}
            disabled={!has}
            onClick={o.action}
            className="rounded-xl border border-hairline p-3 text-left transition-colors hover:bg-surface-2 disabled:opacity-40 disabled:hover:bg-transparent"
          >
            <div className="text-sm font-medium">{o.title}</div>
            <div className="mt-0.5 text-xs leading-snug text-muted">{o.body}</div>
          </button>
        ))}
      </div>

      <details className="mt-3 text-xs text-muted">
        <summary className="cursor-pointer font-medium hover:text-ink">
          Getting this into Apple Health or Health Connect
        </summary>
        <div className="mt-2 space-y-2 leading-relaxed">
          <p>
            Neither platform accepts a file directly — iOS Health has no import button,
            and Health Connect on Android only takes data from apps that write to it.
            Both need a companion app in the middle:
          </p>
          <ul className="list-disc space-y-1 pl-4">
            <li>
              <strong>Apple Health</strong> — the XML export uses Apple&apos;s own
              HealthKit schema (<code>HKQuantityTypeIdentifierDietaryEnergyConsumed</code>{" "}
              and friends). Importers such as Health Auto Export, HealthFit, or Simple
              Health Export read it.
            </li>
            <li>
              <strong>Health Connect / Google Fit</strong>, <strong>Cronometer</strong>,{" "}
              <strong>MyFitnessPal</strong> — these want a CSV, and{" "}
              <code>data/log.csv</code> already is one, one row per logged item.
              Point their importer at the file in the repo rather than at a
              re-export that could disagree with it.
            </li>
          </ul>
        </div>
      </details>
    </section>
  );
}
