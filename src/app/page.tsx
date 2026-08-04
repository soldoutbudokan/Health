"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Food, MealSlot } from "@/lib/types";
import { useAppData } from "@/lib/store";
import {
  addDays,
  computeProgress,
  entriesForDate,
  formatDateKey,
  proteinPace,
  proteinStreak,
  rollingAverage,
  round,
  sumEntries,
  toDateKey,
} from "@/lib/nutrition";
import { allFoods, suggestGapClosers } from "@/lib/search";
import { CalorieRing, MacroSplit, ProteinRing } from "@/components/Meters";
import { MealList } from "@/components/MealList";
import { AddFoodModal } from "@/components/AddFoodModal";
import { GapClosers, QuickAdd, StatTile } from "@/components/StatTiles";
import { TrendChart, type TrendPoint } from "@/components/TrendChart";
import { UndoToast } from "@/components/UndoToast";

export default function Dashboard() {
  const store = useAppData();
  const { data, loaded, undo } = store;

  const [date, setDate] = useState(() => toDateKey());
  const [modalOpen, setModalOpen] = useState(false);
  const [modalSlot, setModalSlot] = useState<MealSlot>("breakfast");

  const dayEntries = useMemo(
    () => entriesForDate(data.entries, date),
    [data.entries, date],
  );
  const totals = useMemo(() => sumEntries(dayEntries), [dayEntries]);
  const progress = useMemo(
    () => computeProgress(totals, data.goals),
    [totals, data.goals],
  );

  const isToday = date === toDateKey();
  const pace = useMemo(
    () => proteinPace(totals, data.goals),
    [totals, data.goals],
  );

  const catalog = useMemo(() => allFoods(data.customFoods), [data.customFoods]);
  const favorites = useMemo(
    () =>
      data.favorites
        .map((id) => catalog.find((f) => f.id === id))
        .filter((f): f is Food => Boolean(f)),
    [data.favorites, catalog],
  );

  const gapClosers = useMemo(
    () =>
      suggestGapClosers(
        catalog,
        progress.protein.toMin,
        progress.calories.remaining,
      ),
    [catalog, progress.protein.toMin, progress.calories.remaining],
  );

  const trend = useMemo(() => {
    const days = 14;
    const cal: TrendPoint[] = [];
    const prot: TrendPoint[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = addDays(date, -i);
      const es = entriesForDate(data.entries, d);
      const t = sumEntries(es);
      cal.push({ date: d, value: t.calories, logged: es.length > 0 });
      prot.push({ date: d, value: t.protein, logged: es.length > 0 });
    }
    return { cal, prot };
  }, [data.entries, date]);

  const { avg: avg7, loggedDays: logged7 } = useMemo(
    () => rollingAverage(data.entries, date, 7),
    [data.entries, date],
  );
  const streak = useMemo(
    () => proteinStreak(data.entries, data.goals),
    [data.entries, data.goals],
  );

  const yesterday = addDays(date, -1);
  const hasYesterday = data.entries.some((e) => e.date === yesterday);

  function openModal(slot: MealSlot) {
    setModalSlot(slot);
    setModalOpen(true);
  }

  function quickLog(food: Food) {
    const hour = new Date().getHours();
    const slot: MealSlot =
      hour < 11 ? "breakfast" : hour < 15 ? "lunch" : hour < 21 ? "dinner" : "snack";
    store.addEntry(food, 1, slot, date);
  }

  if (!loaded) {
    return (
      <div className="grid min-h-[50vh] place-items-center text-sm text-muted">
        Loading your log…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Date bar */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setDate(addDays(date, -1))}
          aria-label="Previous day"
          className="rounded-lg border border-hairline px-2.5 py-1.5 text-ink-2 hover:bg-surface-2"
        >
          ‹
        </button>
        <h1 className="text-lg font-semibold">{formatDateKey(date)}</h1>
        <button
          onClick={() => setDate(addDays(date, 1))}
          disabled={isToday}
          aria-label="Next day"
          className="rounded-lg border border-hairline px-2.5 py-1.5 text-ink-2 hover:bg-surface-2 disabled:opacity-30"
        >
          ›
        </button>
        {!isToday && (
          <button
            onClick={() => setDate(toDateKey())}
            className="rounded-lg px-2 py-1.5 text-sm font-medium text-protein hover:bg-surface-2"
          >
            Today
          </button>
        )}
        <div className="ml-auto flex items-center gap-2">
          {dayEntries.length === 0 && hasYesterday && (
            <button
              onClick={() => store.copyDay(yesterday, date)}
              className="rounded-lg border border-hairline px-2.5 py-1.5 text-xs font-medium text-ink-2 hover:bg-surface-2"
            >
              Copy yesterday
            </button>
          )}
          <button
            onClick={() => openModal("snack")}
            className="rounded-lg bg-protein px-3 py-1.5 text-sm font-semibold text-white hover:opacity-90"
          >
            + Log food
          </button>
        </div>
      </div>

      {/* Hero meters */}
      <section className="card p-5">
        <div className="flex flex-wrap items-center justify-center gap-8 sm:justify-around">
          <CalorieRing consumed={totals.calories} goal={data.goals.calories} />
          <ProteinRing
            consumed={totals.protein}
            min={data.goals.proteinMin}
            max={data.goals.proteinMax}
          />
        </div>
        <div className="mt-5 border-t border-hairline pt-4">
          <MacroSplit
            protein={totals.protein}
            carbs={totals.carbs}
            fat={totals.fat}
          />
        </div>
      </section>

      {/* KPI row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile
          label="Protein pace"
          value={
            progress.protein.toMin === 0 ? "Done" : `${round(pace.perMeal)}g`
          }
          unit={progress.protein.toMin === 0 ? undefined : "/ meal"}
          hint={pace.label}
          tone={progress.protein.toMin === 0 ? "good" : "neutral"}
        />
        <StatTile
          label="Protein streak"
          value={streak}
          unit={streak === 1 ? "day" : "days"}
          hint={
            streak === 0
              ? `Hit ${data.goals.proteinMin}g to start one`
              : "Consecutive days at target"
          }
          tone={streak >= 3 ? "good" : "neutral"}
        />
        <StatTile
          label="Avg kcal · 7d"
          value={logged7 > 0 ? round(avg7.calories).toLocaleString() : "—"}
          hint={
            logged7 > 0
              ? `Over ${logged7} logged day${logged7 === 1 ? "" : "s"} · target ${data.goals.calories.toLocaleString()}`
              : "No days logged yet"
          }
          tone={
            logged7 > 0 && Math.abs(avg7.calories - data.goals.calories) <= 200
              ? "good"
              : "neutral"
          }
        />
        <StatTile
          label="Avg protein · 7d"
          value={logged7 > 0 ? round(avg7.protein) : "—"}
          unit={logged7 > 0 ? "g" : undefined}
          hint={
            logged7 > 0
              ? `Over ${logged7} logged day${logged7 === 1 ? "" : "s"} · target ${data.goals.proteinMin}–${data.goals.proteinMax}g`
              : "No days logged yet"
          }
          tone={logged7 > 0 && avg7.protein >= data.goals.proteinMin ? "good" : "neutral"}
        />
      </div>

      {/* Gap closers — only when there's actually a gap */}
      {progress.protein.toMin > 0 && dayEntries.length > 0 && (
        <GapClosers
          foods={gapClosers}
          needProtein={progress.protein.toMin}
          remainingCalories={progress.calories.remaining}
          onPick={quickLog}
        />
      )}

      {favorites.length > 0 && (
        <QuickAdd
          foods={favorites}
          onPick={quickLog}
          onManage={() => {
            window.location.href = "/foods";
          }}
        />
      )}

      {/* The log */}
      <MealList
        entries={dayEntries}
        onRemove={store.removeEntry}
        onAdd={openModal}
        onServings={store.updateServings}
      />

      {dayEntries.length === 0 && (
        <div className="card p-8 text-center">
          <p className="text-sm text-ink-2">Nothing logged for {formatDateKey(date).toLowerCase()} yet.</p>
          <p className="mt-1 text-xs text-muted">
            Your 23 recipes, the bars, and the shakes are already in the catalog — start
            typing and they&apos;ll come up.
          </p>
          <button
            onClick={() => openModal("breakfast")}
            className="mt-4 rounded-lg bg-protein px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
          >
            Log the first thing
          </button>
        </div>
      )}

      {/* Trends — two charts, never one with two y-axes */}
      <div className="grid gap-3 sm:grid-cols-2">
        <TrendChart
          title="Calories · last 14 days"
          unit="kcal"
          points={trend.cal}
          color="var(--series-carbs)"
          goal={data.goals.calories}
        />
        <TrendChart
          title="Protein · last 14 days"
          unit="g"
          points={trend.prot}
          color="var(--series-protein)"
          band={{ min: data.goals.proteinMin, max: data.goals.proteinMax }}
        />
      </div>

      <p className="pb-2 text-center text-xs text-muted">
        <Link href="/history" className="hover:text-ink">
          Full history &amp; export →
        </Link>
      </p>

      <AddFoodModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        customFoods={data.customFoods}
        defaultSlot={modalSlot}
        onAdd={(food, servings, slot) => store.addEntry(food, servings, slot, date)}
        onSaveFood={store.addCustomFood}
      />

      {undo && (
        <UndoToast
          label={undo.label}
          onUndo={store.undoRemove}
          onDismiss={store.dismissUndo}
        />
      )}
    </div>
  );
}
