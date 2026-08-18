# PescaBA 🎣

Aplicación móvil + web para descubrir **lugares de pesca** en la Provincia de Buenos Aires
(MVP), con arquitectura preparada para expandirse a toda Argentina y el mundo.

## Stack

- **Monorepo**: pnpm workspaces + TypeScript estricto.
- **Backend**: NestJS + Prisma + PostgreSQL/PostGIS + Redis + BullMQ.
- **Mobile**: Expo (React Native) + expo-router + react-native-maps.
- **Admin**: React + Vite + MapLibre.
- **Infra local**: Docker Compose (PostGIS, Redis, MinIO, Meilisearch opcional).

## Requisitos

- Node.js ≥ 22 (recomendado 22 LTS)
- pnpm 10 (`npm i -g pnpm@10`)
- Docker Desktop (para PostgreSQL/PostGIS, Redis, MinIO)

## Puesta en marcha rápida

```bash
# 1. Infraestructura local
docker compose up -d

# 2. Dependencias
pnpm install

# 3. Configuración (ver docs/ENV.md)
cp .env.example .env
cp apps/api/.env.example apps/api/.env   # para el CLI de Prisma (migrate/seed/studio)

# 4. Base de datos: migrar + seedear
pnpm db:migrate
pnpm db:seed

# 5. Levantar la API (http://localhost:3000, Swagger en /v1/docs)
pnpm dev:api

# 6. Panel admin (http://localhost:5173)
pnpm dev:admin

# 7. App móvil (Expo)
pnpm dev:mobile
```

> Los datos de seed son **ficticios/demo**, nunca verificados. No representan lugares reales.
> El runtime del API lee el `.env` de la raíz; el CLI de Prisma usa `apps/api/.env`
> (ambos git-ignored; en producción las variables se inyectan como env del proceso).

## Documentación

- [CHANGELOG.md](CHANGELOG.md) — registro de cambios.
- [docs/PLAN.md](docs/PLAN.md) — plan de implementación por etapas.
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — arquitectura y decisiones (ADR).
- [docs/SETUP.md](docs/SETUP.md) — guía completa de puesta en marcha.
- [docs/ENV.md](docs/ENV.md) — variables de entorno.
- [docs/API.md](docs/API.md) — referencia de la API REST.
- [docs/DATABASE.md](docs/DATABASE.md) — modelo de datos y geoespacial.
- [docs/TESTING.md](docs/TESTING.md) — cómo correr los tests.
- [docs/IMPORT.md](docs/IMPORT.md) — guía de importación CSV/GeoJSON.
- [docs/MODERATION.md](docs/MODERATION.md) — guía de moderación.
- [docs/DEPLOY.md](docs/DEPLOY.md) — despliegue a producción.
- [docs/LEGAL.md](docs/LEGAL.md) — consideraciones legales y de privacidad.

## Contribuir

Mirá [CONTRIBUTING.md](CONTRIBUTING.md): convenciones de commits, ramas, estilo y tests.

## Licencia

[MIT](LICENSE). Este proyecto es un MVP de demostración; los datos de muestra son ficticios.
