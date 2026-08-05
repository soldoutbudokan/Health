# Nutrition Calculator

A daily calorie and protein tracker built around one specific set of goals —
**2,800 kcal** and **160–180 g protein** — and one specific set of food: the 23
recipes in [soldoutbudokan/Templates](https://github.com/soldoutbudokan/Templates/tree/master/Recipes),
the bars and shakes that show up most days, and whatever else gets eaten.

**The site is read-only.** There is no add button, no browser storage, and no
way to save anything from the page. `data/log.csv` in this repo is the log;
Claude Code edits it, commits, and GitHub Pages rebuilds.

```bash
npm install
npm run dev    # http://localhost:3000
npm run build  # writes ./out
```

---

## How a meal gets onto the site

```
you tell Claude Code what you ate
  → it appends rows to data/log.csv
  → commit, push
  → GitHub Actions rebuilds and publishes
  → the site shows it
```

That is the entire write path, and it is the only one. The trade is that the
site is a snapshot of the last commit rather than of live state — which is why
every relative date on it ("Today", the 7-day averages, the protein pace) is
relative to the moment the build ran, not to when you happen to be looking.

### Why not just let the browser write?

It used to. That app kept everything in `localStorage`, which meant the log
lived in one browser on one device and vanished with the site data. Syncing it
through a private gist fixed the device problem and introduced a worse one: two
copies of the truth, so merges, tombstones for deletes, conflict rules, and a
token pasted into every browser. One file with one writer removes all of it.

Claude Code was already the thing doing the hard entries — a restaurant plate,
an unlabelled product, a day reconstructed after the fact. Making it the *only*
writer costs a rebuild and buys a log with a git history.

---

## Where the data lives

| File | What it is |
|---|---|
| `data/log.csv` | The log. One row per thing eaten. The source of truth. |
| `data/goals.json` | `{calories, proteinMin, proteinMax, fiber}`. No UI edits it. |

Both are read at build time by `src/lib/logFile.ts` and `src/lib/goalsFile.ts`,
which use `node:fs` and therefore **run on the build machine only**. A client
component that imports either one fails the build, on purpose.

The CSV columns are the ones a spreadsheet wants: open it in Excel, fix a
number, commit it back. `fiber_g`, `sugar_g` and `sodium_mg` may be blank —
blank means *not recorded*, which is not the same as zero. Quote any field
containing a comma; plenty of food names have one.

### On privacy

**The repo is public, and so is the log.** Anyone can read what's in
`data/log.csv`, and git keeps the history of every change to it.

That was a deliberate trade rather than an oversight. Putting a login in front
of a static site turns out to be surprisingly expensive: GitHub Pages can only
restrict a site on Enterprise, Cloudflare Access needs a domain registered to
your own account and cannot protect a `*.pages.dev` URL, and Vercel cannot
protect a production domain below its Pro tier. The free routes all involve
either buying a domain or moving the data into a database so a client-side
login has something real to guard — because on a static site the data is
compiled into the JavaScript, and a login over an already-published bundle is
decoration.

For calories and protein that wasn't judged worth the cost. It would be the
wrong call for anything more revealing, so don't put anything in the CSV that
shouldn't be world-readable.

---

## Architecture

Every route is a server component that reads the files and passes plain data
into a client component that owns nothing but presentation:

```
src/app/page.tsx          readLog() + readGoals()  →  <Dashboard entries goals … />
src/app/history/page.tsx  readLog() + readGoals()  →  <History entries goals … />
src/app/foods/page.tsx    static catalog only, so client-side outright
```

`node:fs` runs at build; the browser gets JSON baked into the HTML. Client state
is limited to which day you are looking at, the 7/14/30/90 range selector, chart
hover, and the catalog's search and sort.

**Nothing reads the clock during render.** The build day and hour are computed
in the server component and threaded down as props, and `proteinStreak` — which
calls `toDateKey()` internally — is computed server-side too. A value that
differs between pre-render and hydration is a hydration mismatch, and the clock
is the one thing guaranteed to have moved in between. `formatDay` in
`src/lib/labels.ts` exists for the same reason: it takes the day "Today" means
as an argument and pins the locale, where `formatDateKey` reads both ambiently.

```
src/
├─ app/
│  ├─ page.tsx              Server: reads the log, renders the dashboard
│  ├─ history/page.tsx      Server: reads the log, renders history
│  └─ foods/page.tsx        Client: catalog browser
├─ components/
│  ├─ Dashboard.tsx         Client: day selection, rings, KPIs, meals, trends
│  ├─ History.tsx           Client: range selector, daily table, export
│  ├─ Meters.tsx            Rings and the macro split — presentational
│  ├─ MealList.tsx          The day's log grouped by meal — presentational
│  ├─ StatTiles.tsx         KPI tiles and the gap-closer panel
│  └─ TrendChart.tsx        Client: bar chart with hover/tap readout
├─ data/                    recipes.ts, staples.ts, pantry.ts — the catalog
└─ lib/
   ├─ logFile.ts            Build-time CSV read. node:fs.
   ├─ goalsFile.ts          Build-time goals read. node:fs.
   ├─ nutrition.ts          All the maths. Local dates, per-logged-day averages.
   ├─ labels.ts             Hydration-safe date labels.
   ├─ search.ts             Catalog search and gap-closer ranking.
   ├─ types.ts              The domain model.
   └─ export.ts             Markdown and Apple Health XML.
```

There is no `app/api/`. There cannot be: a static export has no server to run
route handlers on, and Next refuses to build one that contains them.

---

## What's in the catalog

The catalog is a **reference**, not a log — nothing in it is editable and
nothing in it counts until a row in `data/log.csv` references it. Reusing a
catalog id keeps the numbers consistent, which is why the Foods page shows each
id next to its food.

| Group | Count | Notes |
|---|---|---|
| Recipes | 34 entries | The 23 recipe files, plus a separate entry per serving-suggestion column — "Chicken Curry, curry only" vs "with 1 cup rice", "Niku Udon +1 egg" vs "+2 eggs" |
| Packaged | 5 | Grenade Oreo White, Gatorade Recover Chocolate Caramel, the ON Gold Standard shake (with and without a splash of 2% milk), Starbucks venti iced sugar-free vanilla protein latte |
| Pantry (Toronto) | 4 | The catered plate broken into scoops so a future visit can be logged component by component |
| Staples | 16 | Rice, eggs, milk, skyr, oats, chicken breast, tuna, peanut butter, oil |

Every food carries its **provenance** as a badge (`recipe`, `label`, `staple`,
`manual`) and a note saying where the number came from. A recipe estimate and a
manufacturer's panel deserve different levels of trust, and this is how that
survives into the log.

The recipe figures are transcribed from the recipe files, which are themselves
estimates. The packaged figures are off published panels; the two that needed a
judgement call are documented in the food's own note:

- **Grenade Oreo White** — Grenade publishes 230 kcal / 20 g protein / 2 g
  sugar for the 60 g bar. Third-party databases list anything from 210–250 kcal.
- **Gatorade Recover Chocolate Caramel** — 350 kcal and 20 g protein are
  consistent everywhere. Carbs are listed as 43 g on nutrition databases and
  49 g in some retail copy; 43 g is what reconciles with the 350 kcal total.

---

## Sticking to the goals

The parts that exist because a total at the end of the day is too late to act on:

- **Protein pace** — splits the protein still needed across the meals left as of
  the snapshot. "45 g per meal across 2 more" is a decision; "90 g short" is a
  report. On a day that is already over, the tile reports the result instead.
- **Closing the gap** — with protein outstanding, ranks the catalog by how much
  of the gap each food closes per calorie, penalising anything that would blow
  the remaining calorie budget. It reads the catalog, not the log, so it still
  answers a real question in a read-only app: *what would have closed this?*
- **Protein as a band, not a line** — 160–180 g is drawn as an arc on the ring,
  so "in the band" is visibly distinct from "over the top of it". Over is
  success, not failure.
- **Streak + rolling averages** — a single bad day matters much less than the
  7-day average, so both are on the dashboard.
- **Averages divide by logged days, not calendar days.** A day never logged is
  missing data, not a zero-calorie day. Averaging it as zero would report one
  logged day of 2,700 kcal as a "386 kcal average".

---

## Export

| Format | Use it for |
|---|---|
| Markdown | A readable log with per-day tables. Drops into notes or a repo. |
| Apple Health XML | Apple's HealthKit export schema, with dietary energy, protein, carbs, fat, fibre and sodium records. |

There is no CSV export and no JSON backup. `data/log.csv` already *is* the CSV,
one row per logged item, and a download that regenerated it would be a second
copy that could disagree with the first. Git is the backup.

**On Apple Health and Health Connect, honestly:** neither accepts a file
directly. iOS Health has no import button, and Health Connect only takes data
from apps that write to it. The XML uses Apple's real
`HKQuantityTypeIdentifierDietary*` schema so third-party importers (Health Auto
Export, HealthFit, Simple Health Export) can read it. For everything that wants
a CSV — Health Connect, Cronometer, MyFitnessPal — point it at `data/log.csv`.

---

## Deploying

It builds to a folder of static files, so any file host will serve it. It is
configured for **GitHub Pages**. `.github/workflows/deploy.yml` builds on every
push to `main` and publishes `out/`, dropping a `.nojekyll` marker so the
`_next` asset directory survives (Jekyll strips paths beginning with an
underscore). Pages must be enabled with **GitHub Actions** as the source.

Two things in `next.config.ts` matter:

| Setting | Why |
|---|---|
| `output: "export"` | Pre-renders every route to HTML. Required — a static host cannot run route handlers or server components on demand. |
| `basePath: "/Health"` | Pages serves a *project* site from `https://<user>.github.io/Health`, not from the domain root. Without it every asset URL resolves one level too high and the page loads blank. It must match the repository name — rename the repo and this changes with it. |

### Environment variables

None. There is no server, so there is nowhere to keep a secret — anything in
`.env` would be compiled into the bundle and readable by anyone with access to
the site. The privacy model is the private repo plus Cloudflare Access, not a
credential the browser holds.

---

## Charts

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
