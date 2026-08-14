import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { App } from "./app/App";
import { AuthProvider } from "./features/auth/application/AuthContext";
import { warmApi } from "./shared/api/http";
import "./styles.css";

/** Vite BASE_URL ends with `/`; BrowserRouter basename must not. */
const basename = import.meta.env.BASE_URL.replace(/\/$/, "") || undefined;

warmApi();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter basename={basename}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);
