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
 *
 * The four entries added September 14, 2026 come from a second visit on a
 * different format — a "one protein, two sides" plate rather than the August
 * buffet — and were built from a photo of the tray. The aioli is broken out
 * from the potatoes it arrived on because it is the swing item: a heavy pour
 * is worth more calories than the potatoes gained from being smashed and
 * fried. Everything above about salt applies here twice over, since the
 * tandoori rub and the Caesar dressing are both seasoning nobody weighed.
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
  {
    id: "pantry-tandoori-chicken",
    name: "Tandoori chicken",
    brand: "Pantry (Toronto)",
    source: "custom",
    per: "1 protein portion (~180 g cooked)",
    gramsPerServing: 180,
    macros: { calories: 400, protein: 46, carbs: 5, fat: 21, fiber: 1, sugar: 2, sodium: 700 },
    note: "The protein half of a one-protein, two-sides plate, estimated Sep 14 from a photo: boneless charred pieces with coriander, about a third of the container. About 180 g of cooked thigh plus the yogurt-and-oil marinade. Call it 300–500 kcal; breast instead would be about 330 kcal with 12 g fat and the same protein. Sodium 450–1,100 mg, almost all marinade.",
    tags: ["pantry", "chicken", "tandoori", "indian", "protein", "catering", "toronto"],
  },
  {
    id: "pantry-smashed-potatoes",
    name: "Smashed potatoes",
    brand: "Pantry (Toronto)",
    source: "custom",
    per: "1 side portion (~200 g)",
    gramsPerServing: 200,
    macros: { calories: 320, protein: 4, carbs: 38, fat: 16, fiber: 4, sugar: 2, sodium: 350 },
    note: "Baby potatoes boiled, flattened and roasted in oil with herbs, estimated Sep 14 from a photo. The potatoes are about 155 kcal and the oil roughly doubles it, so call it 250–420. Sodium 200–550 mg. The aioli on top is its own entry.",
    tags: ["pantry", "potatoes", "smashed potatoes", "side", "catering", "toronto"],
  },
  {
    id: "pantry-garlic-aioli",
    name: "Garlic aioli",
    brand: "Pantry (Toronto)",
    source: "custom",
    per: "1 drizzle (~30 g)",
    gramsPerServing: 30,
    macros: { calories: 205, protein: 0.3, carbs: 1, fat: 22.5, fiber: 0, sugar: 0.5, sodium: 200 },
    note: "The aioli on the potatoes, separate because it varies a lot: mayo-based, about 680 kcal per 100 g. The photo on Sep 14 showed it poured with a bit of pooling, so about 30 g; a light drizzle would be 10 g and 70 kcal. Call it 70–250 kcal. Sodium 120–320 mg.",
    tags: ["pantry", "aioli", "garlic", "mayo", "sauce", "catering", "toronto"],
  },
  {
    id: "pantry-kale-caesar-chickpeas",
    name: "Kale Caesar salad",
    variant: "with roasted chickpeas",
    brand: "Pantry (Toronto)",
    source: "custom",
    per: "1 side portion (~165 g, dressed)",
    gramsPerServing: 165,
    macros: { calories: 325, protein: 11.5, carbs: 22.5, fat: 21, fiber: 8, sugar: 3, sodium: 595 },
    note: "Curly kale Caesar with roasted chickpeas and Parmesan, a different dish from the generic greens and chickpeas entry (kept for the Aug 4 plate). Built Sep 14 from a photo: ~90 g kale, ~35 g crunchy roasted chickpeas, ~28 g dressing, ~6 g Parmesan. The crunchy chickpeas are why it's 100 kcal more than the older entry. Call it 230–430 kcal and 400–850 mg sodium, mostly dressing and cheese.",
    tags: ["pantry", "salad", "kale", "caesar", "chickpeas", "side", "catering", "toronto"],
  },
];
