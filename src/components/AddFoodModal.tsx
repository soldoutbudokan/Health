"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Food, MealSlot } from "@/lib/types";
import { MEAL_LABELS, MEAL_SLOTS } from "@/lib/types";
import { round } from "@/lib/nutrition";
import { allFoods, foodLabel, searchFoods } from "@/lib/search";
import { SourceBadge } from "./SourceBadge";

interface Props {
  open: boolean;
  onClose: () => void;
  customFoods: Food[];
  defaultSlot: MealSlot;
  /** Returns the food actually logged, so the caller can offer to save it. */
  onAdd: (food: Food, servings: number, slot: MealSlot) => void;
  /** Persist a web/Claude/manual food into the user's own catalog. */
  onSaveFood: (food: Omit<Food, "id" | "createdAt">) => Food;
}

type Mode = "search" | "manual";

interface AiResult {
  food: Food;
  confidence: "label" | "database" | "estimate";
  sources: string[];
  macroMismatch: number | null;
}

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

  const [ai, setAi] = useState<AiResult | null>(null);
  const [aiState, setAiState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [aiError, setAiError] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  const catalog = useMemo(() => allFoods(customFoods), [customFoods]);
  const localResults = useMemo(
    () => searchFoods(catalog, query, query ? 12 : 8),
    [catalog, query],
  );

  useEffect(() => {
    if (open) {
      setSlot(defaultSlot);
      // Let the dialog mount before stealing focus.
      const t = setTimeout(() => inputRef.current?.focus(), 40);
      return () => clearTimeout(t);
    }
    // Reset everything on close so the next open is a clean slate.
    setQuery("");
    setSelected(null);
    setServings(1);
    setMode("search");
    setWebResults([]);
    setWebState("idle");
    setWebError(null);
    setAi(null);
    setAiState("idle");
    setAiError(null);
  }, [open, defaultSlot]);

  // Typing invalidates the previous remote lookups.
  useEffect(() => {
    setWebResults([]);
    setWebState("idle");
    setWebError(null);
    setAi(null);
    setAiState("idle");
    setAiError(null);
  }, [query]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        if (selected) setSelected(null);
        else onClose();
      }
    }
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose, selected]);

  const searchWeb = useCallback(async () => {
    if (query.trim().length < 2) return;
    setWebState("loading");
    setWebError(null);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      const data = (await res.json()) as { results: Food[]; errors: string[] };
      setWebResults(data.results ?? []);
      setWebError(data.errors?.length ? data.errors.join(" · ") : null);
      setWebState("done");
    } catch {
      setWebState("error");
      setWebError("Could not reach the food databases. Check your connection.");
    }
  }, [query]);

  const askClaude = useCallback(async () => {
    if (query.trim().length < 2) return;
    setAiState("loading");
    setAiError(null);
    try {
      const res = await fetch("/api/ai-lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAiState("error");
        setAiError(data.error ?? "Lookup failed.");
        return;
      }
      setAi(data as AiResult);
      setAiState("done");
    } catch {
      setAiState("error");
      setAiError("Could not reach the lookup service.");
    }
  }, [query]);

  if (!open) return null;

  function choose(food: Food) {
    setSelected(food);
    setServings(1);
  }

  function confirm(alsoSave: boolean) {
    if (!selected) return;
    let food = selected;
    if (alsoSave && selected.source !== "recipe" && selected.source !== "staple") {
      const { id: _id, createdAt: _createdAt, ...rest } = selected;
      void _id;
      void _createdAt;
      food = onSaveFood(rest);
    }
    onAdd(food, servings, slot);
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
                      Nothing in your catalog matches “{query}”. Try the web or Claude below.
                    </p>
                  ) : (
                    localResults.map((f) => (
                      <FoodRow key={f.id} food={f} onClick={() => choose(f)} />
                    ))
                  )}
                </Section>

                {query.trim().length >= 2 && (
                  <>
                    <Section
                      title="Food databases"
                      hint="USDA + Open Food Facts · free, no account"
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

                    <Section
                      title="Ask Claude"
                      hint="Searches the web and works out the macros"
                      action={
                        aiState === "loading" ? (
                          <Spinner />
                        ) : (
                          <ActionButton onClick={askClaude} accent>
                            {aiState === "idle" ? "Look up" : "Retry"}
                          </ActionButton>
                        )
                      }
                    >
                      {aiState === "loading" && (
                        <p className="px-1 py-3 text-sm text-muted">
                          Searching for “{query}”… this usually takes 10–20 seconds.
                        </p>
                      )}
                      {aiError && <p className="px-1 py-1.5 text-sm text-serious">{aiError}</p>}
                      {ai && (
                        <>
                          <FoodRow food={ai.food} onClick={() => choose(ai.food)} />
                          <div className="mt-1 space-y-1 px-1 text-xs text-muted">
                            <p>
                              <ConfidenceChip level={ai.confidence} />{" "}
                              {ai.food.note}
                            </p>
                            {ai.sources.length > 0 && (
                              <p>Sources: {ai.sources.slice(0, 4).join(", ")}</p>
                            )}
                            {ai.macroMismatch !== null && (
                              <p className="text-serious">
                                ⚠ Macros and calories disagree by ~{ai.macroMismatch}% — worth a
                                second look before you rely on it.
                              </p>
                            )}
                          </div>
                        </>
                      )}
                    </Section>
                  </>
                )}
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
  accent,
}: {
  onClick: () => void;
  children: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors ${
        accent
          ? "bg-protein text-white hover:opacity-90"
          : "border border-hairline text-ink-2 hover:bg-surface-2"
      }`}
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

function ConfidenceChip({ level }: { level: "label" | "database" | "estimate" }) {
  const map = {
    label: { text: "From label", color: "var(--status-good)" },
    database: { text: "From database", color: "var(--series-protein)" },
    estimate: { text: "Estimated", color: "var(--status-warning)" },
  } as const;
  const m = map[level];
  return (
    <span
      className="mr-1 inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
      style={{ color: m.color, background: "var(--surface-2)" }}
    >
      {m.text}
    </span>
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
  onConfirm: (alsoSave: boolean) => void;
}) {
  const m = food.macros;
  const isBuiltin = food.source === "recipe" || food.source === "staple";
  const alreadyMine = food.id.startsWith("custom-");
  const canSave = !isBuiltin && !alreadyMine;

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
          <label className="mb-2 block text-[11px] font-semibold uppercase tracking-wide text-muted">
            Servings
          </label>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setServings(Math.max(0.25, round(servings - 0.25, 2)))}
              className="h-10 w-10 rounded-lg border border-hairline text-lg font-medium hover:bg-surface-2"
              aria-label="Fewer servings"
            >
              −
            </button>
            <input
              type="number"
              min={0.25}
              step={0.25}
              value={servings}
              onChange={(e) => setServings(Math.max(0, Number(e.target.value) || 0))}
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

        <div>
          <label className="mb-2 block text-[11px] font-semibold uppercase tracking-wide text-muted">
            Meal
          </label>
          <div className="grid grid-cols-4 gap-1.5">
            {MEAL_SLOTS.map((s) => (
              <button
                key={s}
                onClick={() => setSlot(s)}
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
            onClick={() => onConfirm(true)}
            className="flex-1 rounded-lg border border-hairline py-2.5 text-sm font-semibold text-ink-2 hover:bg-surface-2"
          >
            Save &amp; add
          </button>
        )}
        <button
          onClick={() => onConfirm(false)}
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
        <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-muted">
          Name
        </label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Deli turkey sandwich"
          className="w-full rounded-lg border border-hairline bg-surface-2 px-3 py-2.5 text-[15px] outline-none placeholder:text-muted"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-muted">
          One serving is
        </label>
        <input
          value={per}
          onChange={(e) => setPer(e.target.value)}
          placeholder="e.g. 1 sandwich, 100 g, 1 cup"
          className="w-full rounded-lg border border-hairline bg-surface-2 px-3 py-2.5 text-[15px] outline-none placeholder:text-muted"
        />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {fields.map(([label, value, set, unit]) => (
          <div key={label}>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-muted">
              {label}
            </label>
            <div className="relative">
              <input
                type="number"
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
        ))}
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
