"use client";

import type { Food } from "@/lib/types";
import { round } from "@/lib/nutrition";
import { foodLabel, proteinDensity } from "@/lib/search";

/** A handful of headline numbers is a KPI row, not a chart. */
export function StatTile({
  label,
  value,
  unit,
  hint,
  tone = "neutral",
}: {
  label: string;
  value: string | number;
  unit?: string;
  hint?: string;
  tone?: "neutral" | "good" | "warn";
}) {
  const color =
    tone === "good"
      ? "var(--success-text)"
      : tone === "warn"
        ? "var(--status-serious)"
        : undefined;

  return (
    <div className="card p-3.5">
      <div className="text-[11px] font-medium uppercase tracking-wide text-muted">
        {label}
      </div>
      <div className="mt-1 flex items-baseline gap-1">
        <span className="text-2xl font-semibold leading-none" style={{ color }}>
          {value}
        </span>
        {unit && <span className="text-sm text-muted">{unit}</span>}
      </div>
      {hint && <div className="mt-1 text-xs leading-snug text-muted">{hint}</div>}
    </div>
  );
}

/**
 * The single most useful thing a tracker can do at 4pm: given what's left in
 * the budget, name specific things that close the gap. Ranked by how much of
 * the remaining protein they deliver per calorie.
 */
export function GapClosers({
  foods,
  needProtein,
  remainingCalories,
  onPick,
}: {
  foods: Food[];
  needProtein: number;
  remainingCalories: number;
  onPick: (food: Food) => void;
}) {
  if (foods.length === 0) return null;

  return (
    <section className="card p-4">
      <div className="mb-1 flex items-baseline gap-2">
        <h2 className="text-sm font-semibold">Closing the gap</h2>
        <span className="text-xs text-muted">
          {round(needProtein)}g protein ·{" "}
          {remainingCalories > 0
            ? `${round(remainingCalories)} kcal left`
            : "over calorie budget"}
        </span>
      </div>
      <p className="mb-3 text-xs text-muted">
        Ranked by protein per calorie against what you have left today.
      </p>

      <ul className="space-y-1.5">
        {foods.map((f) => {
          const covers = Math.min(100, (f.macros.protein / needProtein) * 100);
          const fits = remainingCalories <= 0 || f.macros.calories <= remainingCalories;
          return (
            <li key={f.id}>
              <button
                onClick={() => onPick(f)}
                className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors hover:bg-surface-2"
              >
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{foodLabel(f)}</div>
                  <div className="tnum truncate text-xs text-muted">
                    {round(f.macros.protein, 1)}g protein · {round(f.macros.calories)} kcal ·{" "}
                    {round(proteinDensity(f.macros), 1)}g per 100 kcal
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <div
                    className="tnum text-sm font-semibold"
                    style={{ color: fits ? "var(--series-protein)" : "var(--status-serious)" }}
                  >
                    {Math.round(covers)}%
                  </div>
                  <div className="text-[10px] text-muted">of gap</div>
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export function QuickAdd({
  foods,
  onPick,
  onManage,
}: {
  foods: Food[];
  onPick: (food: Food) => void;
  onManage: () => void;
}) {
  return (
    <section>
      <div className="mb-2 flex items-center gap-2">
        <h2 className="text-[11px] font-semibold uppercase tracking-wide text-muted">
          Quick add
        </h2>
        <button
          onClick={onManage}
          className="ml-auto text-xs font-medium text-muted hover:text-ink"
        >
          {foods.length === 0 ? "Pin favourites →" : "Manage →"}
        </button>
      </div>

      {foods.length === 0 ? (
        <p className="text-xs text-muted">
          Star a food on the Foods page and it shows up here for one-tap logging.
        </p>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {foods.map((f) => (
            <button
              key={f.id}
              onClick={() => onPick(f)}
              className="group flex items-center gap-2 rounded-full border border-hairline bg-surface px-3 py-1.5 text-sm transition-colors hover:border-hairline-strong hover:bg-surface-2"
            >
              <span className="max-w-[180px] truncate font-medium">{foodLabel(f)}</span>
              <span className="tnum text-xs text-muted">
                {round(f.macros.protein)}g
              </span>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
