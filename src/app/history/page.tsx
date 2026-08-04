"use client";

import { useMemo, useRef, useState } from "react";
import { useAppData } from "@/lib/store";
import type { AppData, Goals } from "@/lib/types";
import {
  addDays,
  entriesForDate,
  formatDateKey,
  loggedDates,
  rollingAverage,
  round,
  sumEntries,
  toDateKey,
} from "@/lib/nutrition";
import {
  download,
  toAppleHealthXML,
  toCSV,
  toDailyCSV,
  toJSON,
  toMarkdown,
} from "@/lib/export";
import { TrendChart, type TrendPoint } from "@/components/TrendChart";
import { StatTile } from "@/components/StatTiles";

const RANGES = [7, 14, 30, 90] as const;

export default function History() {
  const store = useAppData();
  const { data, loaded } = store;
  const [range, setRange] = useState<(typeof RANGES)[number]>(30);

  const today = toDateKey();

  const points = useMemo(() => {
    const cal: TrendPoint[] = [];
    const prot: TrendPoint[] = [];
    for (let i = range - 1; i >= 0; i--) {
      const d = addDays(today, -i);
      const es = entriesForDate(data.entries, d);
      const t = sumEntries(es);
      cal.push({ date: d, value: t.calories, logged: es.length > 0 });
      prot.push({ date: d, value: t.protein, logged: es.length > 0 });
    }
    return { cal, prot };
  }, [data.entries, range, today]);

  const stats = useMemo(() => {
    // rollingAverage already divides by logged days rather than calendar days.
    const { avg, loggedDays } = rollingAverage(data.entries, today, range);
    const onTarget = points.prot.filter(
      (p) => p.logged && p.value >= data.goals.proteinMin,
    ).length;
    return {
      loggedDays,
      avg,
      onTarget,
      hitRate: loggedDays > 0 ? (onTarget / loggedDays) * 100 : 0,
    };
  }, [points, data.entries, data.goals.proteinMin, range, today]);

  const dates = useMemo(() => loggedDates(data.entries), [data.entries]);

  if (!loaded) {
    return (
      <div className="grid min-h-[50vh] place-items-center text-sm text-muted">
        Loading…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="text-lg font-semibold">History</h1>
        <div className="ml-auto flex gap-1">
          {RANGES.map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold ${
                range === r
                  ? "bg-surface-2 text-ink"
                  : "text-ink-2 hover:bg-surface-2"
              }`}
            >
              {r}d
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile
          label="Days logged"
          value={stats.loggedDays}
          unit={`/ ${range}`}
          hint={`${Math.round((stats.loggedDays / range) * 100)}% coverage`}
        />
        <StatTile
          label="Protein target hit"
          value={`${Math.round(stats.hitRate)}%`}
          hint={`${stats.onTarget} of ${stats.loggedDays} logged days`}
          tone={stats.hitRate >= 80 ? "good" : stats.hitRate >= 50 ? "neutral" : "warn"}
        />
        <StatTile
          label="Avg kcal / logged day"
          value={stats.loggedDays > 0 ? round(stats.avg.calories).toLocaleString() : "—"}
          hint={`Target ${data.goals.calories.toLocaleString()}`}
        />
        <StatTile
          label="Avg protein / logged day"
          value={stats.loggedDays > 0 ? round(stats.avg.protein) : "—"}
          unit={stats.loggedDays > 0 ? "g" : undefined}
          hint={`Target ${data.goals.proteinMin}–${data.goals.proteinMax}g`}
          tone={
            stats.loggedDays > 0 && stats.avg.protein >= data.goals.proteinMin
              ? "good"
              : "neutral"
          }
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <TrendChart
          title={`Calories · last ${range} days`}
          unit="kcal"
          points={points.cal}
          color="var(--series-carbs)"
          goal={data.goals.calories}
          height={150}
        />
        <TrendChart
          title={`Protein · last ${range} days`}
          unit="g"
          points={points.prot}
          color="var(--series-protein)"
          band={{ min: data.goals.proteinMin, max: data.goals.proteinMax }}
          height={150}
        />
      </div>

      {/* Table view — the accessible counterpart to the charts above. */}
      <section className="card overflow-hidden">
        <h2 className="border-b border-hairline px-4 py-3 text-sm font-semibold">
          Daily totals
        </h2>
        {dates.length === 0 ? (
          <p className="p-6 text-center text-sm text-muted">
            Nothing logged yet. Once you have a few days, this fills in.
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
                  <th className="px-4 py-2 text-right font-semibold">Target</th>
                </tr>
              </thead>
              <tbody className="tnum">
                {dates.map((d) => {
                  const t = sumEntries(entriesForDate(data.entries, d));
                  const hit = t.protein >= data.goals.proteinMin;
                  return (
                    <tr key={d} className="border-b border-hairline last:border-b-0">
                      <td className="px-4 py-2">{formatDateKey(d)}</td>
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
                            −{round(data.goals.proteinMin - t.protein)}g
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

      <ExportPanel data={data} />
      <SettingsPanel
        goals={data.goals}
        onSave={store.setGoals}
        onImport={store.replaceAll}
        onClear={store.clearAll}
      />
    </div>
  );
}

function ExportPanel({ data }: { data: AppData }) {
  const stamp = toDateKey();
  const has = data.entries.length > 0;

  const options = [
    {
      title: "CSV — every item",
      body: "One row per logged food. Opens in Excel, Numbers, or Sheets.",
      action: () => download(`nutrition-items-${stamp}.csv`, toCSV(data.entries), "text/csv"),
    },
    {
      title: "CSV — daily totals",
      body: "One row per day. This is the shape most trackers want to import.",
      action: () =>
        download(`nutrition-daily-${stamp}.csv`, toDailyCSV(data.entries), "text/csv"),
    },
    {
      title: "Markdown",
      body: "A readable log with per-day tables — drops straight into notes or a repo.",
      action: () =>
        download(`nutrition-log-${stamp}.md`, toMarkdown(data), "text/markdown"),
    },
    {
      title: "Apple Health XML",
      body: "Health-export schema with dietary energy, protein, carbs, fat, fibre and sodium records.",
      action: () =>
        download(
          `nutrition-apple-health-${stamp}.xml`,
          toAppleHealthXML(data.entries),
          "application/xml",
        ),
    },
    {
      title: "JSON backup",
      body: "Everything — log, goals, your own foods. Restore it below on another device.",
      action: () =>
        download(`nutrition-backup-${stamp}.json`, toJSON(data), "application/json"),
    },
  ];

  return (
    <section className="card p-4">
      <h2 className="text-sm font-semibold">Export</h2>
      <p className="mt-1 text-xs text-muted">
        {has
          ? `${data.entries.length} entries across ${loggedDates(data.entries).length} days.`
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
            Both need a companion app in the middle, so pick the export that matches
            the one you use:
          </p>
          <ul className="list-disc space-y-1 pl-4">
            <li>
              <strong>Apple Health</strong> — the XML export uses Apple&apos;s own
              HealthKit schema (<code>HKQuantityTypeIdentifierDietaryEnergyConsumed</code>{" "}
              and friends). Importers such as Health Auto Export, HealthFit, or Simple
              Health Export read it.
            </li>
            <li>
              <strong>Health Connect / Google Fit</strong> — use the daily-totals CSV.
              (Google Fit&apos;s own API was retired in favour of Health Connect, and
              Health Connect has no file import of its own.)
            </li>
            <li>
              <strong>Cronometer, MyFitnessPal, LoseIt</strong> — the per-item CSV maps
              onto their importers most directly.
            </li>
          </ul>
        </div>
      </details>
    </section>
  );
}

function SettingsPanel({
  goals,
  onSave,
  onImport,
  onClear,
}: {
  goals: Goals;
  onSave: (g: Goals) => void;
  onImport: (d: AppData) => void;
  onClear: () => void;
}) {
  const [draft, setDraft] = useState<Goals>(goals);
  const [saved, setSaved] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const dirty =
    draft.calories !== goals.calories ||
    draft.proteinMin !== goals.proteinMin ||
    draft.proteinMax !== goals.proteinMax ||
    draft.fiber !== goals.fiber;

  async function handleFile(file: File) {
    setImportError(null);
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as AppData;
      if (!parsed || !Array.isArray(parsed.entries)) {
        throw new Error("Not a Nutrition Calculator backup");
      }
      onImport({
        version: 1,
        goals: { ...goals, ...(parsed.goals ?? {}) },
        entries: parsed.entries,
        customFoods: Array.isArray(parsed.customFoods) ? parsed.customFoods : [],
        favorites: Array.isArray(parsed.favorites) ? parsed.favorites : [],
      });
    } catch (e) {
      setImportError(e instanceof Error ? e.message : "Could not read that file");
    }
  }

  const numberFields: Array<[string, keyof Goals, string]> = [
    ["Daily calories", "calories", "kcal"],
    ["Protein minimum", "proteinMin", "g"],
    ["Protein maximum", "proteinMax", "g"],
    ["Fibre target", "fiber", "g"],
  ];

  return (
    <section className="card p-4">
      <h2 className="text-sm font-semibold">Goals &amp; data</h2>

      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {numberFields.map(([label, key, unit]) => (
          <div key={key}>
            <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wide text-muted">
              {label}
            </label>
            <div className="relative">
              <input
                type="number"
                min={0}
                value={draft[key] ?? ""}
                onChange={(e) => {
                  setSaved(false);
                  setDraft({ ...draft, [key]: Number(e.target.value) || 0 });
                }}
                className="tnum w-full rounded-lg border border-hairline bg-surface-2 px-3 py-2 pr-8 text-sm outline-none"
              />
              <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted">
                {unit}
              </span>
            </div>
          </div>
        ))}
      </div>

      {draft.proteinMax < draft.proteinMin && (
        <p className="mt-2 text-xs text-serious">
          The maximum is below the minimum — the target band won&apos;t make sense.
        </p>
      )}

      <div className="mt-3 flex items-center gap-2">
        <button
          disabled={!dirty || draft.proteinMax < draft.proteinMin}
          onClick={() => {
            onSave(draft);
            setSaved(true);
          }}
          className="rounded-lg bg-protein px-3.5 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          Save goals
        </button>
        {saved && !dirty && (
          <span className="text-xs" style={{ color: "var(--success-text)" }}>
            ✓ Saved
          </span>
        )}
      </div>

      <div className="mt-5 border-t border-hairline pt-4">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">
          Backup
        </h3>
        <p className="mt-1 text-xs text-muted">
          Your log lives in this browser only — nothing is uploaded anywhere. Export a
          JSON backup before switching devices or clearing site data.
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void handleFile(f);
              e.target.value = "";
            }}
          />
          <button
            onClick={() => fileRef.current?.click()}
            className="rounded-lg border border-hairline px-3 py-1.5 text-xs font-semibold text-ink-2 hover:bg-surface-2"
          >
            Restore from backup
          </button>
          <button
            onClick={() => {
              if (
                confirm(
                  "Delete the entire log, your saved foods, and your goals? Export a backup first if you might want any of it — this can't be undone.",
                )
              ) {
                onClear();
              }
            }}
            className="rounded-lg border border-hairline px-3 py-1.5 text-xs font-semibold text-critical hover:bg-surface-2"
          >
            Erase everything
          </button>
        </div>
        {importError && <p className="mt-2 text-xs text-critical">{importError}</p>}
      </div>
    </section>
  );
}
