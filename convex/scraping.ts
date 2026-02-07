import { internalMutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Internal Mutation: Log scraping operations.
 * Used by the scraping action to track success/failure.
 */
export const logScrape = internalMutation({
  args: {
    date: v.string(),
    status: v.union(
      v.literal("started"),
      v.literal("completed"),
      v.literal("failed")
    ),
    itemsScraped: v.number(),
    errorMessage: v.optional(v.string()),
    duration: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("scrapeLog", {
      ...args,
      createdAt: Date.now(),
    });
  },
});
