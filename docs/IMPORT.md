# Guía de importación de lugares

El panel admin permite importar lugares desde **CSV** o **GeoJSON**, con **dry-run**
para validar antes de escribir.

## Cómo importar

1. Iniciar sesión en el panel con un rol `editor` o `admin`.
2. Ir a **Importar**.
3. Elegir un archivo CSV o GeoJSON.
4. Marcar **Dry-run** para solo analizar (recomendado primero).
5. Importar y revisar el informe (creables, duplicados, errores).

Endpoint: `POST /v1/admin/sites/import?dryRun=true|false` (multipart `file`).

## Formato CSV

Columnas reconocidas (acepta `snake_case` o `camelCase`):

| Columna | Requerida | Notas |
|---|---|---|
| `name` | sí | Nombre del lugar |
| `site_type` (o `type`) | sí | Uno de los tipos válidos |
| `latitude` (o `lat`) | sí | EPSG:4326 |
| `longitude` (o `lng`/`lon`) | sí | EPSG:4326 |
| `locality`, `municipality`, `province` | no | Ubicación administrativa |
| `address` | no | Dirección o referencia |
| `phone`, `website` | no | Contacto |
| `species` | no | Slugs separados por coma (`pejerrey,carpa`) |
| `amenities` | no | Valores separados por coma (`parking,restrooms`) |
| `access_type`, `ownership_type` | no | Enums válidos |

Ejemplo:

```csv
name,site_type,latitude,longitude,locality,municipality,province,species,amenities
Laguna Demo 1,lagoon,-34.92,-57.95,La Plata,La Plata,Buenos Aires,pejerrey,carpa,parking,restrooms
Muelle Demo 2,pier,-38.0,-57.55,Mar del Plata,General Pueyrredón,Buenos Aires,corvina-rubia,lisa,boat_ramp
```

## Formato GeoJSON

`FeatureCollection` de **Point** (o `Feature` único):

```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": { "type": "Point", "coordinates": [-57.95, -34.92] },
      "properties": {
        "name": "Laguna Demo 1",
        "site_type": "lagoon",
        "locality": "La Plata",
        "species": "pejerrey, carpa"
      }
    }
  ]
}
```

> GeoJSON usa orden `[lng, lat]`.

## Detección de duplicados

Cada fila se compara contra los lugares existentes: si hay un lugar con **nombre similar**
(por `f_unaccent`, tolerante a acentos) a menos de **500 m**, se marca como **posible duplicado**
y NO se inserta.

## Reglas

- Las especies desconocidas se omiten (no rompen la importación).
- Los amenities inválidos se ignoran.
- Las filas con errores de validación se reportan en el informe, no se insertan.
- Los lugares importados quedan `is_verified = false` y `source = 'import'` (requieren revisión).
