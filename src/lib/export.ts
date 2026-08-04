import type { AppData, LogEntry, Macros } from "./types";
import {
  entriesForDate,
  entryMacros,
  formatDateKey,
  loggedDates,
  round,
  sumEntries,
} from "./nutrition";

function csvCell(v: string | number | undefined): string {
  if (v === undefined) return "";
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/**
 * One row per logged item, with the day's totals repeated is *not* done here —
 * totals are their own rows at the end so the file imports cleanly into a
 * spreadsheet or another tracker without duplicate-counting.
 */
export function toCSV(entries: LogEntry[]): string {
  const header = [
    "date",
    "meal",
    "food",
    "variant",
    "brand",
    "serving",
    "servings",
    "calories",
    "protein_g",
    "carbs_g",
    "fat_g",
    "fiber_g",
    "sugar_g",
    "sodium_mg",
    "source",
    "logged_at",
  ];

  const rows = [...entries]
    .sort((a, b) => a.date.localeCompare(b.date) || a.loggedAt.localeCompare(b.loggedAt))
    .map((e) => {
      const m = entryMacros(e);
      return [
        e.date,
        e.slot,
        e.name,
        e.variant ?? "",
        e.brand ?? "",
        e.per,
        round(e.servings, 2),
        round(m.calories),
        round(m.protein, 1),
        round(m.carbs, 1),
        round(m.fat, 1),
        m.fiber ? round(m.fiber, 1) : "",
        m.sugar ? round(m.sugar, 1) : "",
        m.sodium ? round(m.sodium) : "",
        e.source,
        e.loggedAt,
      ].map(csvCell).join(",");
    });

  return [header.join(","), ...rows].join("\n");
}

/** Day-level CSV — one row per day. What most trackers actually want. */
export function toDailyCSV(entries: LogEntry[]): string {
  const header = [
    "date",
    "calories",
    "protein_g",
    "carbs_g",
    "fat_g",
    "fiber_g",
    "items",
  ];
  const rows = loggedDates(entries)
    .sort()
    .map((date) => {
      const dayEntries = entriesForDate(entries, date);
      const m = sumEntries(dayEntries);
      return [
        date,
        round(m.calories),
        round(m.protein, 1),
        round(m.carbs, 1),
        round(m.fat, 1),
        round(m.fiber ?? 0, 1),
        dayEntries.length,
      ].join(",");
    });
  return [header.join(","), ...rows].join("\n");
}

function macroLine(m: Macros): string {
  const parts = [
    `${round(m.calories)} kcal`,
    `${round(m.protein, 1)}g protein`,
    `${round(m.carbs, 1)}g carbs`,
    `${round(m.fat, 1)}g fat`,
  ];
  if (m.fiber) parts.push(`${round(m.fiber, 1)}g fibre`);
  return parts.join(" · ");
}

export function toMarkdown(data: AppData): string {
  const { entries, goals } = data;
  const dates = loggedDates(entries);

  const lines: string[] = [
    "# Nutrition log",
    "",
    `Goals: **${goals.calories} kcal**, **${goals.proteinMin}–${goals.proteinMax}g protein**`,
    "",
    `Exported ${new Date().toLocaleString()} · ${dates.length} day${dates.length === 1 ? "" : "s"} logged`,
    "",
  ];

  for (const date of dates) {
    const dayEntries = entriesForDate(entries, date);
    const totals = sumEntries(dayEntries);
    const hitProtein = totals.protein >= goals.proteinMin;
    const kcalDelta = totals.calories - goals.calories;

    lines.push(`## ${formatDateKey(date)} — ${date}`, "");
    lines.push(`**${macroLine(totals)}**`, "");
    lines.push(
      `- Calories: ${round(totals.calories)} / ${goals.calories} (${kcalDelta >= 0 ? "+" : ""}${round(kcalDelta)})`,
    );
    lines.push(
      `- Protein: ${round(totals.protein, 1)} / ${goals.proteinMin}–${goals.proteinMax}g ${hitProtein ? "✅" : "⚠️ short"}`,
    );
    lines.push("");

    lines.push("| Meal | Food | Servings | kcal | P | C | F |");
    lines.push("|------|------|---------:|-----:|--:|--:|--:|");
    for (const e of dayEntries) {
      const m = entryMacros(e);
      const name = e.variant ? `${e.name} (${e.variant})` : e.name;
      lines.push(
        `| ${e.slot} | ${name} | ${round(e.servings, 2)} | ${round(m.calories)} | ${round(m.protein, 1)} | ${round(m.carbs, 1)} | ${round(m.fat, 1)} |`,
      );
    }
    lines.push("");
  }

  return lines.join("\n");
}

/** Apple Health's export timestamp format: `YYYY-MM-DD HH:MM:SS ±ZZZZ`. */
function appleDate(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  const offsetMin = -d.getTimezoneOffset();
  const sign = offsetMin >= 0 ? "+" : "-";
  const abs = Math.abs(offsetMin);
  const tz = `${sign}${pad(Math.floor(abs / 60))}${pad(abs % 60)}`;
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ` +
    `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())} ${tz}`
  );
}

function xmlEscape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const HK_TYPES: Array<{ key: keyof Macros; type: string; unit: string }> = [
  { key: "calories", type: "HKQuantityTypeIdentifierDietaryEnergyConsumed", unit: "kcal" },
  { key: "protein", type: "HKQuantityTypeIdentifierDietaryProtein", unit: "g" },
  { key: "carbs", type: "HKQuantityTypeIdentifierDietaryCarbohydrates", unit: "g" },
  { key: "fat", type: "HKQuantityTypeIdentifierDietaryFatTotal", unit: "g" },
  { key: "fiber", type: "HKQuantityTypeIdentifierDietaryFiber", unit: "g" },
  { key: "sugar", type: "HKQuantityTypeIdentifierDietarySugar", unit: "g" },
  { key: "sodium", type: "HKQuantityTypeIdentifierDietarySodium", unit: "mg" },
];

/**
 * Apple Health export XML — one Record per nutrient per logged item.
 *
 * iOS Health has no first-party file import, so this is written for the
 * third-party importers that do (Health Auto Export, HealthFit, Simple Health
 * Export and friends). They expect exactly this schema, which is why the
 * DOCTYPE and attribute order are preserved.
 */
export function toAppleHealthXML(entries: LogEntry[]): string {
  const now = appleDate(new Date().toISOString());
  const records: string[] = [];

  for (const e of [...entries].sort((a, b) => a.loggedAt.localeCompare(b.loggedAt))) {
    const m = entryMacros(e);
    const stamp = appleDate(e.loggedAt);
    const label = xmlEscape(e.variant ? `${e.name} (${e.variant})` : e.name);

    for (const { key, type, unit } of HK_TYPES) {
      const value = m[key];
      if (value === undefined || value === 0) continue;
      records.push(
        `  <Record type="${type}" sourceName="Nutrition Calculator" ` +
          `sourceVersion="1.0" unit="${unit}" creationDate="${stamp}" ` +
          `startDate="${stamp}" endDate="${stamp}" value="${round(value, 2)}">\n` +
          `   <MetadataEntry key="HKFoodType" value="${label}"/>\n` +
          `   <MetadataEntry key="HKFoodMeal" value="${e.slot}"/>\n` +
          `  </Record>`,
      );
    }
  }

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    "<!DOCTYPE HealthData [",
    "<!ELEMENT HealthData (ExportDate, Record*)>",
    "<!ATTLIST HealthData locale CDATA #REQUIRED>",
    "<!ELEMENT ExportDate EMPTY>",
    "<!ATTLIST ExportDate value CDATA #REQUIRED>",
    "<!ELEMENT Record (MetadataEntry*)>",
    "<!ELEMENT MetadataEntry EMPTY>",
    "]>",
    '<HealthData locale="en_US">',
    ` <ExportDate value="${now}"/>`,
    ...records,
    "</HealthData>",
  ].join("\n");
}

export function toJSON(data: AppData): string {
  return JSON.stringify(data, null, 2);
}

export function download(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // Revoke on the next tick so Safari has time to start the download.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
