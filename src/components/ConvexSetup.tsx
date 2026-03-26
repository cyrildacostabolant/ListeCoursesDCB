export function ConvexSetup() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-xl shadow-lg max-w-2xl w-full border border-gray-200">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Configuration de la Base de Données</h1>
        </div>
        
        <div className="space-y-4 text-gray-600">
          <p className="text-lg">L'application nécessite <strong>Convex</strong> pour fonctionner (comme demandé).</p>
          
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-2">Instructions d'installation :</h3>
            <ol className="list-decimal pl-5 space-y-2">
              <li>Ouvrez le terminal de votre projet.</li>
              <li>Exécutez la commande : <code className="bg-gray-200 px-2 py-1 rounded text-sm text-pink-600">npx convex dev</code></li>
              <li>Connectez-vous à votre compte Convex si demandé.</li>
              <li>Convex va créer un projet et générer une URL.</li>
              <li>Ajoutez cette URL dans les secrets de l'application sous le nom <code>VITE_CONVEX_URL</code>.</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
