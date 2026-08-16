# Variables de entorno

Toda la configuración sale de variables de entorno. Nunca se hardcodean secrets.
El `.env.example` raíz documenta los valores de desarrollo.

## Backend (apps/api) — variables raíz

| Variable | Uso | Ejemplo dev |
|---|---|---|
| `NODE_ENV` | `development`/`test`/`production` | `development` |
| `HOST` / `PORT` | Bind del API | `0.0.0.0` / `3000` |
| `PUBLIC_API_URL` | URL pública (links de email) | `http://localhost:3000` |
| `DATABASE_URL` | Cadena de conexión Prisma | `postgresql://pesca:pesca_dev_password@localhost:5432/pesca_ba?schema=public` |
| `REDIS_URL` | Redis (refresh, rate limit, colas) | `redis://localhost:6379` |
| `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` | Secrets de firma (≥ 32 bytes) | `openssl rand -hex 32` |
| `JWT_ACCESS_TTL` / `JWT_REFRESH_TTL` | Duración de tokens | `15m` / `30d` |
| `CORS_ORIGINS` | Orígenes permitidos (coma) | `http://localhost:5173,http://localhost:8081` |
| `RATE_LIMIT_WINDOW_MS` / `RATE_LIMIT_MAX` | Throttling global | `60000` / `100` |
| `LOG_LEVEL` | Nivel de logs pino | `info` |
| `SENTRY_DSN` | Errores (opcional) | *(vacío en dev)* |
| `QUEUE_ENABLED` | Activa colas BullMQ en el API | `false` |

### Storage (MinIO / S3)

| Variable | Uso |
|---|---|
| `S3_ENDPOINT` | Endpoint (dev: MinIO) |
| `S3_REGION` | Región |
| `S3_BUCKET` | Bucket |
| `S3_ACCESS_KEY` / `S3_SECRET_KEY` | Credenciales |
| `S3_FORCE_PATH_STYLE` | Path-style (MinIO/garantiza compatibilidad) |
| `S3_PUBLIC_URL` | URL pública base de objetos |

### Búsqueda y geocoding

| Variable | Uso |
|---|---|
| `MEILISEARCH_URL` / `MEILISEARCH_MASTER_KEY` | Reservado (no usado en el MVP) |
| `GEOCODING_PROVIDER` | `none`/`nominatim`/`mapbox`/`maptiler` |
| `GEOCODING_API_KEY` | API key del proveedor (si aplica) |
| `NOMINATIM_URL` | URL del proveedor Nominatim |

### Seed

| Variable | Uso |
|---|---|
| `SEED_DEMO_SITES` | Cantidad de lugares demo (default 20) |

## Panel admin (apps/admin)

| Variable | Uso |
|---|---|
| `VITE_API_URL` | URL de la API. En dev con proxy usar `/v1` |

## Mobile (apps/mobile)

| Variable | Uso |
|---|---|
| `EXPO_PUBLIC_API_URL` | URL de la API con `/v1` (ej. `http://10.0.2.2:3000/v1`) |

> En Expo, las variables `EXPO_PUBLIC_*` se embeben en el bundle. No pongas secrets acá.

## Generar secrets en dev

```bash
openssl rand -hex 32   # JWT_ACCESS_SECRET y JWT_REFRESH_SECRET
```
