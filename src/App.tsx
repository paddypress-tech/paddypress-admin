import * as React from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import { useAuth } from "./context/AuthContext";
import AdminLayout from "./components/layout/AdminLayout";
import Protected from "./routes/Protected";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import OrganizationsPage from "./pages/OrganizationsPage";
import RiceTypesPage from "./pages/master-data/rice-types";
import VarietiesPage from "./pages/master-data/varieties";

import CropYearsPage from "./pages/master-data/crop-years";
import BagRatesPage from "./pages/master-data/bag-rates";
import IkpCentersPage from "./pages/master-data/ikp-centers";
import LocationsMasterPage from "./pages/master-data/LocationsMasterPage";
import ByProductsPage from "./pages/master-data/by-products";

function RedirectIfAuthed({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <RedirectIfAuthed>
            <Login />
          </RedirectIfAuthed>
        }
      />

      <Route element={<Protected />}>
        <Route element={<AdminLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/organizations" element={<OrganizationsPage />} />
          <Route path="/master-data/rice-types" element={<RiceTypesPage />} />
          <Route path="/master-data/varieties" element={<VarietiesPage />} />
          <Route path="/master-data/by-products" element={<ByProductsPage />} />
          <Route path="/master-data/crop-years" element={<CropYearsPage />} />
          <Route path="/master-data/bag-rates" element={<BagRatesPage />} />
          <Route path="/master-data/locations" element={<LocationsMasterPage />} />
          <Route path="/master-data/ikp-centers" element={<IkpCentersPage />} />
          <Route
            path="/master-data/seasons"
            element={<Navigate to="/master-data/crop-years" replace />}
          />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}