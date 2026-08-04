import type { Food, LogEntry, MealSlot } from "@/lib/types";
import { BUILTIN_FOODS } from "@/lib/search";

/**
 * Day one, pre-loaded on the very first run so the dashboard opens with real
 * numbers instead of an empty state. Everything here is an ordinary log entry
 * — edit the servings, move it between meals, or delete it like anything else.
 *
 * Seeding happens only when storage is completely empty, so it never returns
 * after you've cleared it.
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
