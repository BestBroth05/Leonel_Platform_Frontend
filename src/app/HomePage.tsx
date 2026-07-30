import { useAuth } from "../features/auth/application/AuthContext";
import { getApiUrl } from "../shared/api/http";

export function HomePage() {
  const { user } = useAuth();

  return (
    <section className="panel">
      <h1>Bienvenido</h1>
      <p>
        Sesión activa en <strong>Leonel Platform</strong>. Los módulos de negocio se
        agregarán en fases posteriores.
      </p>
      <ul>
        <li>Usuario: {user?.email}</li>
        <li>Rol: {user?.roleSlug}</li>
        <li>API: {getApiUrl()}</li>
      </ul>
    </section>
  );
}
