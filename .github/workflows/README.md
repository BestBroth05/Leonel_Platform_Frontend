# GitHub Actions

| Workflow | Estado |
| -------- | ------ |
| `develop-ci.yml` | Activo — CI en PR/push a `develop` + deploy a GitHub Pages en push a `develop` |
| `deploy-production.yml` | Pendiente (bloque 3 — S3/CloudFront vía OIDC) |

## GitHub Pages (desde `develop`)

URL esperada:

`https://bestbroth05.github.io/Leonel_Platform_Frontend/`

### Configuración en GitHub (una vez)

1. **Settings → Pages → Build and deployment → Source:** *GitHub Actions*
2. **Settings → Secrets and variables → Actions → Variables:**
   - `VITE_API_URL` = URL pública HTTPS de la API (no uses `localhost` desde Pages)

### Qué hace el workflow

- En **pull_request** a `develop`: typecheck, tests, build
- En **push** a `develop`: lo anterior + publica `dist/` en GitHub Pages
- `VITE_BASE_PATH=/Leonel_Platform_Frontend/` para assets y rutas SPA
- Copia `index.html` → `404.html` para que el router no rompa al refrescar
