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

function seeded(): AppData {
  return {
    ...EMPTY_DATA,
    entries: buildSeedEntries(toDateKey()),
    favorites: SEED_FAVORITES,
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
    const parsed = JSON.parse(raw) as Partial<AppData>;
    return {
      version: 1,
      goals: { ...EMPTY_DATA.goals, ...(parsed.goals ?? {}) },
      entries: Array.isArray(parsed.entries) ? parsed.entries : [],
      customFoods: Array.isArray(parsed.customFoods) ? parsed.customFoods : [],
      favorites: Array.isArray(parsed.favorites) ? parsed.favorites : [],
    };
  } catch {
    // A corrupt blob shouldn't brick the app. Start clean but don't clobber
    // the bad value — it stays in localStorage so it can be recovered by hand.
    return EMPTY_DATA;
  }
}

export interface UndoState {
  entry: LogEntry;
  label: string;
}

export function useAppData() {
  const [data, setData] = useState<AppData>(EMPTY_DATA);
  const [loaded, setLoaded] = useState(false);
  const [undo, setUndo] = useState<UndoState | null>(null);
  const undoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  // Keep multiple tabs in sync.
  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key === STORAGE_KEY && e.newValue) setData(load());
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const addEntry = useCallback(
    (food: Food, servings: number, slot: MealSlot, date = toDateKey()) => {
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
        loggedAt: new Date().toISOString(),
      };
      setData((d) => ({ ...d, entries: [...d.entries, entry] }));
      return entry;
    },
    [],
  );

  const removeEntry = useCallback((id: string) => {
    setData((d) => {
      const entry = d.entries.find((e) => e.id === id);
      if (entry) {
        setUndo({ entry, label: entry.name });
        if (undoTimer.current) clearTimeout(undoTimer.current);
        undoTimer.current = setTimeout(() => setUndo(null), 8000);
      }
      return { ...d, entries: d.entries.filter((e) => e.id !== id) };
    });
  }, []);

  const undoRemove = useCallback(() => {
    setUndo((u) => {
      if (u) setData((d) => ({ ...d, entries: [...d.entries, u.entry] }));
      if (undoTimer.current) clearTimeout(undoTimer.current);
      return null;
    });
  }, []);

  const dismissUndo = useCallback(() => {
    if (undoTimer.current) clearTimeout(undoTimer.current);
    setUndo(null);
  }, []);

  const updateServings = useCallback((id: string, servings: number) => {
    setData((d) => ({
      ...d,
      entries: d.entries.map((e) => (e.id === id ? { ...e, servings } : e)),
    }));
  }, []);

  const moveEntry = useCallback((id: string, slot: MealSlot) => {
    setData((d) => ({
      ...d,
      entries: d.entries.map((e) => (e.id === id ? { ...e, slot } : e)),
    }));
  }, []);

  const addCustomFood = useCallback((food: Omit<Food, "id" | "createdAt">) => {
    const created: Food = {
      ...food,
      id: `custom-${makeId()}`,
      createdAt: new Date().toISOString(),
    };
    setData((d) => ({ ...d, customFoods: [...d.customFoods, created] }));
    return created;
  }, []);

  const removeCustomFood = useCallback((id: string) => {
    setData((d) => ({
      ...d,
      customFoods: d.customFoods.filter((f) => f.id !== id),
      favorites: d.favorites.filter((f) => f !== id),
    }));
  }, []);

  const toggleFavorite = useCallback((id: string) => {
    setData((d) => ({
      ...d,
      favorites: d.favorites.includes(id)
        ? d.favorites.filter((f) => f !== id)
        : [...d.favorites, id],
    }));
  }, []);

  const setGoals = useCallback((goals: Goals) => {
    setData((d) => ({ ...d, goals }));
  }, []);

  /** Copy a whole day's log onto another date — "same as yesterday". */
  const copyDay = useCallback((from: string, to: string) => {
    setData((d) => {
      const source = d.entries.filter((e) => e.date === from);
      const copies = source.map((e) => ({
        ...e,
        id: makeId(),
        date: to,
        loggedAt: new Date().toISOString(),
      }));
      return { ...d, entries: [...d.entries, ...copies] };
    });
  }, []);

  const replaceAll = useCallback((next: AppData) => {
    setData(next);
  }, []);

  const clearAll = useCallback(() => {
    setData(EMPTY_DATA);
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
