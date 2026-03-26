import React, { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Link, useNavigate } from "react-router-dom";
import { FileText, Copy, Trash2, Plus, FolderOpen } from "lucide-react";

export function ListesPage() {
  const listes = useQuery(api.listes.get);
  const addListe = useMutation(api.listes.add);
  const duplicateListe = useMutation(api.listes.duplicate);
  const removeListe = useMutation(api.listes.remove);
  const navigate = useNavigate();

  const [newNom, setNewNom] = useState("");

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNom.trim()) return;
    const id = await addListe({ nom: newNom.trim() });
    setNewNom("");
    navigate(`/liste/${id}`);
  };

  if (listes === undefined) return <div>Chargement...</div>;

  return (
    <div className="max-w-5xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Mes Listes de Courses</h2>

      <form onSubmit={handleAdd} className="mb-8 flex gap-4">
        <input
          type="text"
          value={newNom}
          onChange={(e) => setNewNom(e.target.value)}
          placeholder="Nom de la nouvelle liste..."
          className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
        />
        <button
          type="submit"
          className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 flex items-center gap-2"
        >
          <Plus size={20} /> Créer
        </button>
      </form>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {listes.map((liste) => (
          <div key={liste._id} className="bg-white p-6 rounded-lg shadow border border-gray-100 flex flex-col">
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">{liste.nom}</h3>
              <FileText className="text-gray-400 flex-shrink-0" />
            </div>
            <div className="text-sm text-gray-500 mb-6 flex-1">
              <p>Créée le : {new Date(liste.dateCreation).toLocaleDateString()}</p>
              <p>Modifiée le : {new Date(liste.dateModification).toLocaleDateString()}</p>
            </div>
            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
              <Link
                to={`/liste/${liste._id}`}
                className="text-green-600 hover:text-green-800 font-medium flex items-center gap-1"
              >
                <FolderOpen size={18} /> Ouvrir
              </Link>
              <div className="flex gap-3">
                <button
                  onClick={() => duplicateListe({ id: liste._id })}
                  className="text-blue-500 hover:text-blue-700"
                  title="Dupliquer"
                >
                  <Copy size={18} />
                </button>
                <button
                  onClick={() => {
                    if (window.confirm("Supprimer cette liste ?")) {
                      removeListe({ id: liste._id });
                    }
                  }}
                  className="text-red-500 hover:text-red-700"
                  title="Supprimer"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          </div>
        ))}
        {listes.length === 0 && (
          <div className="col-span-full p-8 text-center text-gray-500 bg-white rounded-lg border border-dashed border-gray-300">
            Aucune liste pour le moment. Créez-en une ci-dessus !
          </div>
        )}
      </div>
    </div>
  );
}
