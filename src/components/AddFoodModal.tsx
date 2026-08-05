"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import type { Food, MealSlot } from "@/lib/types";
import { MEAL_LABELS, MEAL_SLOTS } from "@/lib/types";
import { round } from "@/lib/nutrition";
import { allFoods, foodLabel, searchFoods } from "@/lib/search";
import { searchOpenFoodFacts } from "@/lib/offSearch";
import { SourceBadge } from "./SourceBadge";

interface Props {
  open: boolean;
  onClose: () => void;
  customFoods: Food[];
  defaultSlot: MealSlot;
  /** Returns the food actually logged, so the caller can offer to save it. */
  onAdd: (food: Food, servings: number, slot: MealSlot) => void;
  /** Persist a web/manual food into the user's own catalog. */
  onSaveFood: (food: Omit<Food, "id" | "createdAt">) => Food;
}

type Mode = "search" | "manual";

/** Anything focusable, in DOM order — the raw material for the focus trap. */
const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function AddFoodModal({
  open,
  onClose,
  customFoods,
  defaultSlot,
  onAdd,
  onSaveFood,
}: Props) {
  const [mode, setMode] = useState<Mode>("search");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Food | null>(null);
  const [servings, setServings] = useState(1);
  const [slot, setSlot] = useState<MealSlot>(defaultSlot);

  const [webResults, setWebResults] = useState<Food[]>([]);
  const [webState, setWebState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [webError, setWebError] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  /** The control that opened the dialog, so focus can go back where it came from. */
  const openerRef = useRef<HTMLElement | null>(null);

  const catalog = useMemo(() => allFoods(customFoods), [customFoods]);
  const localResults = useMemo(
    () => searchFoods(catalog, query, query ? 12 : 8),
    [catalog, query],
  );

  useEffect(() => {
    if (open) {
      setSlot(defaultSlot);
      return;
    }
    // Reset everything on close so the next open is a clean slate.
    setQuery("");
    setSelected(null);
    setServings(1);
    setMode("search");
    setWebResults([]);
    setWebState("idle");
    setWebError(null);
  }, [open, defaultSlot]);

  // Focus moves in on open and back out on close. Capturing the opener before
  // taking focus is what lets a keyboard user carry on from where they were
  // instead of being dumped at the top of the document.
  useEffect(() => {
    if (!open) return;
    openerRef.current = document.activeElement as HTMLElement | null;
    // Let the dialog mount before stealing focus.
    const t = setTimeout(() => inputRef.current?.focus(), 40);
    return () => {
      clearTimeout(t);
      const opener = openerRef.current;
      openerRef.current = null;
      // Only restore if focus is still inside (or was lost with) the dialog;
      // if something else has legitimately taken it, leave it alone.
      const active = document.activeElement;
      if (!active || active === document.body) opener?.focus?.();
    };
  }, [open]);

  // Typing invalidates the previous remote lookup.
  useEffect(() => {
    setWebResults([]);
    setWebState("idle");
    setWebError(null);
  }, [query]);

  useEffect(() => {
    if (!open) return;

    // `aria-modal` promises the rest of the page is inert. Nothing enforces
    // that on its own, so Tab is wrapped by hand: without this it walks
    // straight out of the dialog and into the page behind it.
    function focusable(): HTMLElement[] {
      const root = dialogRef.current;
      if (!root) return [];
      return Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => el.getClientRects().length > 0,
      );
    }

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        if (selected) setSelected(null);
        else onClose();
        return;
      }
      if (e.key !== "Tab") return;

      const items = focusable();
      if (items.length === 0) {
        e.preventDefault();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement as HTMLElement | null;

      if (!dialogRef.current?.contains(active)) {
        // Focus escaped (or never arrived) — pull it back to the near edge.
        e.preventDefault();
        (e.shiftKey ? last : first).focus();
      } else if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose, selected]);

  const searchWeb = useCallback(async () => {
    if (query.trim().length < 2) return;
    setWebState("loading");
    setWebError(null);
    try {
      const results = await searchOpenFoodFacts(query);
      setWebResults(results);
      setWebState("done");
    } catch {
      setWebState("error");
      setWebError("Could not reach Open Food Facts. Check your connection.");
    }
  }, [query]);

  if (!open) return null;

  function choose(food: Food) {
    setSelected(food);
    setServings(1);
  }

  function confirm(alsoSave: boolean, count: number) {
    if (!selected) return;
    let food = selected;
    if (alsoSave && selected.source !== "recipe" && selected.source !== "staple") {
      const { id: _id, createdAt: _createdAt, ...rest } = selected;
      void _id;
      void _createdAt;
      food = onSaveFood(rest);
    }
    onAdd(food, count, slot);
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 backdrop-blur-[2px] sm:items-center sm:p-4"
      onMouseDown={(e) => {
        if (!dialogRef.current?.contains(e.target as Node)) onClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="Add food"
        className="rise flex max-h-[92dvh] w-full max-w-xl flex-col overflow-hidden rounded-t-2xl border border-hairline bg-surface shadow-xl sm:rounded-2xl"
      >
        {selected ? (
          <PortionStep
            food={selected}
            servings={servings}
            setServings={setServings}
            slot={slot}
            setSlot={setSlot}
            onBack={() => setSelected(null)}
            onConfirm={confirm}
          />
        ) : (
          <>
            <div className="flex items-center gap-2 border-b border-hairline p-3">
              <div className="relative flex-1">
                <svg
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden
                >
                  <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
                  <path d="M20 20l-3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
                <input
                  ref={inputRef}
                  value={query}
                  aria-label="Search foods, recipes, or a barcode"
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && localResults.length > 0) choose(localResults[0]);
                  }}
                  placeholder="Search foods, recipes, or a barcode…"
                  className="w-full rounded-lg border border-hairline bg-surface-2 py-2.5 pl-9 pr-3 text-[15px] outline-none placeholder:text-muted"
                />
              </div>
              <button
                onClick={onClose}
                aria-label="Close"
                className="rounded-lg px-2.5 py-2 text-ink-2 hover:bg-surface-2"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            <div className="flex gap-1 border-b border-hairline px-3 py-2">
              <button
                onClick={() => setMode("search")}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium ${mode === "search" ? "bg-surface-2 text-ink" : "text-ink-2 hover:bg-surface-2"}`}
              >
                Search
              </button>
              <button
                onClick={() => setMode("manual")}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium ${mode === "manual" ? "bg-surface-2 text-ink" : "text-ink-2 hover:bg-surface-2"}`}
              >
                Enter by hand
              </button>
            </div>

            {mode === "manual" ? (
              <ManualEntry
                initialName={query}
                onCreate={(draft) => {
                  const created = onSaveFood(draft);
                  choose(created);
                }}
              />
            ) : (
              <div className="min-h-0 flex-1 overflow-y-auto p-3">
                <Section title={query ? "Your foods" : "Recently useful"}>
                  {localResults.length === 0 ? (
                    <p className="px-1 py-3 text-sm text-muted">
                      Nothing in your catalog matches “{query}”. Try the food database
                      below, or enter it by hand.
                    </p>
                  ) : (
                    localResults.map((f) => (
                      <FoodRow key={f.id} food={f} onClick={() => choose(f)} />
                    ))
                  )}
                </Section>

                {query.trim().length >= 2 && (
                  <Section
                    title="Food database"
                    hint="Open Food Facts · free, no account"
                    action={
                      webState === "idle" ? (
                        <ActionButton onClick={searchWeb}>Search</ActionButton>
                      ) : webState === "loading" ? (
                        <Spinner />
                      ) : (
                        <ActionButton onClick={searchWeb}>Again</ActionButton>
                      )
                    }
                  >
                    {webError && (
                      <p className="px-1 py-1.5 text-xs text-serious">{webError}</p>
                    )}
                    {webState === "done" && webResults.length === 0 && !webError && (
                      <p className="px-1 py-3 text-sm text-muted">No matches.</p>
                    )}
                    {webResults.map((f) => (
                      <FoodRow key={f.id} food={f} onClick={() => choose(f)} />
                    ))}
                  </Section>
                )}

                <p className="mt-1 border-t border-hairline px-1 pt-3 text-xs leading-relaxed text-muted">
                  No label to go on — a restaurant dish, something unpackaged? Ask Claude
                  Code to work out the macros and add it; it writes to the same synced log
                  this app reads, so it shows up here.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function Section({
  title,
  hint,
  action,
  children,
}: {
  title: string;
  hint?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-4 last:mb-0">
      <div className="mb-1.5 flex items-center gap-2 px-1">
        <h3 className="text-[11px] font-semibold uppercase tracking-wide text-muted">
          {title}
        </h3>
        {hint && <span className="hidden text-[11px] text-muted sm:inline">· {hint}</span>}
        <div className="ml-auto">{action}</div>
      </div>
      {children}
    </section>
  );
}

function ActionButton({
  onClick,
  children,
}: {
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className="rounded-lg border border-hairline px-2.5 py-1 text-xs font-semibold text-ink-2 transition-colors hover:bg-surface-2"
    >
      {children}
    </button>
  );
}

function Spinner() {
  return (
    <span
      className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-hairline-strong border-t-protein"
      role="status"
      aria-label="Loading"
    />
  );
}

function FoodRow({ food, onClick }: { food: Food; onClick: () => void }) {
  const m = food.macros;
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors hover:bg-surface-2"
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="truncate text-[15px] font-medium">{foodLabel(food)}</span>
          <SourceBadge source={food.source} />
        </div>
        <div className="tnum truncate text-xs text-muted">
          {food.brand ? `${food.brand} · ` : ""}
          {food.per} · {round(m.calories)} kcal · {round(m.protein, 1)}g P
        </div>
      </div>
      <span className="shrink-0 text-muted" aria-hidden>
        +
      </span>
    </button>
  );
}

/** Half a quarter-serving is below the resolution of any kitchen scale here. */
const MIN_SERVINGS = 0.25;

/**
 * Resolve whatever is in the text field to a loggable number of servings.
 * Mid-edit states ("", "1.", "-") fall back to the last good value rather than
 * to zero, and nothing below the minimum survives.
 */
function normalizeServings(raw: string, fallback: number): number {
  const n = Number(raw);
  if (raw.trim() === "" || !Number.isFinite(n)) return Math.max(MIN_SERVINGS, fallback);
  return Math.max(MIN_SERVINGS, round(n, 2));
}

function PortionStep({
  food,
  servings,
  setServings,
  slot,
  setSlot,
  onBack,
  onConfirm,
}: {
  food: Food;
  servings: number;
  setServings: (n: number) => void;
  slot: MealSlot;
  setSlot: (s: MealSlot) => void;
  onBack: () => void;
  onConfirm: (alsoSave: boolean, servings: number) => void;
}) {
  const m = food.macros;
  const isBuiltin = food.source === "recipe" || food.source === "staple";
  const alreadyMine = food.id.startsWith("custom-");
  const canSave = !isBuiltin && !alreadyMine;

  const uid = useId();
  const servingsId = `${uid}-servings`;
  const mealLabelId = `${uid}-meal`;

  /**
   * The field holds a *string* while it is being edited. Coercing every
   * keystroke to a number breaks decimals: typing "1.5" passes through "1.",
   * which is not a finite number, so the old code wrote 0 back into the field
   * and the next keystroke produced "05" — five servings logged instead of one
   * and a half. The number is only committed when it is actually a number.
   */
  const [draft, setDraft] = useState(() => String(servings));

  // Keep the field in step with the ± buttons and the preset chips, without
  // clobbering an in-progress edit that happens to round to the same value.
  useEffect(() => {
    setDraft((d) => (Number(d) === servings && d.trim() !== "" ? d : String(servings)));
  }, [servings]);

  function commit(): number {
    const next = normalizeServings(draft, servings);
    setServings(next);
    setDraft(String(next));
    return next;
  }

  const totals = {
    calories: m.calories * servings,
    protein: m.protein * servings,
    carbs: m.carbs * servings,
    fat: m.fat * servings,
  };

  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-2 border-b border-hairline p-3">
        <button
          onClick={onBack}
          aria-label="Back"
          className="rounded-lg px-2 py-2 text-ink-2 hover:bg-surface-2"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M15 5l-7 7 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <div className="min-w-0">
          <div className="truncate font-semibold">{foodLabel(food)}</div>
          <div className="truncate text-xs text-muted">
            {food.brand ? `${food.brand} · ` : ""}
            {food.per}
          </div>
        </div>
      </div>

      <div className="space-y-5 overflow-y-auto p-4">
        <div>
          <label
            htmlFor={servingsId}
            className="mb-2 block text-[11px] font-semibold uppercase tracking-wide text-muted"
          >
            Servings
          </label>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setServings(Math.max(MIN_SERVINGS, round(servings - 0.25, 2)))}
              className="h-10 w-10 rounded-lg border border-hairline text-lg font-medium hover:bg-surface-2"
              aria-label="Fewer servings"
            >
              −
            </button>
            <input
              id={servingsId}
              type="number"
              inputMode="decimal"
              min={MIN_SERVINGS}
              step={0.25}
              value={draft}
              onChange={(e) => {
                const raw = e.target.value;
                setDraft(raw);
                const n = Number(raw);
                // Push upstream only once the text is a usable number, so the
                // totals track typing without the field fighting the user.
                if (raw.trim() !== "" && Number.isFinite(n) && n >= MIN_SERVINGS) {
                  setServings(round(n, 2));
                }
              }}
              onBlur={commit}
              className="tnum h-10 w-24 rounded-lg border border-hairline bg-surface-2 text-center text-[15px] outline-none"
            />
            <button
              onClick={() => setServings(round(servings + 0.25, 2))}
              className="h-10 w-10 rounded-lg border border-hairline text-lg font-medium hover:bg-surface-2"
              aria-label="More servings"
            >
              +
            </button>
            <div className="ml-1 flex gap-1">
              {[0.5, 1, 1.5, 2].map((n) => (
                <button
                  key={n}
                  onClick={() => setServings(n)}
                  aria-pressed={servings === n}
                  className={`rounded-lg px-2.5 py-1.5 text-xs font-medium ${
                    servings === n
                      ? "bg-protein text-white"
                      : "border border-hairline text-ink-2 hover:bg-surface-2"
                  }`}
                >
                  {n}×
                </button>
              ))}
            </div>
          </div>
          {food.gramsPerServing ? (
            <p className="tnum mt-1.5 text-xs text-muted">
              ≈ {round(food.gramsPerServing * servings)} g
            </p>
          ) : null}
        </div>

        <div role="group" aria-labelledby={mealLabelId}>
          <span
            id={mealLabelId}
            className="mb-2 block text-[11px] font-semibold uppercase tracking-wide text-muted"
          >
            Meal
          </span>
          <div className="grid grid-cols-4 gap-1.5">
            {MEAL_SLOTS.map((s) => (
              <button
                key={s}
                onClick={() => setSlot(s)}
                aria-pressed={slot === s}
                className={`rounded-lg py-2 text-sm font-medium ${
                  slot === s
                    ? "bg-protein text-white"
                    : "border border-hairline text-ink-2 hover:bg-surface-2"
                }`}
              >
                {MEAL_LABELS[s]}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-xl bg-surface-2 p-3">
          <div className="grid grid-cols-4 gap-2 text-center">
            {[
              { l: "kcal", v: round(totals.calories), c: undefined },
              { l: "Protein", v: `${round(totals.protein, 1)}g`, c: "var(--series-protein)" },
              { l: "Carbs", v: `${round(totals.carbs, 1)}g`, c: "var(--series-carbs)" },
              { l: "Fat", v: `${round(totals.fat, 1)}g`, c: "var(--series-fat)" },
            ].map((x) => (
              <div key={x.l}>
                <div className="tnum text-lg font-semibold" style={x.c ? { color: x.c } : undefined}>
                  {x.v}
                </div>
                <div className="text-[10px] font-medium uppercase tracking-wide text-muted">
                  {x.l}
                </div>
              </div>
            ))}
          </div>
        </div>

        {food.note && (
          <p className="text-xs leading-relaxed text-muted">{food.note}</p>
        )}
      </div>

      <div className="flex gap-2 border-t border-hairline p-3">
        {canSave && (
          <button
            onClick={() => onConfirm(true, commit())}
            className="flex-1 rounded-lg border border-hairline py-2.5 text-sm font-semibold text-ink-2 hover:bg-surface-2"
          >
            Save &amp; add
          </button>
        )}
        <button
          onClick={() => onConfirm(false, commit())}
          className="flex-1 rounded-lg bg-protein py-2.5 text-sm font-semibold text-white hover:opacity-90"
        >
          Add to {MEAL_LABELS[slot].toLowerCase()}
        </button>
      </div>
    </div>
  );
}

function ManualEntry({
  initialName,
  onCreate,
}: {
  initialName: string;
  onCreate: (food: Omit<Food, "id" | "createdAt">) => void;
}) {
  const [name, setName] = useState(initialName);
  const [per, setPer] = useState("1 serving");
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");

  const uid = useId();
  const nameId = `${uid}-name`;
  const perId = `${uid}-per`;

  const kcal = Number(calories) || 0;
  const derived = (Number(protein) || 0) * 4 + (Number(carbs) || 0) * 4 + (Number(fat) || 0) * 9;
  const mismatch = kcal > 0 && Math.abs(derived - kcal) / kcal > 0.2;

  const valid = name.trim().length > 0 && calories !== "";

  const fields: Array<[string, string, (v: string) => void, string]> = [
    ["Calories", calories, setCalories, "kcal"],
    ["Protein", protein, setProtein, "g"],
    ["Carbs", carbs, setCarbs, "g"],
    ["Fat", fat, setFat, "g"],
  ];

  return (
    <div className="space-y-4 overflow-y-auto p-4">
      <div>
        <label
          htmlFor={nameId}
          className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-muted"
        >
          Name
        </label>
        <input
          id={nameId}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Deli turkey sandwich"
          className="w-full rounded-lg border border-hairline bg-surface-2 px-3 py-2.5 text-[15px] outline-none placeholder:text-muted"
        />
      </div>

      <div>
        <label
          htmlFor={perId}
          className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-muted"
        >
          One serving is
        </label>
        <input
          id={perId}
          value={per}
          onChange={(e) => setPer(e.target.value)}
          placeholder="e.g. 1 sandwich, 100 g, 1 cup"
          className="w-full rounded-lg border border-hairline bg-surface-2 px-3 py-2.5 text-[15px] outline-none placeholder:text-muted"
        />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {fields.map(([label, value, set, unit]) => {
          const fieldId = `${uid}-${label.toLowerCase()}`;
          return (
            <div key={label}>
              <label
                htmlFor={fieldId}
                className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-muted"
              >
                {label}
              </label>
              <div className="relative">
                <input
                  id={fieldId}
                  type="number"
                  inputMode="decimal"
                  min={0}
                  step="0.1"
                  value={value}
                  onChange={(e) => set(e.target.value)}
                  placeholder="0"
                  className="tnum w-full rounded-lg border border-hairline bg-surface-2 px-3 py-2.5 pr-9 text-[15px] outline-none"
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted">
                  {unit}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {mismatch && (
        <p className="text-xs text-serious">
          ⚠ Those macros work out to about {round(derived)} kcal, not {round(kcal)}. Worth
          double-checking — one of the numbers is probably off.
        </p>
      )}

      <button
        disabled={!valid}
        onClick={() =>
          onCreate({
            name: name.trim(),
            source: "custom",
            per: per.trim() || "1 serving",
            macros: {
              calories: Number(calories) || 0,
              protein: Number(protein) || 0,
              carbs: Number(carbs) || 0,
              fat: Number(fat) || 0,
            },
          })
        }
        className="w-full rounded-lg bg-protein py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
      >
        Create food
      </button>
    </div>
  );
}
