import React, { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { ArrowUp, ArrowDown, Edit2, Trash2, Plus, Check, X } from "lucide-react";

const COLOR_PALETTE = [
  // Red
  "#fca5a5", "#f87171", "#ef4444", "#dc2626", "#b91c1c",
  // Orange
  "#fdba74", "#fb923c", "#f97316", "#ea580c", "#c2410c",
  // Yellow
  "#fcd34d", "#fbbf24", "#f59e0b", "#d97706", "#b45309",
  // Green
  "#86efac", "#4ade80", "#22c55e", "#16a34a", "#15803d",
  // Teal
  "#5eead4", "#2dd4bf", "#14b8a6", "#0d9488", "#0f766e",
  // Blue
  "#93c5fd", "#60a5fa", "#3b82f6", "#2563eb", "#1d4ed8",
  // Indigo
  "#a5b4fc", "#818cf8", "#6366f1", "#4f46e5", "#4338ca",
  // Purple
  "#d8b4fe", "#c084fc", "#a855f7", "#9333ea", "#7e22ce",
  // Pink
  "#f9a8d4", "#f472b6", "#ec4899", "#db2777", "#be185d",
  // Gray
  "#d1d5db", "#9ca3af", "#6b7280", "#4b5563", "#374151",
];

function ColorPicker({ color, onChange }: { color: string, onChange: (c: string) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={popoverRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-10 h-10 rounded-md border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        style={{ backgroundColor: color }}
        title="Choisir une couleur"
      />
      {isOpen && (
        <div className="absolute z-50 mt-2 p-3 bg-white rounded-lg shadow-xl border border-gray-200 w-[220px] left-0 top-full">
          <div className="grid grid-cols-5 gap-2">
            {COLOR_PALETTE.map(c => (
              <button
                key={c}
                type="button"
                onClick={() => { onChange(c); setIsOpen(false); }}
                className={`w-8 h-8 rounded-full border border-gray-200 hover:scale-110 transition-transform ${color === c ? 'ring-2 ring-offset-2 ring-blue-500' : ''}`}
                style={{ backgroundColor: c }}
                title={c}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function CategoriesPage() {
  const categories = useQuery(api.categories.get);
  const addCategory = useMutation(api.categories.add);
  const updateCategory = useMutation(api.categories.update);
  const removeCategory = useMutation(api.categories.remove);
  const moveUp = useMutation(api.categories.moveUp);
  const moveDown = useMutation(api.categories.moveDown);

  const [newNom, setNewNom] = useState("");
  const [newCouleur, setNewCouleur] = useState("#e5e7eb");
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNom, setEditNom] = useState("");
  const [editCouleur, setEditCouleur] = useState("#e5e7eb");

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNom.trim()) return;
    await addCategory({ nom: newNom.trim(), actif: true, couleur: newCouleur });
    setNewNom("");
    setNewCouleur("#e5e7eb");
  };

  const startEdit = (cat: any) => {
    setEditingId(cat._id);
    setEditNom(cat.nom);
    setEditCouleur(cat.couleur || "#e5e7eb");
  };

  const saveEdit = async (cat: any) => {
    if (!editNom.trim()) return;
    await updateCategory({ id: cat._id, nom: editNom.trim(), actif: cat.actif, couleur: editCouleur });
    setEditingId(null);
  };

  const toggleActif = async (cat: any) => {
    await updateCategory({ id: cat._id, nom: cat.nom, actif: !cat.actif, couleur: cat.couleur });
  };

  if (categories === undefined) return <div>Chargement...</div>;

  return (
    <div className="max-w-4xl mx-auto pb-32">
      <h2 className="text-2xl font-bold mb-6">Gestion des Catégories</h2>

      <form onSubmit={handleAdd} className="mb-8 flex gap-4">
        <ColorPicker color={newCouleur} onChange={setNewCouleur} />
        <input
          type="text"
          value={newNom}
          onChange={(e) => setNewNom(e.target.value)}
          placeholder="Nouvelle catégorie..."
          className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
        />
        <button
          type="submit"
          className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 flex items-center gap-2"
        >
          <Plus size={20} /> Ajouter
        </button>
      </form>

      <div className="bg-white rounded-lg shadow">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="p-4 font-medium text-gray-600 w-16 text-center">Ordre</th>
              <th className="p-4 font-medium text-gray-600 w-24 text-center">Couleur</th>
              <th className="p-4 font-medium text-gray-600">Nom</th>
              <th className="p-4 font-medium text-gray-600 w-24 text-center">Actif</th>
              <th className="p-4 font-medium text-gray-600 w-48 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((cat, index) => (
              <tr key={cat._id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="p-4 text-center text-gray-500">{cat.ordre}</td>
                <td className="p-4 text-center flex justify-center">
                  {editingId === cat._id ? (
                    <ColorPicker color={editCouleur} onChange={setEditCouleur} />
                  ) : (
                    <div 
                      className="w-6 h-6 rounded-full mx-auto border border-gray-300" 
                      style={{ backgroundColor: cat.couleur || "#e5e7eb" }}
                    />
                  )}
                </td>
                <td className="p-4">
                  {editingId === cat._id ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={editNom}
                        onChange={(e) => setEditNom(e.target.value)}
                        className="flex-1 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                        autoFocus
                      />
                    </div>
                  ) : (
                    <span className={cat.actif ? "text-gray-900" : "text-gray-400 line-through"}>{cat.nom}</span>
                  )}
                </td>
                <td className="p-4 text-center">
                  <input
                    type="checkbox"
                    checked={cat.actif}
                    onChange={() => toggleActif(cat)}
                    className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                  />
                </td>
                <td className="p-4 text-right">
                  {editingId === cat._id ? (
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => saveEdit(cat)} className="p-1 text-green-600 hover:text-green-800"><Check size={18} /></button>
                      <button onClick={() => setEditingId(null)} className="p-1 text-red-600 hover:text-red-800"><X size={18} /></button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => moveUp({ id: cat._id })}
                        disabled={index === 0}
                        className="p-1 text-gray-500 hover:text-gray-900 disabled:opacity-30"
                        title="Monter"
                      >
                        <ArrowUp size={18} />
                      </button>
                      <button
                        onClick={() => moveDown({ id: cat._id })}
                        disabled={index === categories.length - 1}
                        className="p-1 text-gray-500 hover:text-gray-900 disabled:opacity-30"
                        title="Descendre"
                      >
                        <ArrowDown size={18} />
                      </button>
                      <button
                        onClick={() => startEdit(cat)}
                        className="p-1 text-blue-500 hover:text-blue-700"
                        title="Modifier"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm("Supprimer cette catégorie ?")) {
                            removeCategory({ id: cat._id });
                          }
                        }}
                        className="p-1 text-red-500 hover:text-red-700"
                        title="Supprimer"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {categories.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-gray-500">Aucune catégorie.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
