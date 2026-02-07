/**
 * Application-wide constants for Foco Diet Planner
 */

export const APP_NAME = "Foco Diet Planner";
export const APP_DESCRIPTION =
  "Plan your meals at Foco based on your calorie goals";

/** Default calorie goal for new users */
export const DEFAULT_CALORIE_GOAL = 2000;

/** Meal types supported by the application */
export const MEAL_TYPES = ["breakfast", "lunch", "dinner"] as const;
export type MealType = (typeof MEAL_TYPES)[number];

/** Meal type display labels */
export const MEAL_TYPE_LABELS: Record<MealType, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
};

/** Meal type time ranges for display */
export const MEAL_TIME_RANGES: Record<MealType, string> = {
  breakfast: "7:00 AM - 10:00 AM",
  lunch: "11:00 AM - 2:00 PM",
  dinner: "5:00 PM - 8:00 PM",
};

/** Color coding for calorie levels */
export const CALORIE_THRESHOLDS = {
  low: 200,
  medium: 500,
  high: 800,
} as const;

/** Dietary restriction options */
export const DIETARY_RESTRICTIONS = [
  "vegetarian",
  "vegan",
  "gluten-free",
  "dairy-free",
  "nut-free",
  "halal",
  "kosher",
] as const;

/** Navigation items */
export const NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard", icon: "LayoutDashboard" },
  { label: "Meal Planner", href: "/meal-planner", icon: "UtensilsCrossed" },
  { label: "Preferences", href: "/preferences", icon: "Settings" },
] as const;
