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
    const trimmedNom = args.nom.trim();

    // Find article with the same name in THIS specific category
    const articlesInCat = await ctx.db.query("articles")
      .withIndex("by_categorie", q => q.eq("categorieId", args.categorieId))
      .collect();

    let article = articlesInCat.find(
      a => a.nom.trim().toLowerCase() === trimmedNom.toLowerCase()
    );

    let articleId;
    if (article) {
      articleId = article._id;
    } else {
      articleId = await ctx.db.insert("articles", {
        nom: trimmedNom,
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
      const itemNom = item.nom.trim();
      if (!itemNom) continue;

      const catNom = item.categorieNom.trim();
      let cat = categories.find(c => c.nom.toLowerCase() === catNom.toLowerCase());
      let catId;
      if (cat) {
        catId = cat._id;
      } else {
        maxOrdreCat++;
        catId = await ctx.db.insert("categories", {
          nom: catNom || "Sans catégorie",
          ordre: maxOrdreCat,
          actif: true,
          couleur: "#e5e7eb"
        });
        cat = { _id: catId, nom: catNom || "Sans catégorie", ordre: maxOrdreCat, actif: true, couleur: "#e5e7eb" } as any;
        categories.push(cat);
      }

      // Find article with the same name in THIS specific category
      const articlesInCat = await ctx.db.query("articles")
        .withIndex("by_categorie", q => q.eq("categorieId", catId))
        .collect();

      let article = articlesInCat.find(
        a => a.nom.trim().toLowerCase() === itemNom.toLowerCase()
      );

      let articleId;
      if (article) {
        articleId = article._id;
      } else {
        articleId = await ctx.db.insert("articles", {
          nom: itemNom,
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

    const oldArticleId = item.articleId;
    const trimmedNom = args.nom.trim();

    // Check if an article already exists with this name in this category
    const articlesInCat = await ctx.db.query("articles")
      .withIndex("by_categorie", q => q.eq("categorieId", args.categorieId))
      .collect();

    let article = articlesInCat.find(
      a => a.nom.trim().toLowerCase() === trimmedNom.toLowerCase()
    );

    let articleId;
    if (article) {
      articleId = article._id;
    } else {
      articleId = await ctx.db.insert("articles", {
        nom: trimmedNom,
        categorieId: args.categorieId,
        quantite: args.quantite,
      });
    }

    await ctx.db.patch(args.id, {
      articleId: articleId,
      quantite: args.quantite,
    });

    // Clean up old article if it's no longer used
    if (oldArticleId !== articleId) {
      const otherUsages = await ctx.db.query("listeArticles")
        .filter(q => q.eq(q.field("articleId"), oldArticleId))
        .first();
        
      if (!otherUsages) {
        const oldArticle = await ctx.db.get(oldArticleId);
        if (oldArticle) {
          await ctx.db.delete(oldArticleId);
        }
      }
    }

    await ctx.db.patch(args.listeId, { dateModification: Date.now() });
  },
});

export const remove = mutation({
  args: { id: v.id("listeArticles"), listeId: v.id("listes") },
  handler: async (ctx, args) => {
    const item = await ctx.db.get(args.id);
    if (item) {
      // Check if this article is used in any other list
      const otherUsages = await ctx.db.query("listeArticles")
        .filter(q => q.and(
          q.eq(q.field("articleId"), item.articleId),
          q.neq(q.field("_id"), args.id)
        ))
        .first();

      // If not used elsewhere, delete it from the 'articles' table
      if (!otherUsages) {
        const article = await ctx.db.get(item.articleId);
        if (article) {
          await ctx.db.delete(item.articleId);
        }
      }
    }

    await ctx.db.delete(args.id);
    await ctx.db.patch(args.listeId, { dateModification: Date.now() });
  },
});

export const updateOrders = mutation({
  args: {
    orders: v.array(v.object({
      id: v.id("listeArticles"),
      ordre: v.number(),
    })),
    listeId: v.id("listes"),
  },
  handler: async (ctx, args) => {
    for (const { id, ordre } of args.orders) {
      await ctx.db.patch(id, { ordre });
    }
    await ctx.db.patch(args.listeId, { dateModification: Date.now() });
  },
});
