"use client";

import { useMemo, useState } from "react";
import { useAppData } from "@/lib/store";
import type { FoodSource } from "@/lib/types";
import { allFoods, foodLabel, proteinDensity, searchFoods } from "@/lib/search";
import { round } from "@/lib/nutrition";
import { SourceBadge } from "@/components/SourceBadge";

const FILTERS: Array<{ key: FoodSource | "all" | "mine"; label: string }> = [
  { key: "all", label: "All" },
  { key: "recipe", label: "Recipes" },
  { key: "packaged", label: "Packaged" },
  { key: "staple", label: "Staples" },
  { key: "mine", label: "Mine" },
];

export default function Foods() {
  const store = useAppData();
  const { data, loaded } = store;
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["key"]>("all");
  const [sort, setSort] = useState<"name" | "protein" | "density">("name");

  const catalog = useMemo(() => allFoods(data.customFoods), [data.customFoods]);

  const shown = useMemo(() => {
    let list = searchFoods(catalog, query, 500);
    if (filter === "mine") {
      list = list.filter(
        (f) => f.source === "custom" || f.source === "claude" || f.source === "usda" || f.source === "off",
      );
    } else if (filter !== "all") {
      list = list.filter((f) => f.source === filter);
    }
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
  }, [catalog, query, filter, sort]);

  if (!loaded) {
    return (
      <div className="grid min-h-[50vh] place-items-center text-sm text-muted">
        Loading…
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold">Foods</h1>
        <p className="mt-1 text-sm text-muted">
          {catalog.length} in the catalog. Star anything for one-tap logging on Today.
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
        aria-label="Filter foods by name, brand or barcode"
        className="w-full rounded-lg border border-hairline bg-surface-2 px-3.5 py-2.5 text-[15px] outline-none placeholder:text-muted"
      />

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap gap-1">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
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
          Nothing matches. Foods you add from the web or from Claude show up here too.
        </p>
      ) : (
        <ul className="card divide-y divide-[color:var(--border)] overflow-hidden">
          {shown.map((f) => {
            const fav = data.favorites.includes(f.id);
            const mine = f.id.startsWith("custom-");
            return (
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

                <div className="flex shrink-0 items-center gap-1">
                  <button
                    onClick={() => store.toggleFavorite(f.id)}
                    aria-label={fav ? `Unpin ${f.name}` : `Pin ${f.name} to quick add`}
                    aria-pressed={fav}
                    className={`h-8 w-8 rounded-lg transition-colors hover:bg-surface-2 ${
                      fav ? "text-warning" : "text-muted"
                    }`}
                  >
                    <svg
                      width="17"
                      height="17"
                      viewBox="0 0 24 24"
                      fill={fav ? "currentColor" : "none"}
                      aria-hidden
                      className="mx-auto"
                    >
                      <path
                        d="M12 3.5l2.6 5.6 6 .8-4.4 4.2 1.1 6-5.3-3-5.3 3 1.1-6L3.4 9.9l6-.8L12 3.5z"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                  {mine && (
                    <button
                      onClick={() => {
                        if (confirm(`Delete “${foodLabel(f)}” from your catalog? Anything already logged stays put.`)) {
                          store.removeCustomFood(f.id);
                        }
                      }}
                      aria-label={`Delete ${f.name}`}
                      className="h-8 w-8 rounded-lg text-muted transition-colors hover:bg-surface-2 hover:text-critical"
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        aria-hidden
                        className="mx-auto"
                      >
                        <path
                          d="M6 6l12 12M18 6L6 18"
                          stroke="currentColor"
                          strokeWidth="2.2"
                          strokeLinecap="round"
                        />
                      </svg>
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
