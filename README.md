# Finanzas

App de finanzas personales con React + TypeScript + Vite + Tailwind CSS.

Backend Express con autenticación JWT. En local usa SQLite (sin Docker). En el VPS, Docker Compose con MySQL, accesible por Tailscale.

## Funcionalidades

- Registro e inicio de sesión (JWT + bcrypt)
- Registro de ingresos, gastos fijos, gastos variables y ahorro
- Categorización de movimientos
- Visualización de balance mensual
- Clonación de transacciones recurrentes
- Historial con gráficos comparativos mes a mes
- PWA instalable

## Tecnologías

- React 18 + TypeScript + Vite 6 + Tailwind CSS 3
- Express + SQLite vía `node:sqlite` (local) / MySQL 8 (Docker)
- Docker Compose (solo despliegue / VPS)
- pnpm (frontend)

## Desarrollo local

Requiere [pnpm](https://pnpm.io/installation) y Node 22.5+ (SQLite nativo). **No hace falta Docker** en local.

```bash
cp .env.example .env
# Edita JWT_SECRET en .env (DB_CLIENT=sqlite por defecto)
pnpm install
pnpm --prefix server install
pnpm run dev
```

Abre **solo** `http://localhost:5173`. Eso levanta:

- API en `:4000` con SQLite en `server/data/finanzas.sqlite`
- Vite en `:5173` (proxy de `/api` → API)

Si ves errores raros de consola (`createRoot`, manifest): DevTools → Application → Unregister service workers + Clear site data, luego hard refresh en `http://localhost:5173/`.

### Probar contra MySQL (opcional)

```bash
# en .env: DB_CLIENT=mysql
pnpm run dev:db    # MySQL en Docker
pnpm run dev
```

## Docker / VPS + Tailscale

1. En el VPS: instala Docker, Docker Compose y [Tailscale](https://tailscale.com/download). Une el VPS a tu tailnet (`tailscale up`).
2. Clona el repo y configura entorno:

```bash
cp .env.example .env
```

3. Edita `.env`:
   - Genera un `JWT_SECRET` largo y aleatorio
   - Cambia `MYSQL_ROOT_PASSWORD` y `MYSQL_PASSWORD`
   - Para exponer solo en Tailscale, pon la IP 100.x del VPS:

```env
BIND_HOST=100.x.x.x
WEB_PORT=3000
```

   (obtén la IP con `tailscale ip -4` en el VPS)

4. Arranca:

```bash
docker compose up -d --build
```

El servicio `api` usa `DB_CLIENT=mysql` automáticamente.

5. Desde otro dispositivo en la misma tailnet abre `http://100.x.x.x:3000`.

MySQL no se publica fuera de la red Docker. El frontend nginx hace proxy de `/api` al contenedor `api`.

## API

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| POST | `/api/auth/register` | No | Registro |
| POST | `/api/auth/login` | No | Login |
| GET | `/api/auth/me` | Sí | Usuario actual |
| GET | `/api/categories` | Sí | Categorías |
| GET | `/api/transactions` | Sí | Transacciones del usuario |
| POST | `/api/transactions` | Sí | Crear transacción |
| DELETE | `/api/transactions/:id` | Sí | Eliminar |
| POST | `/api/transactions/clone-recurring` | Sí | Clonar recurrentes |

## Licencia

MIT
