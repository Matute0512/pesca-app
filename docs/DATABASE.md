# Modelo de datos y geoespacial

## Entidades

| Tabla | Descripción |
|---|---|
| `users` | Usuarios (roles `user/moderator/editor/admin`), auth local (argon2) u OAuth |
| `fishing_sites` | Lugares de pesca (ficha completa) |
| `species` | Catálogo de especies |
| `fishing_site_species` | Especies por lugar (abundancia, temporada) |
| `site_amenities` | Servicios por lugar (enum) |
| `site_photos` | Fotos (moderación: pending/approved/rejected) |
| `favorites` | Favoritos por usuario y lista (favorites/pending/visited) |
| `site_reports` | Reportes de problemas (open/in_review/resolved/rejected) |
| `site_suggestions` | Sugerencias de nuevos lugares (pending/approved/rejected) |
| `regions` | Regiones administrativas (país → nivel 1 → nivel 2) |
| `fishing_regulations` | Regulaciones, licencias y vedas por región |
| `audit_logs` | Auditoría de acciones administrativas |

## Columnas clave de `fishing_sites`

- `latitude` / `longitude` — `double precision` (WGS84 EPSG:4326), fuente de verdad en Prisma.
- `siteType`, `accessType`, `ownershipType` — enums.
- `isPublic`, `isVerified`, `isActive`, `deletedAt` — estados.
- `slug` — único, generado con `slugify`.
- `createdBy` / `updatedBy` / `verifiedBy` — referencias a `users`.

## Geoespacial

### Estrategia (ADR-002)

Prisma no modela columnas `geography`. En lugar de una columna materializada, se usa un
**expresión index GiST** sobre la geografía calculada:

```sql
CREATE INDEX "fishing_sites_geom_gist" ON "fishing_sites"
  USING GIST (ST_SetSRID(ST_MakePoint("longitude", "latitude"), 4326)::geography);
```

La misma expresión se usa en las queries de `SiteSearchService`, de modo que `ST_DWithin`
aprovecha el índice.

### Búsqueda por cercanía

```sql
SELECT id, name, "siteType"::text,
       ST_Distance(
         ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography,
         ST_SetSRID(ST_MakePoint($lng, $lat), 4326)::geography
       ) AS "distanceMeters"
FROM "fishing_sites"
WHERE "isActive" = true AND "isPublic" = true AND "deletedAt" IS NULL
  AND ST_DWithin(
        ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography,
        ST_SetSRID(ST_MakePoint($lng, $lat), 4326)::geography,
        $radiusMeters
      )
ORDER BY "distanceMeters" ASC
LIMIT $limit;
```

Implementación: `apps/api/src/sites/site-search.service.ts` (`nearby`).

### Búsqueda de texto

- **pg_trgm** + **unaccent**: tolerancia a acentos y errores tipográficos simples.
- `f_unaccent` — wrapper inmutable de `unaccent` creado en la migración.
- Full-text search en español para el ranking de relevancia.

## Extensiones e índices

Migración `0001_init` crea:
- Extensiones: `postgis`, `pg_trgm`, `unaccent`.
- Función `public.f_unaccent(text)` (inmutable).
- Índice GiST de geografía (expresión).
- Índice GIN de pg_trgm sobre `name`.
- Índice GIN de FTS sobre campos de texto.

## Convenciones

- IDs: `uuid` (generados por la app).
- Timestamps: `TIMESTAMP(3)`; `createdAt`/`updatedAt` gestionados por Prisma.
- Soft delete: `deletedAt` en `users` y `fishing_sites`.
- Enum de tablas en `@@map` (snake_case); columnas en camelCase.
