# Consideraciones legales y de privacidad

## Privacidad

- **Datos mínimos**: solo pedimos email y contraseña (u OAuth). No se recopilan datos de
  ubicación en segundo plano.
- **Ubicación on-demand**: se solicita permiso de ubicación solo cuando el usuario usa una
  función que lo requiere (búsqueda cercana). No se guarda historial de ubicación.
- **Eliminación de cuenta**: `DELETE /v1/auth/me` (soft delete) + solicitud de purga completa.
- **Política de privacidad**: documentar en producción, con base en:
  - **Argentina — Ley 25.326**: derecho de acceso, rectificación y supresión (ARCO).
  - **GDPR** (para expansión global): base legal, consentimiento, portabilidad, DPA.

## Contenido de pesca

La app muestra avisos claros en las fichas:

> La información puede cambiar. El usuario debe verificar acceso, propiedad privada,
> permisos y regulaciones antes de pescar. No se incentiva la pesca ilegal.

- Las regulaciones, licencias, vedas y temporadas se muestran cuando están disponibles
  (tabla `fishing_regulations`).
- Los lugares privados se marcan como privados (`isPublic = false` / `ownershipType = private`).

## Coordenadas

- Se publican coordenadas de lugares públicos.
- Decisión de producto: **no exponer coordenadas exactas de lugares privados sin permiso**
  (a implementar cuando haya lugares privados reales).

## Datos de demo

- Los lugares del seed son ficticios (`source = demo`, `is_verified = false`).
- La UI muestra un aviso de que los datos son de demostración.

## Carga de contenido por usuarios

- Las sugerencias y fotos pasan por **moderación** antes de publicarse.
- Los reportes permiten corregir datos incorrectos rápidamente.

## Cumplimiento futuro (expansión global)

- Multi-idioma (i18n ya integrado).
- Regulaciones por región/pais (`fishing_regulations` por región).
- Evaluar leyes de pesca y datos personales de cada país antes de activar.
- Evaluar GDPR (consentimiento, exportación de datos, derecho al olvido) y
  leyes de protección de datos locales.
