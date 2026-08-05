"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  type AppData,
  type Food,
  type Goals,
  type LogEntry,
  type MealSlot,
  EMPTY_DATA,
} from "./types";
import { toDateKey } from "./nutrition";
import { SEED_FAVORITES, buildSeedEntries } from "@/data/seed";

const STORAGE_KEY = "nutrition-calculator:v1";

function makeId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

const now = () => new Date().toISOString();

function seeded(): AppData {
  return {
    ...EMPTY_DATA,
    entries: buildSeedEntries(toDateKey()),
    favorites: SEED_FAVORITES,
  };
}

/**
 * Coerce anything claiming to be `AppData` into something safe to render.
 *
 * This runs on the stored blob *and* on restored backups. A hand-edited or
 * truncated file that reached state unchecked would crash on the first
 * `.filter`, and a zero protein goal would divide the rings by zero — so the
 * numeric floors here are load-bearing, not defensive decoration.
 */
function normalize(parsed: Partial<AppData>): AppData {
  const goals = { ...EMPTY_DATA.goals, ...(parsed.goals ?? {}) };
  const num = (v: unknown, fallback: number, min: number) =>
    typeof v === "number" && Number.isFinite(v) && v >= min ? v : fallback;

  return {
    version: 1,
    goals: {
      ...goals,
      calories: num(goals.calories, EMPTY_DATA.goals.calories, 1),
      proteinMin: num(goals.proteinMin, EMPTY_DATA.goals.proteinMin, 1),
      proteinMax: num(goals.proteinMax, EMPTY_DATA.goals.proteinMax, 1),
    },
    entries: Array.isArray(parsed.entries) ? parsed.entries : [],
    customFoods: Array.isArray(parsed.customFoods) ? parsed.customFoods : [],
    favorites: Array.isArray(parsed.favorites) ? parsed.favorites : [],
    deletions:
      parsed.deletions && typeof parsed.deletions === "object"
        ? parsed.deletions
        : {},
    goalsUpdatedAt: parsed.goalsUpdatedAt,
    favoritesUpdatedAt: parsed.favoritesUpdatedAt,
  };
}

function load(): AppData {
  if (typeof window === "undefined") return EMPTY_DATA;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    // No key at all means a genuine first run — seed day one. An existing key
    // is respected even when it holds an empty log, so clearing stays cleared.
    if (raw === null) return seeded();
    if (!raw) return EMPTY_DATA;
    return normalize(JSON.parse(raw) as Partial<AppData>);
  } catch {
    // A corrupt blob shouldn't brick the app. Start clean but don't clobber
    // the bad value — it stays in localStorage so it can be recovered by hand.
    return EMPTY_DATA;
  }
}

export interface UndoState {
  entry: LogEntry;
  /** Where it sat before removal, so undo puts it back rather than at the end. */
  index: number;
  label: string;
}

export function useAppData() {
  const [data, setData] = useState<AppData>(EMPTY_DATA);
  const [loaded, setLoaded] = useState(false);
  const [undo, setUndoState] = useState<UndoState | null>(null);
  const undoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Mirrors of the two pieces of state that callbacks need to *read*.
  // Without these, reading them would mean doing work inside a setState
  // updater, which React requires to be pure — and under StrictMode it runs
  // updaters twice, so any dispatch in there fires twice too.
  const dataRef = useRef(data);
  const undoRef = useRef(undo);

  const setUndo = useCallback((u: UndoState | null) => {
    undoRef.current = u;
    setUndoState(u);
  }, []);

  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  useEffect(() => {
    setData(load());
    setLoaded(true);
  }, []);

  // Persist on every change, but only after the initial load has replaced the
  // empty default — otherwise the first render would wipe stored data.
  useEffect(() => {
    if (!loaded) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      // Quota exceeded or storage disabled. The app keeps working in memory.
    }
  }, [data, loaded]);

  // Keep multiple tabs in sync, including a tab that clears storage entirely.
  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key === STORAGE_KEY) setData(load());
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // A pending undo must not outlive the component that owns it.
  useEffect(() => {
    return () => {
      if (undoTimer.current) clearTimeout(undoTimer.current);
    };
  }, []);

  const addEntry = useCallback(
    (food: Food, servings: number, slot: MealSlot, date = toDateKey()) => {
      const at = now();
      const entry: LogEntry = {
        id: makeId(),
        date,
        slot,
        foodId: food.id,
        name: food.name,
        variant: food.variant,
        brand: food.brand,
        source: food.source,
        per: food.per,
        servings,
        macros: food.macros,
        loggedAt: at,
        updatedAt: at,
      };
      setData((d) => ({ ...d, entries: [...d.entries, entry] }));
      return entry;
    },
    [],
  );

  const removeEntry = useCallback(
    (id: string) => {
      const entries = dataRef.current.entries;
      const index = entries.findIndex((e) => e.id === id);
      if (index === -1) return;

      setUndo({ entry: entries[index], index, label: entries[index].name });
      if (undoTimer.current) clearTimeout(undoTimer.current);
      undoTimer.current = setTimeout(() => setUndo(null), 8000);

      setData((d) => ({
        ...d,
        entries: d.entries.filter((e) => e.id !== id),
        // The tombstone is what stops a peer that still holds this entry from
        // handing it back on the next sync.
        deletions: { ...(d.deletions ?? {}), [id]: now() },
      }));
    },
    [setUndo],
  );

  const undoRemove = useCallback(() => {
    const u = undoRef.current;
    if (!u) return;
    if (undoTimer.current) clearTimeout(undoTimer.current);
    setUndo(null);

    setData((d) => {
      const entries = [...d.entries];
      entries.splice(Math.min(u.index, entries.length), 0, {
        ...u.entry,
        // Post-dating the restore is what lets it win against its own
        // tombstone when the merge compares the two.
        updatedAt: now(),
      });
      const deletions = { ...(d.deletions ?? {}) };
      delete deletions[u.entry.id];
      return { ...d, entries, deletions };
    });
  }, [setUndo]);

  const dismissUndo = useCallback(() => {
    if (undoTimer.current) clearTimeout(undoTimer.current);
    setUndo(null);
  }, [setUndo]);

  const updateServings = useCallback((id: string, servings: number) => {
    setData((d) => ({
      ...d,
      entries: d.entries.map((e) =>
        e.id === id ? { ...e, servings, updatedAt: now() } : e,
      ),
    }));
  }, []);

  const moveEntry = useCallback((id: string, slot: MealSlot) => {
    setData((d) => ({
      ...d,
      entries: d.entries.map((e) =>
        e.id === id ? { ...e, slot, updatedAt: now() } : e,
      ),
    }));
  }, []);

  const addCustomFood = useCallback((food: Omit<Food, "id" | "createdAt">) => {
    const created: Food = {
      ...food,
      id: `custom-${makeId()}`,
      createdAt: now(),
    };
    setData((d) => ({ ...d, customFoods: [...d.customFoods, created] }));
    return created;
  }, []);

  const removeCustomFood = useCallback((id: string) => {
    setData((d) => ({
      ...d,
      customFoods: d.customFoods.filter((f) => f.id !== id),
      favorites: d.favorites.filter((f) => f !== id),
      favoritesUpdatedAt: now(),
    }));
  }, []);

  const toggleFavorite = useCallback((id: string) => {
    setData((d) => ({
      ...d,
      favorites: d.favorites.includes(id)
        ? d.favorites.filter((f) => f !== id)
        : [...d.favorites, id],
      favoritesUpdatedAt: now(),
    }));
  }, []);

  const setGoals = useCallback((goals: Goals) => {
    setData((d) => ({ ...d, goals, goalsUpdatedAt: now() }));
  }, []);

  /** Copy a whole day's log onto another date — "same as yesterday". */
  const copyDay = useCallback((from: string, to: string) => {
    setData((d) => {
      const at = now();
      const copies = d.entries
        .filter((e) => e.date === from)
        .map((e) => ({ ...e, id: makeId(), date: to, loggedAt: at, updatedAt: at }));
      return { ...d, entries: [...d.entries, ...copies] };
    });
  }, []);

  /** Adopt a whole snapshot — a restored backup, or the result of a sync. */
  const replaceAll = useCallback((next: AppData) => {
    setData(normalize(next));
  }, []);

  const clearAll = useCallback(() => {
    // Spread rather than reuse the module constant, so nothing downstream can
    // reach the shared default object.
    setData({ ...EMPTY_DATA, deletions: {} });
  }, []);

  const actions = useMemo(
    () => ({
      addEntry,
      removeEntry,
      undoRemove,
      dismissUndo,
      updateServings,
      moveEntry,
      addCustomFood,
      removeCustomFood,
      toggleFavorite,
      setGoals,
      copyDay,
      replaceAll,
      clearAll,
    }),
    [
      addEntry,
      removeEntry,
      undoRemove,
      dismissUndo,
      updateServings,
      moveEntry,
      addCustomFood,
      removeCustomFood,
      toggleFavorite,
      setGoals,
      copyDay,
      replaceAll,
      clearAll,
    ],
  );

  return { data, loaded, undo, ...actions };
}

export type Store = ReturnType<typeof useAppData>;
