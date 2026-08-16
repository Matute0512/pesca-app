# Referencia de la API REST

- Base: `/v1` — Swagger interactivo en `/v1/docs`.
- Formato de respuesta:

```json
// éxito
{ "success": true, "data": {}, "meta": {} }

// error
{ "success": false, "error": { "code": "ERROR_CODE", "message": "…", "details": [] } }
```

- Autenticación: `Authorization: Bearer <accessToken>`. El refresh token se envía por body
  en `/auth/refresh` y `/auth/logout`.

## Auth

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/v1/auth/register` | Registro (email, password, username opcional) |
| POST | `/v1/auth/login` | Login → `{ accessToken, refreshToken, accessExpiresIn }` |
| POST | `/v1/auth/refresh` | Renueva la sesión (rotación de refresh token) |
| POST | `/v1/auth/logout` | Revoca el refresh token |
| POST | `/v1/auth/forgot-password` | Solicita reset (el link se loguea en dev) |
| POST | `/v1/auth/reset-password` | Confirma reset con token |
| GET | `/v1/auth/me` | Perfil del usuario autenticado |
| PATCH | `/v1/auth/me` | Actualiza perfil |
| DELETE | `/v1/auth/me` | Elimina cuenta (soft delete) |

## Sites

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/v1/sites` | Listado con filtros y paginación |
| GET | `/v1/sites/nearby` | `lat`, `lng`, `radiusMeters` (100–200.000). Ordena por distancia |
| GET | `/v1/sites/search` | `q` + filtros. Ranking por relevancia |
| GET | `/v1/sites/autocomplete` | `q`, `limit`. Sugerencias por nombre/localidad |
| GET | `/v1/sites/:id` | Detalle completo de la ficha |
| GET | `/v1/sites/:id/species` | Especies del lugar |
| GET | `/v1/sites/:id/amenities` | Servicios del lugar |
| GET | `/v1/sites/:id/photos` | Fotos aprobadas |
| POST | `/v1/sites/:id/photos` | Sube foto (multipart `file`, queda pendiente de moderación) |

Filtros del listado: `siteTypes`, `accessTypes`, `amenities`, `species`, `status`
(`verified`, `popular`, `recent_reports`), `q`, `sort` (`name`|`distance`|`newest`), `page`, `pageSize`.

## Favorites (autenticado)

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/v1/favorites` | Lista por lista (`listName`: favorites/pending/visited) |
| POST | `/v1/favorites/:siteId` | Agrega/mueve de lista (`{ listName }`) |
| DELETE | `/v1/favorites/:siteId` | Quita de las listas |

## Suggestions y Reports

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/v1/sites/suggestions` | Sugiere lugar (público; requiere `infoAccurate: true`) |
| POST | `/v1/sites/:siteId/reports` | Reporta un problema (autenticado) |
| GET | `/v1/reports/me` | Mis reportes |

## Metadata (público)

| Método | Ruta |
|---|---|
| GET | `/v1/species` |
| GET | `/v1/site-types` |
| GET | `/v1/amenities` |
| GET | `/v1/regions` |
| GET | `/v1/countries` |

## Admin (roles moderator/editor/admin)

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/v1/admin/dashboard` | Resumen |
| GET/POST | `/v1/admin/sites` | Listar/crear lugares |
| GET/PATCH/DELETE | `/v1/admin/sites/:id` | Ver/editar/eliminar lugar |
| POST | `/v1/admin/sites/:id/verify` | Verificar lugar |
| POST | `/v1/admin/sites/import?dryRun=true` | Importar CSV/GeoJSON (multipart `file`) |
| GET/PATCH | `/v1/admin/suggestions` / `/:id` | Moderar sugerencias |
| GET/PATCH | `/v1/admin/reports` / `/:id` | Moderar reportes |
| GET | `/v1/admin/users` *(admin)* | Listar usuarios |
| PATCH | `/v1/admin/users/:id` *(admin)* | Cambiar rol/estado |
| GET | `/v1/admin/audit-logs` *(admin)* | Auditoría |
| GET/POST/PATCH/DELETE | `/v1/admin/species` | Gestionar especies |
| GET/POST | `/v1/admin/regions` | Gestionar regiones |

## Códigos de error principales

`VALIDATION_FAILED`, `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `CONFLICT`,
`INVALID_CREDENTIALS`, `INVALID_REFRESH_TOKEN`, `EMAIL_TAKEN`, `USERNAME_TAKEN`,
`SITE_NOT_FOUND`, `IMPORT_PARSE_ERROR`, `IMPORT_VALIDATION_ERROR`.

## Health

- `GET /v1/health` — liveness.
- `GET /v1/health/ready` — readiness (verifica DB y Redis).
