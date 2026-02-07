import { query, mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Query: Get menu items for a specific date, optionally filtered by meal type.
 * This is a real-time query - UI updates automatically when data changes.
 */
export const list = query({
  args: {
    date: v.string(),
    mealType: v.optional(
      v.union(
        v.literal("breakfast"),
        v.literal("lunch"),
        v.literal("dinner")
      )
    ),
  },
  handler: async (ctx, args) => {
    if (args.mealType) {
      return await ctx.db
        .query("menuItems")
        .withIndex("by_date_mealType", (q) =>
          q.eq("date", args.date).eq("mealType", args.mealType!)
        )
        .collect();
    }

    return await ctx.db
      .query("menuItems")
      .withIndex("by_date", (q) => q.eq("date", args.date))
      .collect();
  },
});

/**
 * Query: Get a single menu item by ID.
 */
export const getById = query({
  args: { id: v.id("menuItems") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

/**
 * Query: Get available menu items for today.
 */
export const getToday = query({
  args: {
    mealType: v.optional(
      v.union(
        v.literal("breakfast"),
        v.literal("lunch"),
        v.literal("dinner")
      )
    ),
  },
  handler: async (ctx, args) => {
    const today = new Date().toISOString().split("T")[0];

    if (args.mealType) {
      return await ctx.db
        .query("menuItems")
        .withIndex("by_date_mealType", (q) =>
          q.eq("date", today).eq("mealType", args.mealType!)
        )
        .filter((q) => q.eq(q.field("available"), true))
        .collect();
    }

    return await ctx.db
      .query("menuItems")
      .withIndex("by_date", (q) => q.eq("date", today))
      .filter((q) => q.eq(q.field("available"), true))
      .collect();
  },
});

/**
 * Query: Search menu items by name.
 */
export const search = query({
  args: {
    date: v.string(),
    searchTerm: v.string(),
  },
  handler: async (ctx, args) => {
    const items = await ctx.db
      .query("menuItems")
      .withIndex("by_date", (q) => q.eq("date", args.date))
      .collect();

    const term = args.searchTerm.toLowerCase();
    return items.filter(
      (item) =>
        item.name.toLowerCase().includes(term) ||
        item.location.toLowerCase().includes(term)
    );
  },
});

/**
 * Query: Get all unique dates that have menu data.
 */
export const getAvailableDates = query({
  args: {},
  handler: async (ctx) => {
    const items = await ctx.db.query("menuItems").collect();
    const dates = [...new Set(items.map((item) => item.date))];
    return dates.sort().reverse();
  },
});

/**
 * Internal Mutation: Insert a menu item (used by scraping action).
 * Handles deduplication via uniqueKey.
 */
export const insert = internalMutation({
  args: {
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
    uniqueKey: v.string(),
    carbs: v.optional(v.number()),
    fat: v.optional(v.number()),
    fiber: v.optional(v.number()),
    description: v.optional(v.string()),
    servingSize: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Deduplication check
    const existing = await ctx.db
      .query("menuItems")
      .withIndex("by_uniqueKey", (q) => q.eq("uniqueKey", args.uniqueKey))
      .first();

    if (existing) {
      // Update availability if item exists
      await ctx.db.patch(existing._id, { available: true });
      return existing._id;
    }

    return await ctx.db.insert("menuItems", {
      ...args,
      available: true,
      createdAt: Date.now(),
    });
  },
});

/**
 * Mutation: Seed demo menu items for testing purposes.
 * Allows users to test the app before scraping is configured.
 */
export const seedDemoData = mutation({
  args: { date: v.string() },
  handler: async (ctx, args) => {
    const demoItems = [
      // Breakfast
      { name: "Scrambled Eggs", calories: 220, protein: 14, location: "Main Line", mealType: "breakfast" as const, carbs: 2, fat: 16 },
      { name: "Oatmeal with Berries", calories: 280, protein: 8, location: "Main Line", mealType: "breakfast" as const, carbs: 52, fat: 5 },
      { name: "Greek Yogurt Parfait", calories: 190, protein: 12, location: "Deli", mealType: "breakfast" as const, carbs: 28, fat: 4 },
      { name: "Whole Wheat Toast", calories: 130, protein: 5, location: "Main Line", mealType: "breakfast" as const, carbs: 24, fat: 2 },
      { name: "Fresh Fruit Bowl", calories: 120, protein: 2, location: "Salad Bar", mealType: "breakfast" as const, carbs: 30, fat: 0 },
      { name: "Turkey Sausage", calories: 160, protein: 11, location: "Grill", mealType: "breakfast" as const, carbs: 1, fat: 12 },
      // Lunch
      { name: "Grilled Chicken Breast", calories: 350, protein: 42, location: "Grill", mealType: "lunch" as const, carbs: 0, fat: 8 },
      { name: "Caesar Salad", calories: 280, protein: 8, location: "Salad Bar", mealType: "lunch" as const, carbs: 18, fat: 20 },
      { name: "Veggie Wrap", calories: 320, protein: 12, location: "Deli", mealType: "lunch" as const, carbs: 42, fat: 12 },
      { name: "Tomato Basil Soup", calories: 180, protein: 4, location: "Soup Station", mealType: "lunch" as const, carbs: 22, fat: 8 },
      { name: "Brown Rice Bowl", calories: 420, protein: 18, location: "Main Line", mealType: "lunch" as const, carbs: 62, fat: 12 },
      { name: "Turkey Club Sandwich", calories: 480, protein: 28, location: "Deli", mealType: "lunch" as const, carbs: 38, fat: 22 },
      // Dinner
      { name: "Salmon Fillet", calories: 380, protein: 36, location: "Main Line", mealType: "dinner" as const, carbs: 0, fat: 22 },
      { name: "Pasta Primavera", calories: 420, protein: 14, location: "Pasta Station", mealType: "dinner" as const, carbs: 58, fat: 14 },
      { name: "Stir-Fry Tofu", calories: 310, protein: 18, location: "Wok Station", mealType: "dinner" as const, carbs: 28, fat: 16 },
      { name: "Roasted Vegetables", calories: 150, protein: 4, location: "Main Line", mealType: "dinner" as const, carbs: 20, fat: 6 },
      { name: "Grilled Steak", calories: 520, protein: 44, location: "Grill", mealType: "dinner" as const, carbs: 0, fat: 32 },
      { name: "Mixed Green Salad", calories: 90, protein: 3, location: "Salad Bar", mealType: "dinner" as const, carbs: 10, fat: 4 },
    ];

    let inserted = 0;
    for (const item of demoItems) {
      const uniqueKey = `${item.name}-${item.location}-${item.mealType}-${args.date}`;
      const existing = await ctx.db
        .query("menuItems")
        .withIndex("by_uniqueKey", (q) => q.eq("uniqueKey", uniqueKey))
        .first();

      if (!existing) {
        await ctx.db.insert("menuItems", {
          ...item,
          date: args.date,
          uniqueKey,
          available: true,
          createdAt: Date.now(),
        });
        inserted++;
      }
    }

    return { inserted, total: demoItems.length };
  },
});
