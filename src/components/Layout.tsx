import { Link, Outlet, useLocation } from "react-router-dom";
import { List, Tags } from "lucide-react";

export function Layout() {
  const location = useLocation();

  const navItems = [
    { path: "/", label: "Mes listes", icon: <List size={20} /> },
    { path: "/categories", label: "Catégories", icon: <Tags size={20} /> },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-white border-r border-gray-200 flex-shrink-0">
        <div className="p-4 border-b border-gray-200">
          <h1 className="text-xl font-bold text-green-600 flex items-center gap-2">
            <List className="text-green-600" />
            Mes Courses
          </h1>
        </div>
        <nav className="p-4 space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-2 rounded-md transition-colors ${
                location.pathname === item.path
                  ? "bg-green-50 text-green-700 font-medium"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {item.icon}
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
