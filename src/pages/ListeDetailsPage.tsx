import React, { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { ArrowLeft, Printer, Plus, Trash2, Edit2, Check, X, ChevronDown, ChevronRight } from "lucide-react";

export function ListeDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const listeId = id as Id<"listes">;

  const liste = useQuery(api.listes.getById, { id: listeId });
  const articles = useQuery(api.listeArticles.getDetailsByListe, { listeId });
  const categories = useQuery(api.categories.get);

  const addArticle = useMutation(api.listeArticles.add);
  const updateArticle = useMutation(api.listeArticles.update);
  const removeArticle = useMutation(api.listeArticles.remove);
  const updateListe = useMutation(api.listes.update);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNom, setEditNom] = useState("");
  const [editQuantite, setEditQuantite] = useState("");

  const [addingToCategory, setAddingToCategory] = useState<string | null>(null);
  const [newNom, setNewNom] = useState("");
  const [newQuantite, setNewQuantite] = useState("1");

  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<Set<string>>(new Set());

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  
  // Initialize collapsed state and selected categories
  React.useEffect(() => {
    if (articles && categories) {
      const activeCats = categories.filter(c => c.actif);
      const initialCollapsedState: Record<string, boolean> = {};
      const initialSelectedIds = new Set<string>();
      
      activeCats.forEach(cat => {
        const items = articles.filter(a => a.categorieId === cat._id);
        if (items.length === 0) {
          initialCollapsedState[cat._id] = true;
        } else {
          initialSelectedIds.add(cat._id);
        }
      });
      
      setCollapsedCategories(prev => {
        if (Object.keys(prev).length === 0) {
          return initialCollapsedState;
        }
        return prev;
      });

      setSelectedCategoryIds(prev => {
        if (prev.size === 0) {
          return initialSelectedIds;
        }
        return prev;
      });
    }
  }, [articles, categories]);

  const toggleCategorySelection = (catId: string) => {
    setSelectedCategoryIds(prev => {
      const next = new Set(prev);
      if (next.has(catId)) {
        next.delete(catId);
      } else {
        next.add(catId);
      }
      return next;
    });
  };

  const toggleAllCategories = (select: boolean) => {
    if (select && categories) {
      setSelectedCategoryIds(new Set(categories.filter(c => c.actif).map(c => c._id)));
    } else {
      setSelectedCategoryIds(new Set());
    }
  };

  const toggleCategory = (catId: string) => {
    setCollapsedCategories(prev => ({ ...prev, [catId]: !prev[catId] }));
  };

  const startAdd = (catId: string) => {
    setAddingToCategory(catId);
    setNewNom("");
    setNewQuantite("1");
    // Ensure category is expanded
    setCollapsedCategories(prev => ({ ...prev, [catId]: false }));
  };

  const cancelAdd = () => {
    setAddingToCategory(null);
  };

  const handleAdd = async (catId: string) => {
    if (!newNom.trim()) return;
    await addArticle({
      listeId,
      nom: newNom.trim(),
      categorieId: catId as Id<"categories">,
      quantite: newQuantite.trim() || "1",
    });
    setNewNom("");
    setNewQuantite("1");
    setAddingToCategory(null);
  };

  const startEdit = (item: any) => {
    setEditingId(item._id);
    setEditNom(item.articleNom);
    setEditQuantite(item.quantite);
    setAddingToCategory(null); // Close add mode if open
  };

  const saveEdit = async (item: any) => {
    if (!editNom.trim()) return;
    await updateArticle({
      id: item._id,
      listeId,
      nom: editNom.trim(),
      categorieId: item.categorieId,
      quantite: editQuantite.trim(),
    });
    setEditingId(null);
  };

  const saveTitle = async () => {
    if (!editTitle.trim()) return;
    await updateListe({ id: listeId, nom: editTitle.trim() });
    setIsEditingTitle(false);
  };

  if (liste === undefined || articles === undefined || categories === undefined) {
    return <div className="p-8 text-center">Chargement...</div>;
  }

  if (liste === null) {
    return <div className="p-8 text-center">Liste introuvable.</div>;
  }

  const activeCategories = categories.filter(c => c.actif);
  
  // Group articles by category, filtering by selected categories
  const groupedCategories = activeCategories
    .filter(cat => selectedCategoryIds.has(cat._id))
    .map(cat => ({
      ...cat,
      items: articles.filter(a => a.categorieId === cat._id)
    }));

  // Add a "Sans catégorie" group if there are articles with inactive/deleted categories
  const activeCategoryIds = new Set(activeCategories.map(c => c._id));
  const orphanedArticles = articles.filter(a => !activeCategoryIds.has(a.categorieId));
  
  if (orphanedArticles.length > 0) {
    groupedCategories.push({
      _id: "orphaned" as Id<"categories">,
      _creationTime: 0,
      nom: "Autres / Sans catégorie",
      couleur: "#9ca3af", // gray-400
      ordre: 999,
      actif: true,
      items: orphanedArticles
    });
  }

  // Helper to get a lighter version of a hex color for the background
  const getLightColor = (hex: string) => {
    if (!hex) return '#f3f4f6'; // gray-100
    // Simple opacity via rgba or just use the hex with opacity in CSS
    return `${hex}20`; // 12% opacity
  };

  return (
    <div className="max-w-5xl mx-auto pb-20 px-4 sm:px-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 bg-white p-3 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center gap-4">
          <Link to="/" className="text-gray-500 hover:text-gray-900 bg-gray-100 p-2 rounded-md transition-colors">
            <ArrowLeft size={20} />
          </Link>
          {isEditingTitle ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="text-xl font-bold px-3 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && saveTitle()}
              />
              <button onClick={saveTitle} className="p-1 text-green-600 hover:bg-green-50 rounded"><Check size={20} /></button>
              <button onClick={() => setIsEditingTitle(false)} className="p-1 text-red-600 hover:bg-red-50 rounded"><X size={20} /></button>
            </div>
          ) : (
            <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-3 text-gray-800">
              {liste.nom}
              <button onClick={() => { setEditTitle(liste.nom); setIsEditingTitle(true); }} className="text-gray-400 hover:text-blue-600 transition-colors">
                <Edit2 size={16} />
              </button>
            </h2>
          )}
        </div>
        
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <span className="text-sm text-gray-500 mr-2 hidden md:inline">
            {articles.length} article{articles.length !== 1 ? 's' : ''}
          </span>
          <Link
            to={`/print/${listeId}`}
            className="bg-blue-600 text-white px-3 py-2 rounded-md hover:bg-blue-700 flex items-center gap-2 text-sm font-medium transition-colors shadow-sm"
          >
            <Printer size={16} /> <span className="hidden sm:inline">Imprimer / PDF</span>
          </Link>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6 items-start">
        {/* Sidebar: Category Selection */}
        <div className="w-full md:w-64 shrink-0 bg-white p-4 rounded-lg shadow-sm border border-gray-200 sticky top-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
              Rayons
            </h3>
            <div className="flex gap-2">
              <button 
                onClick={() => toggleAllCategories(true)}
                className="text-[10px] text-blue-600 hover:underline font-medium"
              >
                Tous
              </button>
              <button 
                onClick={() => toggleAllCategories(false)}
                className="text-[10px] text-gray-500 hover:underline font-medium"
              >
                Aucun
              </button>
            </div>
          </div>
          
          <div className="space-y-1 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
            {activeCategories.sort((a, b) => a.ordre - b.ordre).map(cat => (
              <label 
                key={cat._id} 
                className={`flex items-center gap-3 p-2 rounded-md cursor-pointer transition-colors hover:bg-gray-50 group ${selectedCategoryIds.has(cat._id) ? 'bg-blue-50/30' : ''}`}
              >
                <div className="relative flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedCategoryIds.has(cat._id)}
                    onChange={() => toggleCategorySelection(cat._id)}
                    className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
                  />
                </div>
                <div className="flex-1 flex items-center gap-2 min-w-0">
                  <div 
                    className="w-2 h-2 rounded-full shrink-0" 
                    style={{ backgroundColor: cat.couleur || "#3b82f6" }}
                  />
                  <span className={`text-sm truncate ${selectedCategoryIds.has(cat._id) ? 'font-semibold text-gray-900' : 'text-gray-600'}`}>
                    {cat.nom}
                  </span>
                </div>
                {articles.filter(a => a.categorieId === cat._id).length > 0 && (
                  <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full group-hover:bg-white transition-colors">
                    {articles.filter(a => a.categorieId === cat._id).length}
                  </span>
                )}
              </label>
            ))}
          </div>
        </div>

        {/* Main Content: Categories List */}
        <div className="flex-1 min-w-0 space-y-2 w-full">
          {groupedCategories.map((cat) => {
            const isCollapsed = collapsedCategories[cat._id];
            const isAdding = addingToCategory === cat._id;
            const catColor = cat.couleur || "#3b82f6"; // default blue
            const bgColor = getLightColor(catColor);

            return (
              <div key={cat._id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                {/* Category Header */}
                <div 
                  className="flex items-center justify-between px-2 py-1.5 border-l-4 cursor-pointer select-none transition-colors hover:brightness-95"
                  style={{ borderLeftColor: catColor, backgroundColor: bgColor }}
                  onClick={() => toggleCategory(cat._id)}
                >
                  <div className="flex items-center gap-2">
                    <button className="text-gray-600 focus:outline-none">
                      {isCollapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
                    </button>
                    <h3 className="font-bold text-gray-800 text-sm" style={{ color: catColor !== '#e5e7eb' ? catColor : 'inherit', filter: 'brightness(0.6)' }}>
                      {cat.nom}
                    </h3>
                  </div>
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      startAdd(cat._id);
                    }}
                    className="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded bg-white/60 hover:bg-white text-gray-700 border border-transparent hover:border-gray-300 transition-all"
                  >
                    <Plus size={14} className="text-green-600" /> Ajouter
                  </button>
                </div>

                {/* Category Content */}
                {!isCollapsed && (
                  <div className="border-t border-gray-200">
                    <table className="w-full text-left text-sm">
                      <tbody className="divide-y divide-gray-100">
                        {cat.items.map((item) => (
                          <tr key={item._id} className="hover:bg-gray-50 transition-colors group">
                            <td className="px-2 py-1 w-8 text-center">
                              <input type="checkbox" className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer" />
                            </td>
                            
                            {editingId === item._id ? (
                              <>
                                <td className="px-2 py-1">
                                  <input
                                    type="text"
                                    value={editNom}
                                    onChange={(e) => setEditNom(e.target.value)}
                                    className="w-full px-2 py-0.5 border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                    autoFocus
                                    onKeyDown={(e) => e.key === 'Enter' && saveEdit(item)}
                                  />
                                </td>
                                <td className="px-2 py-1 w-20 sm:w-24">
                                  <input
                                    type="text"
                                    value={editQuantite}
                                    onChange={(e) => setEditQuantite(e.target.value)}
                                    className="w-full px-2 py-0.5 border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                    onKeyDown={(e) => e.key === 'Enter' && saveEdit(item)}
                                  />
                                </td>
                                <td className="px-2 py-1 w-20 text-right">
                                  <div className="flex items-center justify-end gap-1">
                                    <button onClick={() => saveEdit(item)} className="p-1 text-green-600 hover:bg-green-50 rounded"><Check size={14} /></button>
                                    <button onClick={() => setEditingId(null)} className="p-1 text-red-600 hover:bg-red-50 rounded"><X size={14} /></button>
                                  </div>
                                </td>
                              </>
                            ) : (
                              <>
                                <td className="px-2 py-1 font-medium text-gray-800">{item.articleNom}</td>
                                <td className="px-2 py-1 text-gray-600 w-20 sm:w-24">{item.quantite}</td>
                                <td className="px-2 py-1 w-20 text-right">
                                  <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => startEdit(item)} className="p-1 text-blue-600 hover:bg-blue-50 rounded" title="Modifier">
                                      <Edit2 size={14} />
                                    </button>
                                    <button
                                      onClick={() => {
                                        if (window.confirm("Supprimer cet article ?")) {
                                          removeArticle({ id: item._id, listeId });
                                        }
                                      }}
                                      className="p-1 text-red-600 hover:bg-red-50 rounded"
                                      title="Supprimer"
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  </div>
                                </td>
                              </>
                            )}
                          </tr>
                        ))}

                        {/* Inline Add Row */}
                        {isAdding && (
                          <tr className="bg-blue-50/50">
                            <td className="px-2 py-1 w-8 text-center">
                              <span className="text-gray-300">-</span>
                            </td>
                            <td className="px-2 py-1">
                              <input
                                type="text"
                                value={newNom}
                                onChange={(e) => setNewNom(e.target.value)}
                                placeholder="Nom de l'article..."
                                className="w-full px-2 py-0.5 border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm"
                                autoFocus
                                onKeyDown={(e) => e.key === 'Enter' && handleAdd(cat._id)}
                              />
                            </td>
                            <td className="px-2 py-1 w-20 sm:w-24">
                              <input
                                type="text"
                                value={newQuantite}
                                onChange={(e) => setNewQuantite(e.target.value)}
                                placeholder="Qté"
                                className="w-full px-2 py-0.5 border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm"
                                onKeyDown={(e) => e.key === 'Enter' && handleAdd(cat._id)}
                              />
                            </td>
                            <td className="px-2 py-1 w-20 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <button onClick={() => handleAdd(cat._id)} className="p-1 text-green-600 hover:bg-green-100 rounded" title="Valider">
                                  <Check size={14} />
                                </button>
                                <button onClick={cancelAdd} className="p-1 text-gray-500 hover:bg-gray-200 rounded" title="Annuler">
                                  <X size={14} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        )}

                        {cat.items.length === 0 && !isAdding && (
                          <tr>
                            <td colSpan={4} className="px-2 py-2 text-center text-xs text-gray-500 italic bg-gray-50/50">
                              Aucun article — cliquez sur "+ Ajouter"
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}

          {groupedCategories.length === 0 && (
            <div className="text-center py-12 bg-white rounded-lg border border-dashed border-gray-300 text-gray-500">
              {selectedCategoryIds.size === 0 
                ? "Sélectionnez des rayons à gauche pour commencer votre liste."
                : "Aucune catégorie active. Allez dans \"Catégories\" pour en créer."}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
