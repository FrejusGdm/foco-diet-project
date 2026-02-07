/**
 * Shared TypeScript types for the Foco Diet Planner.
 *
 * These types mirror the Convex schema and are used throughout
 * the frontend. When `npx convex dev` generates proper types,
 * these can be replaced with the generated versions.
 */

export type MealType = "breakfast" | "lunch" | "dinner";

export interface MenuItem {
  _id: string;
  name: string;
  calories: number;
  protein: number;
  location: string;
  mealType: MealType;
  date: string;
  available: boolean;
  createdAt: number;
  uniqueKey: string;
  carbs?: number;
  fat?: number;
  fiber?: number;
  description?: string;
  servingSize?: string;
  imageUrl?: string;
}

export interface UserPreferences {
  _id: string;
  userId: string;
  dailyCalorieGoal: number;
  dailyProteinGoal?: number;
  preferredMealTypes: MealType[];
  dietaryRestrictions?: string[];
  createdAt: number;
  updatedAt: number;
}

export interface MealPlan {
  _id: string;
  userId: string;
  date: string;
  meals: {
    breakfast?: string[];
    lunch?: string[];
    dinner?: string[];
  };
  totalCalories: number;
  totalProtein: number;
  createdAt: number;
  updatedAt: number;
  resolvedMeals?: {
    breakfast: MenuItem[];
    lunch: MenuItem[];
    dinner: MenuItem[];
  };
}
