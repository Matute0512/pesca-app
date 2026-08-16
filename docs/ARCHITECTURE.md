# PescaBA — Arquitectura

## 1. Visión general

**Monolito modular** para el backend, no microservicios. Un solo proceso NestJS
(`apps/api`) con módulos por dominio. Un proceso worker separado (`apps/worker`)
procesa jobs de cola (imágenes, importación). Esto mantiene la simplicidad del MVP
sin cerrar la puerta a extraer servicios cuando el tráfico lo justifique.

```
┌─────────────┐   ┌──────────────┐   ┌─────────────┐
│ apps/mobile │   │ apps/admin   │   │  Clientes   │
│ (Expo)      │   │ (React+Vite) │   └─────────────┘
└──────┬──────┘   └──────┬───────┘
       │  HTTPS/JSON     │
       ▼                 ▼
┌────────────────────────────────┐
│        apps/api (NestJS)        │
│  Auth · Sites · Favorites ·     │
│  Reports · Suggestions · Admin  │
└───────┬────────────┬────────────┘
        │            │
        ▼            ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ PostgreSQL   │ │ Redis        │ │ MinIO (S3)   │
│ + PostGIS    │ │ cache/queue  │ │ imágenes     │
│ + pg_trgm    │ │              │ │              │
└──────────────┘ └──────────────┘ └──────┬───────┘
                                         │
                                         ▼
┌───────────────────────────────────────────────┐
│ apps/worker (BullMQ) — Sharp · import · dupes  │
└───────────────────────────────────────────────┘
```

## 2. Módulos del backend (NestJS)

Cada módulo es autocontenido: controlador (HTTP) + servicio (lógica) + DTOs + tests.

| Módulo | Responsabilidad |
|---|---|
| `health` | `/health`, readiness/liveness, versión de la app |
| `auth` | register, login, refresh (rotación), logout, forgot/reset password, me |
| `users` | perfil, preferencias (idioma, unidades), desactivación de cuenta |
| `sites` | CRUD público, búsqueda cercana, búsqueda de texto, autocompletado, ficha |
| `favorites` | favoritos por usuario y por lista (favoritos/pendientes/visitados) |
| `reports` | reporte de problemas por sitio; listado propio |
| `suggestions` | sugerencia de nuevo lugar, quedan pendientes de moderación |
| `metadata` | species, site-types, amenities, regions, countries (catálogos) |
| `admin` | CRUD interno, verificación, moderación de sugerencias/reportes, usuarios/roles, auditoría, importación |
| `storage` | subida/gestión de imágenes a S3 (MinIO) |

## 3. Estrategia geoespacial

- Coordenadas almacenadas como `latitude`/`longitude` `Double` (EPSG:4326) en Prisma.
- La geografía se computa como expresión inmutable y se indexa con un **expresión index
  GiST** (ver nota en *Búsqueda por cercanía*).

### Búsqueda por cercanía

```sql
SELECT id, name, site_type,
       ST_Distance(
         ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography,
         ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography
       ) AS distance_meters
FROM fishing_sites
WHERE is_active = TRUE AND is_public = TRUE
  AND ST_DWithin(
        ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography,
        ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography,
        :radius_meters
      )
ORDER BY distance_meters ASC
LIMIT :limit;
```

La API recibe `lat`, `lng`, `radiusMeters` (entre 100 y 200_000). Devuelve `distanceMeters`.

### Nota sobre la columna `geom`

En lugar de una columna `geom` materializada, la geografía se computa como expresión
`ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography` (inmutable) y se indexa
con un **expresión index GiST**. Esto mantiene a Prisma como única fuente de verdad para
`latitude`/`longitude`, evita columnas generadas que Prisma no modela y evita drift en
`prisma migrate dev`. La consulta anterior usa la misma expresión para garantizar el uso
del índice.

## 4. Búsqueda de texto

MVP: PostgreSQL + `pg_trgm` + `unaccent`.

- `pg_trgm` → coincidencias difusas (`%nombre%` con `SIMILARITY`/`ILIKE`).
- `unaccent` → tolerancia a acentos ("laguna" = "laguna").
- FTS (`to_tsvector('spanish', name || ' ' || locality || ' ' || municipality)`) para
  ranking de relevancia en búsqueda por texto.

El acceso se encapsula en `SiteSearchService` con una interfaz estable, para que la
implementación pueda reemplazarse por Meilisearch/Typesense sin tocar los controladores.

## 5. Autenticación y autorización

- **JWT**: access token corto (15 min) + refresh token (30 días) con **rotación** y
  revocación por `jti` en Redis (lista de revocados).
- Passwords con **argon2id**.
- Roles: `user`, `moderator`, `editor`, `admin`.
- Decoradores `@Roles(...)` + guard `RolesGuard`.
- Rate limiting por IP (Redis) en auth y endpoints sensibles.
- Módulo `audit_logs` registra acciones administrativas (antes/después, usuario, IP).

## 6. API REST

Versionada en `/v1`, formato de respuesta consistente:

```json
{ "success": true, "data": {}, "meta": {} }          // éxito
{ "success": false, "error": { "code": "...", "message": "...", "details": [] } }  // error
```

Swagger en `GET /docs` (OpenAPI 3).

## 7. Almacenamiento

- Imágenes a S3-compatible. En desarrollo local: **MinIO** (docker).
- Cliente `@aws-sdk/client-s3` configurable por env (`S3_ENDPOINT`, `S3_REGION`,
  `S3_BUCKET`, `S3_ACCESS_KEY`, `S3_SECRET_KEY`).
- El worker redimensiona y genera thumbnails con **Sharp**.
- Validación de MIME y tamaño en el API antes de subir.

## 8. Colas

**BullMQ** + Redis:
- `image-processing`: redimensionar/generar thumbnail/codificar.
- `import`: importación CSV/GeoJSON en background.
- `duplicate-detection`: detectar posibles duplicados (nombre similar + distancia).

## 9. Mobile (apps/mobile)

- Expo SDK 53 + **expo-router** (file-based routing).
- **react-native-maps** para el MVP (funciona en Expo Go); se documenta la migración a
  MapLibre (`@maplibre/maplibre-react-native`) cuando se requiera dev client.
- TanStack Query para datos de servidor; Zustand para estado global (sesión, filtros).
- i18next (es/en). Expo Location para permisos on-demand.
- Caché de últimos resultados en memoria + AsyncStorage (favoritos offline básico).

## 10. Administración (apps/admin)

- React + Vite + TypeScript.
- TanStack Table para listados; **react-map-gl (MapLibre)** para editar coordenadas
  sobre mapa.
- Rutas protegidas por rol; consumo directo de la API `/v1/admin`.

## 11. Observabilidad

- Logs estructurados con **pino** + request-id (correlación).
- `/health` (liveness) y `/health/ready` (readiness: DB, Redis).
- Métricas básicas con Prometheus client (opcional).
- **Sentry** para errores (activado por env `SENTRY_DSN`).

## 12. Decisiones de arquitectura (ADR)

| ADR | Decisión | Motivo |
|---|---|---|
| ADR-001 | Monolito modular, no microservicios | Simplicidad para MVP; los módulos NestJS permiten extraer servicios después |
| ADR-002 | Prisma + SQL crudo para PostGIS; expresión index GiST sobre lat/lng | Prisma no modela geography; la expresión es inmutable, indexable y evita drift |
| ADR-003 | Search = Postgres (pg_trgm + unaccent + FTS) | Sin servicio extra para el MVP; abstracción lista para Meilisearch |
| ADR-004 | react-native-maps en mobile (MVP) | Corre en Expo Go sin build nativo; abstracción para MapLibre |
| ADR-005 | JWT con refresh rotation + revocación en Redis | Seguridad sin depender de sesiones de estado complejas |
| ADR-006 | Express (default de NestJS) sobre Fastify | Compatibilidad y documentación; migrable si surge necesidad |
| ADR-007 | MinIO en dev, R2/S3/B2 en prod | Interfaz S3 estándar; sin costos de dev |
| ADR-008 | i18n e idioma desde el inicio | La expansión global es requisito; traducir después es caro |
