# Guía de despliegue

> Esta guía describe el despliegue **mínimo viable**. El CI **no despliega automáticamente**:
> requiere configuración explícita (secrets + trigger manual).

## Modelo de despliegue

```
┌────────────┐   ┌─────────────┐
│  Mobile    │   │   Admin     │  (Vercel/Netlify/Cloudflare Pages / CDN)
│ (EAS Build)│   │ (Vite build)│
└─────┬──────┘   └──────┬──────┘
      │                 │
      ▼                 ▼
        ┌─────────────────────────┐
        │   API (Node/NestJS)     │  ← Docker image en Fly.io/Render/Railway
        │   + Worker (BullMQ)     │
        └──────┬──────────┬───────┘
               ▼          ▼
         PostgreSQL      Redis
         + PostGIS       (managed)
               │
               ▼
         S3 / R2 / B2 (imágenes)
```

## 1. Infraestructura

- **PostgreSQL + PostGIS**: cualquier provider con extensión PostGIS (Supabase, Neon, RDS + RDS PostGIS).
  Aplicar migraciones con `pnpm db:migrate` (se puede correr en el CI antes del deploy).
- **Redis**: managed (Upstash, ElastiCache) o en el mismo host.
- **Storage S3**: Cloudflare R2, AWS S3 o Backblaze B2 (compatibles con el cliente).
- **Geocoding** (para importación): configurar `GEOCODING_PROVIDER` + key.

## 2. Backend

Build: `pnpm --filter api build` (genera el cliente Prisma y compila NestJS).

Imagen Docker (ejemplo) — `infra/docker/api.Dockerfile`:

```dockerfile
FROM node:22-alpine AS build
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages ./packages
COPY apps/api ./apps/api
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @pescaba/shared --filter @pescaba/geo build
RUN pnpm --filter api build

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/apps/api/dist ./apps/api/dist
COPY --from=build /app/apps/api/package.json ./apps/api/package.json
COPY --from=build /app/node_modules ./node_modules
CMD ["node", "apps/api/dist/main.js"]
```

### Variables de producción obligatorias

- `DATABASE_URL`, `REDIS_URL`
- `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` (generar con `openssl rand -hex 32`)
- `CORS_ORIGINS` (los dominios reales del admin y la app)
- `S3_*` (endpoint real de R2/S3/B2, `S3_FORCE_PATH_STYLE=true` para R2/B2)
- `PUBLIC_API_URL`
- `SENTRY_DSN` (opcional)
- `NODE_ENV=production`

### HTTPS y headers

- HTTPS: lo maneja el proxy/load balancer del provider; el API fuerza `NODE_ENV=production`.
- `helmet()` activa los security headers por defecto.

## 3. Worker

Correr como proceso separado: `node apps/worker/dist/main.js`.
En plataformas tipo Fly.io/Render, un segundo servicio con el mismo build.

## 4. Panel admin

```bash
cd apps/admin
pnpm build            # genera dist/ estático
VITE_API_URL=https://api.tudominio.com/v1
```

Subir `dist/` a un host estático (Vercel, Netlify, Cloudflare Pages). El SPA redirige a `index.html`.

## 5. App móvil

Build nativo con **EAS Build** (`eas build`). Configurar `EXPO_PUBLIC_API_URL` al momento del build.
Las actualizaciones de JS se pueden enviar con **EAS Update** sin publicar a la store.

## 6. Rate limiting y seguridad

- `RATE_LIMIT_*` para throttling global.
- Para multi-instancia, conectar el throttler a Redis (hoy usa almacenamiento en memoria; ver ADR).
- Rotar secrets regularmente. No loguear secrets (los logs de pino no incluyen headers de auth).

## 7. Backups y mantenimiento

- Backups de Postgres (point-in-time recovery del provider).
- `lastCheckedAt` de lugares para saber cuándo re-verificar.
- Monitorear `/health` y `/health/ready`.
