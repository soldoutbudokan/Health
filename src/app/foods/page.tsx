"use client";

import { useMemo, useState } from "react";
import type { FoodSource, Macros } from "@/lib/types";
import {
  BUILTIN_FOODS,
  caloriesPerProteinGram,
  foodLabel,
  searchFoods,
} from "@/lib/search";
import { round } from "@/lib/nutrition";
import { SourceBadge } from "@/components/SourceBadge";

/**
 * The catalog browser. A client component rather than a server one because
 * everything on it is interactive — filtering, sorting, searching — and none
 * of it is data from disk: the catalog is a static module, shipped with the
 * app and identical in every build.
 *
 * It is a reference, not a log. Nothing here can be eaten, starred or deleted;
 * the ids are the useful output, because a row in `data/log.csv` that reuses a
 * catalog id inherits numbers that have already been checked.
 */

const FILTERS: Array<{ key: FoodSource | "all"; label: string }> = [
  { key: "all", label: "All" },
  { key: "recipe", label: "Recipes" },
  { key: "packaged", label: "Packaged" },
  { key: "staple", label: "Staples" },
  { key: "custom", label: "Manual" },
];

export default function Foods() {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["key"]>("all");
  const [sort, setSort] = useState<"name" | "protein" | "cost">("name");

  const shown = useMemo(() => {
    let list = searchFoods(BUILTIN_FOODS, query, 500);
    if (filter !== "all") list = list.filter((f) => f.source === filter);

    if (sort === "protein") {
      list = [...list].sort((a, b) => b.macros.protein - a.macros.protein);
    } else if (sort === "cost") {
      // Cheapest protein first. A food with no protein has no ratio at all, so
      // it sorts to the bottom rather than to either extreme.
      list = [...list].sort(
        (a, b) =>
          (caloriesPerProteinGram(a.macros) ?? Infinity) -
          (caloriesPerProteinGram(b.macros) ?? Infinity),
      );
    } else if (!query) {
      list = [...list].sort((a, b) => foodLabel(a).localeCompare(foodLabel(b)));
    }
    return list;
  }, [query, filter, sort]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold">Foods</h1>
        <p className="mt-1 text-sm text-muted">
          {BUILTIN_FOODS.length} in the catalog, with the numbers already checked.
          Log one by its id.
        </p>
      </div>

      {/* A placeholder is not a label — it vanishes on the first keystroke and
          screen readers announce the field as unnamed. */}
      <input
        id="food-filter"
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Filter foods…"
        aria-label="Filter foods by name or brand"
        className="w-full rounded-lg border border-hairline bg-surface-2 px-3.5 py-2.5 text-[15px] outline-none placeholder:text-muted"
      />

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap gap-1" role="group" aria-label="Filter by source">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              aria-pressed={filter === f.key}
              className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold ${
                filter === f.key
                  ? "bg-surface-2 text-ink"
                  : "text-ink-2 hover:bg-surface-2"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <label className="ml-auto flex items-center gap-1.5 text-xs text-muted">
          Sort
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as typeof sort)}
            className="rounded-lg border border-hairline bg-surface-2 px-2 py-1.5 text-xs text-ink outline-none"
          >
            <option value="name">Name</option>
            <option value="protein">Most protein</option>
            <option value="cost">Calories per gram of protein</option>
          </select>
        </label>
      </div>

      {shown.length === 0 ? (
        <p className="card p-8 text-center text-sm text-muted">
          Nothing matches. The catalog only holds what ships with the app — a
          one-off gets its numbers written straight into the log instead.
        </p>
      ) : (
        <ul className="card divide-y divide-[color:var(--border)] overflow-hidden">
          {shown.map((f) => (
            <li key={f.id} className="flex items-center gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="truncate text-[15px] font-medium">
                    {foodLabel(f)}
                  </span>
                  <SourceBadge source={f.source} />
                </div>
                <div className="tnum truncate text-xs text-muted">
                  {f.brand ? `${f.brand} · ` : ""}
                  {f.per}
                </div>
                {/* Six columns don't fit a phone, so the same numbers wrap into
                    a strip below the serving they're "per". */}
                <MacroStrip macros={f.macros} />
                {/* The id is what you hand Claude Code to log this thing. */}
                <div className="mt-0.5 truncate font-mono text-[11px] text-muted">
                  {f.id}
                </div>
                {f.note && (
                  <div className="mt-1 line-clamp-2 text-xs leading-snug text-muted">
                    {f.note}
                  </div>
                )}
              </div>

              <MacroColumns macros={f.macros} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/**
 * The per-serving numbers, aligned so the catalog can be read down a column
 * rather than across a row — which is the point of sorting it by one of them.
 *
 * Protein, carbs and fat carry the same three series colours the dashboard's
 * macro split uses. Fibre doesn't: it is logged less reliably than the macros,
 * and an absent value is *not recorded*, which is not the same as zero, so it
 * renders as a dash. The same goes for calories per gram of protein on a food
 * with no protein in it.
 */
function MacroColumns({ macros: m }: { macros: Macros }) {
  const cost = caloriesPerProteinGram(m);

  return (
    <div className="tnum hidden shrink-0 gap-3 text-right text-[11px] text-muted sm:flex">
      <Column label="kcal" value={round(m.calories)} />
      <Column
        label="prot"
        value={round(m.protein, 1)}
        color="var(--series-protein)"
      />
      <Column label="carb" value={round(m.carbs, 1)} color="var(--series-carbs)" />
      <Column label="fat" value={round(m.fat, 1)} color="var(--series-fat)" />
      <Column
        label="fibre"
        value={m.fiber === undefined ? "—" : round(m.fiber, 1)}
      />
      <Column
        label="kcal/g P"
        value={cost === null ? "—" : round(cost, 1)}
        width="w-14"
      />
    </div>
  );
}

function Column({
  label,
  value,
  color,
  width = "w-10",
}: {
  label: string;
  value: string | number;
  color?: string;
  width?: string;
}) {
  return (
    <span className={`${width} whitespace-nowrap`}>
      <span
        className="block text-sm font-semibold text-ink"
        style={color ? { color } : undefined}
      >
        {value}
      </span>
      {label}
    </span>
  );
}

function MacroStrip({ macros: m }: { macros: Macros }) {
  const cost = caloriesPerProteinGram(m);

  return (
    <div className="tnum mt-1 flex flex-wrap gap-x-2 text-xs text-muted sm:hidden">
      <span className="font-semibold text-ink">{round(m.calories)} kcal</span>
      <span style={{ color: "var(--series-protein)" }}>
        {round(m.protein, 1)}g P
      </span>
      <span style={{ color: "var(--series-carbs)" }}>{round(m.carbs, 1)}g C</span>
      <span style={{ color: "var(--series-fat)" }}>{round(m.fat, 1)}g F</span>
      <span>{m.fiber === undefined ? "—" : `${round(m.fiber, 1)}g`} fibre</span>
      <span className="text-ink">
        {cost === null ? "—" : round(cost, 1)} kcal/g P
      </span>
    </div>
  );
}
