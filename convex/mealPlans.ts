import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Query: Get the user's meal plan for a specific date.
 * Returns null if no plan exists for that date.
 */
export const getByDate = query({
  args: { date: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    const plan = await ctx.db
      .query("mealPlans")
      .withIndex("by_userId_date", (q) =>
        q.eq("userId", identity.subject).eq("date", args.date)
      )
      .first();

    if (!plan) return null;

    // Resolve menu item details for each meal
    const resolvedMeals: Record<string, Array<Record<string, unknown>>> = {};
    for (const mealType of ["breakfast", "lunch", "dinner"] as const) {
      const mealIds = plan.meals[mealType] ?? [];
      const items = await Promise.all(
        mealIds.map((id) => ctx.db.get(id))
      );
      resolvedMeals[mealType] = items.filter(Boolean) as Array<Record<string, unknown>>;
    }

    return {
      ...plan,
      resolvedMeals,
    };
  },
});

/**
 * Query: Get today's meal plan for the current user.
 */
export const getCurrent = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    const today = new Date().toISOString().split("T")[0];
    const plan = await ctx.db
      .query("mealPlans")
      .withIndex("by_userId_date", (q) =>
        q.eq("userId", identity.subject).eq("date", today)
      )
      .first();

    if (!plan) return null;

    const resolvedMeals: Record<string, Array<Record<string, unknown>>> = {};
    for (const mealType of ["breakfast", "lunch", "dinner"] as const) {
      const mealIds = plan.meals[mealType] ?? [];
      const items = await Promise.all(
        mealIds.map((id) => ctx.db.get(id))
      );
      resolvedMeals[mealType] = items.filter(Boolean) as Array<Record<string, unknown>>;
    }

    return {
      ...plan,
      resolvedMeals,
    };
  },
});

/**
 * Mutation: Add a menu item to the user's meal plan.
 * Creates the plan if it doesn't exist, or updates an existing one.
 * Recalculates total calories and protein after adding.
 */
export const addMeal = mutation({
  args: {
    date: v.string(),
    mealType: v.union(
      v.literal("breakfast"),
      v.literal("lunch"),
      v.literal("dinner")
    ),
    menuItemId: v.id("menuItems"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Verify the menu item exists
    const menuItem = await ctx.db.get(args.menuItemId);
    if (!menuItem) {
      throw new Error("Menu item not found");
    }

    let plan = await ctx.db
      .query("mealPlans")
      .withIndex("by_userId_date", (q) =>
        q.eq("userId", identity.subject).eq("date", args.date)
      )
      .first();

    if (plan) {
      // Update existing plan
      const currentMeals = plan.meals[args.mealType] ?? [];

      // Prevent duplicates
      if (currentMeals.includes(args.menuItemId)) {
        return plan._id;
      }

      const updatedMeals = {
        ...plan.meals,
        [args.mealType]: [...currentMeals, args.menuItemId],
      };

      // Recalculate totals
      const totals = await calculateTotals(ctx, updatedMeals);

      await ctx.db.patch(plan._id, {
        meals: updatedMeals,
        totalCalories: totals.calories,
        totalProtein: totals.protein,
        updatedAt: Date.now(),
      });

      return plan._id;
    }

    // Create new plan
    const meals = {
      breakfast: args.mealType === "breakfast" ? [args.menuItemId] : undefined,
      lunch: args.mealType === "lunch" ? [args.menuItemId] : undefined,
      dinner: args.mealType === "dinner" ? [args.menuItemId] : undefined,
    };

    return await ctx.db.insert("mealPlans", {
      userId: identity.subject,
      date: args.date,
      meals,
      totalCalories: menuItem.calories,
      totalProtein: menuItem.protein,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

/**
 * Mutation: Remove a menu item from the user's meal plan.
 * Recalculates totals after removal.
 */
export const removeMeal = mutation({
  args: {
    date: v.string(),
    mealType: v.union(
      v.literal("breakfast"),
      v.literal("lunch"),
      v.literal("dinner")
    ),
    menuItemId: v.id("menuItems"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const plan = await ctx.db
      .query("mealPlans")
      .withIndex("by_userId_date", (q) =>
        q.eq("userId", identity.subject).eq("date", args.date)
      )
      .first();

    if (!plan) {
      throw new Error("Meal plan not found");
    }

    const currentMeals = plan.meals[args.mealType] ?? [];
    const updatedMealItems = currentMeals.filter(
      (id) => id !== args.menuItemId
    );

    const updatedMeals = {
      ...plan.meals,
      [args.mealType]:
        updatedMealItems.length > 0 ? updatedMealItems : undefined,
    };

    const totals = await calculateTotals(ctx, updatedMeals);

    await ctx.db.patch(plan._id, {
      meals: updatedMeals,
      totalCalories: totals.calories,
      totalProtein: totals.protein,
      updatedAt: Date.now(),
    });

    return plan._id;
  },
});

/**
 * Mutation: Clear all meals from a meal plan for a specific date.
 */
export const clear = mutation({
  args: { date: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const plan = await ctx.db
      .query("mealPlans")
      .withIndex("by_userId_date", (q) =>
        q.eq("userId", identity.subject).eq("date", args.date)
      )
      .first();

    if (plan) {
      await ctx.db.patch(plan._id, {
        meals: {},
        totalCalories: 0,
        totalProtein: 0,
        updatedAt: Date.now(),
      });
    }
  },
});

// Helper: Calculate total calories and protein from a meals object
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function calculateTotals(
  ctx: any,
  meals: Record<string, unknown[] | undefined>
) {
  let calories = 0;
  let protein = 0;

  for (const mealType of ["breakfast", "lunch", "dinner"]) {
    const mealIds = (meals[mealType] ?? []) as unknown[];
    for (const id of mealIds) {
      const item = await ctx.db.get(id);
      if (item) {
        calories += item.calories;
        protein += item.protein;
      }
    }
  }

  return { calories, protein };
}
