# Nutrition Calculator

A daily calorie and protein tracker built around one specific set of goals —
**2,800 kcal** and **160–180 g protein** — and one specific set of food: the 23
recipes in [soldoutbudokan/Templates](https://github.com/soldoutbudokan/Templates/tree/master/Recipes),
the bars and shakes that show up most days, and whatever else you eat that
needs looking up.

Everything lives in your browser. No account, no server-side database, nothing
uploaded anywhere.

```bash
npm install
cp .env.example .env.local   # optional keys — see below
npm run dev                  # http://localhost:3000
```

---

## What's in the catalog out of the box

| Group | Count | Notes |
|---|---|---|
| Recipes | 34 entries | The 23 recipe files, plus a separate entry for each serving-suggestion column in their nutrition tables — "Chicken Curry, curry only" vs "with 1 cup rice", "Niku Udon +1 egg" vs "+2 eggs", and so on |
| Packaged | 5 | Grenade Oreo White, Gatorade Recover Chocolate Caramel, the ON Gold Standard shake (with and without a splash of 2% milk), Starbucks venti iced sugar-free vanilla protein latte |
| Pantry (Toronto) | 4 | The catered plate broken into scoops so a future visit can be logged component by component |
| Staples | 16 | Rice, eggs, milk, skyr, oats, chicken breast, tuna, peanut butter, oil — the things you top a recipe up with or close a gap with |

Every food carries its **provenance** as a badge (`recipe`, `label`, `USDA`,
`Claude`, `yours`) and a note saying where the number came from. A recipe
estimate and a manufacturer's panel deserve different levels of trust, and this
is how that survives into the log.

### About the numbers

The recipe figures are transcribed from the nutrition tables in the recipe
files, which are themselves estimates. The packaged figures are off
manufacturers' published panels where those were reachable — the two that
needed a judgement call are documented in the food's own note:

- **Grenade Oreo White** — Grenade publishes 230 kcal / 20 g protein / 2 g
  sugar for the 60 g bar. Third-party databases list anything from 210–250 kcal.
- **Gatorade Recover Chocolate Caramel** — 350 kcal and 20 g protein are
  consistent everywhere. Carbs are listed as 43 g on nutrition databases and
  49 g in some retail copy; 43 g is what reconciles with the 350 kcal total, so
  that's what's used.

If a wrapper disagrees with the app, the wrapper wins. Edit the food on the
Foods page.

---

## Adding food that isn't in the catalog

The add dialog tries three things, cheapest first:

1. **Your catalog** — instant, offline, fuzzy. Type `potstick`, `gren`, or a
   barcode.
2. **Food databases** — [USDA FoodData Central](https://fdc.nal.usda.gov/) and
   [Open Food Facts](https://world.openfoodfacts.org/) in parallel. Free, no
   account needed. Pure-digit queries go straight to Open Food Facts' barcode
   endpoint.
3. **Ask Claude** — for restaurant dishes, regional products, and anything with
   no label. Claude searches the web, reads the panel, and returns structured
   macros with a confidence level (`from label` / `from database` / `estimated`)
   and its sources.

Anything from 2 or 3 can be saved into your own catalog with **Save & add**, so
the second time is instant.

There's also **Enter by hand** when you already know the numbers.

### Environment variables

Both are optional; the app works without either.

| Variable | What it unlocks | Without it |
|---|---|---|
| `ANTHROPIC_API_KEY` | The "Ask Claude" lookup | The button returns a clear "not configured" message |
| `USDA_API_KEY` | USDA search at normal rate limits ([free key](https://fdc.nal.usda.gov/api-key-signup)) | Falls back to the shared `DEMO_KEY`, ~30 requests/hour before it starts failing |

Open Food Facts needs no key.

---

## Sticking to the goals

The parts that exist because a total at the end of the day is too late to act on:

- **Protein pace** — splits the protein you still need across the meals you have
  left. "45 g per meal across 2 more" is a decision; "90 g short" is a report.
- **Closing the gap** — at any point with protein outstanding, ranks foods from
  your own catalog by how much of the gap they close per calorie, and penalises
  anything that would blow the remaining calorie budget. One tap to log.
- **Protein as a band, not a line** — 160–180 g is drawn as an arc on the ring,
  so you can see "in the band" as distinct from "over the top of it".
- **Streak + rolling averages** — a single bad day matters much less than the
  7-day average, so both are on the dashboard.
- **Averages divide by logged days, not calendar days.** A day you never logged
  is missing data, not a zero-calorie day. Averaging it as zero would report one
  logged day of 2,700 kcal as a "386 kcal average".
- **Copy yesterday** — one button, for the days you eat the same thing.
- **Quick add** — star anything on the Foods page and it becomes a one-tap chip.
- **Undo** — removing an entry is always undoable for 8 seconds.

---

## Export

| Format | Use it for |
|---|---|
| CSV — every item | One row per logged food. Cronometer, MyFitnessPal, LoseIt importers. |
| CSV — daily totals | One row per day. The shape most trackers and spreadsheets want. |
| Markdown | A readable log with per-day tables. Drops into notes or a repo. |
| Apple Health XML | Apple's HealthKit export schema, with dietary energy, protein, carbs, fat, fibre and sodium records. |
| JSON | Full backup — log, goals, your own foods. Restore on another device. |

**On Apple Health and Health Connect, honestly:** neither accepts a file
directly. iOS Health has no import button, and Health Connect only takes data
from apps that write to it. The XML uses Apple's real
`HKQuantityTypeIdentifierDietary*` schema so third-party importers (Health Auto
Export, HealthFit, Simple Health Export) can read it; for Android, the
daily-totals CSV is the practical path. Google Fit's own API was retired in
favour of Health Connect.

---

## Where the data lives

`localStorage`, under `nutrition-calculator:v1`. That means:

- It survives refreshes and restarts, and syncs across tabs.
- It does **not** sync across devices or browsers, and clearing site data
  deletes it.

So: **export a JSON backup before switching devices**, from History → Goals &
data. Restoring is a file picker on the same panel.

Day one is pre-loaded on first run so the dashboard opens with real numbers.
Those are ordinary entries — edit, move, or delete them like anything else.
Once you clear the log, it stays cleared.

---

## Deploying

It's a standard Next.js app, so Vercel works with no configuration:

```bash
npx vercel
```

Add `ANTHROPIC_API_KEY` and `USDA_API_KEY` as environment variables in the
project settings. The two API routes run server-side, so neither key is ever
exposed to the browser.

Note that `localStorage` is per-browser: deploying doesn't give you sync, it
just means you don't need a laptop running to open it on your phone.

---

## Project layout

```
src/
├─ app/
│  ├─ page.tsx              Dashboard — rings, KPIs, gap closers, the log, trends
│  ├─ history/page.tsx      Trends, daily table, export, goals & backup
│  ├─ foods/page.tsx        Catalog browser, favourites, delete
│  └─ api/
│     ├─ search/route.ts    USDA + Open Food Facts proxy
│     └─ ai-lookup/route.ts Claude web search → structured macros
├─ components/              Meters, TrendChart, AddFoodModal, MealList, …
├─ data/                    recipes.ts, staples.ts, pantry.ts, seed.ts
└─ lib/                     types, store (localStorage), nutrition math, search, export
```

### Charts

Two things worth knowing if you extend them:

- **Calories and protein are separate charts, never one chart with two
  y-axes.** Different scales; a dual axis lets you draw any relationship you
  like between them.
- **Bars, not a line.** The days are discrete and some are missing — a line
  would interpolate straight through a day you didn't log and imply you ate
  something you didn't.

The macro palette is the validated categorical slots 1–3 (blue / orange /
aqua), which clear colour-vision-deficiency separation in both light and dark.
Light-mode aqua sits below 3:1 contrast on the light surface, so every fat
segment ships with a visible text label rather than relying on colour alone.
