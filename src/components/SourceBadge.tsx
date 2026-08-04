import type { FoodSource } from "@/lib/types";

const LABELS: Record<FoodSource, { text: string; title: string }> = {
  recipe: { text: "recipe", title: "From your Recipes repo" },
  packaged: { text: "label", title: "From a manufacturer's nutrition panel" },
  staple: { text: "staple", title: "Standard reference values for a common food" },
  usda: { text: "USDA", title: "USDA FoodData Central" },
  off: { text: "OFF", title: "Open Food Facts (crowd-sourced label data)" },
  claude: { text: "Claude", title: "Looked up by Claude from web sources" },
  custom: { text: "yours", title: "You entered this one" },
};

/**
 * Provenance is load-bearing in a nutrition tracker: a recipe estimate and a
 * label reading deserve different levels of trust, and the badge is how that
 * survives into the log.
 */
export function SourceBadge({ source }: { source: FoodSource }) {
  const l = LABELS[source];
  return (
    <span
      title={l.title}
      className="shrink-0 rounded border border-hairline px-1 py-px text-[9px] font-semibold uppercase tracking-wide text-muted"
    >
      {l.text}
    </span>
  );
}
