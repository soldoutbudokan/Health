# Working on this repo

Two logs on one site: a daily calorie and protein tracker targeting **2,800 kcal**
and **160–180 g protein**, and a lifting log run against a training program with a
**December 31st, 2026** deadline.

**You are the only thing that writes to the log.** The website is a read-only
dashboard. It has no add button, no browser storage, and no way to save anything —
that is deliberate, not an oversight. Don't add one back.

## How it works

```
you edit data/log.csv  →  commit  →  push  →  Actions rebuilds  →  site shows it
```

The site is a static export on GitHub Pages at
`https://soldoutbudokan.github.io/Health/`. A push to `main` triggers
`.github/workflows/deploy.yml`, which builds and publishes; allow a minute or two.

**The repo is public, and so is the log.** That is a deliberate choice, not an
oversight — putting a login in front of the site turned out to cost either a
domain purchase (Cloudflare Access requires a domain on your own account and
cannot protect a `*.pages.dev` URL), $20/month (Vercel cannot protect a
production domain below Pro), or moving the data into Firestore. Public was
judged the better trade for a calorie log. Don't write anything into
`data/log.csv` that shouldn't be world-readable, and don't assume it's private
because it's "just" a food log.

## The two jobs you'll usually be asked to do

> "I had a chicken shawarma plate from the place on Bloor and two coffees"

Work out the macros, append rows to `data/log.csv`, commit, push, and say what you
assumed. A push takes a minute or two to appear on the site.

> "Bench 2 sets of 5 at 155 and 135, cable row 2×5 at 130, dips 1×7. Wiped out."

Append one row per **set** to `data/workouts.csv` and one row for the session to
`data/sessions.csv`. Work out which program day it was (`src/data/program.ts`) and
say so; the site checks the session against that day automatically, so getting the
`session` column right is what makes the comparison mean anything.

There's also a routine that asks each evening whether anything needs logging. Same
jobs, just prompted rather than volunteered.

## `data/log.csv`

One row per thing eaten. Columns, in order:

```
id,date,meal,food,variant,brand,serving,servings,calories,
protein_g,carbs_g,fat_g,fiber_g,sugar_g,sodium_mg,source,logged_at
```

| Column | Notes |
|---|---|
| `id` | any unique string — `uuidgen` is fine |
| `date` | `YYYY-MM-DD`, **local** calendar date. A row without a valid date is dropped at build. |
| `meal` | `breakfast` \| `lunch` \| `dinner` \| `snack` |
| `serving` | what one serving *is*, e.g. `1 bowl (1/6 recipe)` |
| `servings` | multiplier. Macros are **per serving** — half a portion is `0.5`, don't halve the macros |
| `fiber_g`, `sugar_g`, `sodium_mg` | may be blank. Blank means *not recorded*, which is not the same as zero |
| `source` | `recipe` \| `packaged` \| `staple` \| `usda` \| `off` \| `claude` \| `custom` |

Quote any field containing a comma and double any internal quote (`"Chicken Curry, curry only"`).
Plenty of food names contain commas, so this matters.

`data/goals.json` holds the targets. Edit it if asked; there's no UI for it.

## The training files

Four grains, four files. Don't merge them — sets, sessions, layoffs and morning
check-ins are genuinely different things and each is queried on its own.

### `data/workouts.csv` — one row per *set*

```
id,date,session,exercise,kind,set_index,reps,weight_lbs,duration_min,rpe,note,source
```

| Column | Notes |
|---|---|
| `session` | `heavy-lower` \| `light-lower` \| `heavy-upper` \| `light-upper` \| `off-a` \| `off-b` \| `stretch` \| `basketball` \| `other`. **Blank** for imported reference points that belong to no session |
| `exercise` | free text; aliases are folded in `src/lib/training.ts` (`canonical`), so "Pull ups" and "Pullups" match. Add an alias there rather than renaming history |
| `kind` | `warmup` \| `jump` \| `compound` \| `isolation` \| `core` \| `mobility` \| `finisher`. Drives how the session card groups things — the sled is `warmup` at the start and `finisher` at the end |
| `set_index` | 1, 2, 3… within that exercise |
| `reps`, `weight_lbs`, `duration_min` | any may be blank. Bodyweight work has reps and no weight; the sled has duration and neither |
| `source` | `logged` (it happened and was recorded) \| `sheet` (from the old spreadsheet) \| `handoff` (a baseline stated in the training plan) |

**One row per set, never a rolled-up average.** "2 sets of 5 at 155 and 135" is two
rows. The set that *differs* is the whole point — 155 is a top set and 135 is a
back-off set, and progression keys on the first number.

**File order is session order.** The session card renders in it, so append sets in
the order they were performed.

### `data/sessions.csv` — one row per *session*

```
date,session,duration_min,fatigue,sweat,bodyweight_lbs,deload,flags,note
```

`fatigue` is 1–5 (5 = exhausted), `sweat` is `low`/`normal`/`high`, `deload` is
`yes` or blank, `flags` is semicolon-separated joint or soreness tags such as
`front-shoulder`. All optional. This is where the subjective half lives — record it,
because a bench that dropped 10 lbs on a day flagged *exhausted, sweating heavily*
is a recovery story, not a strength story.

### `data/breaks.csv` — one row per stretch of *not training*

```
start,end,kind,label,note
```

`kind` is `travel` \| `illness` \| `deload` \| `other`. These shade the charts and
explain gaps. Without them a six-week hole reads as "stopped tracking" rather than
"was in Japan".

### `data/checkins.csv` — one row per *morning check-in*

```
date,bodyweight_lbs,sleep_start,sleep_end,note
```

Bodyweight and sleep belong to a morning, not to a training session — rest days
have mornings too, so this is its own file rather than a phantom `other` row in
`sessions.csv`. Sleep times are the **local 24-hour clock**, `sleep_start` being
the night before (`23:00,07:15` is an 8¼-hour night; the code handles the
midnight crossing). Everything but `date` may be blank — blank means not
recorded. When a weigh-in or a night's sleep gets mentioned ("weighed in at
187.6", "slept 11 to 7:15"), append a row here; the dashboard shows it on its
own day, alongside that day's session.

`data/training-goals.json` holds the six goals, the August baselines, the December
targets and the January projection table. The projection is kept deliberately: the
distance between it and reality is the layoff.
## Before inventing an exercise, check the program

`src/data/program.ts` is the plan in code — the same object `/program` renders and
`comparePlan()` grades sessions against. If a session deviates, that's data, not an
error: log what happened and let the page report the gap. **Don't edit the program
to make a session look compliant.** `docs/training-plan.md` is the source of truth
for the reasoning; if the two disagree, the document wins and the file is stale.

## Before inventing a food, check the catalog

59 entries live in `src/data/`, and reusing one keeps the numbers consistent:

| File | What's in it |
|---|---|
| `recipes.ts` | 34 entries from the [Templates](https://github.com/soldoutbudokan/Templates/tree/master/Recipes) recipes, one per serving-suggestion column |
| `staples.ts` | 21 staples plus packaged goods (bars, shakes, the Starbucks latte) |
| `pantry.ts` | 4 components of the Toronto catered plate |

```bash
grep -n -i -A6 'chilli' src/data/recipes.ts
grep -n 'id: "' src/data/*.ts          # every id
```

Copy the catalog entry's macros verbatim and use `servings` for the portion.

## Rules that matter more than the numbers

**Say where the numbers came from.** A manufacturer's panel, a USDA row and your
estimate from a photo deserve different trust. Every food in `src/data/` carries a
`note` recording which it is — follow that. If you add to the catalog, write the note.

**Check the arithmetic reconciles.** Protein × 4 + carbs × 4 + fat × 9 should land
within about 10% of the stated calories. Every entry in this catalog passes; if
yours doesn't, you've misread a label. Fibre counts inside carbs here.

**Leave a value blank rather than guessing it.** Several recipes deliberately have
no sodium because they specify "salt to taste" and any figure would be invention.
A made-up number reads as authoritative and is worse than an absent one.

**Dates are local, never UTC.** `toDateKey()` in `src/lib/nutrition.ts` exists
because `toISOString()` shifts the day for anyone behind UTC. Don't reintroduce it.

**Averages divide by logged days, not calendar days.** An unlogged day is missing
data, not a zero-calorie day.

**Protein is a band, not a line.** Over 180 g renders as success. Don't adjust real
data so it sits inside the band.

**Don't invent units.** The old spreadsheet mixes pounds with machine pin numbers —
"6 Reps at 13" is a pin position, "5 Reps at 145 lbs" is a weight. Only the rows
whose units were unambiguous were imported into `data/workouts.csv`. The rest is
displayed verbatim on `/program` and computed on by nothing. Keep it that way.

**Hypermobility shapes the program.** Several rules that look like preferences
aren't: no hard lockouts, no passive stretching, deloads every 4–5 weeks. They're in
`HYPERMOBILITY_RULES`. Don't quietly relax one because a session would score better.

## Checks

```bash
npx tsc --noEmit
npm run build          # writes out/; also lints
```

`src/lib/logFile.ts` reads the CSV at build time using `node:fs`, so it can only be
imported from server components. If a client component imports it the build fails.

If you touched `src/data/`, re-check that Atwater reconciles and no `fiber` exceeds
its entry's `carbs`.

`docs/spreadsheet/*.csv` are read at build time too, by `/program`. They're derived
from `docs/irl-cdtw.xlsx`; if that file is ever updated, regenerate them rather than
hand-editing the CSVs.

## History, so nobody re-litigates it

This app has been through three storage designs. It briefly synced through a private
gist with a token in the browser, and before that kept everything in `localStorage`
and pushed to the gist on a button press. Both were abandoned because two copies of
the truth means merging, and merging means tombstones, conflict rules, and a button
you have to remember to press. One file, one writer, no sync. Keep it that way.

There were also two API routes — `/api/ai-lookup` calling Claude, and `/api/search`
proxying USDA. Both are deleted. The first is your job now; the second isn't worth a
server. `output: "export"` will fail the build if anyone adds a route handler back.
