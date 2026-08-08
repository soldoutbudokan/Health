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
 *
 * Sodium was added on August 8, 2026 and is softer still than the calories.
 * A full plate is roughly 2,100 mg with a plausible range of 1,350–3,000 —
 * a band wide enough that the plate can only be read as "this was the salty
 * meal of the day", never as a figure to total precisely against a target.
 * Every seasoned dish here is dominated by a sauce or rub whose quantity
 * nobody measured, which is a different kind of unknown from the calories:
 * portion size can at least be eyeballed, salt cannot.
 */
export const PANTRY_FOODS: Food[] = [
  {
    id: "pantry-korean-bbq-tofu",
    name: "Korean BBQ tofu",
    brand: "Pantry (Toronto)",
    source: "custom",
    per: "1 scoop (~150 g)",
    gramsPerServing: 150,
    macros: { calories: 265, protein: 20, carbs: 12.5, fat: 15, fiber: 3, sodium: 700 },
    note: "The swing item on the plate. Deep-fried before saucing adds ~75–100 kcal and ~7 g fat per scoop; baked and lightly sauced takes ~50 kcal off. Sodium is an estimate with a wide band (450–1,000 mg): the glaze is soy- and gochujang-based and carries essentially all of it, so the figure tracks how wet the scoop was rather than how much tofu was in it. The tofu itself is under 20 mg. Treat 700 mg as the middle of a range, not a reading.",
    tags: ["pantry", "tofu", "korean", "bbq", "vegetarian", "catering", "toronto"],
  },
  {
    id: "pantry-chicken-thigh",
    name: "Bone-in chicken thigh",
    brand: "Pantry (Toronto)",
    source: "custom",
    per: "1 thigh (~110 g meat + skin)",
    gramsPerServing: 110,
    macros: { calories: 280, protein: 26, carbs: 3, fat: 17, fiber: 0, sodium: 450 },
    note: "Skin on. Taking the skin off drops it to roughly 190 kcal and 10 g fat. Sodium is an estimate in the 300–700 mg band. Unseasoned roast thigh is ~85 mg/100 g (so ~95 mg here); catering chicken is rubbed or brined before it goes in, and that step is worth several times the meat's own figure. Which end of the band applies depends entirely on the kitchen.",
    tags: ["pantry", "chicken", "thigh", "catering", "toronto"],
  },
  {
    id: "pantry-mac-and-cheese",
    name: "Mac and cheese",
    brand: "Pantry (Toronto)",
    source: "custom",
    per: "1 scoop (~170 g)",
    gramsPerServing: 170,
    macros: { calories: 320, protein: 13, carbs: 30, fat: 16, fiber: 1, sodium: 600 },
    note: "Assumes a standard cheese sauce. A cream- or extra-cheese-heavy version can run 100 kcal higher. Sodium is an estimate in the 400–800 mg band, and it moves with the same thing the calories do — the cheese. Cheese and salted pasta water carry nearly all of it, so a richer sauce raises both numbers together.",
    tags: ["pantry", "mac", "cheese", "pasta", "catering", "toronto"],
  },
  {
    id: "pantry-greens-chickpeas",
    name: "Greens with roasted chickpeas",
    brand: "Pantry (Toronto)",
    source: "custom",
    per: "1 scoop (~160 g, dressed)",
    gramsPerServing: 160,
    macros: { calories: 220, protein: 7, carbs: 16, fat: 13, fiber: 8, sodium: 350 },
    note: "Most of the fat is dressing, most of the fibre is chickpeas. Undressed this is closer to 120 kcal and 4 g fat. Sodium is an estimate in the 200–500 mg band, split roughly evenly between the dressing and the seasoning on the roasted chickpeas; the greens themselves are near zero. Undressed, this drops to well under 150 mg.",
    tags: ["pantry", "salad", "greens", "chickpeas", "catering", "toronto"],
  },
];
