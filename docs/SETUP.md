# Guía de puesta en marcha local

## Requisitos

- **Node.js** ≥ 22 (recomendado 22 LTS).
- **pnpm** 10: `npm i -g pnpm@10`.
- **Docker Desktop** (PostgreSQL+PostGIS, Redis, MinIO, Meilisearch opcional).

## 1. Clonar e instalar

```bash
git clone <repo> pesca-app
cd pesca-app
pnpm install
```

## 2. Variables de entorno

```bash
cp .env.example .env
```

Editar `.env` con valores reales (especialmente los secrets de JWT y la `DATABASE_URL`).
Los valores del `.env.example` funcionan para desarrollo local sin cambios.

## 3. Infraestructura local

```bash
docker compose up -d
```

Levanta:
- **db** — PostgreSQL 16 + PostGIS 3.5 (puerto 5432).
- **redis** — Redis 7 (puerto 6379).
- **minio** — S3-compatible, consola en http://localhost:9001 (puerto 9000 API).

Verificación: `docker compose ps` debe mostrar los tres `healthy`.

> Meilisearch es opcional (perfil `search`): `docker compose --profile search up -d`.

## 4. Base de datos

```bash
# Aplica las migraciones (incluye PostGIS, índices GiST/GIN, pg_trgm, unaccent)
pnpm db:migrate

# Carga los datos demo (usuarios, especies, regiones, 20 lugares ficticios)
pnpm db:seed
```

> ⚠️ Los lugares del seed son **ficticios** (`source=demo`, no verificados). No representan lugares reales.

## 5. Backend (API)

```bash
pnpm dev:api
```

- API: http://localhost:3000/v1
- Swagger/OpenAPI: http://localhost:3000/v1/docs
- Health: http://localhost:3000/v1/health

## 6. Panel admin

```bash
pnpm dev:admin
```

- Panel: http://localhost:5173
- Login demo: `demo.admin@pescaba.dev` / `PescaDemo123!`

El panel usa un proxy de Vite hacia la API (`/v1` → `http://localhost:3000`).

## 7. App móvil (Expo)

```bash
cp apps/mobile/.env.example apps/mobile/.env
pnpm dev:mobile
```

- Escaneá el QR con Expo Go (Android/iOS).
- En Android emulador usá `EXPO_PUBLIC_API_URL=http://10.0.2.2:3000/v1`.
- En un dispositivo físico, usá la IP local de tu máquina (`http://192.168.x.x:3000/v1`).

## 8. Worker (opcional)

```bash
pnpm dev:worker
```

Consume las colas BullMQ (`image-processing`, `site-import`, `duplicate-detection`).

## Scripts útiles

| Comando | Descripción |
|---|---|
| `pnpm db:migrate` | Aplica migraciones pendientes |
| `pnpm db:migrate:dev` | `prisma migrate dev` (al cambiar el schema) |
| `pnpm db:seed` | Carga datos demo |
| `pnpm db:studio` | Prisma Studio |
| `pnpm lint` | ESLint en todo el repo |
| `pnpm typecheck` | TypeScript en todo el repo |
| `pnpm test` | Tests unitarios |
| `pnpm test:e2e` | Tests e2e (requiere db + redis) |

## Solución de problemas

- **Docker daemon no corre**: iniciá Docker Desktop antes de `docker compose up -d`.
- **El API no arranca**: revisá que `DATABASE_URL` y `JWT_*_SECRET` existan en `.env`.
- **Errores de tipo en `@pescaba/*`**: los paquetes compartidos deben compilarse primero:
  `pnpm --filter @pescaba/shared --filter @pescaba/geo build`.
- **Tests e2e fallan**: la base de test `pesca_ba_test` se crea con
  `POSTGRES_DB` o a mano (`CREATE DATABASE pesca_ba_test;`).
