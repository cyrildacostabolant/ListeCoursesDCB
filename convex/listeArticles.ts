import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getDetailsByListe = query({
  args: { listeId: v.id("listes") },
  handler: async (ctx, args) => {
    const items = await ctx.db.query("listeArticles")
      .withIndex("by_liste", q => q.eq("listeId", args.listeId))
      .collect();

    const results = [];
    for (const item of items) {
      const article = await ctx.db.get(item.articleId);
      if (article) {
        const category = await ctx.db.get(article.categorieId);
        results.push({
          ...item,
          articleNom: article.nom,
          categorieId: article.categorieId,
          categorieNom: category?.nom || "Sans catégorie",
          categorieOrdre: category?.ordre || 9999,
          categorieActif: category?.actif ?? true,
          categorieCouleur: category?.couleur || "#e5e7eb",
        });
      }
    }
    return results.sort((a, b) => a.ordre - b.ordre);
  },
});

export const add = mutation({
  args: {
    listeId: v.id("listes"),
    nom: v.string(),
    categorieId: v.id("categories"),
    quantite: v.string(),
  },
  handler: async (ctx, args) => {
    // Find or create article
    let article = await ctx.db.query("articles").filter(q => q.eq(q.field("nom"), args.nom)).first();
    let articleId;
    if (article) {
      articleId = article._id;
      // Optionally update category if changed
      if (article.categorieId !== args.categorieId) {
        await ctx.db.patch(articleId, { categorieId: args.categorieId });
      }
    } else {
      articleId = await ctx.db.insert("articles", {
        nom: args.nom,
        categorieId: args.categorieId,
        quantite: args.quantite,
      });
    }

    const items = await ctx.db.query("listeArticles").withIndex("by_liste", q => q.eq("listeId", args.listeId)).collect();
    const maxOrdre = items.reduce((max, i) => Math.max(max, i.ordre), 0);

    await ctx.db.insert("listeArticles", {
      listeId: args.listeId,
      articleId: articleId,
      quantite: args.quantite,
      ordre: maxOrdre + 1,
    });

    await ctx.db.patch(args.listeId, { dateModification: Date.now() });
  },
});

export const addBulk = mutation({
  args: {
    listeId: v.id("listes"),
    items: v.array(v.object({
      nom: v.string(),
      categorieNom: v.string(),
      quantite: v.string(),
    }))
  },
  handler: async (ctx, args) => {
    const categories = await ctx.db.query("categories").collect();
    let maxOrdreCat = categories.reduce((max, c) => Math.max(max, c.ordre), 0);

    const listeItems = await ctx.db.query("listeArticles").withIndex("by_liste", q => q.eq("listeId", args.listeId)).collect();
    let maxOrdreItem = listeItems.reduce((max, i) => Math.max(max, i.ordre), 0);

    for (const item of args.items) {
      let cat = categories.find(c => c.nom.toLowerCase() === item.categorieNom.toLowerCase());
      let catId;
      if (cat) {
        catId = cat._id;
      } else {
        maxOrdreCat++;
        catId = await ctx.db.insert("categories", {
          nom: item.categorieNom || "Sans catégorie",
          ordre: maxOrdreCat,
          actif: true,
          couleur: "#e5e7eb"
        });
        categories.push({ _id: catId, nom: item.categorieNom, ordre: maxOrdreCat, actif: true, couleur: "#e5e7eb" } as any);
      }

      let article = await ctx.db.query("articles").filter(q => q.eq(q.field("nom"), item.nom)).first();
      let articleId;
      if (article) {
        articleId = article._id;
        if (article.categorieId !== catId) {
          await ctx.db.patch(articleId, { categorieId: catId });
        }
      } else {
        articleId = await ctx.db.insert("articles", {
          nom: item.nom,
          categorieId: catId,
          quantite: item.quantite,
        });
      }

      maxOrdreItem++;
      await ctx.db.insert("listeArticles", {
        listeId: args.listeId,
        articleId: articleId,
        quantite: item.quantite,
        ordre: maxOrdreItem,
      });
    }
    await ctx.db.patch(args.listeId, { dateModification: Date.now() });
  }
});

export const update = mutation({
  args: {
    id: v.id("listeArticles"),
    listeId: v.id("listes"),
    nom: v.string(),
    categorieId: v.id("categories"),
    quantite: v.string(),
  },
  handler: async (ctx, args) => {
    const item = await ctx.db.get(args.id);
    if (!item) return;

    let article = await ctx.db.query("articles").filter(q => q.eq(q.field("nom"), args.nom)).first();
    let articleId;
    if (article) {
      articleId = article._id;
      if (article.categorieId !== args.categorieId) {
        await ctx.db.patch(articleId, { categorieId: args.categorieId });
      }
    } else {
      articleId = await ctx.db.insert("articles", {
        nom: args.nom,
        categorieId: args.categorieId,
        quantite: args.quantite,
      });
    }

    await ctx.db.patch(args.id, {
      articleId: articleId,
      quantite: args.quantite,
    });

    await ctx.db.patch(args.listeId, { dateModification: Date.now() });
  },
});

export const remove = mutation({
  args: { id: v.id("listeArticles"), listeId: v.id("listes") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    await ctx.db.patch(args.listeId, { dateModification: Date.now() });
  },
});
