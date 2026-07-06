# Finanzas

App de finanzas personales construida con React + TypeScript + Vite + Tailwind CSS.

Almacenamiento local con IndexedDB (Dexie.js) y autenticacion multiusuario con Web Crypto API.

## Funcionalidades

- Registro e inicio de sesion multiusuario
- Registro de ingresos, gastos fijos, gastos variables y ahorro
- Categorizacion de movimientos
- Visualizacion de balance mensual
- Clonacion de transacciones recurrentes
- Historial con graficos comparativos mes a mes
- PWA instalable (offline-ready)

## Tecnologias

- React 18
- TypeScript
- Vite 6
- Tailwind CSS 3
- Dexie.js (IndexedDB)
- Recharts
- React Router DOM v7

## Ejecutar localmente

```bash
cd app
pnpm install
pnpm dev
```

## Construir para produccion

```bash
cd app
pnpm build
```

## Docker

```bash
docker compose up -d
```

## Licencia

MIT
