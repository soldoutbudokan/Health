import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
// Web search plus reasoning can take a while; give it room on Vercel.
export const maxDuration = 60;

const MODEL = "claude-opus-5";

/**
 * The shape Claude must fill in. `strict: true` guarantees the tool input
 * validates against this exactly, so the handler can trust the fields without
 * defensive parsing. Optional nutrients are `number | null` rather than absent
 * — an explicit null is a real signal ("the label doesn't state fibre"),
 * whereas a missing key is ambiguous.
 */
const NUTRITION_SCHEMA = {
  type: "object",
  properties: {
    name: {
      type: "string",
      description: "Food name, without the brand. e.g. 'Protein Bar'",
    },
    brand: {
      anyOf: [{ type: "string" }, { type: "null" }],
      description: "Brand or manufacturer, or null for a generic food.",
    },
    variant: {
      anyOf: [{ type: "string" }, { type: "null" }],
      description: "Flavour or sub-type, e.g. 'Oreo White'. Null if none.",
    },
    per: {
      type: "string",
      description:
        "What ONE serving of these numbers is, written the way a label would. e.g. '1 bar (60 g)', '1 cup (240 ml)', '100 g'.",
    },
    grams_per_serving: {
      anyOf: [{ type: "number" }, { type: "null" }],
      description: "Weight of one serving in grams, or null if not applicable.",
    },
    calories: { type: "number", description: "kcal per serving" },
    protein: { type: "number", description: "grams per serving" },
    carbs: { type: "number", description: "grams per serving" },
    fat: { type: "number", description: "grams per serving" },
    fiber: {
      anyOf: [{ type: "number" }, { type: "null" }],
      description: "grams per serving, or null if unknown",
    },
    sugar: {
      anyOf: [{ type: "number" }, { type: "null" }],
      description: "grams per serving, or null if unknown",
    },
    sodium: {
      anyOf: [{ type: "number" }, { type: "null" }],
      description: "milligrams per serving, or null if unknown",
    },
    confidence: {
      type: "string",
      enum: ["label", "database", "estimate"],
      description:
        "'label' = read off the manufacturer's published nutrition panel; " +
        "'database' = from a nutrition database like USDA; " +
        "'estimate' = reasoned from ingredients or similar products.",
    },
    note: {
      type: "string",
      description:
        "One or two sentences: where the numbers came from, and the biggest thing that would make them wrong for this user.",
    },
    sources: {
      type: "array",
      items: { type: "string" },
      description: "Domains or page titles the figures came from. May be empty.",
    },
  },
  required: [
    "name",
    "brand",
    "variant",
    "per",
    "grams_per_serving",
    "calories",
    "protein",
    "carbs",
    "fat",
    "fiber",
    "sugar",
    "sodium",
    "confidence",
    "note",
    "sources",
  ],
  additionalProperties: false,
} as const;

const SYSTEM = `You look up nutrition facts for foods so they can be logged in a macro tracker.

Search the web for the specific product or food the user names. Prefer, in order:
1. The manufacturer's own published nutrition panel.
2. A reputable nutrition database (USDA FoodData Central, Open Food Facts).
3. Retailer listings that reproduce the panel.

Then call record_nutrition exactly once with the figures for ONE serving.

Rules:
- Report one serving as the label defines it, not per 100 g, unless the food genuinely has no serving size — then use 100 g and say so in "per".
- If sources disagree, prefer the one whose macros reconcile with the stated calorie count (protein x 4 + carbs x 4 + fat x 9 should land within about 10% of the stated calories), and say in the note that sources disagreed.
- For a restaurant dish or home-cooked food with no label, estimate from a typical preparation, set confidence to "estimate", and say what you assumed.
- Never invent a brand. If the user named no brand, treat it as generic and set brand to null.
- Keep the note short and concrete. The most useful thing you can say is what would move these numbers most for this particular food.`;

interface LookupResult {
  name: string;
  brand: string | null;
  variant: string | null;
  per: string;
  grams_per_serving: number | null;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number | null;
  sugar: number | null;
  sodium: number | null;
  confidence: "label" | "database" | "estimate";
  note: string;
  sources: string[];
}

export async function POST(req: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          "ANTHROPIC_API_KEY is not set. Add it to .env.local and restart the dev server to enable Claude lookups.",
      },
      { status: 501 },
    );
  }

  let query: string;
  try {
    const body = (await req.json()) as { query?: string };
    query = (body.query ?? "").trim();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
  if (query.length < 2) {
    return NextResponse.json({ error: "Enter a food to look up." }, { status: 400 });
  }

  const client = new Anthropic({ apiKey });

  const tools: Anthropic.Messages.ToolUnion[] = [
    { type: "web_search_20260209", name: "web_search", max_uses: 6 },
    {
      name: "record_nutrition",
      description:
        "Record the nutrition facts for one serving of the food. Call this exactly once, after searching.",
      strict: true,
      input_schema: NUTRITION_SCHEMA as unknown as Anthropic.Messages.Tool.InputSchema,
    },
  ];

  const messages: Anthropic.Messages.MessageParam[] = [
    {
      role: "user",
      content: `Find the nutrition facts for: ${query}`,
    },
  ];

  try {
    let response = await client.messages.create({
      model: MODEL,
      max_tokens: 8000,
      // A bounded extract-from-search task — medium keeps the UI responsive
      // without costing accuracy. Raise to "high" if lookups come back thin.
      output_config: { effort: "medium" },
      system: SYSTEM,
      tools,
      messages,
    });

    // Server-side tools run in a loop on Anthropic's side and can hand back a
    // paused turn when they hit their iteration cap. Resume by echoing the
    // assistant turn; do NOT append a "continue" user message.
    let resumes = 0;
    while (response.stop_reason === "pause_turn" && resumes < 3) {
      messages.push({ role: "assistant", content: response.content });
      response = await client.messages.create({
        model: MODEL,
        max_tokens: 8000,
        output_config: { effort: "medium" },
        system: SYSTEM,
        tools,
        messages,
      });
      resumes++;
    }

    if (response.stop_reason === "refusal") {
      return NextResponse.json(
        { error: "Claude declined to answer that one. Try rephrasing the food." },
        { status: 422 },
      );
    }

    const call = response.content.find(
      (b): b is Anthropic.Messages.ToolUseBlock =>
        b.type === "tool_use" && b.name === "record_nutrition",
    );

    if (!call) {
      const text = response.content
        .filter((b): b is Anthropic.Messages.TextBlock => b.type === "text")
        .map((b) => b.text)
        .join(" ")
        .trim();
      return NextResponse.json(
        {
          error:
            text.slice(0, 300) ||
            "Couldn't find nutrition facts for that. Try adding the brand or a size.",
        },
        { status: 404 },
      );
    }

    const r = call.input as LookupResult;

    // Sanity check the model's own arithmetic before it reaches the log.
    const derived = r.protein * 4 + r.carbs * 4 + r.fat * 9;
    const mismatch =
      r.calories > 0 ? Math.abs(derived - r.calories) / r.calories : 0;

    return NextResponse.json({
      food: {
        id: `claude-${Date.now()}`,
        name: r.name,
        variant: r.variant ?? undefined,
        brand: r.brand ?? undefined,
        source: "claude" as const,
        per: r.per,
        gramsPerServing: r.grams_per_serving ?? undefined,
        macros: {
          calories: r.calories,
          protein: r.protein,
          carbs: r.carbs,
          fat: r.fat,
          fiber: r.fiber ?? undefined,
          sugar: r.sugar ?? undefined,
          sodium: r.sodium ?? undefined,
        },
        note: r.note,
        tags: r.sources,
      },
      confidence: r.confidence,
      sources: r.sources,
      // Surfaced in the UI so an internally inconsistent answer is visible
      // rather than silently logged.
      macroMismatch: mismatch > 0.15 ? Math.round(mismatch * 100) : null,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const status =
      err instanceof Anthropic.APIError && err.status ? err.status : 500;
    return NextResponse.json(
      { error: `Claude lookup failed: ${message}` },
      { status: status >= 400 && status < 600 ? status : 500 },
    );
  }
}
