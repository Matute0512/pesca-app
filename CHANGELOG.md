# Changelog

Todos los cambios significativos de PescaBA se registran en este archivo.
Formato de fecha: `AAAA-MM-DD`.

---

## [2026-08-18] — MVP: fixes de UI, Swagger y runtime de la app móvil

Sesión de verificación del MVP (Etapa 8). Se corrigieron problemas de UI, de
documentación de la API y de runtime de la app móvil (web y Expo Go).

### 🎨 Admin panel — tipos de lugar en español
- El formulario (`SiteEditPage`) y las columnas "Tipo" de los listados
  (`SitesListPage`, `SuggestionsPage`) mostraban los slugs en inglés
  (`river`, `lagoon`, …). Ahora usan labels en español: Playa, Río, Laguna,
  Arroyo, Lago, Muelle, Espigón, Puerto, Club de pesca, Bajada de embarcación,
  Acceso público, Represa, Humedal.
- Nuevo helper local `apps/admin/src/lib/labels.ts` con el mapa de labels.
  Se mantiene local en vez de importar `@pescaba/shared` porque el build de
  Vite/rollup no resuelve los re-exports CJS del paquete compartido.
- Bonus: los chips de búsqueda y de sugerir de la app móvil tenían el mismo
  problema; ahora muestran el label en español desde `@pescaba/shared`.
- `packages/shared`: label de `club` corregido a "Club de pesca".

### 📚 API — Swagger interactivo
- Se agregaron `@ApiQuery`/`@ApiParam` en los controllers con query params
  (`sites`, `favorites`, `reports`, `admin`) y `@ApiBody` con esquema inline en
  los endpoints de `auth` (register/login/refresh/logout/forgot/reset-password).
- Ahora en `http://localhost:3000/v1/docs` se pueden ingresar parámetros y
  ejecutar peticiones (p. ej. `/v1/sites/nearby` con `lat`/`lng`/`radiusMeters`
  y el body de `/v1/auth/login`).

### 📱 Mobile — web y Expo Go funcionando
- **Dependencias web**: instalados `react-native-web@^0.21.2` y `react-dom@19.1.0`
  (versiones de SDK 54), lo que resolvió `Unable to resolve react-native-web/dist/index`.
- **Mapa web-safe**: `react-native-maps` es un módulo solo-nativo y rompía el
  bundle web. Se creó `SiteMap` con split por plataforma
  (`SiteMap.native.tsx` usa react-native-maps; `SiteMap.web.tsx` muestra un
  placeholder en el navegador; `SiteMap.tsx` solo para que `tsc` resuelva el
  módulo). Se aplicó en el Home y en el Detalle de lugar.
- **Manejo de error de ubicación**: `enableLocation` no capturaba errores
  (p. ej. servicios de ubicación apagados en emulador), generando rejections
  sin manejar. Ahora muestra un mensaje amigable y un botón
  **"Usar ubicación de ejemplo (Buenos Aires)"** para usar la app sin GPS.
- **URL de la API por plataforma** (`apps/mobile/src/lib/api.ts`): default
  inteligente según `Platform` — emulador Android usa `http://10.0.2.2:3000/v1`,
  web/otros usan `http://localhost:3000/v1`. Para un celular físico se
  sobreescribe con `EXPO_PUBLIC_API_URL` en `apps/mobile/.env`
  (documentado en `.env.example`).
- Parches de `expo` y `expo-constants` actualizados dentro del rango SDK 54.

### 🔧 Infra / entorno
- Se liberó el puerto 8081 (un dev server de Expo previo lo ocupaba), para que
  `pnpm dev:mobile` arranque limpio.

---

## [2026-08-16] — Cierre de la Etapa 8 (MVP verificado)

- Verificación runtime: infra healthy (PostGIS/Redis/MinIO), migración y seed OK,
  tests unitarios (18) y e2e (11) en verde, smoke test de `/health`,
  `/v1/sites/nearby` y `/v1/sites/search`.
- Migración a Expo SDK 54 + hoist de `metro*` en el `.npmrc` (requisito del CLI de Expo).
- Migración de `moduleResolution` de `node10` a `nodenext`.
- Guía de contribución (`CONTRIBUTING.md`).
