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
  {
    id: "aloette-go-burger",
    name: "Go Burger",
    brand: "Aloette",
    source: "claude",
    per: "1 burger",
    macros: {
      calories: 850,
      protein: 43,
      carbs: 41,
      fat: 57,
      fiber: 2,
      sugar: 7,
      sodium: 1700,
    },
    note: "Estimated from the burger's construction, not a published panel — Aloette publishes no nutrition. Built as a double patty (~120 g cooked 80/20 chuck), two slices of cheese, a mayo-based special sauce (~35 g), pickles and lettuce on a soft potato-style bun. Fat is what drives this and it comes from three places at once: patties ~25 g, cheese ~11 g, sauce ~17 g, so the 57 g total is not one indulgent component but the whole build. Calorie band is 750-1,000; a smash-style patty pair at the light end and a thicker griddled pair at the heavy. Sodium is wider still at 1,200-2,300 mg because the sauce and the cheese are both unmeasurable from the outside — treat 1,700 as the middle of a range, not a reading. For reference, a Shake Shack Double ShackBurger, which does publish, is 770 kcal / 1,120 mg; this is estimated a little richer because the sauce is more generous.",
    tags: ["burger", "beef", "cheeseburger", "aloette", "restaurant", "takeout", "lunch", "toronto"],
  },
  {
    id: "aloette-go-fries",
    name: "Fries",
    brand: "Aloette",
    source: "claude",
    per: "100 g",
    gramsPerServing: 100,
    macros: {
      calories: 315,
      protein: 4,
      carbs: 40,
      fat: 15.5,
      fiber: 4,
      sugar: 0.5,
      sodium: 480,
    },
    note: "Estimated for restaurant deep-fried potato at a typical oil uptake, held per 100 g rather than per portion so a handful and a full side both log honestly against the same entry — a served side is roughly 150 g. Calorie band is 280-360 per 100 g and it tracks cut thickness: thinner fries carry more oil per gram, not less. Sodium is the least certain figure here at 300-700 mg per 100 g, because fries are salted by hand at the pass and no two orders match.",
    tags: ["fries", "potato", "side", "aloette", "restaurant", "takeout", "toronto"],
  },
  {
    id: "aloette-go-cookie",
    name: "Cookie",
    brand: "Aloette",
    source: "claude",
    per: "1 cookie (~75 g)",
    gramsPerServing: 75,
    macros: {
      calories: 350,
      protein: 4,
      carbs: 45,
      fat: 18,
      fiber: 2,
      sugar: 28,
      sodium: 240,
    },
    note: "Estimated as a bakery-style chocolate chip cookie of about 75 g, which is the assumption doing most of the work — the band is 250-450 kcal and it is almost entirely a question of size, since cookies of this style are fairly consistent per gram at ~4.7 kcal/g. If the cookie was closer to a supermarket size (~50 g) this is 100 kcal high; if it was one of the large single-serve bakery discs (~100 g) it is 100 kcal low. Sodium ~240 mg is ordinary for the type and is the least consequential number in the row.",
    tags: ["cookie", "dessert", "chocolate chip", "aloette", "restaurant", "takeout", "toronto"],
  },
];
