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
  app/          # router, shell, inicio
  features/     # auth, clients, catalogs, orders (+ inventario en detalle)
  shared/       # api, types, utils
```

Tipos de auth/dominio viven en `src/shared/types` (duplicados mínimos; sin paquete npm compartido entre repos).

## Qué probar en UI (Fase 2)

1. Login → Inicio
2. Clientes: alta / activar-desactivar
3. Catálogos: marcas, tipos, destinos
4. Pedidos: crear → abrir detalle
5. En detalle: recepción, compostura, merma, salida parcial → ver saldo e historial
