import { RECIPE_FOODS } from "@/data/recipes";
import { PANTRY_FOODS } from "@/data/pantry";
import { PACKAGED_FOODS, STAPLE_FOODS } from "@/data/staples";
import type { Food, Macros } from "./types";

/**
 * The whole catalog. It is a *reference*, not a log: nothing here is editable
 * and nothing here is eaten until a row referencing it lands in `data/log.csv`.
 * The Foods page browses it, and the gap-closer panel ranks it.
 */
export const BUILTIN_FOODS: Food[] = [
  ...PACKAGED_FOODS,
  ...RECIPE_FOODS,
  ...STAPLE_FOODS,
  ...PANTRY_FOODS,
];

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function searchText(f: Food): string {
  return normalize(
    [f.name, f.variant, f.brand, f.per, ...(f.tags ?? [])]
      .filter(Boolean)
      .join(" "),
  );
}

/**
 * Token-AND scoring: every word you type has to appear somewhere, then results
 * are ranked by how early and how exactly they match. Deliberately simple —
 * the catalog is small enough that a real fuzzy index would be overkill, and
 * substring matching handles typo-free partial words ("gren", "potstick")
 * which is what people actually type.
 */
export function searchFoods(foods: Food[], query: string, limit = 40): Food[] {
  const q = normalize(query);
  if (!q) return foods.slice(0, limit);
  const tokens = q.split(" ");

  const scored: Array<{ food: Food; score: number }> = [];
  for (const food of foods) {
    const hay = searchText(food);
    const name = normalize(food.name);

    let score = 0;
    let matchedAll = true;
    for (const t of tokens) {
      const idx = hay.indexOf(t);
      if (idx === -1) {
        matchedAll = false;
        break;
      }
      // Earlier matches and name matches are worth more.
      score += 100 - Math.min(idx, 60);
      if (name.includes(t)) score += 60;
      if (name.startsWith(t)) score += 40;
    }
    if (!matchedAll) continue;

    // Whole-phrase hit in the name beats scattered token hits.
    if (name.includes(q)) score += 200;
    if (name === q) score += 300;

    scored.push({ food, score });
  }

  scored.sort((a, b) => b.score - a.score || a.food.name.localeCompare(b.food.name));
  return scored.slice(0, limit).map((s) => s.food);
}

export function foodLabel(f: Food): string {
  return f.variant ? `${f.name} — ${f.variant}` : f.name;
}

/**
 * Rank foods by how well one serving closes the remaining gap: strongly
 * prefers things that deliver the protein still needed without blowing past
 * the calories still available. Protein density does the heavy lifting, and
 * anything that would overshoot calories is penalised rather than excluded so
 * the list never comes back empty.
 */
export function suggestGapClosers(
  foods: Food[],
  needProtein: number,
  remainingCalories: number,
  limit = 4,
): Food[] {
  if (needProtein <= 0) return [];

  const scored = foods
    .filter((f) => f.macros.protein >= 8)
    .map((f) => {
      const { protein, calories } = f.macros;
      const density = calories > 0 ? protein / (calories / 100) : protein;

      // How much of the gap this closes, capped so a 76g smoothie isn't
      // penalised for a 20g gap but doesn't get extra credit either.
      const coverage = Math.min(protein / needProtein, 1);

      let score = coverage * 100 + density * 8;

      // Overshooting the calorie budget is the thing to avoid late in the day.
      if (remainingCalories > 0 && calories > remainingCalories) {
        const overshoot = (calories - remainingCalories) / remainingCalories;
        score -= overshoot * 120;
      }
      return { food: f, score };
    });

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map((s) => s.food);
}

/**
 * Calories bought per gram of protein — the number that actually decides what
 * to eat, and the one worth minimising. Lower is leaner: skyr is around 12,
 * peanut butter around 45.
 *
 * Null when the food has no protein at all, because "infinite calories per
 * gram" is a division by zero dressed up as a fact. Callers render a dash.
 */
export function caloriesPerProteinGram(m: Macros): number | null {
  return m.protein > 0 ? m.calories / m.protein : null;
}
