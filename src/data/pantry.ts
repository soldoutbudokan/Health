import type { Food } from "@/lib/types";

/**
 * Pantry (catering, Toronto) — plate components, broken out so a future visit
 * can be logged scoop by scoop rather than as one lump.
 *
 * These are estimates for a catered buffet with no published nutrition, so
 * they carry more uncertainty than anything else in the catalog. The oil and
 * sugar in the tofu glaze and the richness of the mac are the two things that
 * move the total most: a full plate lands somewhere in 1,150–1,550 kcal
 * depending on how heavy the serving hand was.
 */
export const PANTRY_FOODS: Food[] = [
  {
    id: "pantry-korean-bbq-tofu",
    name: "Korean BBQ tofu",
    brand: "Pantry (Toronto)",
    source: "custom",
    per: "1 scoop (~150 g)",
    gramsPerServing: 150,
    macros: { calories: 265, protein: 20, carbs: 12.5, fat: 15, fiber: 3 },
    note: "The swing item on the plate. Deep-fried before saucing adds ~75–100 kcal and ~7 g fat per scoop; baked and lightly sauced takes ~50 kcal off.",
    tags: ["pantry", "tofu", "korean", "bbq", "vegetarian", "catering", "toronto"],
  },
  {
    id: "pantry-chicken-thigh",
    name: "Bone-in chicken thigh",
    brand: "Pantry (Toronto)",
    source: "custom",
    per: "1 thigh (~110 g meat + skin)",
    gramsPerServing: 110,
    macros: { calories: 280, protein: 26, carbs: 3, fat: 17, fiber: 0 },
    note: "Skin on. Taking the skin off drops it to roughly 190 kcal and 10 g fat.",
    tags: ["pantry", "chicken", "thigh", "catering", "toronto"],
  },
  {
    id: "pantry-mac-and-cheese",
    name: "Mac and cheese",
    brand: "Pantry (Toronto)",
    source: "custom",
    per: "1 scoop (~170 g)",
    gramsPerServing: 170,
    macros: { calories: 320, protein: 13, carbs: 30, fat: 16, fiber: 1 },
    note: "Assumes a standard cheese sauce. A cream- or extra-cheese-heavy version can run 100 kcal higher.",
    tags: ["pantry", "mac", "cheese", "pasta", "catering", "toronto"],
  },
  {
    id: "pantry-greens-chickpeas",
    name: "Greens with roasted chickpeas",
    brand: "Pantry (Toronto)",
    source: "custom",
    per: "1 scoop (~160 g, dressed)",
    gramsPerServing: 160,
    macros: { calories: 220, protein: 7, carbs: 16, fat: 13, fiber: 8 },
    note: "Most of the fat is dressing, most of the fibre is chickpeas. Undressed this is closer to 120 kcal and 4 g fat.",
    tags: ["pantry", "salad", "greens", "chickpeas", "catering", "toronto"],
  },
];
