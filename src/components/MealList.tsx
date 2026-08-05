import type { LogEntry } from "@/lib/types";
import { MEAL_LABELS, MEAL_SLOTS } from "@/lib/types";
import { entryMacros, groupBySlot, round, sumEntries } from "@/lib/nutrition";
import { SourceBadge } from "./SourceBadge";

/**
 * The day's log, grouped by meal. Read-only: there is nothing to add, remove,
 * re-portion or move, because the only way anything gets in here is a row in
 * `data/log.csv` and a rebuild.
 *
 * Empty slots are not rendered. A row of four headers with nothing under them
 * was scaffolding for the "+ Add" buttons that used to live in them, and with
 * those gone it is just noise between the reader and the food.
 */
export function MealList({ entries }: { entries: LogEntry[] }) {
  const bySlot = groupBySlot(entries);
  const slots = MEAL_SLOTS.filter((s) => bySlot[s].length > 0);

  if (slots.length === 0) return null;

  return (
    <div className="space-y-3">
      {slots.map((slot) => {
        const items = bySlot[slot];
        const totals = sumEntries(items);
        return (
          <section key={slot} className="card overflow-hidden">
            <header className="flex items-baseline gap-2 px-4 py-3">
              <h2 className="text-sm font-semibold">{MEAL_LABELS[slot]}</h2>
              <span className="tnum text-xs text-muted">
                {round(totals.calories)} kcal · {round(totals.protein, 1)}g P
              </span>
              <span className="ml-auto text-xs text-muted">
                {items.length} item{items.length === 1 ? "" : "s"}
              </span>
            </header>

            <ul className="border-t border-hairline">
              {items.map((e) => (
                <EntryRow key={e.id} entry={e} />
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}

function EntryRow({ entry }: { entry: LogEntry }) {
  const m = entryMacros(entry);
  const name = entry.variant ? `${entry.name} — ${entry.variant}` : entry.name;

  return (
    <li className="flex items-center gap-3 border-b border-hairline px-4 py-2.5 last:border-b-0">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="truncate text-[15px]">{name}</span>
          <SourceBadge source={entry.source} />
        </div>
        <div className="tnum truncate text-xs text-muted">
          {entry.servings !== 1 && `${round(entry.servings, 2)} × `}
          {entry.per}
          {entry.brand && ` · ${entry.brand}`}
        </div>
      </div>

      <div className="tnum hidden shrink-0 gap-4 text-right text-xs text-muted sm:flex">
        <span className="w-14">
          <span className="block font-semibold text-ink">{round(m.calories)}</span>
          kcal
        </span>
        <span className="w-12">
          <span
            className="block font-semibold"
            style={{ color: "var(--series-protein)" }}
          >
            {round(m.protein, 1)}
          </span>
          prot
        </span>
      </div>

      <div className="tnum shrink-0 text-right sm:hidden">
        <div className="text-sm font-semibold">{round(m.calories)}</div>
        <div className="text-[11px]" style={{ color: "var(--series-protein)" }}>
          {round(m.protein, 1)}g P
        </div>
      </div>
    </li>
  );
}
