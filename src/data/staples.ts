import type { Food } from "@/lib/types";

/**
 * Packaged products the user eats regularly. Figures are off manufacturer
 * labels where those were reachable; each `note` says where the number came
 * from and how confident it is. Labels get reformulated — if a wrapper
 * disagrees with what's here, the wrapper wins. Edit the entry (or override it
 * once from the log) rather than living with a stale number.
 */
export const PACKAGED_FOODS: Food[] = [
  {
    id: "pkg-grenade-oreo-white",
    name: "Grenade Protein Bar",
    variant: "Oreo White",
    brand: "Grenade",
    source: "packaged",
    per: "1 bar (60 g)",
    gramsPerServing: 60,
    macros: {
      calories: 230,
      protein: 20,
      carbs: 21,
      fat: 9,
      fiber: 5,
      sugar: 2,
    },
    note: "Grenade's published figures for the 60 g Oreo White bar (230 kcal, 20 g protein, 2 g sugars). Third-party databases list this anywhere from 210–250 kcal, so check your wrapper if you want it exact.",
    tags: ["bar", "protein bar", "snack", "grenade", "oreo"],
  },
  {
    id: "pkg-gatorade-caramel-bar",
    name: "Gatorade Recover Whey Protein Bar",
    variant: "Chocolate Caramel",
    brand: "Gatorade",
    source: "packaged",
    per: "1 bar (2.8 oz / 80 g)",
    gramsPerServing: 80,
    macros: {
      calories: 350,
      protein: 20,
      carbs: 43,
      fat: 11,
      fiber: 1,
      sugar: 29,
    },
    note: "2.8 oz Recover bar: 350 kcal and 20 g protein are consistent across sources. Carbs are listed as 43 g on nutrition databases and 49 g in some retail copy — 43 g is what actually reconciles with the 350 kcal total, so that is what's used here.",
    tags: ["bar", "protein bar", "snack", "gatorade", "caramel", "recover"],
  },
  {
    id: "pkg-on-whey-shake-2scoop",
    name: "Protein Shake",
    variant: "2 scoops ON Gold Standard vanilla, water",
    brand: "Optimum Nutrition",
    source: "packaged",
    per: "2 scoops (~61 g) in water",
    gramsPerServing: 61,
    macros: { calories: 240, protein: 48, carbs: 6, fat: 2, fiber: 1, sugar: 2 },
    note: "Two scoops of ON Gold Standard 100% Whey, Vanilla Ice Cream (120 kcal / 24 g protein per scoop). Matches the Protein Berry Smoothie recipe's own line item.",
    tags: ["shake", "whey", "protein", "on", "optimum", "vanilla"],
  },
  {
    id: "pkg-on-whey-shake-2scoop-milk",
    name: "Protein Shake",
    variant: "2 scoops ON vanilla + splash of 2% milk",
    brand: "Optimum Nutrition",
    source: "packaged",
    per: "2 scoops (~61 g) + ~1/2 cup 2% milk",
    gramsPerServing: 183,
    macros: {
      calories: 301,
      protein: 52,
      carbs: 12,
      fat: 4.5,
      fiber: 1,
      sugar: 8,
    },
    note: "The 2-scoop shake plus a ~1/2 cup (120 ml) splash of 2% milk (+61 kcal, +4 g protein, +6 g carbs, +2.4 g fat). Serving weight is 61 g of powder plus ~122 g of milk: the macro delta against the water version is exactly half a cup at this catalog's 244 g/cup, so the milk weight is derived rather than measured. Water isn't counted, same as the sibling entry. Use the water version and add milk separately if your splash varies.",
    tags: ["shake", "whey", "protein", "on", "optimum", "vanilla", "milk"],
  },
  {
    id: "pkg-sbux-sf-vanilla-protein-latte-venti",
    name: "Iced Sugar-Free Vanilla Protein Latte",
    variant: "Venti",
    brand: "Starbucks",
    source: "packaged",
    per: "1 venti (24 fl oz)",
    macros: {
      calories: 280,
      protein: 40,
      carbs: 17,
      fat: 6,
      fiber: 0,
      sugar: 13,
    },
    note: "LOWEST-CONFIDENCE ENTRY IN THE CATALOG — check it against the current Starbucks panel before trusting it. Only the 280 kcal, 40 g protein, 6 g fat and 13 g sugar are taken from Starbucks; the 17 g carbs is back-calculated from those, so this entry passing an Atwater check is arithmetic, not corroboration. Two independent sanity checks it does survive: the stated 13 g sugar bounds carbs from below, and building the drink from roughly 10 fl oz of 2% milk plus ~30 g of whey lands near 280 / 40 / 17 / 6. Against that, 40 g protein is at the top of the range published for this drink, and it is the largest single protein item in the catalog — it alone is a quarter of a day's target, so an error here moves a whole day. Left as published rather than adjusted on a guess. A grande is roughly three-quarters of this.",
    tags: ["starbucks", "latte", "coffee", "protein", "vanilla", "iced", "drink"],
  },
];

/**
 * Single ingredients and portion units. These exist so you can build a meal
 * that isn't a recipe, top up a recipe serving (an extra cup of rice, another
 * egg), or close a protein gap late in the day without a web lookup.
 * Figures are USDA-typical values for the stated portion.
 *
 * On the fibre and sodium columns, since both are exported and a blank cell
 * looks like an oversight:
 *
 * - Fibre is carried on every staple that has any. The entries without it —
 *   egg, whey, milk, skyr, Greek yogurt, cottage cheese, chicken, tuna, olive
 *   oil — are fibre-free foods, so blank there is the correct answer, not a
 *   gap waiting to be filled.
 * - Sodium is filled in only where it is both material and reasonably stable
 *   across products. Plain rice, oats, eggs, raw almonds, fresh fruit and
 *   olive oil are left blank because they are near-zero as bought; salting,
 *   roasting or brining them swamps the base figure by an order of magnitude
 *   and no single number would be honest. Every entry that does carry sodium
 *   names its source in its own note.
 */
export const STAPLE_FOODS: Food[] = [
  {
    id: "staple-rice-cooked-cup",
    name: "White rice, cooked",
    source: "staple",
    per: "1 cup (~158 g)",
    gramsPerServing: 158,
    macros: { calories: 205, protein: 4.3, carbs: 44.5, fat: 0.4, fiber: 0.6 },
    tags: ["rice", "carb", "side"],
  },
  {
    id: "staple-egg-large",
    name: "Egg, large",
    source: "staple",
    per: "1 large egg (50 g)",
    gramsPerServing: 50,
    macros: { calories: 72, protein: 6.3, carbs: 0.4, fat: 4.8 },
    tags: ["egg", "protein", "breakfast"],
  },
  {
    id: "staple-on-whey-scoop",
    name: "ON Gold Standard Whey, vanilla",
    brand: "Optimum Nutrition",
    source: "staple",
    per: "1 scoop (~30.5 g)",
    gramsPerServing: 30.5,
    macros: { calories: 120, protein: 24, carbs: 3, fat: 1 },
    tags: ["whey", "protein", "powder", "scoop"],
  },
  {
    id: "staple-milk-2pct-cup",
    name: "Milk, 2%",
    source: "staple",
    per: "1 cup (244 g)",
    gramsPerServing: 244,
    macros: { calories: 122, protein: 8, carbs: 12, fat: 4.8, sugar: 12, sodium: 115 },
    note: "USDA reduced-fat (2%) milk with added vitamin A and D, 1 cup. The 115 mg sodium is the same row the macros come from (47 mg/100 g at 244 g) and is consistent across brands.",
    tags: ["milk", "dairy", "drink"],
  },
  {
    id: "staple-skyr-siggis",
    name: "Siggi's 0% plain skyr",
    brand: "Siggi's",
    source: "staple",
    per: "3/4 cup (~180 g)",
    gramsPerServing: 180,
    macros: { calories: 113, protein: 20, carbs: 7, fat: 0, sodium: 65 },
    note: "Macros are Siggi's 0% plain scaled from the 150 g cup to a 3/4-cup (180 g) portion. The sodium is NOT off the tub — it is USDA's strained nonfat yogurt row (36 mg/100 g) at 180 g. Plain skyr panels cluster in the 55–75 mg range at this size, so treat 65 mg as an estimate rather than a label reading.",
    tags: ["yogurt", "skyr", "protein", "dairy"],
  },
  {
    id: "staple-greek-yogurt-0",
    name: "Greek yogurt, 0% plain",
    source: "staple",
    per: "1 container (170 g)",
    gramsPerServing: 170,
    macros: { calories: 100, protein: 17, carbs: 6, fat: 0.7, sodium: 61 },
    note: "USDA 'Yogurt, Greek, plain, nonfat' at 170 g — the macros and the 61 mg sodium are the same row (36 mg/100 g). Flavoured tubs are a different food entirely; look those up.",
    tags: ["yogurt", "greek", "protein", "dairy"],
  },
  {
    id: "staple-cottage-cheese",
    name: "Cottage cheese, low fat",
    source: "staple",
    per: "1 cup (226 g)",
    gramsPerServing: 226,
    macros: { calories: 163, protein: 28, carbs: 6.2, fat: 2.3, sodium: 918 },
    note: "USDA 'Cheese, cottage, lowfat, 1% milkfat', 1 cup (226 g): the 163 kcal / 28 g protein / 6.2 g carbs / 2.3 g fat already here and the 918 mg sodium all come off that one row. This is the largest sodium item in the catalog and brands differ a lot — Breakstone's 1% works out around 880 mg a cup, Friendship around 720 — so read your tub if sodium is what you are watching. No-salt-added versions are under 100 mg with the same macros.",
    tags: ["cottage cheese", "protein", "dairy"],
  },
  {
    id: "staple-chicken-breast-100g",
    name: "Chicken breast, cooked",
    source: "staple",
    per: "100 g",
    gramsPerServing: 100,
    macros: { calories: 165, protein: 31, carbs: 0, fat: 3.6, sodium: 74 },
    note: "USDA 'chicken breast, meat only, cooked, roasted', 100 g — the 165/31/3.6 line everyone quotes, and the 74 mg sodium is that same row. That figure is plain unseasoned meat: brined, marinated or salted-in-the-pan chicken runs several times higher, and pre-brined supermarket breasts can pass 300 mg. The calories and protein hold either way.",
    tags: ["chicken", "protein", "meat"],
  },
  {
    id: "staple-tuna-can",
    name: "Tuna, canned in water, drained",
    source: "staple",
    per: "1 can (5 oz / ~110 g drained)",
    gramsPerServing: 110,
    macros: { calories: 120, protein: 26, carbs: 0, fat: 1, sodium: 300 },
    note: "Macros are label-typical for a drained 5 oz can of light tuna in water. Sodium is an estimate at the middle of the range rather than one brand's panel: USDA's canned-light-in-water row is 247 mg/100 g (~270 mg here) and US brand panels (StarKist, Bumble Bee) work out at 300–360 mg a can. Low-sodium packs are roughly half; tuna in oil is a different entry.",
    tags: ["tuna", "fish", "protein"],
  },
  {
    id: "staple-oats-dry",
    name: "Rolled oats, dry",
    source: "staple",
    per: "1/2 cup (40 g)",
    gramsPerServing: 40,
    macros: { calories: 150, protein: 5, carbs: 27, fat: 3, fiber: 4 },
    tags: ["oats", "oatmeal", "breakfast", "carb"],
  },
  {
    id: "staple-bread-slice",
    name: "Bread, sandwich slice",
    source: "staple",
    per: "1 slice (~28 g)",
    gramsPerServing: 28,
    macros: { calories: 80, protein: 3, carbs: 15, fat: 1, fiber: 1, sodium: 135 },
    note: "Serving weight corrected from 43 g to 28 g. 80 kcal in 43 g is 1.9 kcal/g, which no sandwich bread reaches, and 15 g of carbs in 43 g is 35% carb by weight against bread's typical ~50%. The macros were the sound half: 3 g protein / 15 g carbs / 1 g fat is a standard soft-sandwich slice (Sara Lee-class, 28 g / 80 kcal — 2.9 kcal/g, 54% carb by weight), so the gram figure was the wrong number, not the panel. Thick-cut loaves (Oroweat 43 g, Dave's Killer 45 g) are ~110 kcal a slice — log 1.4 servings or edit this entry. Sodium is USDA commercially-prepared white bread (477 mg/100 g) at 28 g; supermarket panels for a slice this size run 130–170 mg.",
    tags: ["bread", "toast", "carb"],
  },
  {
    id: "staple-peanut-butter",
    name: "Peanut butter",
    source: "staple",
    per: "2 tbsp (32 g)",
    gramsPerServing: 32,
    macros: { calories: 190, protein: 7, carbs: 8, fat: 16, fiber: 2, sodium: 150 },
    note: "Label-typical salted smooth peanut butter (Jif/Skippy: 190 kcal, 7 g protein, 8 g carbs, 16 g fat per 2 tbsp). Sodium of 150 mg is where those panels sit and matches USDA's salted-smooth row (476 mg/100 g = 152 mg at 32 g). Natural unsalted has the same macros with roughly 5 mg sodium — clear the field if that's what's in your jar.",
    tags: ["peanut butter", "fat", "spread"],
  },
  {
    id: "staple-almonds",
    name: "Almonds",
    source: "staple",
    per: "1 oz (28 g, ~23 nuts)",
    gramsPerServing: 28,
    macros: { calories: 164, protein: 6, carbs: 6, fat: 14, fiber: 3.5 },
    tags: ["almonds", "nuts", "snack", "fat"],
  },
  {
    id: "staple-apple",
    name: "Apple",
    source: "staple",
    per: "1 medium (182 g)",
    gramsPerServing: 182,
    macros: { calories: 95, protein: 0.5, carbs: 25, fat: 0.3, fiber: 4.4, sugar: 19 },
    tags: ["apple", "fruit", "snack"],
  },
  {
    id: "staple-banana",
    name: "Banana",
    source: "staple",
    per: "1 medium (118 g)",
    gramsPerServing: 118,
    macros: { calories: 105, protein: 1.3, carbs: 27, fat: 0.4, fiber: 3 },
    tags: ["banana", "fruit", "snack"],
  },
  {
    id: "staple-olive-oil",
    name: "Olive oil",
    source: "staple",
    per: "1 tbsp (13.5 g)",
    gramsPerServing: 13.5,
    macros: { calories: 119, protein: 0, carbs: 0, fat: 13.5 },
    tags: ["oil", "olive", "fat", "cooking"],
  },
];
