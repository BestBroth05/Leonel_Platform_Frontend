import { useState, type FormEvent } from "react";
import { Navigate } from "react-router-dom";
import { ApiClientError } from "../../../shared/api/http";
import { useAuth } from "../application/AuthContext";

export function LoginPage() {
  const { user, login, loading } = useAuth();
  const [email, setEmail] = useState("admin@leonel-platform.local");
  const [password, setPassword] = useState("Pass123!");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!loading && user) {
    return <Navigate to="/" replace />;
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.message);
      } else {
        setError("No se pudo iniciar sesión");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="login-page">
      <form className="login-card" onSubmit={onSubmit}>
        <img
          className="login-logo"
          src={`${import.meta.env.BASE_URL}logo-leonel-platform.png`}
          alt="Leonel Platform"
        />
        <h1>Iniciar sesión</h1>
        <p>Plataforma de administración operativa para el taller familiar.</p>
        {error ? <p className="error">{error}</p> : null}
        <label className="field">
          <span>Correo</span>
          <input
            type="email"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>
        <label className="field">
          <span>Contraseña</span>
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>
        <button className="btn btn-primary" type="submit" disabled={submitting}>
          {submitting ? "Entrando…" : "Entrar"}
        </button>
      </form>
    </div>
  );
}
