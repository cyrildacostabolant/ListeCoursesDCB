import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  categories: defineTable({
    nom: v.string(),
    ordre: v.number(),
    actif: v.boolean(),
    couleur: v.optional(v.string()),
  }),
  articles: defineTable({
    nom: v.string(),
    categorieId: v.id("categories"),
    quantite: v.string(),
  }),
  listes: defineTable({
    nom: v.string(),
    dateCreation: v.number(),
    dateModification: v.number(),
  }),
  listeArticles: defineTable({
    listeId: v.id("listes"),
    articleId: v.id("articles"),
    quantite: v.string(),
    ordre: v.number(),
  }).index("by_liste", ["listeId"]),
});
