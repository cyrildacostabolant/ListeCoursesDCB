import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const get = query({
  handler: async (ctx) => {
    const listes = await ctx.db.query("listes").collect();
    return listes.sort((a, b) => b.dateModification - a.dateModification);
  },
});

export const getById = query({
  args: { id: v.id("listes") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const add = mutation({
  args: { nom: v.string() },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("listes", {
      nom: args.nom,
      dateCreation: now,
      dateModification: now,
    });
  },
});

export const update = mutation({
  args: { id: v.id("listes"), nom: v.string() },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      nom: args.nom,
      dateModification: Date.now(),
    });
  },
});

export const remove = mutation({
  args: { id: v.id("listes") },
  handler: async (ctx, args) => {
    // Delete listeArticles first
    const items = await ctx.db.query("listeArticles").withIndex("by_liste", q => q.eq("listeId", args.id)).collect();
    for (const item of items) {
      await ctx.db.delete(item._id);
    }
    await ctx.db.delete(args.id);
  },
});

export const duplicate = mutation({
  args: { id: v.id("listes") },
  handler: async (ctx, args) => {
    const original = await ctx.db.get(args.id);
    if (!original) return;
    const now = Date.now();
    const newListId = await ctx.db.insert("listes", {
      nom: `${original.nom} (Copie)`,
      dateCreation: now,
      dateModification: now,
    });

    const items = await ctx.db.query("listeArticles").withIndex("by_liste", q => q.eq("listeId", args.id)).collect();
    for (const item of items) {
      await ctx.db.insert("listeArticles", {
        listeId: newListId,
        articleId: item.articleId,
        quantite: item.quantite,
        ordre: item.ordre,
      });
    }
  },
});
