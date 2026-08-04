import { NextResponse } from "next/server";
import type { Food, Macros } from "@/lib/types";

export const runtime = "nodejs";

/**
 * Free food databases, queried server-side so keys stay off the client.
 *
 *  - Open Food Facts  — no key, best for branded/packaged goods and barcodes.
 *  - USDA FoodData Central — free key, best for generic whole foods.
 *
 * Both are queried in parallel and merged; whichever answers, answers. A
 * failure in one never blocks the other.
 */

const OFF_SEARCH = "https://world.openfoodfacts.org/cgi/search.pl";
const OFF_BARCODE = "https://world.openfoodfacts.org/api/v2/product";
const USDA_SEARCH = "https://api.nal.usda.gov/fdc/v1/foods/search";

const UA = "NutritionCalculator/1.0 (personal macro tracker)";

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
      const mg = num(n[`sodium${suffix}`]);
      // OFF reports sodium in grams.
      return mg === undefined ? undefined : Math.round(mg * 1000);
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

interface UsdaNutrient {
  nutrientNumber?: string;
  nutrientName?: string;
  value?: number;
  unitName?: string;
}

interface UsdaFood {
  fdcId?: number;
  description?: string;
  brandName?: string;
  brandOwner?: string;
  dataType?: string;
  servingSize?: number;
  servingSizeUnit?: string;
  householdServingFullText?: string;
  foodNutrients?: UsdaNutrient[];
}

// USDA nutrient numbers are stable identifiers; names are not.
const USDA_NUM = {
  calories: "208",
  protein: "203",
  fat: "204",
  carbs: "205",
  fiber: "291",
  sugar: "269",
  sodium: "307",
};

function usdaToFood(f: UsdaFood): Food | null {
  const name = (f.description ?? "").trim();
  if (!name) return null;

  const by = new Map<string, number>();
  for (const n of f.foodNutrients ?? []) {
    if (n.nutrientNumber && typeof n.value === "number") {
      by.set(n.nutrientNumber, n.value);
    }
  }

  // USDA search results are per 100 g. Branded foods also carry a serving size,
  // so scale to the real serving where we can — that is what people log.
  const per100 = {
    calories: by.get(USDA_NUM.calories),
    protein: by.get(USDA_NUM.protein),
    carbs: by.get(USDA_NUM.carbs),
    fat: by.get(USDA_NUM.fat),
    fiber: by.get(USDA_NUM.fiber),
    sugar: by.get(USDA_NUM.sugar),
    sodium: by.get(USDA_NUM.sodium),
  };

  const servingGrams =
    f.servingSizeUnit?.toLowerCase() === "g" && f.servingSize
      ? f.servingSize
      : undefined;
  const factor = servingGrams ? servingGrams / 100 : 1;

  const macros = clean({
    calories: per100.calories === undefined ? undefined : per100.calories * factor,
    protein: (per100.protein ?? 0) * factor,
    carbs: (per100.carbs ?? 0) * factor,
    fat: (per100.fat ?? 0) * factor,
    fiber: per100.fiber === undefined ? undefined : per100.fiber * factor,
    sugar: per100.sugar === undefined ? undefined : per100.sugar * factor,
    sodium: per100.sodium === undefined ? undefined : per100.sodium * factor,
  });
  if (!macros) return null;

  const per = servingGrams
    ? f.householdServingFullText?.trim()
      ? `${f.householdServingFullText.trim()} (${servingGrams} g)`
      : `${servingGrams} g`
    : "100 g";

  return {
    id: `usda-${f.fdcId ?? name}`,
    name,
    brand: (f.brandName || f.brandOwner || "").trim() || undefined,
    source: "usda",
    per,
    gramsPerServing: servingGrams ?? 100,
    macros,
    note: `USDA FoodData Central${f.dataType ? ` · ${f.dataType}` : ""}.`,
  };
}

async function fetchJSON(url: string, timeoutMs = 8000): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": UA, Accept: "application/json" },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

async function searchOFF(q: string): Promise<Food[]> {
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

async function searchUSDA(q: string): Promise<Food[]> {
  const key = process.env.USDA_API_KEY || "DEMO_KEY";
  const url =
    `${USDA_SEARCH}?api_key=${encodeURIComponent(key)}` +
    `&query=${encodeURIComponent(q)}&pageSize=12` +
    `&dataType=${encodeURIComponent("Foundation,SR Legacy,Branded")}`;
  const data = (await fetchJSON(url)) as { foods?: UsdaFood[] };
  return (data.foods ?? []).map(usdaToFood).filter((f): f is Food => f !== null);
}

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) {
    return NextResponse.json({ results: [], errors: [] });
  }

  const [off, usda] = await Promise.allSettled([searchOFF(q), searchUSDA(q)]);

  const results: Food[] = [];
  const errors: string[] = [];

  if (off.status === "fulfilled") results.push(...off.value);
  else errors.push(`Open Food Facts unavailable (${String(off.reason).slice(0, 80)})`);

  if (usda.status === "fulfilled") results.push(...usda.value);
  else {
    const hint = process.env.USDA_API_KEY
      ? ""
      : " — set USDA_API_KEY in .env.local, the shared DEMO_KEY is rate limited";
    errors.push(`USDA unavailable${hint}`);
  }

  // Interleave the two sources so neither dominates the top of the list.
  const offOnly = results.filter((r) => r.source === "off");
  const usdaOnly = results.filter((r) => r.source === "usda");
  const merged: Food[] = [];
  for (let i = 0; i < Math.max(offOnly.length, usdaOnly.length); i++) {
    if (offOnly[i]) merged.push(offOnly[i]);
    if (usdaOnly[i]) merged.push(usdaOnly[i]);
  }

  return NextResponse.json({ results: merged.slice(0, 20), errors });
}
