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
      sodium: 300,
    },
    note: "Grenade's published figures for the 60 g Oreo White bar (230 kcal, 20 g protein, 2 g sugars). Third-party databases list this anywhere from 210–250 kcal, so check your wrapper if you want it exact. Sodium is the softest figure here: Grenade's UK panel gives salt, not sodium, and the bars cluster around 0.7–0.8 g salt — divided by 2.5 that is 280–320 mg, so 300 mg is the middle of a converted range rather than a number read off a panel. Check the wrapper if sodium is what you are watching.",
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
      sodium: 200,
    },
    note: "2.8 oz Recover bar: 350 kcal and 20 g protein are consistent across sources. Carbs are listed as 43 g on nutrition databases and 49 g in some retail copy — 43 g is what actually reconciles with the 350 kcal total, so that is what's used here. Sodium is mid-range rather than a single panel reading; published figures for this bar sit around 180–230 mg.",
    tags: ["bar", "protein bar", "snack", "gatorade", "caramel", "recover"],
  },
  {
    id: "pkg-kirkland-chewy-protein-bar",
    name: "Kirkland Signature Protein Bar",
    variant: "chewy",
    brand: "Kirkland Signature",
    source: "packaged",
    per: "1 bar (60 g)",
    gramsPerServing: 60,
    macros: {
      calories: 190,
      protein: 21,
      carbs: 22,
      fat: 6,
      fiber: 15,
      sugar: 1,
      sodium: 210,
    },
    note: "LOW CONFIDENCE — these figures are the Kirkland Signature chewy bar's panel as recalled, not read off a wrapper, so check the box before trusting them; the calories and protein are the two most likely to be right and the sodium the least. TWO ASSUMPTIONS, both worth checking. First, the flavour: this is written for the chocolate-chip-cookie-dough class of bar, and the peanut-butter-and-chocolate-chunk version runs a couple of grams fatter for the same protein. Second, the 210 mg sodium is the middle of a ~180–250 mg band across the line rather than one reading. THIS ENTRY DELIBERATELY FAILS THE ATWATER CHECK and that is not a misread label: 21 x 4 + 22 x 4 + 6 x 9 is 226 against a stated 190, which is 19% out and well past the 10% the rest of the catalog holds to. The 15 g of fibre is why. These bars carry soluble corn fibre and IMO, which the manufacturer counts nearer 2 kcal/g than 4 — take the 15 g out of the carbs at 4 and put it back at 2 and the sum is 196 against 190, which lands. The Premier shake entry carries a milder version of the same caveat. Fibre is the single biggest figure in this entry and the one that makes the day's fibre total move, so it matters more here than the sodium does.",
    tags: ["bar", "protein bar", "snack", "kirkland", "costco", "chewy"],
  },
  {
    id: "pkg-on-whey-shake-2scoop",
    name: "Protein Shake",
    variant: "2 scoops ON Gold Standard vanilla, water",
    brand: "Optimum Nutrition",
    source: "packaged",
    per: "2 scoops (~61 g) in water",
    gramsPerServing: 61,
    macros: { calories: 240, protein: 48, carbs: 6, fat: 2, fiber: 1, sugar: 2, sodium: 260 },
    note: "Two scoops of ON Gold Standard 100% Whey, Vanilla Ice Cream (120 kcal / 24 g protein per scoop). Matches the Protein Berry Smoothie recipe's own line item. Sodium is 130 mg per scoop off ON's Vanilla Ice Cream panel, doubled; water contributes none. Other flavours in the range run 105–140 mg a scoop, so this moves a little if the tub changes.",
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
      sodium: 318,
    },
    note: "Sodium is the sibling entry's 260 mg plus half of this catalog's 115 mg/cup 2% milk row, derived the same way the other macros here are. The 2-scoop shake plus a ~1/2 cup (120 ml) splash of 2% milk (+61 kcal, +4 g protein, +6 g carbs, +2.4 g fat). Serving weight is 61 g of powder plus ~122 g of milk: the macro delta against the water version is exactly half a cup at this catalog's 244 g/cup, so the milk weight is derived rather than measured. Water isn't counted, same as the sibling entry. Use the water version and add milk separately if your splash varies.",
    tags: ["shake", "whey", "protein", "on", "optimum", "vanilla", "milk"],
  },
  {
    id: "pkg-premier-shake-cookies-cream",
    name: "Premier Protein Shake",
    variant: "Cookies & Cream",
    brand: "Premier Protein",
    source: "packaged",
    per: "1 bottle (11 fl oz / 325 ml)",
    gramsPerServing: 325,
    macros: {
      calories: 160,
      protein: 30,
      carbs: 5,
      fat: 3,
      sugar: 1,
      sodium: 200,
    },
    note: "Premier's published panel for the 11 fl oz ready-to-drink bottle: 160 kcal, 30 g protein, 5 g carbs, 3 g fat, 1 g sugar. Sodium sits around 200 mg and moves a little by flavour (the range across the line is roughly 180–220 mg). Atwater comes out at 167 against a stated 160, which is normal for a shake — the carb figure includes fibre and sugar alcohols that do not deliver a full 4 kcal/g.",
    tags: ["shake", "protein", "premier", "cookies and cream", "rtd", "drink"],
  },
  {
    id: "pkg-sbux-sf-vanilla-protein-latte-venti",
    name: "Iced Sugar-Free Vanilla Protein Latte",
    variant: "Venti, less ice",
    brand: "Starbucks",
    source: "packaged",
    per: "1 venti (24 fl oz), less ice",
    macros: {
      calories: 294,
      protein: 42,
      carbs: 17.9,
      fat: 6.3,
      fiber: 0,
      sugar: 13.7,
      sodium: 294,
    },
    note: "The standing order is less ice, so since August 10, 2026 this entry is Starbucks' published venti panel scaled by 1.05 — the owner's estimate that less ice leaves room for about 5% more drink. The multiplier is a calibration, not a reading; what Starbucks publishes is the regular-ice venti at 280 kcal / 40 g protein / 17 g carbs / 6 g fat / 13 g sugar, and dividing by 1.05 gets back to it. Everything the un-scaled entry carried still applies. Sodium is NOT from Starbucks — it is built from a ~10 fl oz 2% milk plus ~30 g whey reconstruction (~144 mg from the milk, ~130 mg from the whey, then the same ×1.05), so it inherits every doubt that reconstruction carries and should be read as ±85 mg. LOWEST-CONFIDENCE ENTRY IN THE CATALOG — check it against the current Starbucks panel before trusting it. Of the published figures only the calories, protein, fat and sugar are Starbucks'; the 17 g carbs is back-calculated from those, so this entry passing an Atwater check is arithmetic, not corroboration. Two independent sanity checks it does survive: the stated sugar bounds carbs from below, and building the drink from roughly 10 fl oz of 2% milk plus ~30 g of whey lands near the published 280 / 40 / 17 / 6. Against that, 40 g protein is at the top of the range published for this drink, and at 42 g scaled it is the largest single protein item in the catalog — it alone is a quarter of a day's target, so an error here moves a whole day. A grande with regular ice is roughly three-quarters of the un-scaled venti.",
    tags: ["starbucks", "latte", "coffee", "protein", "vanilla", "iced", "drink"],
  },
  {
    id: "pkg-ritz-bits-cheese-pack",
    name: "Ritz Bits",
    variant: "Cheese",
    brand: "Nabisco",
    source: "packaged",
    per: "1 pack (1 oz / 28 g)",
    gramsPerServing: 28,
    macros: {
      calories: 150,
      protein: 2.8,
      carbs: 15,
      fat: 8.4,
      fiber: 0.5,
      sugar: 2,
      sodium: 225,
    },
    note: "Scaled from the box panel's 30 g (1/2 cup) serving — 160 kcal, 3 g protein, 16 g carbs, 9 g fat, 240 mg sodium — down to the 28 g single-serve pack, so every figure here is the panel times 0.93 rather than a reading off the snack-pack wrapper itself. That scaling is the entry's main caveat: the two sizes are the same cracker, but single-serve packs sometimes carry their own rounded panel. Fibre and sugar are the softest numbers, both below the 1 g the panel rounds to, and published figures for a 1 oz pack range 120–250 mg on sodium depending on the source — 225 mg comes from the box panel, which is the only one of those tied to a stated serving weight. THE VARIETY IS AN ASSUMPTION: logged as the cheese-filled sandwich version, the common single-serve pack. Plain Ritz Bits minis (no filling) land within ~10 kcal and ~15 mg sodium of this but split differently, nearer 18 g carbs and 7 g fat.",
    tags: ["cracker", "ritz", "cheese", "snack", "nabisco", "bits"],
  },
  {
    id: "pkg-maggi-masala-70g",
    name: "Maggi 2-Minute Noodles",
    variant: "Masala",
    brand: "Maggi",
    source: "packaged",
    per: "1 pack (70 g, noodle cake + tastemaker)",
    gramsPerServing: 70,
    macros: {
      calories: 310,
      protein: 6,
      carbs: 43,
      fat: 13,
      fiber: 2,
      sugar: 3,
      sodium: 890,
    },
    note: "The whole 70 g pack as sold — noodle cake plus the tastemaker sachet — prepared with water and nothing else. Calories, protein, carbs and fat agree across the export-pack panel and its per-100 g figure (443 kcal/100 g x 0.70 = 310), and Atwater lands at 313, so the macros are solid. Sodium was 970 mg from the export-pack panel until August 9, 2026, when the pack actually in the cupboard was read and put two packs at ~1,780 mg — so 890 a pack, which is what this now carries. That the 1,780 was two packs and not one was confirmed the same day, so 890 a pack is settled rather than inferred from an ambiguous total. It is also the only line here traceable to the box on hand rather than a database — the macros are still the export-pack figure and would be worth replacing off the same panel next time it is open. Regional variants (Masala vs Chicken vs Curry) move sodium more than they move calories. Sugar is the tastemaker's, ~3 g, and is the least corroborated line.",
    tags: ["noodles", "instant noodles", "maggi", "masala", "ramen", "quick"],
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
 * - Sodium is carried wherever the as-eaten figure is knowable, which since
 *   August 8, 2026 includes the near-zero entries it used to omit. The old rule
 *   filled it in only where it was "material and reasonably stable" and left
 *   rice, oats, eggs, almonds, fruit and oil blank as near-zero. That was right
 *   about the magnitudes and wrong about the cost: a blank does not read as
 *   "about 2 mg", it reads as "not recorded", so one uncounted apple made a
 *   whole day's total a floor of unknown depth rather than a number. Fruit eaten
 *   raw is now carried at its USDA value.
 *
 *   What stays blank is narrower and is a real caveat, not a rounding one:
 *   rice, oats, eggs, almonds and olive oil are bought near-zero but reach the
 *   plate cooked, salted, roasted or brined, and that step routinely adds
 *   hundreds of milligrams. There the as-bought figure would be a floor
 *   masquerading as a total, which is the failure this column is trying to
 *   avoid. Log the salt with the dish instead. Every entry that carries sodium
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
    macros: { calories: 120, protein: 24, carbs: 3, fat: 1, sodium: 130 },
    note: "ON Gold Standard 100% Whey, Vanilla Ice Cream: 120 kcal / 24 g protein / 130 mg sodium per 30.5 g scoop, all off the same panel. Other flavours run 105–140 mg.",
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
    macros: { calories: 95, protein: 0.5, carbs: 25, fat: 0.3, fiber: 4.4, sugar: 19, sodium: 2 },
    note: "USDA raw apple with skin, 1 mg/100 g, so ~2 mg at 182 g. Carried despite being trivial: eaten raw there is no cooking salt to swamp it, so the figure is complete rather than a floor.",
    tags: ["apple", "fruit", "snack"],
  },
  {
    id: "staple-banana",
    name: "Banana",
    source: "staple",
    per: "1 medium (118 g)",
    gramsPerServing: 118,
    macros: { calories: 105, protein: 1.3, carbs: 27, fat: 0.4, fiber: 3, sodium: 1 },
    note: "USDA raw banana, 1 mg/100 g, so ~1 mg at 118 g. Carried for the same reason as the apple: raw and unsalted, so this is the whole figure, not a floor.",
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
