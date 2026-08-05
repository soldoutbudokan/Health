# Working on this repo

A daily calorie and protein tracker targeting **2,800 kcal** and **160–180 g protein**.

**You are the only thing that writes to the log.** The website is a read-only
dashboard. It has no add button, no browser storage, and no way to save anything —
that is deliberate, not an oversight. Don't add one back.

## How it works

```
you edit data/log.csv  →  commit  →  push  →  Cloudflare Pages rebuilds  →  site shows it
```

The site is a static export served by Cloudflare Pages behind Cloudflare Access,
so it asks for a login before it will show anything. That login is what keeps the
log private, which is why the data can sit in the repo in plain text.

The repo is **private**. Keep it that way — the whole privacy model rests on it.

## The job you'll usually be asked to do

> "I had a chicken shawarma plate from the place on Bloor and two coffees"

Work out the macros, append rows to `data/log.csv`, commit, push, and say what you
assumed. A push takes a minute or two to appear on the site.

There's also a routine that asks each evening whether anything needs logging. Same
job, just prompted rather than volunteered.

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

## Checks

```bash
npx tsc --noEmit
npm run build          # writes out/; also lints
```

`src/lib/logFile.ts` reads the CSV at build time using `node:fs`, so it can only be
imported from server components. If a client component imports it the build fails.

If you touched `src/data/`, re-check that Atwater reconciles and no `fiber` exceeds
its entry's `carbs`.

## History, so nobody re-litigates it

This app has been through three storage designs. It briefly synced through a private
gist with a token in the browser, and before that kept everything in `localStorage`
and pushed to the gist on a button press. Both were abandoned because two copies of
the truth means merging, and merging means tombstones, conflict rules, and a button
you have to remember to press. One file, one writer, no sync. Keep it that way.

There were also two API routes — `/api/ai-lookup` calling Claude, and `/api/search`
proxying USDA. Both are deleted. The first is your job now; the second isn't worth a
server. `output: "export"` will fail the build if anyone adds a route handler back.
