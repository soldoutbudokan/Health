import type { Food, LogEntry, MealSlot } from "@/lib/types";
import { BUILTIN_FOODS } from "@/lib/search";

/**
 * Day one, pre-loaded on the very first run so the dashboard opens with real
 * numbers instead of an empty state. Everything here is an ordinary log entry
 * — edit the servings, move it between meals, or delete it like anything else.
 *
 * Seeding happens only when storage is completely empty, so it never returns
 * after you've cleared it.
 *
 * This day totals 2,711 kcal and 213.5 g protein against goals of 2,800 kcal
 * and a 160–180 g band — 89 kcal under, 33.5 g over the top of the band. That
 * is deliberate, and it is not a rounding accident waiting to be tidied up:
 *
 * - Over the band is not a failure state in this app. `ProteinRing` renders
 *   consumed > max as "✓ Target cleared (+33g)" in the success colour; the
 *   only `text-critical` on the dashboard is calories over budget, and
 *   calories are under. First run opens green on both rings, correctly.
 * - Nothing renders broken. `GapClosers` is gated on `protein.toMin > 0` and
 *   is meant to be absent on a day with no gap; the pace tile reads "Done".
 * - The numbers are ordinary, not extreme: 31.5% of calories from protein on
 *   a 2,700 kcal day is a normal high-protein day, not an implausible one.
 * - The two breakfast drinks that carry 92 g of protein between them are both
 *   in SEED_FAVORITES — they are routine items, not padding chosen to hit a
 *   number.
 *
 * Trimming servings to land inside the band would mean editing a real logged
 * day so the dashboard flatters the goal, which is exactly the thing the band
 * (rather than a line) exists to avoid. Left alone on purpose.
 *
 * One caveat worth knowing: 40 g of the 213.5 comes from the Starbucks venti
 * protein latte, the lowest-confidence entry in the catalog (its carbs are
 * back-calculated — see its note). If that figure is revised down, this day's
 * protein total moves with it.
 */
const SEED_PLAN: Array<{ foodId: string; servings: number; slot: MealSlot }> = [
  // Breakfast
  { foodId: "pkg-sbux-sf-vanilla-protein-latte-venti", servings: 1, slot: "breakfast" },
  { foodId: "pkg-on-whey-shake-2scoop-milk", servings: 1, slot: "breakfast" },

  // Lunch — the Pantry plate, scoop by scoop
  { foodId: "pantry-korean-bbq-tofu", servings: 2, slot: "lunch" },
  { foodId: "pantry-chicken-thigh", servings: 1, slot: "lunch" },
  { foodId: "pantry-mac-and-cheese", servings: 1, slot: "lunch" },
  { foodId: "pantry-greens-chickpeas", servings: 1, slot: "lunch" },

  // Dinner
  { foodId: "recipe-mushroom-potsticker-soup-6", servings: 1, slot: "dinner" },

  // Snacks
  { foodId: "pkg-grenade-oreo-white", servings: 1, slot: "snack" },
  { foodId: "staple-apple", servings: 1, slot: "snack" },
];

function makeId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function buildSeedEntries(date: string): LogEntry[] {
  const byId = new Map<string, Food>(BUILTIN_FOODS.map((f) => [f.id, f]));
  const now = new Date().toISOString();

  return SEED_PLAN.flatMap(({ foodId, servings, slot }) => {
    const food = byId.get(foodId);
    // A renamed or removed catalog id should quietly drop out of the seed
    // rather than crash the first render.
    if (!food) return [];
    return [
      {
        id: makeId(),
        date,
        slot,
        foodId: food.id,
        name: food.name,
        variant: food.variant,
        brand: food.brand,
        source: food.source,
        per: food.per,
        servings,
        macros: food.macros,
        loggedAt: now,
      } satisfies LogEntry,
    ];
  });
}

/** Sensible starting pins for the quick-add row. */
export const SEED_FAVORITES = [
  "pkg-on-whey-shake-2scoop-milk",
  "pkg-grenade-oreo-white",
  "pkg-sbux-sf-vanilla-protein-latte-venti",
  "recipe-protein-berry-smoothie",
];
