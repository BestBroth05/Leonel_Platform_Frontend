import { Navigate, Route, Routes } from "react-router-dom";
import { LoginPage } from "../features/auth/ui/LoginPage";
import { RequireAuth } from "../features/auth/ui/RequireAuth";
import { CatalogsPage } from "../features/catalogs/ui/CatalogsPage";
import { ClientsPage } from "../features/clients/ui/ClientsPage";
import { OrderDetailPage } from "../features/orders/ui/OrderDetailPage";
import { OrdersPage } from "../features/orders/ui/OrdersPage";
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
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/orders/:id" element={<OrderDetailPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
