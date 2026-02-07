import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

/**
 * Foco Diet Planner - Database Schema
 *
 * Collections:
 * - menuItems: Daily menu items scraped from Foco website
 * - userPreferences: User calorie goals and dietary preferences
 * - mealPlans: User's selected meals for each day
 * - scrapeLog: Log of scraping operations for monitoring
 */
export default defineSchema({
  menuItems: defineTable({
    name: v.string(),
    calories: v.number(),
    protein: v.number(),
    location: v.string(),
    mealType: v.union(
      v.literal("breakfast"),
      v.literal("lunch"),
      v.literal("dinner")
    ),
    date: v.string(),
    available: v.boolean(),
    createdAt: v.number(),
    uniqueKey: v.string(),
    carbs: v.optional(v.number()),
    fat: v.optional(v.number()),
    fiber: v.optional(v.number()),
    description: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    servingSize: v.optional(v.string()),
  })
    .index("by_date", ["date"])
    .index("by_mealType", ["mealType"])
    .index("by_date_mealType", ["date", "mealType"])
    .index("by_uniqueKey", ["uniqueKey"])
    .index("by_available_date", ["available", "date"]),

  userPreferences: defineTable({
    userId: v.string(),
    dailyCalorieGoal: v.number(),
    dailyProteinGoal: v.optional(v.number()),
    preferredMealTypes: v.array(
      v.union(
        v.literal("breakfast"),
        v.literal("lunch"),
        v.literal("dinner")
      )
    ),
    dietaryRestrictions: v.optional(v.array(v.string())),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_userId", ["userId"]),

  mealPlans: defineTable({
    userId: v.string(),
    date: v.string(),
    meals: v.object({
      breakfast: v.optional(v.array(v.id("menuItems"))),
      lunch: v.optional(v.array(v.id("menuItems"))),
      dinner: v.optional(v.array(v.id("menuItems"))),
    }),
    totalCalories: v.number(),
    totalProtein: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_userId_date", ["userId", "date"]),

  scrapeLog: defineTable({
    date: v.string(),
    status: v.union(
      v.literal("started"),
      v.literal("completed"),
      v.literal("failed")
    ),
    itemsScraped: v.number(),
    errorMessage: v.optional(v.string()),
    duration: v.optional(v.number()),
    createdAt: v.number(),
  }).index("by_date", ["date"]),
});
