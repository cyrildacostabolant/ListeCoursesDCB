import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const get = query({
  handler: async (ctx) => {
    return await ctx.db.query("articles").collect();
  },
});

export const add = mutation({
  args: { nom: v.string(), categorieId: v.id("categories"), quantite: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db.insert("articles", args);
  },
});
