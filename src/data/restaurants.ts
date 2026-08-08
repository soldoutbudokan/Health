import type { Food } from "@/lib/types";

/**
 * Restaurant and takeout dishes, kept separate from `pantry.ts` because that
 * file is one specific catered plate in Toronto and this is somewhere you order
 * from repeatedly. Both are the same *kind* of entry — a venue with no published
 * nutrition, reconstructed from what is visibly in the dish — so both carry the
 * same warning: the macros are estimates, and the sodium is a wider estimate
 * still, because a portion can be eyeballed and a sauce cannot.
 *
 * These exist so a dish eaten more than once stops being re-estimated from
 * scratch every time. A second guess at the same sandwich that lands 200 kcal
 * from the first one makes the log look like the sandwich changed.
 */
export const RESTAURANT_FOODS: Food[] = [
  {
    id: "sw-cacio-e-pepe",
    name: "Cacio e Pepe",
    brand: "Spaghetti Western",
    source: "claude",
    per: "1 scoop (~120 g)",
    gramsPerServing: 120,
    macros: {
      calories: 260,
      protein: 10,
      carbs: 26.5,
      fat: 12.5,
      fiber: 1.4,
      sugar: 1.1,
      sodium: 500,
    },
    note: "Estimated from the dish's construction, not a published panel: ~90 g cooked pasta and ~25 g Pecorino Romano per scoop, which is what the 10 g protein and 12.5 g fat imply. The sodium is the number to be careful with — Pecorino Romano runs ~1,800 mg/100 g, among the saltiest cheeses there is, so the cheese alone is ~450 mg and salted pasta water carries the rest. Band is 350–700 mg per scoop and it tracks the cheese, which is also what drives the calories, so a generous scoop moves both together. Portions here are logged in scoops: 4 scoops is a 2,000 mg dish.",
    tags: ["pasta", "cacio e pepe", "pecorino", "spaghetti western", "restaurant", "takeout"],
  },
  {
    id: "sw-chicken-caesar-sandwich",
    name: "Chicken Caesar Sandwich",
    brand: "Spaghetti Western",
    source: "claude",
    per: "1 sandwich",
    macros: {
      calories: 655,
      protein: 49,
      carbs: 57,
      fat: 25,
      fiber: 3,
      sugar: 3,
      sodium: 1400,
    },
    note: "Estimated for a whole sandwich; it is usually logged at 0.5. The 49 g protein implies roughly 170 g of chicken, which is what makes this the largest protein item in the catalog outside the Starbucks latte. Sodium is an estimate in the 1,000–1,900 mg band and comes from four places at once — bread ~450 mg, seasoned chicken ~500 mg, Caesar dressing ~350 mg, Parmesan ~120 mg — so there is no single ingredient to blame or to swap out. Even half a sandwich is a 700 mg item.",
    tags: ["sandwich", "chicken", "caesar", "spaghetti western", "restaurant", "takeout", "lunch"],
  },
];
