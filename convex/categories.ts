import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const get = query({
  handler: async (ctx) => {
    const categories = await ctx.db.query("categories").collect();
    return categories.sort((a, b) => a.ordre - b.ordre);
  },
});

export const add = mutation({
  args: { nom: v.string(), actif: v.boolean(), couleur: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const categories = await ctx.db.query("categories").collect();
    const maxOrdre = categories.reduce((max, c) => Math.max(max, c.ordre), 0);
    return await ctx.db.insert("categories", {
      nom: args.nom,
      ordre: maxOrdre + 1,
      actif: args.actif,
      couleur: args.couleur || "#e5e7eb",
    });
  },
});

export const update = mutation({
  args: { id: v.id("categories"), nom: v.string(), actif: v.boolean(), couleur: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const { id, ...rest } = args;
    await ctx.db.patch(id, rest);
  },
});

export const remove = mutation({
  args: { id: v.id("categories") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

export const moveUp = mutation({
  args: { id: v.id("categories") },
  handler: async (ctx, args) => {
    const category = await ctx.db.get(args.id);
    if (!category) return;
    const all = await ctx.db.query("categories").collect();
    const sorted = all.sort((a, b) => a.ordre - b.ordre);
    const index = sorted.findIndex(c => c._id === args.id);
    if (index > 0) {
      const prev = sorted[index - 1];
      await ctx.db.patch(category._id, { ordre: prev.ordre });
      await ctx.db.patch(prev._id, { ordre: category.ordre });
    }
  }
});

export const moveDown = mutation({
  args: { id: v.id("categories") },
  handler: async (ctx, args) => {
    const category = await ctx.db.get(args.id);
    if (!category) return;
    const all = await ctx.db.query("categories").collect();
    const sorted = all.sort((a, b) => a.ordre - b.ordre);
    const index = sorted.findIndex(c => c._id === args.id);
    if (index < sorted.length - 1) {
      const next = sorted[index + 1];
      await ctx.db.patch(category._id, { ordre: next.ordre });
      await ctx.db.patch(next._id, { ordre: category.ordre });
    }
  }
});
