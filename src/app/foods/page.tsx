"use client";

import { useMemo, useState } from "react";
import type { FoodSource } from "@/lib/types";
import { BUILTIN_FOODS, foodLabel, proteinDensity, searchFoods } from "@/lib/search";
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
  const [sort, setSort] = useState<"name" | "protein" | "density">("name");

  const shown = useMemo(() => {
    let list = searchFoods(BUILTIN_FOODS, query, 500);
    if (filter !== "all") list = list.filter((f) => f.source === filter);

    if (sort === "protein") {
      list = [...list].sort((a, b) => b.macros.protein - a.macros.protein);
    } else if (sort === "density") {
      list = [...list].sort(
        (a, b) => proteinDensity(b.macros) - proteinDensity(a.macros),
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
            <option value="density">Protein per 100 kcal</option>
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

              <div className="tnum hidden shrink-0 gap-4 text-right text-[11px] text-muted sm:flex">
                <span className="w-12">
                  <span className="block text-sm font-semibold text-ink">
                    {round(f.macros.calories)}
                  </span>
                  kcal
                </span>
                <span className="w-12">
                  <span
                    className="block text-sm font-semibold"
                    style={{ color: "var(--series-protein)" }}
                  >
                    {round(f.macros.protein, 1)}
                  </span>
                  prot
                </span>
                <span className="w-12">
                  <span className="block text-sm font-semibold">
                    {round(proteinDensity(f.macros), 1)}
                  </span>
                  /100kcal
                </span>
              </div>

              <div className="tnum shrink-0 text-right sm:hidden">
                <div className="text-sm font-semibold">{round(f.macros.calories)}</div>
                <div className="text-[11px]" style={{ color: "var(--series-protein)" }}>
                  {round(f.macros.protein, 1)}g P
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
