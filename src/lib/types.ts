/** Core nutrition numbers. Everything in the app reduces to this shape. */
export interface Macros {
  calories: number;
  protein: number; // grams
  carbs: number; // grams
  fat: number; // grams
  fiber?: number; // grams
  sugar?: number; // grams
  sodium?: number; // milligrams
}

export type FoodSource =
  | "recipe" // from the Recipes repo
  | "packaged" // labelled product entered by hand
  | "staple" // common single ingredient
  | "usda" // USDA FoodData Central
  | "off" // Open Food Facts
  | "claude" // looked up by Claude
  | "custom"; // typed in manually

/**
 * A food is a *definition*, not a logged event. `per` describes what one unit
 * of `macros` represents, e.g. "1 serving (1/8 of recipe)" or "1 bar (60g)".
 */
export interface Food {
  id: string;
  name: string;
  /** Optional short qualifier shown after the name, e.g. "with 1 cup rice". */
  variant?: string;
  brand?: string;
  source: FoodSource;
  /** Human-readable description of one serving. */
  per: string;
  /** Grams in one serving, when known. Enables gram-based portioning. */
  gramsPerServing?: number;
  macros: Macros;
  /** Free-text caveats — recipe notes, label-vs-estimate warnings, etc. */
  note?: string;
  /** Search keywords beyond the name. */
  tags?: string[];
  /** ISO timestamp — set for foods the user added themselves. */
  createdAt?: string;
}

export type MealSlot = "breakfast" | "lunch" | "dinner" | "snack";

export const MEAL_SLOTS: MealSlot[] = [
  "breakfast",
  "lunch",
  "dinner",
  "snack",
];

export const MEAL_LABELS: Record<MealSlot, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
  snack: "Snacks",
};

/**
 * A logged event. The food's macros are *snapshotted* at log time so that
 * editing or deleting a food definition later never rewrites history.
 */
export interface LogEntry {
  id: string;
  /** Local calendar date, YYYY-MM-DD. */
  date: string;
  slot: MealSlot;
  foodId: string;
  name: string;
  variant?: string;
  brand?: string;
  source: FoodSource;
  per: string;
  /** Number of servings. 1.5 = one and a half servings. */
  servings: number;
  /** Macros for ONE serving. Multiply by `servings` for the entry total. */
  macros: Macros;
  loggedAt: string; // ISO timestamp
}

export interface Goals {
  calories: number;
  proteinMin: number;
  proteinMax: number;
  /** Optional soft targets; left undefined they are simply not scored. */
  carbs?: number;
  fat?: number;
  fiber?: number;
}

export const DEFAULT_GOALS: Goals = {
  calories: 2800,
  proteinMin: 160,
  proteinMax: 180,
  fiber: 30,
};

/** Everything persisted to localStorage, versioned for future migrations. */
export interface AppData {
  version: 1;
  goals: Goals;
  entries: LogEntry[];
  /** Foods the user created, imported from the web, or got from Claude. */
  customFoods: Food[];
  /** Food ids pinned to the quick-add row. */
  favorites: string[];
}

export const EMPTY_DATA: AppData = {
  version: 1,
  goals: DEFAULT_GOALS,
  entries: [],
  customFoods: [],
  favorites: [],
};

export const ZERO_MACROS: Macros = {
  calories: 0,
  protein: 0,
  carbs: 0,
  fat: 0,
  fiber: 0,
  sugar: 0,
  sodium: 0,
};
