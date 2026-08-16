# PescaBA — Plan de implementación

> Proyecto: aplicación móvil + web para descubrir lugares de pesca.
> Alcance inicial: Provincia de Buenos Aires (Argentina), con arquitectura preparada para expansión nacional y global.
> Fecha: 2026-08-15.
> Estado: MVP (Fase 1).

---

## 1. Objetivo

PescaBA es una app (móvil + web) para que pescadores encuentren lugares de pesca
cercanos (playas, lagunas, ríos, arroyos, muelles, espigones, clubes, accesos públicos,
bajadas de embarcación) con datos de acceso, servicios, especies y verificación.

El MVP cubre la Provincia de Buenos Aires. El diseño nace multi-país, multi-idioma y
multi-región para escalar a Argentina y al mundo.

## 2. Alcance del MVP (Fase 1)

**Incluye:**
- Mapa de lugares + listado.
- Búsqueda cercana (radio configurable, ordenada por distancia) con PostGIS.
- Búsqueda por texto (autocompletado, tolerante a acentos/errores tipográficos).
- Filtros por tipo, acceso, servicios, especies y estado.
- Ficha de detalle de lugar.
- Registro/login opcional (JWT con refresh rotation).
- Favoritos y listas (favoritos / pendientes / visitados) sincronizados.
- Sugerencia de nuevos lugares (con moderación).
- Reporte de problemas (con moderación).
- Panel administrador web (login, dashboard, CRUD, moderación, importación, auditoría).
- Carga inicial de datos demo (claramente marcados como ficticios).

**NO incluye (etapas futuras):** pagos, torneos, marketplace, clima avanzado, mareas,
redes sociales, chat entre usuarios, calificaciones, modo offline completo ni mapas offline.

## 3. Stack tecnológico

| Capa | Tecnología |
|---|---|
| Monorepo | pnpm workspaces, TypeScript estricto |
| Lint/format | ESLint (flat config) + Prettier |
| Backend | NestJS + Express + TypeScript |
| ORM | Prisma + SQL crudo para PostGIS |
| Base de datos | PostgreSQL 16 + PostGIS + pg_trgm + unaccent |
| Cache/colas | Redis (cache, rate limiting, BullMQ) |
| Búsqueda | PostgreSQL FTS + pg_trgm (abstracción para Meilisearch futuro) |
| Storage | S3-compatible (MinIO local; R2/S3/B2 en prod) |
| Admin | React + Vite + TypeScript + TanStack Table + MapLibre (react-map-gl) |
| Mobile | Expo (SDK 53) + expo-router + react-native-maps (MVP) |
| Estado mobile | TanStack Query + Zustand |
| i18n | i18next |
| Imágenes | Sharp (worker) |
| Docs API | Swagger/OpenAPI (NestJS) |
| Tests | Jest + Supertest |
| CI | GitHub Actions |
| Observabilidad | Pino (logs estructurados), request-id, Sentry, health endpoint |

## 4. Etapas de implementación (orden de trabajo)

### Etapa 0 — Planificación y arquitectura
- [x] `docs/PLAN.md` (este documento).
- [x] `docs/ARCHITECTURE.md` (arquitectura + ADRs).

### Etapa 1 — Esqueleto del monorepo
- [x] `pnpm-workspace.yaml`, `package.json`, `tsconfig.base.json`.
- [x] ESLint flat config y Prettier compartidos.
- [x] `.gitignore`, `.editorconfig`, `.nvmrc`.
- [x] `docker-compose.yml` (Postgres/PostGIS, Redis, MinIO, meilisearch opcional).
- [x] `.env.example` raíz.

### Etapa 2 — Paquetes compartidos
- [x] `packages/shared`: tipos, constantes (site types, amenity types, report types, roles, especies), DTOs y schemas zod.
- [x] `packages/geo`: validación de coordenadas, cálculo de distancia, formatos, búsqueda por radio.
- [x] `packages/ui` (opcional, reservado para componentes compartidos entre admin/web).

### Etapa 3 — Backend base (apps/api)
- [x] Bootstrap NestJS: `main.ts`, ConfigModule, validación global (zod), CORS, helmet, rate limiting, request-id, filtro de excepciones, Swagger en `/docs`.
- [x] `PrismaModule` + schema completo.
- [x] Migración inicial con PostGIS habilitado, columna `geom` generada e índice GiST.
- [x] Módulos: health, auth, users, sites, favorites, reports, suggestions, metadata, admin.
- [x] Endpoint `/v1/sites/nearby` con `ST_DWithin`/`ST_Distance`.
- [x] Endpoint `/v1/sites/search` y `/v1/sites/autocomplete` con `pg_trgm` + `unaccent`.

### Etapa 4 — Seeds y datos demo
- [x] 10 usuarios demo con roles (user/moderator/editor/admin).
- [x] 20 especies de Argentina.
- [x] Tipos de lugar, amenities, regiones de PBA.
- [x] 20 lugares demo **ficticios**, con coordenadas genéricas en PBA y `is_verified = false`.

### Etapa 5 — Worker (apps/worker)
- [x] Conector BullMQ con Redis.
- [x] Jobs: procesamiento de imágenes (Sharp), importación CSV/GeoJSON, detección de duplicados.

### Etapa 6 — Panel admin (apps/admin)
- [x] Login y protección por roles.
- [x] Dashboard básico (counters).
- [x] CRUD de lugares con editor de coordenadas sobre mapa.
- [x] Moderación de sugerencias y reportes.
- [x] Gestión de usuarios/roles, especies, tipos, amenities, regiones.
- [x] Importación CSV/GeoJSON con dry-run.
- [x] Auditoría.

### Etapa 7 — App móvil (apps/mobile)
- [x] Expo + expo-router con tabs.
- [x] Home: mapa + lista de lugares.
- [x] Búsqueda con autocompletado y filtros.
- [x] Detalle de lugar con mapa, "Cómo llegar", llamar, compartir, favoritos, reportar.
- [x] Favoritos (3 listas), perfil, sugerir lugar, reportar problema, config.
- [x] i18n es/en.
- [x] Estados vacíos, errores de red, reintento, caché de últimos resultados.

### Etapa 8 — Tests, CI y verificación
- [x] Unit tests (geo, validación, servicios).
- [x] E2E de endpoints críticos (nearby, search, auth, favoritos, sugerencias, reportes).
- [x] Workflow GitHub Actions: install → lint → typecheck → test → build.
- [x] Verificación local: `pnpm install`, `prisma generate`, lint/typecheck/build en todos los workspaces.
- [x] Levantar docker (si el daemon corre), migrar, seedear y probar `GET /v1/sites/nearby`.

### Etapa 9 — Documentación
- [x] README raíz.
- [x] Guías: setup local, variables de entorno, modelo de datos, API, importación, moderación, deploy, legal/privacidad.

## 5. Criterios de aceptación

| # | Criterio | Cómo se verifica |
|---|---|---|
| 1 | Backend levanta localmente | `pnpm --filter api start:dev` responde en `/health` |
| 2 | PostGIS habilitado | `SELECT postgis_version()` OK en la migración |
| 3 | `/v1/sites/nearby` devuelve lugares por distancia | Test e2e + curl |
| 4 | `/v1/sites/search` devuelve por nombre | Test e2e |
| 5 | App móvil muestra lista de lugares | Pantalla Home conectada a la API |
| 6 | App móvil muestra detalle | Pantalla Detalle |
| 7 | Panel admin lista lugares | Pantalla Sites del admin |
| 8 | Seeds funcionales | `pnpm --filter api db:seed` sin errores |
| 9 | Docs explican cómo correrlo | README + docs |
| 10 | Lint y typecheck sin errores | `pnpm lint` y `pnpm typecheck` |
| 11 | Tests críticos pasan | `pnpm test` |
| 12 | Sin secretos hardcodeados | Todo por `.env`; `.env.example` documenta |

## 6. Decisiones de producto documentadas

- Los lugares demo son **ficticios**; se marcan `is_verified = false`, `source = 'demo'` y se advierte en UI/UI.
- El idioma principal es español; el código de identificadores en inglés.
- Solo se pide permiso de ubicación cuando el usuario usa una función que lo requiere.
- No se exponen coordenadas exactas de lugares privados sin permiso (decisión futura; el MVP muestra todo el dato geo).

## 7. Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| Prisma no soporta PostGIS nativo | lat/lng en Prisma; `geom` generado por SQL + raw queries para geo |
| MapLibre no corre en Expo Go | react-native-maps para MVP; abstracción para migrar a MapLibre con dev client |
| Calidad de datos inicial | Moderación, reportes, verificación, estado `is_verified` |
| Expansión futura de búsqueda | Abstracción `SearchService` detrás de la implementación Postgres |
| Multi-idioma futuro | i18n desde el inicio; `preferred_language` en el usuario |
