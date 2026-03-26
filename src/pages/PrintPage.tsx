import { useParams, Link } from "react-router-dom";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { ArrowLeft, Download } from "lucide-react";

export function PrintPage() {
  const { id } = useParams<{ id: string }>();
  const listeId = id as Id<"listes">;

  const liste = useQuery(api.listes.getById, { id: listeId });
  const articles = useQuery(api.listeArticles.getDetailsByListe, { listeId });

  const handlePrint = () => {
    window.print();
  };

  if (liste === undefined || articles === undefined) {
    return <div className="p-8">Chargement...</div>;
  }

  if (liste === null) {
    return <div className="p-8">Liste introuvable.</div>;
  }

  // Group articles by category
  const grouped = articles.reduce((acc, item) => {
    if (!item.categorieActif) return acc;
    const catId = item.categorieId;
    if (!acc[catId]) {
      acc[catId] = {
        nom: item.categorieNom,
        ordre: item.categorieOrdre,
        couleur: item.categorieCouleur,
        items: [],
      };
    }
    acc[catId].items.push(item);
    return acc;
  }, {} as Record<string, { nom: string; ordre: number; couleur: string; items: any[] }>);

  const sortedCategories = (Object.values(grouped) as { nom: string; ordre: number; couleur: string; items: any[] }[]).sort((a, b) => a.ordre - b.ordre);

  // Dynamic sizing to fit on one A4 page
  const totalItems = articles.length;
  const totalCategories = sortedCategories.length;
  // Categories take more space (title + padding)
  const estimatedLines = totalItems + totalCategories * 3;

  let printColumnCount = 2;
  let printTextSize = "print:text-sm";
  let printTitleSize = "print:text-xl";
  let printCatTitleSize = "print:text-sm";
  let printItemSpacing = "print:space-y-1";
  let printCatSpacing = "print:mb-4";
  let printDotSize = "print:w-3 print:h-3";

  if (estimatedLines > 150) {
    printColumnCount = 4;
    printTextSize = "print:text-[8px] print:leading-tight";
    printTitleSize = "print:text-sm";
    printCatTitleSize = "print:text-[9px]";
    printItemSpacing = "print:space-y-0";
    printCatSpacing = "print:mb-1";
    printDotSize = "print:w-2 print:h-2";
  } else if (estimatedLines > 100) {
    printColumnCount = 3;
    printTextSize = "print:text-[9px] print:leading-tight";
    printTitleSize = "print:text-base";
    printCatTitleSize = "print:text-[10px]";
    printItemSpacing = "print:space-y-0";
    printCatSpacing = "print:mb-1.5";
    printDotSize = "print:w-2 print:h-2";
  } else if (estimatedLines > 60) {
    printColumnCount = 2;
    printTextSize = "print:text-xs";
    printTitleSize = "print:text-lg";
    printCatTitleSize = "print:text-sm";
    printItemSpacing = "print:space-y-0.5";
    printCatSpacing = "print:mb-2";
    printDotSize = "print:w-2.5 print:h-2.5";
  }

  return (
    <div className="min-h-screen bg-gray-100 print:bg-white p-4 md:p-8 print:p-0">
      <style>
        {`
          @media print {
            @page {
              size: A4;
              margin: 0;
            }
            body {
              -webkit-print-color-adjust: exact;
              margin: 0;
              padding: 0;
              background-color: white !important;
            }
            .print-container {
              width: 210mm;
              height: 297mm;
              margin: 0 auto;
              padding: 7mm;
              box-sizing: border-box;
              overflow: hidden;
            }
            .print-columns {
              column-count: ${printColumnCount} !important;
              column-gap: 10mm !important;
              column-fill: balance !important;
              height: 100%;
            }
          }
        `}
      </style>
      <div className="max-w-4xl mx-auto mb-6 flex items-center justify-between bg-white p-4 rounded-lg shadow print:hidden">
        <Link to={`/liste/${listeId}`} className="text-gray-600 hover:text-gray-900 flex items-center gap-2 font-medium">
          <ArrowLeft size={20} /> Retour
        </Link>
        <button
          onClick={() => handlePrint()}
          className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 flex items-center gap-2 font-medium shadow-sm"
        >
          <Download size={20} /> Exporter PDF / Imprimer
        </button>
      </div>

      {/* Printable Area */}
      <div className="max-w-4xl mx-auto bg-white shadow-lg print:shadow-none print:bg-white print:max-w-none print:w-full print-container">
        <div className="p-8 md:p-12 print:p-0 bg-white h-full flex flex-col">
          <div className={`mb-4 border-b-2 border-gray-800 pb-2 print:mb-2 print:pb-1 shrink-0`}>
            <h1 className={`text-2xl font-bold text-gray-900 uppercase tracking-wider ${printTitleSize}`}>{liste.nom}</h1>
          </div>

          <div className="print-columns flex-1">
            {sortedCategories.map((cat) => (
              <div key={cat.nom} className={`break-inside-avoid mb-8 ${printCatSpacing}`}>
                <h2 className={`text-lg font-bold text-gray-800 uppercase tracking-widest border-b border-gray-300 mb-3 pb-1 flex items-center gap-2 print:mb-1 print:pb-0.5 ${printCatTitleSize}`}>
                  <div 
                    className={`w-4 h-4 rounded-full print:border print:border-gray-400 ${printDotSize}`} 
                    style={{ backgroundColor: cat.couleur || "#e5e7eb", WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}
                  />
                  {cat.nom}
                </h2>
                <ul className={`space-y-2 ${printItemSpacing}`}>
                  {cat.items.map((item) => (
                    <li key={item._id} className={`flex items-baseline justify-between text-gray-800 text-sm md:text-base ${printTextSize}`}>
                      <span className="font-medium">{item.articleNom}</span>
                      <div className="flex-1 border-b border-dotted border-gray-300 mx-2 relative top-[-4px]"></div>
                      <span className="font-bold whitespace-nowrap">{item.quantite}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {sortedCategories.length === 0 && (
            <p className="text-center text-gray-500 italic py-12">La liste est vide.</p>
          )}
        </div>
      </div>
    </div>
  );
}
