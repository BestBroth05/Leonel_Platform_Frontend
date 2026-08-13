import { Navigate, Route, Routes } from "react-router-dom";
import { LoginPage } from "../features/auth/ui/LoginPage";
import { RequireAuth } from "../features/auth/ui/RequireAuth";
import { CatalogsPage } from "../features/catalogs/ui/CatalogsPage";
import { ClientWeeksPage } from "../features/client-weeks/ui/ClientWeeksPage";
import { ClientsPage } from "../features/clients/ui/ClientsPage";
import { OrderDetailPage } from "../features/orders/ui/OrderDetailPage";
import { CutDetailPage } from "../features/production-formats/ui/CutDetailPage";
import { ProductionFormatDetailPage } from "../features/production-formats/ui/ProductionFormatDetailPage";
import { ProductionFormatsPage } from "../features/production-formats/ui/ProductionFormatsPage";
import { AppShell } from "./AppShell";
import { HomePage } from "./HomePage";

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<RequireAuth />}>
        <Route element={<AppShell />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/clients" element={<ClientsPage />} />
          <Route path="/catalogs" element={<CatalogsPage />} />
          <Route path="/production-formats" element={<ProductionFormatsPage />} />
          <Route
            path="/production-formats/:id"
            element={<ProductionFormatDetailPage />}
          />
          <Route
            path="/production-formats/:formatId/cuts/:cutId"
            element={<CutDetailPage />}
          />
          <Route path="/weekly-settlement" element={<ClientWeeksPage />} />
          <Route path="/orders" element={<Navigate to="/production-formats" replace />} />
          <Route path="/orders/:id" element={<OrderDetailPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
