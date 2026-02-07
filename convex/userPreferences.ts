import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Query: Get the current user's preferences.
 * Returns null if the user hasn't set preferences yet.
 */
export const get = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    return await ctx.db
      .query("userPreferences")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .first();
  },
});

/**
 * Mutation: Create or update user preferences.
 * Upserts based on userId - creates new record if none exists,
 * updates existing record if one does.
 */
export const update = mutation({
  args: {
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
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const existing = await ctx.db
      .query("userPreferences")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        ...args,
        updatedAt: Date.now(),
      });
      return existing._id;
    }

    return await ctx.db.insert("userPreferences", {
      userId: identity.subject,
      ...args,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});
