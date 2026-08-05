"use client";

/**
 * Open Food Facts search, run straight from the browser.
 *
 * This used to be a server route that fanned out to Open Food Facts *and* USDA
 * FoodData Central. The app is now a static export with no server, so the two
 * databases no longer sit behind the same door:
 *
 *  - Open Food Facts needs no credential and sends permissive CORS headers, so
 *    the browser can call it directly. It moved here unchanged.
 *  - USDA requires an API key. A key in a static bundle is world-readable and
 *    would be scraped and burnt, so USDA is dropped rather than shipped
 *    insecurely. Whole foods are covered by the built-in staples catalog.
 *
 * The one behavioural difference from the old route is the `User-Agent` header
 * it set: browsers forbid scripts from setting that, so it is simply absent.
 */

import type { Food, Macros } from "./types";

const OFF_SEARCH = "https://world.openfoodfacts.org/cgi/search.pl";
const OFF_BARCODE = "https://world.openfoodfacts.org/api/v2/product";

function num(v: unknown): number | undefined {
  const n = typeof v === "string" ? parseFloat(v) : (v as number);
  return typeof n === "number" && Number.isFinite(n) ? n : undefined;
}

function clean(m: Partial<Macros>): Macros | null {
  const calories = num(m.calories);
  const protein = num(m.protein) ?? 0;
  const carbs = num(m.carbs) ?? 0;
  const fat = num(m.fat) ?? 0;
  // A food with no energy value is useless for tracking; drop it.
  if (calories === undefined) return null;
  return {
    calories: Math.round(calories * 10) / 10,
    protein: Math.round(protein * 10) / 10,
    carbs: Math.round(carbs * 10) / 10,
    fat: Math.round(fat * 10) / 10,
    fiber: num(m.fiber),
    sugar: num(m.sugar),
    sodium: num(m.sodium),
  };
}

interface OffProduct {
  code?: string;
  product_name?: string;
  brands?: string;
  quantity?: string;
  serving_size?: string;
  serving_quantity?: number | string;
  nutriments?: Record<string, unknown>;
}

function offToFood(p: OffProduct): Food | null {
  const n = p.nutriments ?? {};
  const name = (p.product_name ?? "").trim();
  if (!name) return null;

  // Prefer per-serving values when the product declares a serving; fall back
  // to per-100g, which every OFF product has.
  const hasServing = num(n["energy-kcal_serving"]) !== undefined;
  const suffix = hasServing ? "_serving" : "_100g";

  const macros = clean({
    calories: num(n[`energy-kcal${suffix}`]),
    protein: num(n[`proteins${suffix}`]),
    carbs: num(n[`carbohydrates${suffix}`]),
    fat: num(n[`fat${suffix}`]),
    fiber: num(n[`fiber${suffix}`]),
    sugar: num(n[`sugars${suffix}`]),
    sodium: (() => {
      const grams = num(n[`sodium${suffix}`]);
      // OFF reports sodium in grams; the app stores milligrams.
      return grams === undefined ? undefined : Math.round(grams * 1000);
    })(),
  });
  if (!macros) return null;

  const grams = hasServing ? num(p.serving_quantity) : 100;

  return {
    id: `off-${p.code ?? name.toLowerCase().replace(/\s+/g, "-")}`,
    name,
    brand: (p.brands ?? "").split(",")[0]?.trim() || undefined,
    source: "off",
    per: hasServing ? (p.serving_size?.trim() || "1 serving") : "100 g",
    gramsPerServing: grams,
    macros,
    note: `Open Food Facts${p.code ? ` · barcode ${p.code}` : ""}. Crowd-sourced label data — spot-check anything that looks off.`,
  };
}

async function fetchJSON(url: string, timeoutMs = 8000): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Look a food up on Open Food Facts.
 *
 * Queries of 8–14 digits are treated as barcodes and go straight to the
 * product endpoint — an exact hit beats a text search every time. Anything
 * else is a text search.
 *
 * Rejects if the network call fails or times out; the caller decides how loudly
 * to say so.
 */
export async function searchOpenFoodFacts(query: string): Promise<Food[]> {
  const q = query.trim();
  if (q.length < 2) return [];

  // A pure-digit query is a barcode — go straight to the product endpoint.
  if (/^\d{8,14}$/.test(q)) {
    const data = (await fetchJSON(`${OFF_BARCODE}/${q}.json`)) as {
      product?: OffProduct;
      status?: number;
    };
    const food = data.product ? offToFood(data.product) : null;
    return food ? [food] : [];
  }

  const url =
    `${OFF_SEARCH}?search_terms=${encodeURIComponent(q)}` +
    `&search_simple=1&action=process&json=1&page_size=12`;
  const data = (await fetchJSON(url)) as { products?: OffProduct[] };
  return (data.products ?? [])
    .map(offToFood)
    .filter((f): f is Food => f !== null);
}
