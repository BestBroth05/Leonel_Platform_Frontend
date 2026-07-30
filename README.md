# Leonel Platform — Frontend

Aplicación web React (`@leonel-platform/web`) para **Leonel Platform**.

Repositorio: [Leonel_Platform_Frontend](https://github.com/BestBroth05/Leonel_Platform_Frontend.git)

## Requisitos

- Node.js 22+
- pnpm 9 (`corepack enable`)
- Backend hermano en `../leonel-platform-backend` para el stack local completo

## Arranque local (solo frontend)

```bash
cp .env.example .env
pnpm install
pnpm dev
```

La API debe estar en `VITE_API_URL` (por defecto `http://localhost:3000`).

## Stack completo (recomendado)

Desde el backend hermano:

```bash
cd ../leonel-platform-backend
pnpm local:up
```

Compose en Backend construye este repo con contexto `../leonel-platform-frontend`.

## Comandos

```bash
pnpm dev
pnpm typecheck
pnpm test
pnpm build
```

## Estructura

```text
src/
  app/          # router, shell, páginas
  features/     # auth, (clients/orders/inventory más adelante)
  shared/       # api, types, utils
```

Tipos de auth viven en `src/shared/types` (duplicados mínimos; sin paquete npm compartido entre repos).
