/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { ListesPage } from "./pages/ListesPage";
import { CategoriesPage } from "./pages/CategoriesPage";
import { ListeDetailsPage } from "./pages/ListeDetailsPage";
import { PrintPage } from "./pages/PrintPage";
import { Layout } from "./components/Layout";
import { ConvexSetup } from "./components/ConvexSetup";

const convexUrl = (import.meta as any).env.VITE_CONVEX_URL;
const convex = convexUrl ? new ConvexReactClient(convexUrl) : null;

export default function App() {
  if (!convex) {
    return <ConvexSetup />;
  }

  return (
    <ConvexProvider client={convex}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<ListesPage />} />
            <Route path="categories" element={<CategoriesPage />} />
            <Route path="liste/:id" element={<ListeDetailsPage />} />
          </Route>
          <Route path="/print/:id" element={<PrintPage />} />
        </Routes>
      </BrowserRouter>
    </ConvexProvider>
  );
}
