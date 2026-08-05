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
npm run dev   # http://localhost:3000
```

No API keys, no `.env.local`, no accounts. The app is a static site: everything
it needs it either ships with or fetches from a free public API in the browser.

---

## What's in the catalog out of the box

| Group | Count | Notes |
|---|---|---|
| Recipes | 34 entries | The 23 recipe files, plus a separate entry for each serving-suggestion column in their nutrition tables — "Chicken Curry, curry only" vs "with 1 cup rice", "Niku Udon +1 egg" vs "+2 eggs", and so on |
| Packaged | 5 | Grenade Oreo White, Gatorade Recover Chocolate Caramel, the ON Gold Standard shake (with and without a splash of 2% milk), Starbucks venti iced sugar-free vanilla protein latte |
| Pantry (Toronto) | 4 | The catered plate broken into scoops so a future visit can be logged component by component |
| Staples | 16 | Rice, eggs, milk, skyr, oats, chicken breast, tuna, peanut butter, oil — the things you top a recipe up with or close a gap with |

Every food carries its **provenance** as a badge (`recipe`, `label`, `OFF`,
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

The add dialog tries two things, cheapest first:

1. **Your catalog** — instant, offline, fuzzy. Type `potstick`, `gren`, or a
   barcode.
2. **Food database** — [Open Food Facts](https://world.openfoodfacts.org/),
   queried straight from the browser. Free, no account, no key. Pure-digit
   queries of 8–14 characters go to the barcode endpoint; everything else is a
   text search. Best for branded, packaged goods.

Anything from 2 can be saved into your own catalog with **Save & add**, so the
second time is instant. There's also **Enter by hand** when you already know the
numbers.

### For anything without a label

Restaurant dishes, home cooking, regional products — ask **Claude Code** to work
out the macros and write the entry. It reads and writes the same private gist
this app syncs with, so the food shows up in the log next time the app syncs.

That used to be an "Ask Claude" button inside the app, backed by a server route
holding an Anthropic key. A static site has no server to hold a key, and the
route was unauthenticated — on a public URL anyone who found it could spend the
key's credits. Moving the work to Claude Code removes both problems and gets a
better answer, since Claude Code can look at the whole log while it decides.

### Environment variables

None. There is no server, so there is nowhere to keep a secret — anything in
`.env` would be compiled into the bundle and readable by anyone. `ANTHROPIC_API_KEY`
and `USDA_API_KEY` are both gone: the first with the "Ask Claude" route, the
second with USDA search, which was dropped rather than shipped with a
world-readable key. Open Food Facts needs no key, which is why it survived the
move to the client.

The one credential the app does use — a GitHub token for gist sync — is pasted
per device and kept in that browser's `localStorage`. It never enters the repo
or the bundle.

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

It builds to a folder of static files — no Node process runs in production —
so any file host will serve it. It ships configured for **GitHub Pages**.

```bash
npm run build   # writes ./out
```

`.github/workflows/deploy.yml` does this on every push to the default branch:
build, drop a `.nojekyll` marker in `out/` (Pages otherwise runs Jekyll, which
strips any path starting with an underscore — i.e. all of `_next/`), upload it
as a Pages artifact and deploy. Enable it once under **Settings → Pages →
Source → GitHub Actions**.

Two settings in `next.config.ts` make that work:

| Setting | Why |
|---|---|
| `output: "export"` | Pre-renders every route to HTML. Required — a static host cannot run route handlers or server components on demand. |
| `basePath: "/Health"` | Pages serves a *project* site from `https://<user>.github.io/Health`, not from the domain root. Without it every asset URL resolves one level too high and the page loads blank. It must match the repository name — rename the repo and this changes with it. |

To serve from somewhere else (a root domain, Netlify, S3), drop `basePath` and
publish `out/`.

Note that `localStorage` is per-browser: deploying doesn't give you sync on its
own — gist sync does — it just means you don't need a laptop running to open it
on your phone.

---

## Project layout

```
src/
├─ app/
│  ├─ page.tsx              Dashboard — rings, KPIs, gap closers, the log, trends
│  ├─ history/page.tsx      Trends, daily table, export, goals & backup
│  └─ foods/page.tsx        Catalog browser, favourites, delete
├─ components/              Meters, TrendChart, AddFoodModal, MealList, …
├─ data/                    recipes.ts, staples.ts, pantry.ts, seed.ts
└─ lib/                     types, store (localStorage), nutrition math, search,
                            offSearch (Open Food Facts, client-side), sync, export
```

There is no `app/api/`. There cannot be: a static export has no server to run
route handlers on, and Next refuses to build one that contains them.

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
