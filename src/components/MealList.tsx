"use client";

import type { LogEntry, MealSlot } from "@/lib/types";
import { MEAL_LABELS, MEAL_SLOTS } from "@/lib/types";
import { entryMacros, groupBySlot, round, sumEntries } from "@/lib/nutrition";
import { SourceBadge } from "./SourceBadge";

interface Props {
  entries: LogEntry[];
  onRemove: (id: string) => void;
  onAdd: (slot: MealSlot) => void;
  onServings: (id: string, servings: number) => void;
}

export function MealList({ entries, onRemove, onAdd, onServings }: Props) {
  const bySlot = groupBySlot(entries);

  return (
    <div className="space-y-3">
      {MEAL_SLOTS.map((slot) => {
        const items = bySlot[slot];
        const totals = sumEntries(items);
        return (
          <section key={slot} className="card overflow-hidden">
            <header className="flex items-center gap-2 px-4 py-3">
              <h2 className="text-sm font-semibold">{MEAL_LABELS[slot]}</h2>
              {items.length > 0 && (
                <span className="tnum text-xs text-muted">
                  {round(totals.calories)} kcal · {round(totals.protein, 1)}g P
                </span>
              )}
              <button
                onClick={() => onAdd(slot)}
                className="ml-auto rounded-lg border border-hairline px-2.5 py-1 text-xs font-semibold text-ink-2 transition-colors hover:bg-surface-2"
              >
                + Add
              </button>
            </header>

            {items.length > 0 && (
              <ul className="border-t border-hairline">
                {items.map((e) => (
                  <EntryRow
                    key={e.id}
                    entry={e}
                    onRemove={() => onRemove(e.id)}
                    onServings={(n) => onServings(e.id, n)}
                  />
                ))}
              </ul>
            )}
          </section>
        );
      })}
    </div>
  );
}

function EntryRow({
  entry,
  onRemove,
  onServings,
}: {
  entry: LogEntry;
  onRemove: () => void;
  onServings: (n: number) => void;
}) {
  const m = entryMacros(entry);
  const name = entry.variant ? `${entry.name} — ${entry.variant}` : entry.name;

  return (
    <li className="group flex items-center gap-3 border-b border-hairline px-4 py-2.5 last:border-b-0">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="truncate text-[15px]">{name}</span>
          <SourceBadge source={entry.source} />
        </div>
        <div className="tnum truncate text-xs text-muted">
          {entry.servings !== 1 && `${round(entry.servings, 2)} × `}
          {entry.per}
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

      <div className="flex shrink-0 items-center gap-1">
        <button
          onClick={() => onServings(Math.max(0.25, round(entry.servings - 0.25, 2)))}
          aria-label={`Reduce servings of ${name}`}
          className="h-7 w-7 rounded-md text-muted opacity-0 transition-opacity hover:bg-surface-2 hover:text-ink focus-visible:opacity-100 group-hover:opacity-100"
        >
          −
        </button>
        <button
          onClick={() => onServings(round(entry.servings + 0.25, 2))}
          aria-label={`Increase servings of ${name}`}
          className="h-7 w-7 rounded-md text-muted opacity-0 transition-opacity hover:bg-surface-2 hover:text-ink focus-visible:opacity-100 group-hover:opacity-100"
        >
          +
        </button>
        <button
          onClick={onRemove}
          aria-label={`Remove ${name}`}
          className="h-7 w-7 rounded-md text-muted transition-colors hover:bg-surface-2 hover:text-critical"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden
            className="mx-auto"
          >
            <path
              d="M6 6l12 12M18 6L6 18"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>
    </li>
  );
}
