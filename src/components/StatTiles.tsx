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
 * Given what's left in the budget, name specific things that would close the
 * gap. Ranked by how much of the remaining protein they deliver per calorie.
 *
 * This reads the *catalog*, not the log, so it still means something in a
 * read-only app: it answers "what could close this gap", and the answer is a
 * shopping decision rather than a button. Nothing here logs anything — the
 * rows are text, not controls.
 */
export function GapClosers({
  foods,
  needProtein,
  remainingCalories,
}: {
  foods: Food[];
  needProtein: number;
  remainingCalories: number;
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
        From the catalog, ranked by protein per calorie against what was left.
      </p>

      <ul className="space-y-1.5">
        {foods.map((f) => {
          const covers = Math.min(100, (f.macros.protein / needProtein) * 100);
          const fits = remainingCalories <= 0 || f.macros.calories <= remainingCalories;
          return (
            <li key={f.id} className="flex items-center gap-3 px-2 py-2">
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
                {/* The percentage is the signal; colour only reinforces it,
                    so the "doesn't fit" case says so in words too. */}
                <div className="text-[10px] text-muted">
                  {fits ? "of gap" : "over budget"}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
