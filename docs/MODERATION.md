# Guía de moderación

## Roles

| Rol | Permisos |
|---|---|
| `user` | Leer lugares, favoritos, sugerir, reportar |
| `moderator` | Moderar sugerencias y reportes |
| `editor` | Crear/editar/verificar lugares y datos de contenido |
| `admin` | Todo lo anterior + gestión de usuarios, roles y auditoría |

## Flujo de sugerencias

1. Un usuario envía una sugerencia vía `POST /v1/sites/suggestions`.
2. Queda `status = pending`.
3. En el panel → **Sugerencias**, el moderador puede:
   - **Aprobar**: crea automáticamente el lugar (no verificado, `source = user_suggestion`).
   - **Rechazar**: con motivo, queda `status = rejected`.
4. Toda decisión queda en `audit_logs`.

## Flujo de reportes

1. Un usuario reporta un problema (`wrong_coordinates`, `place_closed`, etc.).
2. Queda `status = open`.
3. En el panel → **Reportes**, el moderador:
   - **Resolver**: marca el reporte como `resolved` (y de paso puede corregir el lugar).
   - **Descartar**: `rejected`.
   - **En revisión**: `in_review`.

## Verificación de lugares

Un editor/admin puede marcar un lugar como **verificado** (`POST /v1/admin/sites/:id/verify`).
El campo `is_verified = true` se refleja en la app (badge ✓) y en el ranking de búsqueda.

Verificá como mínimo:
- Nombre correcto.
- Coordenadas correctas (arrastrando el punto en el mapa).
- Acceso y propiedad correctos.
- Datos de contacto coherentes.

## Fotos

- Las fotos subidas por usuarios quedan `moderationStatus = pending`.
- Solo las fotos `approved` se muestran al público.
- En el API: `PATCH /v1/admin/photos/:id` (a implementar en el panel) o directo por DB/script.

## Auditoría

Toda acción administrativa (crear/editar/eliminar/verificar lugares, moderar, cambiar roles)
queda registrada con usuario, IP, user-agent y antes/después en `audit_logs`.

## Buenas prácticas

- Nunca verificar datos que no pudiste confirmar.
- Marcar lugares privados como privados (`isPublic = false` o `ownershipType = private`).
- Si un lugar está cerrado o es peligroso, desactivarlo (`DELETE` = soft delete) y reportarlo.
- Ante datos dudosos, rechazar la edición y contactar al autor por el medio disponible.
