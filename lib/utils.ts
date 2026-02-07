import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a number as calories display
 */
export function formatCalories(calories: number): string {
  return `${calories} kcal`;
}

/**
 * Format a number as grams display
 */
export function formatGrams(grams: number): string {
  return `${grams}g`;
}

/**
 * Get today's date in ISO format (YYYY-MM-DD)
 */
export function getTodayISO(): string {
  return new Date().toISOString().split("T")[0];
}

/**
 * Calculate percentage of goal achieved
 */
export function calculateProgress(current: number, goal: number): number {
  if (goal <= 0) return 0;
  return Math.min(Math.round((current / goal) * 100), 100);
}

/**
 * Generate a deduplication key for menu items
 */
export function generateUniqueKey(
  name: string,
  location: string,
  mealType: string,
  date: string
): string {
  return `${name}-${location}-${mealType}-${date}`;
}
