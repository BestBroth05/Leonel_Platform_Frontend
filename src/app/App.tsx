import { Navigate, Route, Routes } from "react-router-dom";
import { LoginPage } from "../features/auth/ui/LoginPage";
import { RequireAuth } from "../features/auth/ui/RequireAuth";
import { AppShell } from "./AppShell";
import { HomePage } from "./HomePage";

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<RequireAuth />}>
        <Route element={<AppShell />}>
          <Route path="/" element={<HomePage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
