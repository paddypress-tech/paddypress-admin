import * as React from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import { useAuth } from "./context/AuthContext";
import AdminLayout from "./components/layout/AdminLayout";
import Protected from "./routes/Protected";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import OrganizationsPage from "./pages/OrganizationsPage";
import RiceTypesPage from "./pages/master-data/RiceTypesPage";
import VarietiesPage from "./pages/master-data/VarietiesPage";
import CropYearsPage from "./pages/master-data/CropYearsPage";
import BagRatesPage from "./pages/master-data/BagRatesPage";
import IkpCentersPage from "./pages/master-data/IkpCentersPage";
import IkpMasterPage from "./pages/master-data/IkpMasterPage";

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
          <Route path="/master-data/crop-years" element={<CropYearsPage />} />
          <Route path="/master-data/bag-rates" element={<BagRatesPage />} />
          <Route path="/master-data/ikp" element={<IkpMasterPage />} />
          <Route path="/master-data/ikp-centers" element={<IkpCentersPage />} />
          <Route path="/master-data/ikp-states" element={<Navigate to="/master-data/ikp?tab=states" replace />} />
          <Route
            path="/master-data/ikp-districts"
            element={<Navigate to="/master-data/ikp?tab=districts" replace />} 
          />
          <Route path="/master-data/ikp-mandals" element={<Navigate to="/master-data/ikp?tab=mandals" replace />} />
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