# Working on this repo

A daily calorie and protein tracker targeting **2,800 kcal** and **160–180 g protein**.
The site is a static export on GitHub Pages; the log lives in a private gist that both
the app and Claude Code read and write.

## The job you'll usually be asked to do

> "I had a chicken shawarma plate from the place on Bloor and two coffees, log it"

The app handles the fifteen foods eaten constantly — one tap each. You get asked about
the things it can't do: a restaurant dish, an unlabelled product, a plate that needs
splitting into components, a day that needs reconstructing after the fact. Work out the
macros, append entries to the gist, and say what you assumed.

## Where the data lives

A private gist, one file: **`nutrition-log.json`**. The gist id and a fine-grained token
are the user's; ask if you don't have them. The token needs the `gist` scope only.

```bash
gh api gists/$GIST_ID --jq '.files["nutrition-log.json"].content' > /tmp/log.json
# edit /tmp/log.json
jq -Rs '{files:{"nutrition-log.json":{content:.}}}' < /tmp/log.json \
  | gh api -X PATCH gists/$GIST_ID --input -
```

**Read before you write, every time.** The user's phone or laptop may have written since
you last looked, and the merge in `src/lib/sync.ts` is only forgiving if you started from
current state.

## Data model

Authoritative definitions are in `src/lib/types.ts` — read it rather than trusting this
summary if the two disagree.

```jsonc
{
  "version": 1,
  "goals": { "calories": 2800, "proteinMin": 160, "proteinMax": 180, "fiber": 30 },
  "entries": [ /* LogEntry[] */ ],
  "customFoods": [ /* Food[] — things not in the shipped catalog */ ],
  "favorites": ["food-id"],          // pinned to the quick-add row
  "deletions": { "entry-id": "ISO" }, // tombstones — see below
  "goalsUpdatedAt": "ISO",
  "favoritesUpdatedAt": "ISO"
}
```

A `LogEntry` **snapshots** the food's macros at log time, so editing a food definition
later never rewrites history:

```jsonc
{
  "id": "uuid",              // crypto.randomUUID()
  "date": "2026-08-04",      // LOCAL calendar date, never UTC
  "slot": "breakfast",       // breakfast | lunch | dinner | snack
  "foodId": "recipe-chilli", // catalog id, or custom-<uuid>
  "name": "Chilli",
  "variant": "with 3 rolls", // optional
  "brand": "Grenade",        // optional
  "source": "recipe",        // recipe|packaged|staple|usda|off|claude|custom
  "per": "1 serving (1/5 recipe)",
  "servings": 1,             // macros are PER SERVING; multiply by this
  "macros": { "calories": 450, "protein": 32, "carbs": 39, "fat": 19, "fiber": 9, "sodium": 735 },
  "loggedAt": "ISO",
  "updatedAt": "ISO"         // set on every write; the merge uses it to pick a winner
}
```

`calories`, `protein`, `carbs`, `fat` are required. `fiber` and `sugar` are grams,
`sodium` is **milligrams**. Fibre counts inside `carbs` in this catalog.

### Deleting

Never just drop an entry from the array. Remove it **and** add its id to `deletions`
with the current timestamp. Absence isn't a delete — the next device to sync still has
the entry, sees you lack it, and hands it straight back. That's what the tombstone stops.

To restore something, delete its tombstone and set the entry's `updatedAt` to now, so it
beats the tombstone it's fighting.

## Finding food that already exists

Check the catalog before inventing anything — 59 entries live in `src/data/`:

| File | What's in it |
|---|---|
| `recipes.ts` | 34 entries from the [Templates](https://github.com/soldoutbudokan/Templates/tree/master/Recipes) recipes, one per serving-suggestion column |
| `staples.ts` | 21 staples plus packaged goods (bars, shakes, the Starbucks latte) |
| `pantry.ts` | 4 components of the Toronto catered plate |

```bash
grep -n 'id: "' src/data/*.ts          # every id
grep -n -i -A6 'chilli' src/data/recipes.ts
```

If a catalog food matches, reference its `id` in `foodId` and copy its `macros` verbatim.
Use `servings` for portions — half a serving is `0.5`, not edited macros.

## Adding food that isn't in the catalog

Add a `Food` to `customFoods` and reference it, with `source: "claude"` and an id of
`custom-<uuid>`. Two rules matter more than the numbers:

**Say where the numbers came from.** Every food carries a `note`. A manufacturer's panel,
a USDA row and your estimate from a photo deserve different trust, and the `note` is how
that survives into the log. Write which one it is. "Estimated from a typical restaurant
portion; the oil content is the biggest unknown" is a good note.

**Check your arithmetic reconciles.** Protein × 4 + carbs × 4 + fat × 9 should land within
about 10% of the stated calories. If it doesn't, you've misread something. Every entry in
this catalog passes that check and new ones should too.

Leave `sodium` and `fiber` absent when you genuinely can't derive them. Absent is honest;
a made-up number reads as authoritative and is worse than nothing. Several recipes
deliberately omit sodium because they specify "salt to taste" — follow that precedent.

## Conventions worth not breaking

- **Dates are local, never UTC.** `toDateKey()` in `src/lib/nutrition.ts` exists because
  `toISOString()` shifts the day for anyone behind UTC. Don't reintroduce it.
- **Averages divide by logged days, not calendar days.** An unlogged day is missing data,
  not a zero-calorie day.
- **Protein is a band, not a line.** Over 180 g renders as success, not failure. Don't
  "fix" data to sit inside the band.
- **Charts:** calories and protein are separate charts, never dual-axis. Bars, not lines —
  a line interpolates through a day that was never logged.

## Checks

```bash
npm run build      # also lints and typechecks; must exit 0
npx tsc --noEmit
```

If you touched `src/data/`, verify Atwater still reconciles and that no `fiber` exceeds
its entry's `carbs`.

## Not here any more

There used to be `/api/ai-lookup` (Claude via the API) and `/api/search` (USDA proxy).
Both were deleted when the app went static — you replaced the first one, and the second
now runs client-side against Open Food Facts, which needs no key. Don't add server routes
back; `output: "export"` will fail the build.
